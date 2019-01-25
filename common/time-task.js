'use strict';

var path = require('path');
var log4js = require('log4js');
var logger = log4js.getLogger('time-task');
var schedule = require('node-schedule');
var wallet = require('./wallet.js');
var db = require('./mysql_pool')
var helper = require('../app/helper.js');
var config = require('../config.json');
var query = require('../app/query.js');
var execCmd = require('./cmd_line.js')

var eventhubs = null;
var mBlockId = -1;
var mIsRunning = false;
var mIsGasRunning = false;
var mFeeType = 1;

function takeOffGasReturn() {
    //6个占位符从左到右分别代表：秒、分、时、日、月、周几
    //30 1 7 * * * 每天的早晨7点1分30秒触发
    schedule.scheduleJob('* * * * * *', function () {
        var currTime = wallet.getStdDateTime();
        var futureTime = wallet.getVestingEffectTime();
        if (!mIsGasRunning) {
            mIsGasRunning = true;
            doWithGasReturnOfFeeType(currTime, futureTime);
        }
    });
}

async function doWithGasReturnOfFeeType(currTime,futureTime) {
    await db.syncQuery("DELETE FROM t_idx_gas WHERE feeType=?", [mFeeType]);
    await db.syncQuery("INSERT INTO t_idx_gas(id,feeType) SELECT id,feeType FROM t_charge_record WHERE status=1 AND feeType=? AND createTime<=STR_TO_DATE('" + currTime + "','%Y-%m-%d %H:%i:%s')", [mFeeType]);
    try {
        var results = await db.syncQuery("SELECT a.channelName,a.ccName,a.contractAddr,a.address,sum(a.gasUsed) as gasUsed FROM t_charge_record a INNER JOIN  t_idx_gas b on b.id=a.id AND b.feeType=a.feeType WHERE a.status=1 AND a.feeType=? group by a.channelName,a.ccName,a.contractAddr,a.address", [mFeeType]);
        if (results && results.length > 0) {
            var len = results.length;
            for (var i = 0; i < len; i++) {
                var obj = results[i];

                var fcn = "fixedTimePresale";
                var orgName = config.platInvokeNode.orgName;

                var reason = "";
                var vType = 0;
                if (mFeeType == 1) {
                    reason = "instantiate chaincode";
                    vType = 1;
                } else if (mFeeType == 2) {
                    reason = "upgrade chaincode";
                    vType = 2;
                } else if (mFeeType == 3) {
                    reason = "invoke chaincode";
                    vType = 3;
                }
                var request = {
                    orgName: orgName,
                    contractAddr: obj.contractAddr,
                    ccName: obj.ccName,
                    gasUsed: "" + obj.gasUsed,
                    futureTime: futureTime,
                    txID: "",
                    vType: vType,
                    reason: reason,
                    createTime: currTime
                };
                var jsonStr = JSON.stringify(request);
                var signature = helper.signGasData(orgName, jsonStr);
                var args = [];
                args.push(jsonStr);
                args.push(signature);

                var msg = await wallet.platInvoke(fcn, args, null, null);
                if (wallet.isJson(msg)) {
                    if (msg.status == true) {
                        await db.syncQuery("UPDATE t_charge_record a INNER JOIN t_idx_gas b ON a.id=b.id AND a.feeType=b.feeType SET a.status=2,a.returnTxId='" + msg.txId + "' WHERE a.status=1 AND a.feeType=? AND a.contractAddr=? AND a.channelName=? AND a.ccName=? AND a.address=?", [mFeeType, obj.contractAddr, obj.channelName, obj.ccName, obj.address]);
                        if (i == len - 1) {
                            if (mFeeType>=3) {
                                mFeeType = 1;
                                mIsGasRunning = false;
                            } else {
                                mFeeType = mFeeType+1;
                                doWithGasReturnOfFeeType(currTime, futureTime);
                            }
                        }
                    } else {
                        mFeeType = 1;
                        mIsGasRunning = false;
                    }
                } else {
                    mFeeType = 1;
                    mIsGasRunning = false;
                }
            }
        } else {
            if(mFeeType>=3) {
                mFeeType = 1;
                mIsGasRunning = false;
            } else {
                mFeeType = mFeeType + 1;
                doWithGasReturnOfFeeType(currTime, futureTime);
            }
        }
    }catch(e) {
        mFeeType = 1;
        mIsGasRunning = false;
        logger.error("查询数据库出错,"+e); 
    }
}

function updateContractStatus() {
    schedule.scheduleJob('* 30 * * * *', function () {
        var sql = "SELECT channelName,ccName,contractAddr,address,sum(gasUsed) as gasUsed FROM t_charge_record WHERE status=1 group by channelName,ccName,contractAddr,address";
        var totalSql = "select count(1) as total from (" + sql + ")a";
        db.asyncQuery(totalSql, [], function (err, items, fields) { 
            if (!err && items.length > 0) {
                var pageSize = 20;
                var total = items[0].total;
                var temp = parseInt(total / pageSize);
                var pages = (total % pageSize == 0) ? temp : (temp + 1);
                for (var pageNo = 1; pageNo <= pages; pageNo++) {
                    var currTime = wallet.getStdDateTime();
                    var futureTime = wallet.getVestingEffectTime();

                    var querySql = sql + " limit " + (pageNo - 1) * pageSize + "," + pageSize;
                    db.asyncQuery(querySql, [], function (err, results, fields) {
                        if (!err && results.length > 0) {
                            for (var j = 0; j < results.length; j++) {
                                var obj = results[j];
                                var fcn = "updateCCStatus";
                                var orgName = config.platInvokeNode.orgName;
                                var request = {
                                    orgName: orgName,
                                    contractAddr: obj.contractAddr,
                                    ccName: obj.ccName,
                                    gasUsed: obj.gasUsed+"",
                                    futureTime: futureTime,
                                    createTime: currTime
                                };
                                var jsonStr = JSON.stringify(request);
                                var signature = helper.signGasData(orgName, jsonStr);
                                var args = [];
                                args.push(jsonStr);
                                args.push(signature);

                                wallet.platInvoke(fcn, args, null, function (msg) {
                                });
                            }
                        } else {
                            if (err)
                                logger.error(err.sqlMessage);
                        }
                    });
                }
            } else {
                if (err)
                    logger.error(err.sqlMessage);
            }
        });
       
    });
}

function blockListener() {
    schedule.scheduleJob('* * * * * *', async function () {
        if(!eventhubs) {
            var orgName = config.platQueryNode.orgName;
            var userName = config.platQueryNode.userName;
            var peers = config.platQueryNode.peers;
            var channelName = config.channelName;

            eventhubs = await helper.newEventHubs(channelName, peers, orgName);
            for (let key in eventhubs) {
                let eh = eventhubs[key];
                eh.connect();
            }
            eventhubs.forEach((eh) => {
                eh.registerBlockEvent(async (block) => {
                    var blockId = block.number;
                    var blockObj = await query.getBlockByNumber(peers[0], channelName, blockId, userName, orgName);
                    if (blockObj.data.data.length > 0) {
                        // Config block must only contain  one transaction
                        doWithBlockInfo(blockObj);
                    }
                },
                (error) => {
                    for (let key in eventhubs) {
                        let eh = eventhubs[key];
                        eh.disconnect();
                    }
                    eventhubs = null;
                    logger.error('Failed to receive the block event ::' + error);
                });
            });
        }
    });
}

//处理block信息
function doWithBlockInfo(block) {
    var channel_header = block.data.data[0].payload.header.channel_header;
    if (channel_header.channel_id === config.channelName) {
        var previous_hash = block.header.previous_hash;
        var blockId = block.header.number;
        var createTime = wallet.getBlockCreateTime(block);
        var blockSize = Buffer.byteLength(JSON.stringify(block), 'utf8');
        blockSize = blockSize / 1024;
        var blockObj = {
            blockId: blockId,
            channelId: channel_header.channel_id,
            previousHash: previous_hash,
            blockSize: blockSize,
            createTime: createTime
        };
        db.syncQuery('insert into t_block_ext_info SET ?', blockObj);
        db.syncQuery('update t_block_ext_info SET currentHash = ? where blockId = ?', [previous_hash, blockId - 1]);
    } else {
    }
}

//获取对象及更新语句
function parseBlockForSql(block) {
    var channel_header = block.data.data[0].payload.header.channel_header;
    if (channel_header.channel_id === config.channelName) {
        var previous_hash = block.header.previous_hash;
        var blockId = block.header.number;
        var createTime = wallet.getBlockCreateTime(block);
        var blockSize = Buffer.byteLength(JSON.stringify(block), 'utf8');
        blockSize = blockSize / 1024;
        return [blockId, channel_header.channel_id, previous_hash, blockSize, createTime];
    }
    return null;
}

function syncBlockExtInfo() {
    var peer = config.platQueryNode.peers[0];
    var orgName = config.platQueryNode.orgName;
    var userName = config.platQueryNode.userName;
    var channelName = config.channelName;

    db.asyncQuery('SELECT idx_value FROM t_idx_record WHERE idx_type=1', [], function (err, results, fields) {
        if (!err&&results.length>0) {
            mBlockId = results[0]["idx_value"];
        } else {
            db.asyncQuery('INSERT INTO t_idx_record(idx_type,idx_value) VALUES(1,-1)', [], function (err, results, fields) {
            });
        }
    });
    
    //每秒执行一次
    schedule.scheduleJob('* * * * * *', function () {
        if(!mIsRunning) {
            mIsRunning = true;
            db.asyncQuery('SELECT blockId FROM t_block_ext_info ORDER BY blockId DESC LIMIT 0,1', [], function (err, results, fields) {
                var currBlockId = 0;
                if (!err && results.length > 0) {
                    currBlockId = results[0]["blockId"];
                }
                if (currBlockId > mBlockId) {
                    db.asyncQuery('SELECT blockId FROM t_block_ext_info WHERE blockId>? AND blockId<=?', [mBlockId,currBlockId], async function (err2, results2, fields) {
                        var blockIds = [];
                        if (!err2 && results2.length > 0) {
                            for (var i = 0; i < results2.length;i++) {
                                blockIds.push(results2[i].blockId);
                            }
                        }
                        var syncIds = [];
                        for (var i = mBlockId+1; i <= currBlockId;i++) {
                            if (!isInArray(blockIds,i)) {
                                syncIds.push(i);
                            }
                        }
                        var values = [];
                        for (var i = 0;i<syncIds.length;i++) {
                            var blockObj = await query.getBlockByNumber(peer, channelName, syncIds[i], userName, orgName);
                            var obj = parseBlockForSql(blockObj);
                            if (obj) {
                                values.push(obj);
                            } else {
                                i == syncIds.length;
                                mIsRunning = false;
                            }
                        }
                        
                        if (values.length > 0 && values.length == syncIds.length) {
                            db.syncQuery('INSERT INTO t_block_ext_info(blockId,channelId,previousHash,blockSize,createTime) VALUES ?', [values]);
                            db.syncQuery('UPDATE t_block_ext_info a,t_block_ext_info b SET a.currentHash=b.previousHash WHERE b.blockId=(a.blockId+1) AND a.currentHash is null', []);
                            db.syncQuery('UPDATE t_idx_record SET idx_value=? WHERE idx_type=?', [currBlockId, 1]);
                            mBlockId = currBlockId;
                            mIsRunning = false;
                        } else {
                            db.asyncQuery('UPDATE t_idx_record SET idx_value=? WHERE idx_type=?', [currBlockId, 1], function (err, results, fields) {
                                mBlockId = currBlockId;
                                mIsRunning = false;
                            });
                        }
                    });
                } else {
                    mIsRunning = false;
                }
            });
        }
    });
}

/**
 * 使用循环的方式判断一个元素是否存在于一个数组中
 * @param {Object} arr 数组
 * @param {Object} value 元素值
 */
function isInArray(arr, value) {
    for (var i = 0; i < arr.length; i++) {
        if (value === arr[i]) {
            return true;
        }
    }
    return false;
}

//清理日志 每5分钟执行一次（*/5 * * * *）
function cleanLog() {
    var exePath = path.resolve(__dirname, './clean.sh');
    //每天的凌晨1点1分30秒触发 ：'30 1 1 * * *'
    schedule.scheduleJob('30 1 1 * * *', function () {
        execCmd.execFile(exePath, function (err, stdout, stderr) {
            logger.debug("*****clean log******* " + err);
        });
    });
}

function testCleanLog() {
    var exePath = path.resolve(__dirname, './clean.sh');
    execCmd.execFile(exePath, function (err, stdout, stderr) {
        logger.debug("*****clean log******* " + err);
    });
}

module.exports = {
    takeOffGasReturn: takeOffGasReturn,
    updateContractStatus: updateContractStatus,
    blockListener: blockListener,
    syncBlockExtInfo: syncBlockExtInfo,
    cleanLog: cleanLog,
    testCleanLog: testCleanLog
}
'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('chaincode-query');
var config = require('../config.json');
var query = require('../app/query.js');
var wallet = require('./wallet.js');
var errCode = require('./errorcode.js');

var transfers = {
    "\u0000": 0,
    "\u0001": 1,
    "\u0002": 2,
    "\u0003": 3,
    "\u0004": 4,
    "\u0005": 5,
    "\u0006": 6,
    "\u0007": 7,
    "\b": 8,
    "\t": 9,
    "\n": 10,
    "\u000b": 11,
    "\f": 12,
    "\r": 13,
    "\u000e": 14,
    "\u000f": 15,
    "\u0010": 16,
    "\u0011": 17,
    "\u0012": 18,
    "\u0013": 19,
    "\u0014": 20,
    "\u0015": 21,
    "\u0016": 22,
    "\u0017": 23,
    "\u0018": 24,
    "\u0019": 25,
    "\u001a": 26,
    "\u001b": 27,
    "\u001c": 28,
    "\u001d": 29,
    "\u001e": 30,
    "\u001f": 31,
    "\"": 34,
    "\\": 92
};

function parseJson(msg) {
    try {
        var jsonObj = JSON.parse(msg);
        return jsonObj;
    } catch (e) { }

    return msg;
}

//将json传过来的数据， unicode编码的字符转成普通字符
function decode(s) { 
    //s = "\u0000address~tokenId~op~value~txID~action\u0000walletRestNum1NSEatCGBoWPYzEVb3zmYY1zsoD7FiZTvL\u000093481ef0ab2f11e8a9125bd6cc04c661\u0000+\u000010000000000\u00007fb360394c26fedf11a54fde5a6377cb7960406c66c7fc338080b670832468ea\u0000signleTransfer\u0000";
    if(typeof s === 'string') {
        s = unescape(s.replace(/\\(u[0-9a-fA-F]{4})/gm, '%$1')); 
    }
    return parseJson(s);
}

/**
 * 解析block数据
 * @param {Object} blockObj 
 */
function parseBlockInfo(blockObj) {

    let txLen = blockObj.data.data.length;
    var allTrans = [];
    for (let i = 0; i < txLen; i++) {
        var result = parseSingleTx(blockObj.data.data[i]);
        if (result)
            allTrans.push(result);
    }

    return {
        'blockid': blockObj.header.number.toString(),
        'previous_hash': blockObj.header.previous_hash,
        'data_hash': blockObj.header.data_hash,
        'transactions': allTrans
    };
}

/**
 * 解析单个交易信息
 * @param {object} tx 
 */
function parseSingleTx(tx) {
    var txHeader = {
        'channelname': tx.payload.header.channel_header.channel_id,
        'txhash': tx.payload.header.channel_header.tx_id,
        'createdt': new Date(tx.payload.header.channel_header.timestamp)
    };

    var txType = tx.payload.header.channel_header.typeString;
    //0: "MESSAGE"
    //1: "CONFIG"
    //2: "CONFIG_UPDATE"
    //3: "ENDORSER_TRANSACTION"
    //4: "ORDERER_TRANSACTION"
    //5: "DELIVER_SEEK_INFO"
    //6: "CHAINCODE_PACKAGE"
    //7: "PEER_RESOURCE_UPDATE"
    if (txType == "ENDORSER_TRANSACTION") {
        var txActions = [];
        var txActionLen = tx.payload.data.actions.length;
        for (var j = 0; j < txActionLen; j++) {
            var cc = tx.payload.data.actions[j].payload.action.proposal_response_payload.extension.chaincode_id;
            var set = tx.payload.data.actions[j].payload.action.proposal_response_payload.extension.results.ns_rwset;
            
            var trans = [];
            var wallets = [];
            var tokens = [];
            var contracts = [];
            var gasReturns = [];
            var tokenMaster = {};
            var others = [];

            for (var x = 0; x < set.length;x++) {
                var item = set[x];
                if (item.rwset) {
                    let arr = item.rwset.writes;
                    if (arr) {
                        for (var k = 0; k < arr.length; k++) {
                            var tempKey = arr[k].key;
                            /*
                            tempKey.indexOf("transferPrefix") == 0
                                || tempKey.indexOf("genisisBlock") == 0
                                || tempKey.indexOf("walletPrefix") == 0
                                || tempKey.indexOf("tokenPrefix") == 0
                                || tempKey.indexOf("leaderAddress") == 0
                                || tempKey.indexOf("staffAddressList") == 0
                                || tempKey.indexOf("staffBoolsPrefix") == 0
                                || tempKey.indexOf("masterThreshold") == 0
                                || tempKey.indexOf("managerThreshold") == 0
                                || tempKey.indexOf("vestingPrefix") == 0
                                || tempKey.indexOf("allowedPrefix") == 0
                                || tempKey.indexOf("confirmPrefix") == 0
                                || tempKey.indexOf("pausedPrefix") == 0
                                || tempKey.indexOf("contractPrefix") == 0
                            */
                            if (1 == 1) {              
                                var retObj = parseJson(arr[k].value);
                                if (tempKey.indexOf("transferPrefix") == 0) {
                                    trans = trans.concat(retObj);
                                } else if (tempKey.indexOf("walletPrefix") == 0) {
                                    wallets.push(retObj);
                                } else if (tempKey.indexOf("tokenPrefix") == 0) {
                                    tokens.push(retObj);
                                } else if (tempKey.indexOf("contractPrefix") == 0) {
                                    contracts = contracts.concat(retObj);
                                } else if (tempKey.indexOf("vestingPrefix") == 0) {
                                    //vestingPrefix1CzoX3Zv714K8B8q5cU126NfRMwGGpsC6D~2
                                    var addr = tempKey.substring(0, tempKey.lastIndexOf("~"))
                                    addr = addr.replace("vestingPrefix", "");
                                    if (Array.isArray(retObj)) {
                                        for (var n = 0; n < retObj.length; n++) {
                                            //instantiate chaincode
                                            //upgrade chaincode
                                            //issue token
                                            if (retObj[n].reason == "invoke chaincode"
                                                || retObj[n].reason == "instantiate chaincode"
                                                || retObj[n].reason == "upgrade chaincode") {
                                                retObj[n]["address"] = addr;
                                                retObj["gasReturnHash"] = wallet.sha256(addr + retObj.id);
                                                gasReturns.push(retObj[n]);
                                            }
                                        }
                                    } else {
                                        if (retObj.reason == "invoke chaincode"
                                            || retObj.reason == "instantiate chaincode"
                                            || retObj.reason == "upgrade chaincode") {
                                            retObj["address"] = addr;
                                            retObj["gasReturnHash"] = wallet.sha256(addr + retObj.id);
                                            gasReturns.push(retObj);
                                        }
                                    }
                                } else if (tempKey.indexOf("tokenMasterWalletPrefix") == 0) {
                                    var tokenID = tempKey.replace("tokenMasterWalletPrefix","");
                                    tokenMaster[tokenID] = retObj;
                                } else {
                                    others.push({ "key": tempKey, "value": retObj });
                                }
                            }
                        }
                    }
                }
            }
            if (trans.length > 0 || wallets.length > 0
                || tokens.length > 0 || contracts.length > 0
                || others.length > 0 || gasReturns.length > 0 || tokenMaster) {
                return {
                    'channelname': tx.payload.header.channel_header.channel_id,
                    'chaincodename': cc.name,
                    'chaincodeversion': cc.version,
                    'txhash': tx.payload.header.channel_header.tx_id,
                    'createdt': new Date(tx.payload.header.channel_header.timestamp),
                    'wallets': wallets,
                    'trans': trans,
                    'tokens': tokens,
                    'contracts': contracts,
                    'gasReturns': gasReturns,
                    'tokenMaster': tokenMaster,
                    'others': others
                };
            }
        }
    } else {//CONFIG TX
        //allTrans.push(tx.payload.data.last_update.payload.data.config_update);
    }
    return null;
}

function deDuplicate(arr) {
    var newArr = [];
    for (var i = 0; i < arr.length; i++) {
        var str = JSON.stringify(arr[i]);
        if (!isDuplicate(newArr,str)) {
            newArr.push(arr[i]);
        }
    }
    return newArr;
}

function isDuplicate(arr,str) {
    for(var i = 0; i < arr.length ;i ++) {
        if(JSON.stringify(arr[i])==str) {
            return true;
        }
    }
    return false;
}

function queryBalance(req,res) {
    let address = req.params.address;
    let fcn = 'queryWalletInfo';
    wallet.platQuery(fcn, address, res, function (msg) {
        if (!msg.data || msg.data == "") {
            msg.data = null;
        }
        wallet.writeJson(res, msg);
    });
}

function queryTransferHistoryInfo(req, res) {
    let txId = req.params.txId;
    let fcn = 'queryTransferHistoryInfo';
    wallet.platQuery(fcn, txId, res, function (msg) {
        wallet.writeJson(res, msg);
    });
}

function queryTransferStatus(req, res) {
    let txId = req.params.txId;
    let fcn = 'queryTransferStatus';
    wallet.platQuery(fcn, txId, res, function (msg) {
        wallet.writeJson(res, msg);
    });
}

function queryMultiTransferStatus(req, res) {
    let data = req.body.data;
    if (!data) {
        wallet.writeJson(res, {
            status: false,
            errorCode: errCode.ERR_TXID_CANNOT_BE_NULL,
            msg: ""
        });
        return;
    }
    let args = wallet.parseParams(data);
    if (args.length > 200) {
        wallet.writeJson(res, {
            status: false,
            errorCode: errCode.ERR_TXID_COUNT_CANNOT_GREATER_THAN_200,
            msg: ""
        });
        return;
    }

    let fcn = 'queryMultiTransferStatus';
    wallet.platQuery(fcn, [JSON.stringify(args)], res, function (msg) {
        wallet.writeJson(res, msg);
    });
}

function isMaterOrManagerOfAddr(req, res) {
    let address = req.params.address;
    let tokenID = req.params.tokenID;
    let fcn = 'isMaterOrManagerOfAddr';
    var args = [];
    args.push(address);
    args.push(tokenID);
    wallet.platQuery(fcn, args, res, function (msg) {
        wallet.writeJson(res, msg);
    });
}


function getVar(req,res) {
    let varName = req.body.varName;
    let fcn = 'getVar';
    wallet.platQuery(fcn, varName, res, function (msg) {
        wallet.writeJson(res, msg);
    });
}

function walletIsExist(req,res) {
    let address = req.params.address;
    let fcn = 'walletIsExist';
    wallet.platQuery(fcn, address, res);
}

function managerCount(req,res) {
    let fcn = 'managersCount';
    var args = [];
    args.push(req.params.tokenID);
    wallet.platQuery(fcn, args, res, function (msg) {
        if (msg.status == true) {
            res.json({ status: true, count: msg.data });
        } else {
            wallet.writeJson(res, msg);
        }
    });
}

function isAddressManager(req,res) {
    let fcn = 'isAddressManager';
    var tokenID = req.body.tokenID;
    var address = req.body.address;
    var args = [];
    args.push(tokenID);
    args.push(address);

    wallet.platQuery(fcn, args, res, function (msg) {
        wallet.writeJson(res, msg);
    });
}

function getMajorityThreshold(req,res) {
    if (!req.params.tokenID) {
        wallet.writeJson(res, {
            status: false,
            errorCode: errCode.ERR_TOKENID_CAN_NOT_BE_NULL,
            msg: ""
        });
        return;
    }
    let fcn = 'getMajorityThreshold';
    var args = [];
    args.push(req.params.tokenID);
    wallet.platQuery(fcn, args, res, function (msg) {
        if (msg.status == true) {
            res.json({ status: true, count: msg.data });
        } else {
            wallet.writeJson(res, msg);
        }
    });
}

function isConfirmed(req,res) {
    var request = {
        tokenID: req.body.tokenID,
        address: req.body.address,
        data: req.body.data
    };
    let fcn = 'isConfirmed';
    var args = [];
    args.push(JSON.stringify(request));

    wallet.platQuery(fcn, args, res, function (msg) {
        wallet.writeJson(res, msg);
    });
}

function isConfirmedBy(req,res) {
    let fcn = 'isConfirmedBy';
    var address = req.body.address;
    var data = req.body.data;
    var args = [];
    args.push(address);
    args.push(data);

    wallet.platQuery(fcn, args, res, function (msg) {
        wallet.writeJson(res,msg);
    });
}

function isMajorityConfirmed(req,res) {
    var originHexStr = req.body.origin;
    var origin = wallet.hexStrToObj(originHexStr);
    if (!origin) {
        wallet.writeJson(res, {
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: ""
        });
        return;
    }

    if (!origin.tokenID) {
        wallet.writeJson(res, {
            status: false,
            errorCode: errCode.ERR_TOKENID_CAN_NOT_BE_NULL,
            msg: ""
        });
        return;
    }

    if (!origin.funcName) {
        wallet.writeJson(res, {
            status: false,
            errorCode: errCode.ERR_CONFIRM_FUNCTION_CANNOT_BE_NULL,
            msg: ""
        });
        return;
    }
    var sendData = {
        tokenID: origin.tokenID,
        originData: originHexStr
    };
    let fcn = 'isMajorityConfirmed';
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platQuery(fcn, args, res, function (msg) {
        wallet.writeJson(res, msg);
    });
}

function vestingFunc(req,res) {
    var currentTime = req.body.currentTime;
    var startTime = req.body.startTime;
    var initReleaseAmount = req.body.initReleaseAmount;
    var amount = req.body.amount;
    var interval = req.body.interval;
    var periods = req.body.periods;

    if (!wallet.GtZeroInt(currentTime)) {
        wallet.writeJson(res, {
            status: false,
            errorCode: errCode.ERR_VESTING_CURRENT_TIME_MUST_GREATER_THAN_0,
            msg: ""
        });
        return;
    }
    if (!wallet.GtZeroInt(startTime)) {
        wallet.writeJson(res, {
            status: false,
            errorCode: errCode.ERR_VESTING_START_TIME_MUST_GREATER_THAN_0,
            msg: ""
        });
        return;
    }
    if (!wallet.GeZeroNumric(initReleaseAmount)) {
        wallet.writeJson(res, {
            status: false,
            errorCode: errCode.ERR_VESTING_INIT_RELEASE_AMOUNT_MUST_GREATER_THAN_OR_EQ_0,
            msg: ""
        });
        return;
    }
    if (!wallet.GtZeroNumric(amount)) {
        wallet.writeJson(res, {
            status: false,
            errorCode: errCode.ERR_VESTING_AMOUNT_MUST_GREATER_THAN_0,
            msg: ""
        });
        return;
    }
    if (!wallet.GtZeroInt(interval)) {
        wallet.writeJson(res, {
            status: false,
            errorCode: errCode.ERR_VESTING_INTERVAL_MUST_GREATER_THAN_0,
            msg: ""
        });
        return;
    }
    if (!wallet.GtZeroInt(periods)) {
        wallet.writeJson(res, {
            status: false,
            errorCode: errCode.ERR_VESTING_PERIODS_MUST_GREATER_THAN_0,
            msg: ""
        });
        return;
    }
    var sendData = {
        currentTime: +currentTime,
        startTime: +startTime,
        initReleaseAmount: initReleaseAmount,
        amount: amount,
        interval: +interval,
        periods: +periods
    };
    var originStr = JSON.stringify(sendData);
    let fcn = 'vestingFunc';
    var args = [originStr];
    wallet.platQuery(fcn, args, res, function (msg) {
        wallet.writeJson(res, msg);
    });
}

function queryWithdrawed(req,res) {
    let fcn = 'queryWithdrawed';
    var address = req.params.address;
    var id = req.params.id;
    var args = [];
    args.push(address);
    args.push(id + "");
    wallet.platQuery(fcn, args, res, function (msg) {
        wallet.writeJson(res, msg);
    });
}

function hexToNumber(req,res) {
    let fcn = 'hexToNumber';
    var hexStr = req.body.hexStr;
    if (!hexStr) {
        res.json({ status: false, 
            errorCode: errCode.ERR_PARAM_CANNOT_BE_NULL, 
            msg: wallet.getErrMsg(req, errCode.ERR_PARAM_CANNOT_BE_NULL)
        });
        return;
    }
    if (hexStr.indexOf("0X") == 0) {
        hexStr = '0x' + hexStr.substring(2, hexStr.length);
    }
    if (hexStr.indexOf("0x") != 0) {
        hexStr = '0x' + hexStr;
    }
    var args = [hexStr];
    wallet.platQuery(fcn, args, res, function (msg) {
        wallet.writeJson(res, msg);
    });
}

function vestingsBalance(req,res) {
    let fcn = 'vestingsBalance';
    var address = req.body.address;
    var tokenID = req.body.tokenID;
    var args = [];
    args.push(address);
    args.push(tokenID);
    wallet.platQuery(fcn, args, res, function (msg) {
        wallet.writeJson(res, msg);
    });
}

function vestingsBalanceDetail(req, res) {
    let fcn = 'vestingsBalanceDetail';
    var address = req.body.address;
    var tokenID = req.body.tokenID;
    var args = [];
    args.push(address);
    args.push(tokenID);
    wallet.platQuery(fcn, args, res, function (msg) {
        wallet.writeJson(res, msg);
    });
}

function balanceOf(req,res) {
    let fcn = 'balanceOf';
    var address = req.body.address;
    var tokenID = req.body.tokenID;
    var args = [];
    args.push(address);
    args.push(tokenID);
    wallet.platQuery(fcn, args, res, function (msg) {
        wallet.writeJson(res, msg);
    });
}

function allowance(req,res) {
    let fcn = 'allowance';
    var address = req.body.address;
    var spender = req.body.spender;
    var tokenID = req.body.tokenID;
    var args = [address, spender, tokenID];
    wallet.platQuery(fcn, args, res, function (msg) {
        if (msg.status == true) {
            res.json({ status: true, count: msg.data });
        } else {
            wallet.writeJson(res, msg);
        }
    });
}

function queryTokenInfo(req,res) {
    let tokenID = req.params.tokenID;
    let fcn = 'queryTokenInfo';
    wallet.platQuery(fcn, tokenID, res, function (msg) {
        wallet.writeJson(res,msg);
    });
}

function queryMasterTokenInfo(req, res) {
    let fcn = 'queryMasterTokenInfo';
    wallet.platQuery(fcn, "", res, function (msg) {
        wallet.writeJson(res, msg);
    });
}

function queryWalletsByToken(req,res) {
    let tokenID = req.params.tokenID;
    let fcn = 'queryWalletsByToken';
    wallet.platQuery(fcn, tokenID, res);
}

function queryTransferCount(req,res) {
    let address = req.params.address;
    let fcn = 'queryTransferCount';
    wallet.platQuery(fcn, address, res, function (message) {
        if (message.status == true) {
            res.json({ status: true, count: message.data.count });
        } else {
            wallet.writeJson(res, message);
        }
    });
}

async function getBlockInfo(req,res) {
    let blockId = req.params.blockId;
    if (!blockId) {
        res.json({
            status: false,
            errorCode: errCode.ERR_BLOCK_ID_OR_HASH_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_BLOCK_ID_OR_HASH_CANNOT_BE_NULL)
        });
        return;
    }
    var peer = config.platQueryNode.peers[0];
    var orgName = config.platQueryNode.orgName;
    var userName = config.platQueryNode.userName;
    var channelName = config.channelName;

    var reg = /^[0-9]+$/;
    if (reg.test(blockId)) {//是数字
        let message = await query.getBlockByNumber(peer, channelName, blockId, userName, orgName);
        if (wallet.isJson(message)) {
            let blockInfo = parseBlockInfo(message);
            res.json({ status: true, data: blockInfo });
        } else {
            res.json({ status: false, 
                errorCode: errCode.ERR_BLOCK_NOT_EXISTED, 
                msg: wallet.getErrMsg(req, errCode.ERR_BLOCK_NOT_EXISTED) });
        }
    } else {
        let message = await query.getBlockByHash(peer, channelName, blockId, userName, orgName);
        if (wallet.isJson(message)) {
            let blockInfo = parseBlockInfo(message);
            res.json({ status: true, data: blockInfo });
        } else {
            res.json({ status: false, 
                errorCode: errCode.ERR_BLOCK_NOT_EXISTED, 
                msg: wallet.getErrMsg(req, errCode.ERR_BLOCK_NOT_EXISTED) });
        }
    }
}

async function getTransactionByBlockNumberAndIndex(req,res) {
    let blockId = req.body.blockId;
    let index = req.body.index;
    if (!blockId) {
        res.json({
            status: false,
            errorCode: errCode.ERR_BLOCK_ID_OR_HASH_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_BLOCK_ID_OR_HASH_CANNOT_BE_NULL)
        });
        return;
    }
    if (!index) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TX_INDEX_IN_BLOCK_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TX_INDEX_IN_BLOCK_CANNOT_BE_NULL)
        });
        return;
    }
    var peer = config.platQueryNode.peers[0];
    var orgName = config.platQueryNode.orgName;
    var userName = config.platQueryNode.userName;
    var channelName = config.channelName;

    let message = await query.getBlockByNumber(peer, channelName, blockId, userName, orgName);
    if (wallet.isJson(message)) {
        let txLen = message.data.data.length
        if (index >= txLen) {
            res.json({ status: false, 
                errorCode: errCode.ERR_TX_NOT_EXISTED, 
                msg: wallet.getErrMsg(req, errCode.ERR_TX_NOT_EXISTED) });
            return;
        }
        var result = parseSingleTx(message.data.data[index]);
        if (result) {
            result["status"] = true;
            res.json(result);
        } else
            res.json({ status: false, 
                errorCode: errCode.ERR_TX_NOT_EXISTED, 
                msg: wallet.getErrMsg(req, errCode.ERR_TX_NOT_EXISTED) });
    } else {
        res.json({ status: false, 
            errorCode: errCode.ERR_BLOCK_NOT_EXISTED, 
            msg: wallet.getErrMsg(req, errCode.ERR_BLOCK_NOT_EXISTED) });
    }
}

async function getTransactionByBlockHashAndIndex(req,res) {
    let blockHash = req.body.blockHash;
    let index = req.body.index;
    if (!blockHash) {
        res.json({
            status: false,
            errorCode: errCode.ERR_BLOCK_ID_OR_HASH_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_BLOCK_ID_OR_HASH_CANNOT_BE_NULL)
        });
        return;
    }
    if (!index) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TX_INDEX_IN_BLOCK_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TX_INDEX_IN_BLOCK_CANNOT_BE_NULL)
        });
        return;
    }
    var peer = config.platQueryNode.peers[0];
    var orgName = config.platQueryNode.orgName;
    var userName = config.platQueryNode.userName;
    var channelName = config.channelName;

    let message = await query.getBlockByHash(peer, channelName, blockHash, userName, orgName);
    if (wallet.isJson(message)) {
        let txLen = message.data.data.length;
        if (index >= txLen) {
            res.json({ status: false, 
                errorCode: errCode.ERR_TX_NOT_EXISTED, 
                msg: wallet.getErrMsg(req, errCode.ERR_TX_NOT_EXISTED) });
            return;
        }
        var result = parseSingleTx(message.data.data[index]);
        if (result) {
            result["status"] = true;
            res.json(result);
        } else
            res.json({ status: false, 
                errorCode: errCode.ERR_TX_NOT_EXISTED, 
                msg: wallet.getErrMsg(req, errCode.ERR_TX_NOT_EXISTED) });

    } else {
        res.json({ status: false, 
            errorCode: errCode.ERR_BLOCK_NOT_EXISTED, 
            msg: wallet.getErrMsg(req, errCode.ERR_BLOCK_NOT_EXISTED) });
    }
}

async function getBlockNumber(req,res) {
    let peer = config.platQueryNode.peers[0];
    var orgName = config.platQueryNode.orgName;
    var userName = config.platQueryNode.userName;
    var channelName = config.channelName;

    let message = await query.getChainInfo(peer, channelName, userName, orgName);
    if (wallet.isJson(message)) {
        var high = message.height.high;
        var low = message.height.low;
        var str = wallet.bigIntAdd(high, low);
        res.json({ status: true, data: str.toString() });
    } else {
        res.json({ status: false, 
            errorCode: errCode.ERR_GET_CHAIN_INFO_FAILURE, 
            msg: wallet.getErrMsg(req, errCode.ERR_GET_CHAIN_INFO_FAILURE) });
    }
}

async function getChainInfo(req,res) {
    let peer = config.platQueryNode.peers[0];
    var orgName = config.platQueryNode.orgName;
    var userName = config.platQueryNode.userName;
    var channelName = config.channelName;

    let message = await query.getChainInfo(peer, channelName, userName, orgName);
    if (wallet.isJson(message)) {
        var blockInfo = {
            high: message.height.high,
            low: message.height.low,
            currentBlockHash: message.currentBlockHash.toString('hex'),
            previousBlockHash: message.previousBlockHash.toString('hex'),
        }
        res.json({ status: true, data: blockInfo });
    } else {
        res.json({ status: false, 
            errorCode: errCode.ERR_GET_CHAIN_INFO_FAILURE, 
            msg: wallet.getErrMsg(req, errCode.ERR_GET_CHAIN_INFO_FAILURE) });
    }
}

async function getTransactionByHash(req,res) {
    let trxnId = req.body.txId;
    if (!trxnId) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TX_ID_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TX_ID_CANNOT_BE_NULL)
        });
        return;
    }

    let peer = config.platQueryNode.peers[0];
    let channelName = config.channelName;
    var orgName = config.platQueryNode.orgName;
    var userName = config.platQueryNode.userName;

    let message = await query.getTransactionByID(peer, channelName, trxnId, userName, orgName);
    if (wallet.isJson(message)) {
        let txObj = parseSingleTx(message.transactionEnvelope);
        txObj["status"] = true;
        res.json(txObj);
    } else {
        var regex = "\\((.+?)\\)";
        var arr = message.match(regex);

        if (arr && arr.length > 1) {
            try {
                message = arr[1].substring(arr[1].indexOf("message:") + 8, arr[1].length).trim();
            } catch (e) { }
        }

        res.json({ status: false, 
            errorCode: errCode.ERR_GET_TX_FAILURE, 
            msg: wallet.getErrMsg(req, errCode.ERR_GET_TX_FAILURE)});
    }
}

async function getBlockTransactionCountByNumber(req,res) {
    let blockId = req.params.blockId;
    if (!blockId) {
        res.json({
            status: false,
            errorCode: errCode.ERR_BLOCK_ID_OR_HASH_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_BLOCK_ID_OR_HASH_CANNOT_BE_NULL)
        });
        return;
    }
    var peer = config.platQueryNode.peers[0];
    var orgName = config.platQueryNode.orgName;
    var userName = config.platQueryNode.userName;
    var channelName = config.channelName;

    let message = await query.getBlockByNumber(peer, channelName, blockId, userName, orgName);
    if (wallet.isJson(message)) {
        let count = message.data.data.length;
        res.json({ status: true, count: count });
    } else {
        res.json({ status: false, 
            errorCode: errCode.ERR_BLOCK_NOT_EXISTED, 
            msg: wallet.getErrMsg(req, errCode.ERR_BLOCK_NOT_EXISTED) });
    }
}

async function getBlockTransactionCountByHash(req,res) {
    let blockHash = req.body.blockHash;
    if (!blockHash) {
        res.json({
            status: false,
            errorCode: errCode.ERR_BLOCK_ID_OR_HASH_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_BLOCK_ID_OR_HASH_CANNOT_BE_NULL)
        });
        return;
    }
    var peer = config.platQueryNode.peers[0];
    var orgName = config.platQueryNode.orgName;
    var userName = config.platQueryNode.userName;
    var channelName = config.channelName;

    let message = await query.getBlockByHash(peer, channelName, blockHash, userName, orgName);
    if (wallet.isJson(message)) {
        let count = message.data.data.length;
        res.json({ status: true, count: count });
    } else {
        res.json({ status: false, 
            errorCode: errCode.ERR_BLOCK_NOT_EXISTED, 
            msg: wallet.getErrMsg(req, errCode.ERR_BLOCK_NOT_EXISTED) });
    }
}

async function getPublickKey(req, res, chaincodeName, channelName) {
    var address = req.params.address;
    if (!address) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }
    wallet.platQuery("queryPublicKey", [address], res, null);
}

function queryChargeGas(req,res) {
    let fcn = 'queryChargeGas';
    wallet.platQuery(fcn, "query_gas", res, function (msg) {
        if (msg.status == true) {
            res.json({ status: true, gas: msg.data.gas, decimalUnits: msg.data.decimalUnits });
        } else {
            wallet.writeJson(res, msg);
        }
    });
}

//查询手续费地址
function queryGasAddress(req, res) {
    let fcn = 'queryGasAddress';
    wallet.platQuery(fcn, "", res, function (msg) {
        wallet.writeJson(res, msg);
    });
}

function queryVestingInfo(req, res) {
    let address = req.body.address;
    let pubKey = req.body.pubKey;
    let originData = req.body.originData;
    let signature = req.body.signature;
    let fcn = 'queryVestingInfo';
    var args = [address, pubKey, originData, signature];
    wallet.platQuery(fcn, args, res,function (msg) {
        if(msg.status==true&&msg.data=="") {
            msg.data = [];
        }
        wallet.writeJson(res, msg);
    });
}

function queryMasterAdressOfToken(req, res) {
    let tokenID = req.params.tokenID;
    let fcn = 'queryMasterAdressOfToken';
    var args = [tokenID];
    wallet.platQuery(fcn, args, res, function (msg) {
        wallet.writeJson(res,msg);
    });
}

function queryConfirmInfo(req, res) {
    let tokenID = req.body.tokenID;
    let data = req.body.data;
    let fcn = 'queryConfirmInfo';
    var args = [tokenID,data];
    wallet.platQuery(fcn, args, res, function (msg) {
        wallet.writeJson(res,msg);
    });
}

function cc_query_get(req, res) {
    var account = req.params.account;
    var args = req.query.args;
    let fcn = req.query.fcn;
    var channelName = config.channelName;

    if (!account) {
        res.json({ status: false, 
            errorCode: errCode.ERR_CONTRACT_ADDRESS_CANNOT_BE_NULL, 
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_ADDRESS_CANNOT_BE_NULL) });
        return;
    }

    if (!fcn) {
        res.json({ status: false, 
            errorCode: errCode.ERR_CONTRACT_INVOKE_FUNCTION_CANNOT_BE_NULL, 
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_INVOKE_FUNCTION_CANNOT_BE_NULL)  });
        return;
    }

    if (!args) {
        res.json({ status: false, 
            errorCode: errCode.ERR_CONTRACT_INVOKE_ARGS_CANNOT_BE_NULL, 
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_INVOKE_ARGS_CANNOT_BE_NULL) });
        return;
    }

    wallet.platQuery('isValidContract', [account], res, async function (msg) {
        if (msg.status == true) {
            var ccObj = msg.data;
            if (ccObj.status == 1) {
                res.json({ status: false, 
                    errorCode: errCode.ERR_CONTRACT_NOT_INSTANTIATED_YET, 
                    msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_NOT_INSTANTIATED_YET) });
                return;
            } else if (ccObj.status == 4) {
                res.json({ status: false, 
                    errorCode: errCode.ERR_CONTRACT_FORBIDDEN, 
                    msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_FORBIDDEN) });
                return;
            }

            args = wallet.parseParams(args);
            var peer = config.busnQueryNode.peers[0];
            var userName = config.busnQueryNode.userName;
            var orgName = config.busnQueryNode.orgName;
            let chaincodeName = account + "_" + ccObj.contractSymbol.replace(' ', '');
            let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, userName, orgName);
            wallet.writeJson(res, message);
        } else {
            wallet.writeJson(res, msg);
        }
    });
}

function cc_query_post(req, res) {
    var account = req.params.account;
    var args = req.body.args;
    let fcn = req.body.fcn;
    var channelName = config.channelName;

    if (!account) {
        res.json({ status: false, 
            errorCode: errCode.ERR_CONTRACT_ADDRESS_CANNOT_BE_NULL, 
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_ADDRESS_CANNOT_BE_NUL) });
        return;
    }

    if (!fcn) {
        res.json({ status: false, 
            errorCode: errCode.ERR_CONTRACT_INVOKE_FUNCTION_CANNOT_BE_NULL, 
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_INVOKE_FUNCTION_CANNOT_BE_NULL) });
        return;
    }

    if (!args) {
        res.json({ status: false, 
            errorCode: errCode.ERR_CONTRACT_INVOKE_ARGS_CANNOT_BE_NULL, 
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_INVOKE_ARGS_CANNOT_BE_NULL) });
        return;
    }

    wallet.platQuery('isValidContract', [account], res, async function (msg) {
        if (msg.status == true) {
            var ccObj = msg.data;
            if (ccObj.status == 1) {
                res.json({ status: false, 
                    errorCode: errCode.ERR_CONTRACT_NOT_INSTANTIATED_YET, 
                    msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_NOT_INSTANTIATED_YET) });
                return;
            } else if (ccObj.status == 4) {
                res.json({ status: false, 
                    errorCode: errCode.ERR_CONTRACT_FORBIDDEN, 
                    msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_FORBIDDEN)  });
                return;
            }
            
            args = wallet.parseParams(args);
            var peer = config.busnQueryNode.peers[0];
            var userName = config.busnQueryNode.userName;
            var orgName = config.busnQueryNode.orgName;
            let chaincodeName = account + "_" + ccObj.contractSymbol.replace(' ', '');
            let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, userName, orgName);
            wallet.writeJson(res, message);
        } else {
            wallet.writeJson(res, msg);
        }
    });
}

module.exports = {
    queryChargeGas: queryChargeGas,
    queryGasAddress: queryGasAddress,
    queryBalance: queryBalance,
    queryTransferHistoryInfo: queryTransferHistoryInfo,
    queryTransferStatus: queryTransferStatus,
    queryMultiTransferStatus: queryMultiTransferStatus,
    getVar: getVar,
    walletIsExist: walletIsExist,
    managerCount: managerCount,
    isAddressManager: isAddressManager,
    isMaterOrManagerOfAddr: isMaterOrManagerOfAddr,
    getMajorityThreshold: getMajorityThreshold,
    isConfirmed: isConfirmed,
    isConfirmedBy: isConfirmedBy,
    isMajorityConfirmed: isMajorityConfirmed,
    vestingFunc: vestingFunc,
    queryWithdrawed: queryWithdrawed,
    hexToNumber: hexToNumber,
    vestingsBalance: vestingsBalance,
    vestingsBalanceDetail: vestingsBalanceDetail,
    queryVestingInfo: queryVestingInfo,
    balanceOf: balanceOf,
    allowance: allowance,
    queryTokenInfo: queryTokenInfo,
    queryConfirmInfo: queryConfirmInfo,
    queryMasterAdressOfToken: queryMasterAdressOfToken,
    queryMasterTokenInfo: queryMasterTokenInfo,
    queryWalletsByToken: queryWalletsByToken,
    queryTransferCount: queryTransferCount,
    getPublickKey: getPublickKey,
    getTransactionByHash: getTransactionByHash,
    getBlockInfo: getBlockInfo,
    getChainInfo: getChainInfo,
    getBlockNumber: getBlockNumber,
    getBlockTransactionCountByHash: getBlockTransactionCountByHash,
    getBlockTransactionCountByNumber: getBlockTransactionCountByNumber,
    getTransactionByBlockNumberAndIndex: getTransactionByBlockNumberAndIndex,
    getTransactionByBlockHashAndIndex: getTransactionByBlockHashAndIndex,
    cc_query_get: cc_query_get,
    cc_query_post: cc_query_post
}
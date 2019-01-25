'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('game-address');
var wallet = require('./wallet.js');
var helper = require('../app/helper.js')
var invoke = require('../app/invoke-transaction.js');
var config = require('../config.json');
var db = require('./mysql_pool')
var errCode = require('./errorcode.js');

let express = require('express');
let gameRouter = express.Router();

//国密私钥
let GAME_PRIVATEKEY = "a57944716f0674bf339a4c00f3873cb9396a85766fe893cf99067010488d3fc2";
//国密公钥
let GAME_PUBLICKEY = "042f4e107ee456375e05529fe969f6a10d98ef5fa4b9eaa19b138626d66f25dd059eb5b9ef567f2fb4deecc4285050d8ce9be6ab12ae74c3cb2d4f438b5ec910a3";

//中心系统私钥
let CENTER_PRIVATEKEY = "KymdUtTYKxPZZiTocUc1Dg2fLS4to7thAE6BjPpsWf6Qc5vgWbij";

//中心系统地址
let CENTER_ADDRESS = "U17TJQnX9ytdfMcLMLdHBpm3geBARf2Y4Vc";

//access token有效时长（分钟）
let VALID_INTERVAL = 2;

//获取游戏人物对应的地址
gameRouter.get('/getGameAddress', function (req, res, next) {
    var addrObj = wallet.newWallet();
    if (addrObj.status == true) {
        var newPrivateKey = helper.encrypt(GAME_PUBLICKEY, addrObj.privateKey);
        var access_token = wallet.getUUID();
        db.asyncQuery("INSERT INTO t_wallet_info(address,pub_key,private_key,access_token,create_time,valid_time)VALUES(?,?,?,?,now(),(select date_add(now(), interval " + VALID_INTERVAL + " minute)))", [addrObj.address, addrObj.publicKey, newPrivateKey, access_token], function (err, items, fields) {
            if (!err) {
                res.json({
                    status: true,
                    data: { address: addrObj.address, access_token: access_token}
                });
            } else {
                res.json({ status: false, errorCode: errCode.ERR_GAME_GET_ADDRESS_FAILURE, msg: wallet.getErrMsg(req, errCode.ERR_GAME_GET_ADDRESS_FAILURE) });
            }
        });
    }
});

//刷新access_token
gameRouter.post('/refreshAccessToken', function (req, res, next) {
    var address = req.body.address;
    var access_token = req.body.access_token;
    if (!address) {
        res.json({ status: false, errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL) });
        return;
    }
    if (!access_token) {
        res.json({ status: false, errorCode: errCode.ERR_GAME_ACCESS_TOKEN_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_GAME_ACCESS_TOKEN_CANNOT_BE_NULL) });
        return;
    }
    db.asyncQuery("SELECT id,DATE_FORMAT(valid_time,'%Y-%m-%d %H:%i:%s') as valid_time FROM t_wallet_info WHERE address=? AND access_token=?", [address, access_token], function (err, items, fields) {
        if (!err&&items.length>0) {
            var item = items[0];
            var valid_time = item.valid_time;
            var curr_time = wallet.getStdDateTime();
            if (wallet.compareDate(valid_time, curr_time)<=0) {//已过期
                var new_access_token = wallet.getUUID();
                db.syncQuery("UPDATE t_wallet_info SET access_token=?,valid_time=(select date_add(now(), interval " + VALID_INTERVAL + " minute)) WHERE id=?", [new_access_token, item.id]);
                res.json({
                    status: true,
                    data: new_access_token
                });
            } else {
                res.json({
                    status: true,
                    data: access_token
                });
            }
        } else {
            res.json({ status: false, errorCode: errCode.ERR_GAME_REFRESH_TOKEN_FAILURE, msg: wallet.getErrMsg(req, errCode.ERR_GAME_REFRESH_TOKEN_FAILURE) });
        }
    });
});

//游戏转账操作
gameRouter.post('/transfer', async function (req, res, next) {
    var address = req.body.address;
    var access_token = req.body.access_token;
    var number = req.body.number;

    let message = await transfer(req,address, access_token, number);
    res.json(message);
});

//游戏提币操作
gameRouter.post('/withdrawCoin', async function (req, res, next) {
    var fromAddress = req.body.fromAddress;//付款地址
    var toAddress = req.body.toAddress;//收款地址
    var access_token = req.body.access_token;//访问的token
    var number = req.body.number;//提币数量

    let message = await withdrawCoin(req,fromAddress, toAddress, access_token, number);
    res.json(message);
});

//提币操作
async function withdrawCoin(req,fromAddress, toAddress, access_token, number) {
    if (!fromAddress) {
        return {
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        };
    }
    if (!wallet.isValidAddress(fromAddress)) {
        return {
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, fromAddress)
        };
    }
    if (!toAddress) {
        return {
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        };
    }
    if (!wallet.isValidAddress(toAddress)) {
        return {
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, toAddress)
        };
    }
    if (!access_token) {
        return {
            status: false,
            errorCode: errCode.ERR_GAME_ACCESS_TOKEN_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_GAME_ACCESS_TOKEN_CANNOT_BE_NULL)
        };
    }
    if (!number) {
        return {
            status: false,
            errorCode: errCode.ERR_GAME_WITHDRAW_NUMBER_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_GAME_WITHDRAW_NUMBER_CANNOT_BE_NULL)
        };
    }

    if (!wallet.GtZeroNumric(number)) {
        return {
            status: false,
            errorCode: errCode.ERR_GAME_WITHDRAW_NUMBER_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_GAME_WITHDRAW_NUMBER_MUST_GREATER_THAN_0)
        };
    }

    let items = await db.syncQuery("SELECT id,pub_key,private_key,DATE_FORMAT(valid_time,'%Y-%m-%d %H:%i:%s') as valid_time FROM t_wallet_info WHERE address=? AND access_token=?", [fromAddress, access_token]);
    if (items && items.length > 0) {
        var item = items[0];
        var realAddr = wallet.getAddressWithPubKey(item.pub_key);
        if (realAddr!= fromAddress) {
            return { 
                status: false,
                errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, 
                msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, fromAddress) 
            };
        }
        var valid_time = item.valid_time;
        var curr_time = wallet.getStdDateTime();
        if (wallet.compareDate(valid_time, curr_time) <= 0) {//失效
            return { status: false, 
                errorCode: errCode.ERR_GAME_ACCESS_TOKEN_TIMEOUT, 
                msg: wallet.getErrMsg(req, errCode.ERR_GAME_ACCESS_TOKEN_TIMEOUT) };
        }

        number = number + "";
        var fcn = 'queryMasterTokenInfo';
        let ret = await wallet.syncPlatQuery(fcn,"");
        if(ret.status==false) {
            return ret;
        }

        var tokenID = ret.data.tokenID;
        var pubKey = item.pub_key;
        var encryptKey = item.private_key;
        var privateKey = helper.decrypt(GAME_PRIVATEKEY, encryptKey);

        var signature = "";
        var trans = {
            tokenID: tokenID,
            pubKey: pubKey,
            fromAddress: fromAddress,
            toAddress: toAddress,
            number: number,
            notes: "提币交易",
            txId: wallet.getTxID(),
            time: wallet.getDateTimeNoRod()
        };
        var originStr = JSON.stringify(trans);
        var sigRet = wallet.sign(privateKey, originStr);
        if(sigRet.status==true) {
            signature = sigRet.data;
        } else {
            return sigRet;
        }
 
        var values = {
            token_id: trans.tokenID,
            pub_key: trans.pubKey,
            from_address: trans.fromAddress,
            to_address: trans.toAddress,
            number: trans.number,
            notes: trans.notes,
            tx_id: trans.txId,
            tx_time: trans.time,
            signature: signature,
            status: 1,
            create_time: wallet.getStdDateTime()
        };

        await db.syncQuery('insert into t_transfer_req SET ?', values);
        await execTransfer();
        return { status: true };
    } else {
        return { status: false, 
            errorCode: errCode.ERR_GAME_ACCESS_TOKEN_INVALID, 
            msg: wallet.getErrMsg(req, errCode.ERR_GAME_ACCESS_TOKEN_INVALID) };
    }
}

//转账操作
async function transfer(req,address, access_token, number) {
    if (!address) {
        return {
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        };
    }
    if (!access_token) {
        return {
            status: false,
            errorCode: errCode.ERR_GAME_ACCESS_TOKEN_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_GAME_ACCESS_TOKEN_CANNOT_BE_NULL)
        };
    }
    if (!number) {
        return {
            status: false,
            errorCode: errCode.ERR_GAME_TRANSFER_NUMBER_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_GAME_TRANSFER_NUMBER_CANNOT_BE_NULL)
        };
    }

    let items = await db.syncQuery("SELECT id,pub_key,private_key,DATE_FORMAT(valid_time,'%Y-%m-%d %H:%i:%s') as valid_time FROM t_wallet_info WHERE address=? AND access_token=?", [address, access_token]);
    if (items && items.length > 0) {
        var item = items[0];
        var realAddr = wallet.getAddressWithPubKey(item.pub_key);
        if (realAddr!= address) {
            return { 
                status: false, 
                errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, 
                msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, address)
            };
        }
        var valid_time = item.valid_time;
        var curr_time = wallet.getStdDateTime();
        if (wallet.compareDate(valid_time, curr_time) <= 0) {//失效
            return { status: false, errorCode: errCode.ERR_GAME_ACCESS_TOKEN_TIMEOUT, msg: wallet.getErrMsg(req, errCode.ERR_GAME_ACCESS_TOKEN_TIMEOUT)};
        }

        number = number + "";
        var fcn = 'queryMasterTokenInfo';
        let ret = await wallet.syncPlatQuery(fcn, "");
        if (ret.status == false) {
            return ret;
        }

        var tokenID = ret.data.tokenID;
        var pubKey = item.pub_key;
        var encryptKey = item.private_key;
        var privateKey = helper.decrypt(GAME_PRIVATEKEY, encryptKey);

        var trans = null;
        var originStr = "";
        var signature = "";
        if (number.indexOf("-") > -1) {//从address所在的帐户转入到中心系统帐户中
            trans = {
                tokenID: tokenID,
                pubKey: pubKey,
                fromAddress: address,
                toAddress: CENTER_ADDRESS,
                number: number.replace("-", ""),
                notes: "游戏转账交易",
                txId: wallet.getTxID(),
                time: wallet.getDateTimeNoRod()
            };
            originStr = JSON.stringify(trans);
            var sigRet = wallet.sign(privateKey, originStr);
            if (sigRet.status == true) {
                signature = sigRet.data;
            } else {
                return sigRet;
            }
        } else {
            trans = {
                tokenID: tokenID,
                pubKey: wallet.getPubKeyFromPrivateKey(CENTER_PRIVATEKEY),
                fromAddress: CENTER_ADDRESS,
                toAddress: address,
                number: number,
                notes: "游戏转账交易",
                txId: wallet.getTxID(),
                time: wallet.getDateTimeNoRod()
            };
            originStr = JSON.stringify(trans);
            var sigRet = wallet.sign(CENTER_PRIVATEKEY, originStr);
            if (sigRet.status == true) {
                signature = sigRet.data;
            } else {
                return sigRet;
            }
        }

        var values = {
            token_id: trans.tokenID,
            pub_key: trans.pubKey,
            from_address: trans.fromAddress,
            to_address: trans.toAddress,
            number: trans.number,
            notes: trans.notes,
            tx_id: trans.txId,
            tx_time: trans.time,
            signature: signature,
            status: 1,
            create_time: wallet.getStdDateTime()
        };
        await db.syncQuery('insert into t_transfer_req SET ?', values);
        await execTransfer();
        return { status:true};
    } else {
        return { status: false, errorCode: errCode.ERR_GAME_ACCESS_TOKEN_INVALID, msg: wallet.getErrMsg(req, errCode.ERR_GAME_ACCESS_TOKEN_INVALID) };
    }
}

async function execTransfer() {
    var results = await db.syncQuery("SELECT max(id) as max_id FROM t_transfer_req WHERE status=1", []);
    if (results && results.length > 0) {
        var max_id = results[0].max_id;
        var results = await db.syncQuery("SELECT * FROM t_transfer_req WHERE status=1 AND id<=" + max_id + " ORDER BY id ASC", []);
        if (results && results.length > 0) {
            var len = results.length;
            for (var i = 0; i < len; i++) {
                var obj = results[i];
                var trans = {
                    tokenID: obj.token_id,
                    pubKey: obj.pub_key,
                    fromAddress: obj.from_address,
                    toAddress: obj.to_address,
                    number: obj.number,
                    notes: obj.notes,
                    txId: obj.tx_id,
                    time: obj.tx_time
                };
                var originStr = JSON.stringify(trans);
                var signature = obj.signature;

                var fcn = "transfer";
                var args = [];
                args.push(originStr);
                args.push(originStr);
                args.push(signature);

                var peers = config.platInvokeNode.peers;
                var orgName = config.platInvokeNode.orgName;
                var userName = config.platInvokeNode.userName;

                var chaincodeName = config.chaincodeName;
                var channelName = config.channelName;

                let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, userName, orgName);

                if (typeof message === 'string') {
                    if (message.indexOf('MVCC_READ_CONFLICT') > -1
                        || message.indexOf('PHANTOM_READ_CONFLICT') > -1) {
                        await wallet.platInvoke('updateTransferFailure', args, null, null);
                    }
                }
                if (wallet.isJson(message)) {
                    if(message.status==true) {
                        await db.syncQuery("UPDATE t_transfer_req SET STATUS=2 WHERE id=?", [obj.id]);//success
                    } else {
                        await db.syncQuery("UPDATE t_transfer_req SET STATUS=3, msg=? WHERE id=?", [message.msg, obj.id]);//failure
                    }
                } else {
                    await db.syncQuery("UPDATE t_transfer_req SET STATUS=3, msg=? WHERE id=?", [message,obj.id]);//failure
                }
            }
        }
    }
}

module.exports = gameRouter;
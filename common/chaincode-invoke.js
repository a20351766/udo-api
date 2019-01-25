'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('chaincode-invoke');
var config = require('../config.json');
var wallet = require('./wallet.js');
var invoke = require('../app/invoke-transaction.js');
var db = require('./mysql_pool');
var errCode = require('./errorcode.js');

function createWallet(req,res) {
    var result = wallet.newWallet();
    var request = {
        address: result.address,
        pubKey: result.publicKey,
        createTime: wallet.getDateTimeNoRod()
    };
    var fcn = "createWallet";
    var args = [];
    args.push(JSON.stringify(request));

    wallet.platInvoke(fcn, args, res, function (txId) {
        res.json({
            status: true,
            txId: txId,
            address: result.address,
            publicKey: result.publicKey,
            privateKey: result.privateKey
        });
    });
}

function provideAuthority(req, res) {
    var sender = req.body.address;
    var pubKey = req.body.pubKey;
    var originHexStr = req.body.origin;
    var signature = req.body.signature;

    var origin = wallet.hexStrToObj(originHexStr);
    if (!origin) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_PARSE_FAILURE)
        });
        return;
    }

    var valid = wallet.isValidAddress(sender);
    if (!valid) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, sender)
        });
        return;
    }

    if (wallet.getAddressWithPubKey(pubKey) != sender) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, sender)
        });
        return;
    }

    if (!origin.tokenID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKENID_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKENID_CAN_NOT_BE_NULL)
        });
        return;
    }
    if (!origin.leaderAddress) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }
    valid = wallet.isValidAddress(origin.leaderAddress);
    if (!valid) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, origin.leaderAddress)
        });
        return;
    }
    if (!wallet.GeZeroInt(origin.masterThreshold)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_MASTER_THRESHOLD_MUST_GREATER_THAN_OR_EQ_0,
            msg: wallet.getErrMsg(req, errCode.ERR_MASTER_THRESHOLD_MUST_GREATER_THAN_OR_EQ_0)
        });
        return;
    }
    if (!wallet.GeZeroInt(origin.managerThreshold)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_MANAGER_THRESHOLD_MUST_GREATER_THAN_OR_EQ_0,
            msg: wallet.getErrMsg(req, errCode.ERR_MANAGER_THRESHOLD_MUST_GREATER_THAN_OR_EQ_0)
        });
        return;
    }

    if (!origin.staffAddresses) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }
    for (var i = 0; i < origin.staffAddresses.length;i++) {
        valid = wallet.isValidAddress(origin.staffAddresses[i]);
        if (!valid) {
            res.json({
                status: false,
                errorCode: errCode.ERR_INVALID_ADDRESS,
                msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, origin.staffAddresses[i])
            });
            return;
        }
    }
    var masterThreshold = +origin.masterThreshold;
    var managerThreshold = +origin.managerThreshold;
    if (origin.staffAddresses.length < masterThreshold) {
        res.json({
            status: false,
            errorCode: errCode.ERR_MANAGER_ADDR_COUNT_CANNOT_BE_LESS_THAN_THRESHOLD_NUMBER,
            msg: wallet.getErrMsg(req, errCode.ERR_MANAGER_ADDR_COUNT_CANNOT_BE_LESS_THAN_THRESHOLD_NUMBER, masterThreshold)
        });
        return;
    }
    if (origin.staffAddresses.length < managerThreshold) {
        res.json({
            status: false,
            errorCode: errCode.ERR_MANAGER_ADDR_COUNT_CANNOT_BE_LESS_THAN_THRESHOLD_NUMBER,
            msg: wallet.getErrMsg(req, errCode.ERR_MANAGER_ADDR_COUNT_CANNOT_BE_LESS_THAN_THRESHOLD_NUMBER, managerThreshold)
        });
        return;
    }

    let bl = wallet.verify(originHexStr, signature,pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }

    var sendData = {
        sender: sender,
        pubKey: pubKey,
        originData: originHexStr,
        signature: signature,
        createTime: wallet.getDateTimeNoRod()
    };

    var fcn = "provideAuthority";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function updateWalletPubkey(req,res) {
    var data = req.body.rawData;
    if (!data) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PARAMETER_ERROR,
            msg: wallet.getErrMsg(req, errCode.ERR_PARAMETER_ERROR)
        });
        return;
    }

    var jsonObj = null;
    try {
        var rawData = wallet.hexToStringWide(data);
        jsonObj = JSON.parse(rawData);
    } catch (err) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_PARSE_FAILURE)
        });
        return;
    }

    var origin = jsonObj.origin;
    var signature = jsonObj.signature;
    var pubKey = origin.pubKey;

    if (!origin.address) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }
    var valid = wallet.isValidAddress(origin.address);
    if (!valid) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, origin.address)
        });
        return;
    }

    let address = wallet.getAddressWithPubKey(pubKey);
    if (origin.address != address) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, origin.address)
        });
        return;
    }
    let originStr = JSON.stringify(origin);
    let bl = wallet.verify(originStr, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }

    var fcn = "updateWalletPubkey";
    var args = [];
    args.push(origin.address);
    args.push(pubKey);
    args.push(originStr);
    args.push(signature);
    args.push(wallet.getDateTimeNoRod());

    wallet.platInvoke(fcn, args, res);
}

function transferFrom(req,res) {
    var data = req.body.rawData;
    if (!data) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PARAMETER_ERROR,
            msg: wallet.getErrMsg(req, errCode.ERR_PARAMETER_ERROR)
        });
        return;
    }

    var jsonObj = null;
    try {
        var rawData = wallet.hexToStringWide(data);
        jsonObj = JSON.parse(rawData);
    } catch (err) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_PARSE_FAILURE)
        });
        return;
    }

    var origin = jsonObj.origin;
    var signature = jsonObj.signature;
    var pubKey = origin.pubKey;

    if (!origin.tokenID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKENID_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKENID_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!origin.sender) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!origin.fromAddress) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!origin.toAddress) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!wallet.GtZeroNumric(origin.number)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TRANSFER_NUMBER_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_TRANSFER_NUMBER_MUST_GREATER_THAN_0)
        });
        return;
    }

    if (!wallet.isValidAddress(origin.sender)
        || !wallet.isValidAddress(origin.fromAddress)
        || !wallet.isValidAddress(origin.toAddress)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS)
        });
        return;
    }

    let sender = wallet.getAddressWithPubKey(pubKey);
    if (origin.sender != sender) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,origin.sender)
        });
        return;
    }

    let originStr = JSON.stringify(origin);
    let bl = wallet.verify(originStr, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }

    var sendData = {
        tokenID: origin.tokenID,
        sender: origin.sender,
        fromAddress: origin.fromAddress,
        toAddress: origin.toAddress,
        number: origin.number + "",
        txId: wallet.getTxID(),
        time: wallet.getDateTimeNoRod()
    }
    var fcn = "transferFrom";
    var args = [];
    args.push(JSON.stringify(sendData));
    args.push(pubKey);
    args.push(originStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res);
}

function approve(req,res) {
    var data = req.body.rawData;
    if (!data) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PARAMETER_ERROR,
            msg: wallet.getErrMsg(req, errCode.ERR_PARAMETER_ERROR)
        });
        return;
    }

    var jsonObj = null;
    try {
        var rawData = wallet.hexToStringWide(data);
        jsonObj = JSON.parse(rawData);
    } catch (err) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_PARSE_FAILURE)
        });
        return;
    }

    var origin = jsonObj.origin;
    var signature = jsonObj.signature;
    var pubKey = origin.pubKey;

    if (!origin.tokenID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKENID_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKENID_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!origin.sender) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!origin.address) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!wallet.GtZeroNumric(origin.number)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TRANSFER_NUMBER_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_TRANSFER_NUMBER_MUST_GREATER_THAN_0)
        });
        return;
    }

    if (!wallet.isValidAddress(origin.sender)
        || !wallet.isValidAddress(origin.address)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS)
        });
        return;
    }

    let sender = wallet.getAddressWithPubKey(pubKey);
    if (origin.sender != sender) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, origin.sender)
        });
        return;
    }

    let originStr = JSON.stringify(origin);
    let bl = wallet.verify(originStr, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }

    var sendData = {
        tokenID: origin.tokenID,
        sender: origin.sender,
        address: origin.address,
        number: origin.number + "",
        time: wallet.getDateTimeNoRod()
    }
    var fcn = "approve";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

async function sendRawTransaction(req,res) {
    var originStr = req.body.origin;
    var signature = req.body.signature;

    var origin = null;
    try {
        origin = JSON.parse(originStr);
    } catch (err) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_PARSE_FAILURE)
        });
        return;
    }
    var pubKey = origin.pubKey;
	/*
	if(!origin.tokenID) {
		res.json({
			status: false,
            errorCode: errCode.ERR_TOKENID_CAN_NOT_BE_NULL),
			msg: wallet.getErrMsg(req,errCode.ERR_TOKENID_CAN_NOT_BE_NULL)
		});
		return;
	}*/
    //var valid = wallet.isValidAddress('1KFzzGtDdnq5hrwxXGjwVnKzRbvf8WVxck');

    if (!wallet.GtZeroNumric(origin.number)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TRANSFER_NUMBER_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_TRANSFER_NUMBER_MUST_GREATER_THAN_0)
        });
        return;
    }

    var valid = wallet.isValidAddress(origin.fromAddress);
    if (!valid) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, origin.fromAddress)
        });
        return;
    }

    var valid = wallet.isValidAddress(origin.toAddress);
    if (!valid) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, origin.toAddress)
        });
        return;
    }

    let address = wallet.getAddressWithPubKey(pubKey);
    if (origin.fromAddress != address) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, origin.fromAddress)
        });
        return;
    }
    let bl = wallet.verify(originStr, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }

    //校验成功
    var trans = {
        tokenID: origin.tokenID,
        pubKey: pubKey,
        fromAddress: origin.fromAddress,
        toAddress: origin.toAddress,
        number: origin.number,
        nonce: origin.nonce + "",
        notes: origin.notes,
        txId: wallet.getTxID(),
        time: wallet.getDateTimeNoRod()
    };
    var fcn = "transfer";
    var args = [];
    args.push(JSON.stringify(trans));
    args.push(originStr);
    args.push(signature);

    //同一个人给多人转账时，需排队进行
    if (global.addressMap[origin.fromAddress] == true 
        || global.addressMap[origin.toAddress] == true) {
        await wallet.ZtSleep.sleep(1500);
    }
    global.addressMap[origin.fromAddress] = true;
    global.addressMap[origin.toAddress] = true;
    wallet.platInvoke(fcn, args, res);
}

function multiTransfer(req,res) {
    var data = req.body.rawData;
    if (!data) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PARAMETER_ERROR,
            msg: wallet.getErrMsg(req, errCode.ERR_PARAMETER_ERROR)
        });
        return;
    }

    var jsonObj = null;
    try {
        var rawData = wallet.hexToStringWide(data);
        jsonObj = JSON.parse(rawData);
    } catch (err) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_PARSE_FAILURE)
        });
        return;
    }

    var origin = jsonObj.origin;
    var signature = jsonObj.signature;
    if (!origin.busnID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_MULTITRANSFER_BUSNID_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_MULTITRANSFER_BUSNID_CANNOT_BE_NULL)
        });
        return;
    }

    var transfer = origin.transfer;
    if (!transfer) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TRANSFER_INFO_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TRANSFER_INFO_CANNOT_BE_NULL)
        });
        return;
    }
    var valid = wallet.isValidAddress(transfer.address);
    if (!valid) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS)
        });
        return;
    }

    let addr = wallet.getAddressWithPubKey(transfer.pubKey);
    if (transfer.address != addr) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, transfer.address)
        });
        return;
    }

    if (!transfer.tokenID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKENID_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKENID_CAN_NOT_BE_NULL)
        });
        return;
    }
    if (!transfer.receiveSides) {
        res.json({
            status: false,
            errorCode: errCode.ERR_MULTITRANSFER_RECEIVERS_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_MULTITRANSFER_RECEIVERS_CANNOT_BE_NULL)
        });
    }
    //校验签名
    let pubKey = transfer.pubKey;
    let originStr = JSON.stringify(origin);
    let bl = wallet.verify(originStr, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }

    var receiveSides = transfer.receiveSides;
    for (var k = 0; k < receiveSides.length; k++) {
        var receive = receiveSides[k];
        var valid = wallet.isValidAddress(receive.address);
        if (!valid) {
            res.json({
                status: false,
                errorCode: errCode.ERR_INVALID_ADDRESS,
                msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS)
            });
            return;
        }
        if (!wallet.GtZeroNumric(receive.number)) {
            res.json({
                status: false,
                errorCode: errCode.ERR_TRANSFER_NUMBER_MUST_GREATER_THAN_0,
                msg: wallet.getErrMsg(req, errCode.ERR_TRANSFER_NUMBER_MUST_GREATER_THAN_0)
            });
            return;
        }
        receive.number = receive.number + ""
        receive.status = 1;
        receive.txId = wallet.getTxID();
    }

    var currTime = wallet.getDateTimeNoRod();
    var tokenItem = {
        tokenID: transfer.tokenID,
        receiveSides: transfer.receiveSides
    }
    var transferItem = {
        pubKey: transfer.pubKey,
        address: transfer.address,
        tokenItems: [tokenItem],
        signData: signature
    };
    var request = {
        busnID: origin.busnID,
        nonce: origin.nonce,
        time: currTime,
        transferItems: [transferItem]
    };
    var fcn = "multiTransfer";
    var args = [];
    args.push(JSON.stringify(request));
    args.push(originStr);

    wallet.platInvoke(fcn, args, res, function (txId) {
        let fcn = 'queryMultiTxInfo';
        wallet.platQuery(fcn, txId, res, function (message) {
            message["txId"] = txId;
            wallet.writeJson(res,message);
        });
    });
}

function multiTokenTransfer(req,res) {
    var data = req.body.rawData;
    if (!data) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PARAMETER_ERROR,
            msg: wallet.getErrMsg(req, errCode.ERR_PARAMETER_ERROR)
        });
        return;
    }

    var jsonObj = null;
    try {
        var rawData = wallet.hexToStringWide(data);
        jsonObj = JSON.parse(rawData);
    } catch (err) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_PARSE_FAILURE)
        });
        return;
    }

    var origin = jsonObj.origin;//原数据
    var signData = jsonObj.signData;//签名数据集合
    let originStr = JSON.stringify(origin);

    if (!origin.busnID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_MULTITRANSFER_BUSNID_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_MULTITRANSFER_BUSNID_CANNOT_BE_NULL)
        });
        return;
    }
    if (!signData) {
        res.json({
            status: false,
            errorCode: errCode.ERR_SIGNATURE_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_SIGNATURE_CANNOT_BE_NULL)
        });
        return;
    }
    var transferItems = origin.transferItems;
    if (!transferItems) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TRANSFER_INFO_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TRANSFER_INFO_CANNOT_BE_NULL)
        });
        return;
    }

    for (var i = 0; i < transferItems.length; i++) {
        var item = transferItems[i];
        var valid = wallet.isValidAddress(item.address);
        if (!valid) {
            res.json({
                status: false,
                errorCode: errCode.ERR_INVALID_ADDRESS,
                msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS)
            });
            return;
        }
        let pubKey = item.pubKey;
        let address = wallet.getAddressWithPubKey(pubKey);
        if (item.address != address) {
            res.json({
                status: false,
                errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
                msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, item.address)
            });
            return;
        }

        //校验签名
        let signature = signData[item.address];
        let bl = wallet.verify(originStr, signature, pubKey);
        if (!bl.status) {
            res.json(bl);
            return;
        }

        if (!item.tokenItems || item.tokenItems.length == 0) {
            res.json({
                status: false,
                errorCode: errCode.ERR_TRANSFER_INFO_CANNOT_BE_NULL,
                msg: wallet.getErrMsg(req, errCode.ERR_TRANSFER_INFO_CANNOT_BE_NULL)
            });
            return;
        }

        for (var j = 0; j < item.tokenItems.length; j++) {
            var token = item.tokenItems[j];
            if (!token.tokenID) {
                res.json({
                    status: false,
                    errorCode: errCode.ERR_TOKENID_CAN_NOT_BE_NULL,
                    msg: wallet.getErrMsg(req, errCode.ERR_TOKENID_CAN_NOT_BE_NULL)
                });
                return;
            }
            if (!token.receiveSides) {
                res.json({
                    status: false,
                    errorCode: errCode.ERR_MULTITRANSFER_RECEIVERS_CANNOT_BE_NULL,
                    msg: wallet.getErrMsg(req, errCode.ERR_MULTITRANSFER_RECEIVERS_CANNOT_BE_NULL)
                });
                return;
            }
            var receiveSides = token.receiveSides;
            for (var k = 0; k < receiveSides.length; k++) {
                var receive = receiveSides[k];
                var valid = wallet.isValidAddress(receive.address);
                if (!valid) {
                    res.json({
                        status: false,
                        errorCode: errCode.ERR_INVALID_ADDRESS,
                        msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS)
                    });
                    return;
                }
                if (!wallet.GtZeroNumric(receive.number)) {
                    res.json({
                        status: false,
                        errorCode: errCode.ERR_TRANSFER_NUMBER_MUST_GREATER_THAN_0,
                        msg: wallet.getErrMsg(req, errCode.ERR_TRANSFER_NUMBER_MUST_GREATER_THAN_0)
                    });
                    return;
                }
                receive.number = receive.number + ""
                receive.status = 1;
            }
        }

        item["signData"] = signature;
    }
    origin.transferItems = transferItems;
    //delete origin.pubKey;
    var currTime = wallet.getDateTimeNoRod();
    origin["time"] = currTime;
    var fcn = "multiTransfer";
    var args = [];
    args.push(JSON.stringify(origin));
    args.push(originStr);

    wallet.platInvoke(fcn, args, res);
}

async function ccInvoke(req, res) {
    var account = req.params.account;
    var fcn = req.body.fcn;
    var sender = req.body.sender;//交易发起者
    var pubKey = req.body.pubKey;//交易发起者公钥
    var originData = req.body.originData;//交易原数据,必须为字符串
    var signature  = req.body.signature;//交易签名
    var args = req.body.args;

    if (!account) {
        res.json({ status: false, 
            errorCode: errCode.ERR_CONTRACT_ADDRESS_CANNOT_BE_NULL, 
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_ADDRESS_CANNOT_BE_NULL)
        });
        return;
    }

    if (!fcn) {
        res.json({ 
            status: false, 
            errorCode: errCode.ERR_CONTRACT_INVOKE_FUNCTION_CANNOT_BE_NULL, 
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_INVOKE_FUNCTION_CANNOT_BE_NULL)
        });
        return;
    }

    if(config.gasType == "2") {
        if (!sender) {
            res.json({ 
                status: false, 
                errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL, 
                msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
            });
            return;
        }
        if (!pubKey) {
            res.json({ status: false, 
                errorCode: errCode.ERR_PUBLICKEY_CAN_NOT_BE_NULL,
                msg: wallet.getErrMsg(req, errCode.ERR_PUBLICKEY_CAN_NOT_BE_NULL)
                });
            return;
        }
        if (!originData) {
            res.json({ 
                status: false, 
                errorCode: errCode.ERR_ORIGIN_DATA_CANNOT_BE_NULL, 
                msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_CANNOT_BE_NULL)
            });
            return;
        }
        if (!signature) {
            res.json({ 
                status: false, 
                errorCode: errCode.ERR_SIGNATURE_CANNOT_BE_NULL, 
                msg: wallet.getErrMsg(req, errCode.ERR_SIGNATURE_CANNOT_BE_NULL)
            });
            return;
        }
        if (!wallet.isValidAddress(sender)) {
            res.json({
                status: false,
                errorCode: errCode.ERR_INVALID_ADDRESS,
                msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS)
            });
            return;
        }
        if (sender != wallet.getAddressWithPubKey(pubKey)) {
            res.json({
                status: false,
                errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
                msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, sender)
            });
            return;
        }
        let bl = wallet.verify(originData, signature, pubKey);
        if (!bl.status) {
            res.json(bl);
            return;
        }
    }

    if (!args) {
        res.json({ 
            status: false, 
            errorCode: errCode.ERR_CONTRACT_INVOKE_ARGS_CANNOT_BE_NULL, 
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_INVOKE_ARGS_CANNOT_BE_NULL)
        });
        return;
    }

    wallet.platQuery('isValidContract', [account], res, async function (mResult) {
        if (mResult.status == true) {
            var ccObj = mResult.data;
            if (ccObj.status == 1) {
                res.json({ status: false, 
                    errorCode: errCode.ERR_CONTRACT_NOT_INSTANTIATED_YET, 
                    msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_NOT_INSTANTIATED_YET) 
                });
                return;
            } else if (ccObj.status == 4) {
                res.json({ status: false, 
                    errorCode: errCode.ERR_CONTRACT_FORBIDDEN, 
                    msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_FORBIDDEN)
                });
                return;
            }

            if (config.gasType == "1") {
                if (ccObj.status == 3) {
                    res.json({ 
                        status: false, 
                        errorCode: errCode.ERR_NO_ENOUGH_MAIN_COIN, 
                        msg: wallet.getErrMsg(req, errCode.ERR_NO_ENOUGH_MAIN_COIN)
                    });
                    return;
                }
            }

            args = wallet.parseParams(args);
            var peers = config.busnInvokeNode.peers;
            var org = config.busnInvokeNode.orgName;
            var user = config.busnInvokeNode.userName;
            var channelName = config.channelName;
            let chaincodeName = account + "_" + ccObj.contractSymbol.replace(' ', '');
            var hexStr = wallet.stringToHex(JSON.stringify(args));
            //peers只少得有两个，否则会报背书策略有问题
            let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, user, org);
            if (wallet.isJson(message)) {
                if (message.status == true) {
                    wallet.platQuery("queryChargeGas", "query_gas", res, function (msg) {
                        if (msg.status == true) {
                            if (config.gasType == "1") {//合约用户收取手续费
                                var gasObj = {
                                    channelName: channelName,
                                    ccName: ccObj.contractSymbol,
                                    ccVersion: ccObj.version,
                                    fcnName: fcn,
                                    args: JSON.stringify(args),
                                    address: ccObj.mAddress,
                                    contractAddr: ccObj.contractAddress,
                                    gasUsed: msg.data.gas,
                                    txId: message.txId,
                                    status: 1,
                                    feeType: 3,
                                    createTime: wallet.getStdDateTime()
                                };
                                db.asyncQuery('insert into t_charge_record SET ?', gasObj, function (err, results, fields) {
                                    if (err) {
                                        res.json({
                                            status: false,
                                            errorCode: errCode.ERR_CONTRACT_INVOKE_GAS_RECORD_INSERT_FAILURE,
                                            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_INVOKE_GAS_RECORD_INSERT_FAILURE)
                                        });
                                        return;
                                    }
                                    res.json(message);
                                });
                            } else if (config.gasType == "2") {//普通用户收取手续费
                                //1、判断是否有足够的手续费　2、将手续定期返还
                                let queryArgs = [sender, 'service_charge_gas'];
                                wallet.platQuery('isEnoughBalance', queryArgs, res, function (bResult) {
                                    if (bResult.status == 'true') {
                                        var createTime = wallet.getDateTimeNoRod();
                                        var futureTime = wallet.getVestingEffectTime();
                                        var request = {
                                            sender: sender,
                                            pubKey: pubKey,
                                            originData: originData,
                                            signature: signature,
                                            futureTime: futureTime,
                                            txID: message.txId,
                                            reason: "invoke chaincode of " + fcn + " with args:" + hexStr,
                                            createTime: createTime
                                        };
                                        var jsonStr = JSON.stringify(request);
                                        var txArgs = [];
                                        txArgs.push(jsonStr);
                                        wallet.platInvoke('gasReturnPresale', txArgs, null, function (_msg) {
                                            wallet.writeJson(res,message);
                                        });
                                    } else {
                                        res.json({
                                            status: false,
                                            errorCode: errCode.ERR_NO_ENOUGH_GAS,
                                            msg: wallet.getErrMsg(req, errCode.ERR_NO_ENOUGH_GAS)
                                        });
                                    }
                                });
                            }
                        } else {
                            res.json(msg);
                        }
                    });
                } else {
                    res.json({
                        status: false,
                        errorCode: errCode.ERR_CONTRACT_INVOKE_FAILURE,
                        msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_INVOKE_FAILURE)
                    });
                }
            } else {
                res.json({
                    status: false,
                    errorCode: errCode.ERR_CONTRACT_INVOKE_FAILURE,
                    msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_INVOKE_FAILURE)
                });
            }
        } else {
            res.json(mResult);
        }
    });
}

module.exports = {
    ccInvoke: ccInvoke,
    createWallet: createWallet,
    provideAuthority: provideAuthority,
    updateWalletPubkey: updateWalletPubkey,
    transferFrom: transferFrom,
    approve: approve,
    sendRawTransaction: sendRawTransaction,
    multiTransfer: multiTransfer,
    multiTokenTransfer: multiTokenTransfer
}
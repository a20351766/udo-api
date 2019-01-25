'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('pureland');
var config = require('../config.json');
var wallet = require('./wallet.js');
var upgrade = require('../app/upgrade-chaincode.js');
var query = require('../app/query.js');
var invoke = require('../app/invoke-transaction.js');
var install = require('../app/install-chaincode.js');
var instantiate = require('../app/instantiate-chaincode.js');
var syncTask = require('./sync-task.js');
var path = require('path');
var fileTool = require('./file_download.js');
var unzip = require("unzip2");
var fs = require('fs');
var db = require('./mysql_pool');
var errCode = require('./errorcode.js');

function pldWalletTokenProvideAuthority(req, res) {
    logger.debug('pldWalletTokenProvideAuthority enter');
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
            msg: wallet.getErrMsg(req, errCode.ERR_INVALIDERR_ADDRESS_NOT_MATCH_PUBLICKEY_ADDRESS, sender)
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

    if (!wallet.GeZeroInt(origin.managerThreshold)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_MANAGER_THRESHOLD_PARAM_ERROR,
            msg: wallet.getErrMsg(req, errCode.ERR_MANAGER_THRESHOLD_PARAM_ERROR)
        });
        return;
    }

    if (!origin.managerAddresses) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    for (var i = 0; i < origin.managerAddresses.length;i++) {
        valid = wallet.isValidAddress(origin.managerAddresses[i]);
        if (!valid) {
            res.json({
                status: false,
                errorCode: errCode.ERR_INVALID_ADDRESS,
                msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, origin.managerAddresses[i])
            });
            return;
        }
    }

    var managerThreshold = +origin.managerThreshold;
    if (origin.managerAddresses.length < managerThreshold) {
        res.json({
            status: false,
            errorCode: errCode.ERR_MANAGER_ADDR_COUNT_CANNOT_BE_LESS_THAN_THRESHOLD_NUMBER,
            msg: wallet.getErrMsg(req, errCode.ERR_MANAGER_ADDR_COUNT_CANNOT_BE_LESS_THAN_THRESHOLD_NUMBER,managerThreshold)
        });
        return;
    }

    let bl = wallet.verify(originHexStr, signature, pubKey);
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

    var fcn = "pldWalletTokenProvideAuthority";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function pldWalletTokenConfirm(req,res) {
    logger.debug('pldWalletTokenConfirm enter');
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

    if (!sender) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!wallet.isValidAddress(sender)) {
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

    if (!origin.funcName) {
        res.json({
            status: false,
            errorCode: errCode.ERR_FUNCTION_NAME_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_FUNCTION_NAME_CANNOT_BE_NULL)
        });
        return;
    }

    let bl = wallet.verify(originHexStr, signature, pubKey);
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

    var fcn = "pldWalletTokenConfirm";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function pldWalletTokenRevoke(req,res) {
    logger.debug('pldWalletTokenRevoke enter');
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

    if (!origin.tokenID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKENID_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKENID_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!sender) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!wallet.isValidAddress(sender)) {
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

    if (!origin.funcName) {
        res.json({
            status: false,
            errorCode: errCode.ERR_FUNCTION_NAME_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_FUNCTION_NAME_CANNOT_BE_NULL)
        });
        return;
    }

    let bl = wallet.verify(originHexStr, signature, pubKey);
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

    var fcn = "pldWalletTokenRevoke";
    var args = [JSON.stringify(sendData)];
   
    wallet.platInvoke(fcn, args, res);
}

function pldWalletTokenAddManager(req,res) {
    logger.debug('pldWalletTokenAddManager enter');
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

    if (!origin.tokenID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKENID_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKENID_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!sender) {
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

    if (!wallet.isValidAddress(origin.address)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, origin.address)
        });
        return;
    }

    if (!origin.newAddress) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!wallet.isValidAddress(sender)
        || !wallet.isValidAddress(origin.newAddress)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS)
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

    let bl = wallet.verify(originHexStr, signature, pubKey);
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

    var fcn = "pldWalletTokenAddManager";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}


function pldWalletTokenRemoveManager(req,res) {
    logger.debug('pldWalletTokenRemoveManager enter');
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

    if (!origin.tokenID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKENID_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKENID_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!sender) {
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

    if (!wallet.isValidAddress(origin.address)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, origin.address)
        });
        return;
    }

    if (!origin.oldAddress) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!wallet.isValidAddress(sender)
        || !wallet.isValidAddress(origin.oldAddress)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS)
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

    let bl = wallet.verify(originHexStr, signature, pubKey);
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

    var fcn = "pldWalletTokenRemoveManager";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function pldWalletTokenQueryAuthority(req, res) {
    logger.debug('pldWalletTokenQueryAuthority enter');
    let address = req.params.address;
    let tokenID = req.params.tokenID;
    let fcn = 'pldWalletTokenQueryAuthority';
    wallet.platQuery(fcn, [address, tokenID], res, function (msg) {
        res.json(msg);
    });
}

function pldWalletTokenQueryConfirmInfo(req,res) {
    logger.debug('pldWalletTokenQueryConfirmInfo enter');
    let fcn = 'pldWalletTokenQueryConfirmInfo';
    var address = req.body.address;
    var tokenID = req.body.tokenID;
    var data = req.body.data;
    var args = [];
    args.push(address);
    args.push(tokenID);
    args.push(data);

    wallet.platQuery(fcn, args, res, function (msg) {
        res.json(msg);
    });
}


function pldWalletTokenSetManagerThreshold(req,res) {
    logger.debug('pldWalletTokenSetManagerThreshold enter');
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

    if (!origin.tokenID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKENID_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKENID_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!sender) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!wallet.GeZeroInt(origin.threshold)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_MANAGER_THRESHOLD_PARAM_ERROR,
            msg: wallet.getErrMsg(req, errCode.ERR_MANAGER_THRESHOLD_PARAM_ERROR)
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

    let bl = wallet.verify(originHexStr, signature, pubKey);
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

    var fcn = "pldWalletTokenSetManagerThreshold";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

async function pldTransfer(req,res) {
    logger.debug('pldTransfer enter');
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

    if (!wallet.GtZeroNumric(origin.number)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TRANSFER_NUMBER_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_TRANSFER_NUMBER_MUST_GREATER_THAN_0)
        });
        return;
    }

    if (!sender) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (sender != origin.address) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TRANSFER_SENDER_MUST_BE_FROMADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_TRANSFER_SENDER_MUST_BE_FROMADDRESS)
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
    if (origin.address != address) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, origin.address)
        });
        return;
    }

    let bl = wallet.verify(originHexStr, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }

    var sendData = {
        sender: sender,
        pubKey: pubKey,
        originData: originHexStr,
        signature: signature,
        createTime: wallet.getDateTimeNoRod(),
        txId: wallet.getTxID(),
    };

    var fcn = "pldTransfer";
    var args = [];
    args.push(JSON.stringify(sendData));

    //同一个人给多人转账时，需排队进行
    if (global.addressMap[origin.address] == true 
        || global.addressMap[origin.toAddress] == true) {
        await wallet.ZtSleep.sleep(3000);
    }
    global.addressMap[origin.address] = true;
    global.addressMap[origin.toAddress] = true;

    wallet.platInvoke(fcn, args, res);
}

function pldMultiTransfer(req,res) {
    logger.debug('pldMultiTransfer enter');
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

    if (!sender) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (sender != origin.address) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TRANSFER_SENDER_MUST_BE_FROMADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_TRANSFER_SENDER_MUST_BE_FROMADDRESS)
        });
        return;
    }

    if (!origin.busnID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_MULTITRANSFER_BUSNID_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_MULTITRANSFER_BUSNID_CANNOT_BE_NULL)
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

    let addr = wallet.getAddressWithPubKey(pubKey);
    if (origin.address != addr) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, origin.address)
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

    if (!origin.receiveSides) {
        res.json({
            status: false,
            errorCode: errCode.ERR_MULTITRANSFER_RECEIVERS_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_MULTITRANSFER_RECEIVERS_CANNOT_BE_NULL)
        });
    }

    let bl = wallet.verify(originHexStr, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }

    var receiveSides = origin.receiveSides;
    for (var k = 0; k < receiveSides.length; k++) {
        var receive = receiveSides[k];
        var valid = wallet.isValidAddress(receive.address);
        if (!valid) {
            res.json({
                status: false,
                errorCode: errCode.ERR_INVALID_ADDRESS,
                msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, receive.address)
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

        receive.number = receive.number + "";
        receive.status = 1;
        receive.txId = wallet.getTxID();
    }

    var currTime = wallet.getDateTimeNoRod();
    var tokenItem = {
        tokenID: origin.tokenID,
        receiveSides: origin.receiveSides
    };

    var transferItem = {
        pubKey: pubKey,
        address: origin.address,
        tokenItems: [tokenItem],
        signData: signature
    };

    var sendData = {
        busnID: origin.busnID,
        nonce: origin.nonce,
        time: currTime,
        transferItems: [transferItem]
    };

    var fcn = "pldMultiTransfer";
    var args = [];
    args.push(JSON.stringify(sendData));
    args.push(originHexStr);

    wallet.platInvoke(fcn, args, res, function (txId) {
        let fcn = 'queryMultiTxInfo';
        wallet.platQuery(fcn, txId, res, function (message) {
            message["txId"] = txId;
            res.json(message);
        });
    });
}

function pldApprove(req,res) {
    logger.debug('pldApprove enter');
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

    if (!sender) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (sender != origin.address) {
        res.json({
            status: false,
            errorCode: errCode.ERR_APPROVE_SENDER_MUST_BE_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_APPROVE_SENDER_MUST_BE_ADDRESS)
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

    if (!origin.agentAddress) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (origin.agentAddress == origin.address) {
        res.json({
            status: false,
            errorCode: errCode.ERR_APPROVE_AUTHORIZER_CANNOT_BE_AGENT,
            msg: wallet.getErrMsg(req, errCode.ERR_APPROVE_AUTHORIZER_CANNOT_BE_AGENT)
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

    if (!wallet.isValidAddress(origin.address)
        || !wallet.isValidAddress(origin.agentAddress)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS)
        });
        return;
    }

    let addr = wallet.getAddressWithPubKey(pubKey);
    if (origin.address != addr) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, origin.address)
        });
        return;
    }

    let bl = wallet.verify(originHexStr, signature, pubKey);
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
    }

    var fcn = "pldApprove";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function pldIssueToken(req,res) {
    logger.debug('pldIssueToken enter');
    var data = req.body.rawData;
    if (!data) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PARAMETER_ERROR,
            msg: wallet.getErrMsg(req, errCode.ERR_PARAMETER_ERROR)
        });
        return;
    }

    var jsonObj = wallet.hexStrToObj(data);
    if (!jsonObj) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_PARSE_FAILURE)
        });
        return;
    }

    var originHexStr = jsonObj.origin;
    if (!originHexStr) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_CANNOT_BE_NULL)
        });
        return;
    }

    var origin = wallet.hexStrToObj(originHexStr);
    if (!origin) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_PARSE_FAILURE)
        });
        return;
    }

    var signature = jsonObj.signature;
    var valid = wallet.isValidAddress(jsonObj.address);
    if (!valid) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, jsonObj.address)
        });
        return;
    }

    let address = wallet.getAddressWithPubKey(jsonObj.pubKey);
    if (jsonObj.address != address) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, jsonObj.address)
        });
        return;
    }

    if (!origin.name) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKEN_NAME_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKEN_NAME_CANNOT_BE_NULL)
        });
        return;
    }

    if (origin.name.length < 2 || origin.name.length>32) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKEN_NAME_MUST_BE_2_TO_32_CHARACTER,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKEN_NAME_MUST_BE_2_TO_32_CHARACTER)
        });
        return;
    }

    if (!origin.tokenSymbol) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKEN_SYMBOL_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKEN_SYMBOL_CANNOT_BE_NULL)
        });
        return;
    }

    if (origin.tokenSymbol.length < 2 || origin.tokenSymbol.length > 8) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKEN_SYMBOL_MUST_BE_2_TO_8_CHARACTER,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKEN_SYMBOL_MUST_BE_2_TO_8_CHARACTER)
        });
        return;
    }

    if (!wallet.GeZeroInt(origin.decimalUnits)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKEN_DECIMAL_UNITS_MUST_GREATER_THAN_3,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKEN_DECIMAL_UNITS_MUST_GREATER_THAN_3)
        });
        return;
    }

    if ((+origin.decimalUnits) <= 3) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKEN_DECIMAL_UNITS_MUST_GREATER_THAN_3,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKEN_DECIMAL_UNITS_MUST_GREATER_THAN_3)
        });
        return;
    }

    if ((+origin.decimalUnits) > 18) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKEN_DECIMAL_UNITS_CANNOT_GREATER_THAN_18,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKEN_DECIMAL_UNITS_CANNOT_GREATER_THAN_18)
        });
        return;
    }

    if (!wallet.GtZeroNumric(origin.totalNumber)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKEN_TOTAL_NUMBER_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKEN_TOTAL_NUMBER_MUST_GREATER_THAN_0)
        });
        return;
    }

    if (("" + origin.totalNumber).indexOf(".")>-1) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKEN_TOTAL_NUMBER_MUST_BE_INTEGER,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKEN_TOTAL_NUMBER_MUST_BE_INTEGER)
        });
        return;
    }

    if (("" + origin.totalNumber).length > 16) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKEN_TOTAL_NUMBER_CANNOT_BE_GREATER_THAN_16_DIGIT_NUMBER,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKEN_TOTAL_NUMBER_CANNOT_BE_GREATER_THAN_16_DIGIT_NUMBER)
        });
        return;
    }

    if (!origin.enableNumber) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKEN_ENABLE_NUMBER_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKEN_ENABLE_NUMBER_CANNOT_BE_NULL)
        });
        return;
    }

    if (!wallet.GeZeroNumric(origin.enableNumber)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKEN_ENABLE_NUMBER_MUST_GREATER_THAN_OR_EQUAL_0,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKEN_ENABLE_NUMBER_MUST_GREATER_THAN_OR_EQUAL_0)
        });
        return;
    }

    if (("" + origin.enableNumber).indexOf(".") > -1) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKEN_ENABLE_NUMBER_MUST_BE_INTEGER,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKEN_ENABLE_NUMBER_MUST_BE_INTEGER)
        });
        return;
    }

    var validRet = wallet.validateIssuePrice(origin.issuePrice)
    if (validRet.status == false) {
        res.json(validRet);
        return;
    }

    let bl = wallet.verify(originHexStr, signature, jsonObj.pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }

    //校验成功
    var currTime = wallet.getDateTimeNoRod();
    var effectTime = wallet.getVestingEffectTime();

    var tokenID = wallet.getUUID();
    var sendData = {
        tokenID: tokenID,
        sender: jsonObj.address,
        pubKey: jsonObj.pubKey,
        originData: originHexStr,
        signature: signature,
        createTime: currTime,
        effectTime: effectTime,
        txId: wallet.getTxID()
    };

    var fcn = "pldIssueToken";
    var args = [];
    var str = JSON.stringify(sendData);
    args.push(str);
    
    wallet.platInvoke(fcn, args, res, function (txId) {
        res.json({
            status: true,
            txId: txId,
            tokenId: tokenID
        });
    });
}

function pldSetIssueTokenGas(req,res) {
    logger.debug('pldSetIssueTokenGas enter');
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

    if (!sender) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!wallet.GeZeroNumric(origin.issueTokenGas)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ISSUE_TOKEN_GAS_MUST_GREATER_THAN_OR_EQUAL_0,
            msg: wallet.getErrMsg(req, errCode.ERR_ISSUE_TOKEN_GAS_MUST_GREATER_THAN_OR_EQUAL_0)
        });
        return;
    }

    if (!wallet.isValidAddress(sender)) {
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

    let bl = wallet.verify(originHexStr, signature, pubKey);
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

    var fcn = "pldSetIssueTokenGas";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function pldQueryIssueTokenGas(req,res) {
    logger.debug('pldQueryIssueTokenGas enter');
    let fcn = 'pldQueryIssueTokenGas';
    wallet.platQuery(fcn, "", res, function (msg) {
        if (msg.status == true) {
            res.json({ status: true, gas: msg.data.gas, decimalUnits: msg.data.decimalUnits });
        } else {
            res.json(msg);
        }
    });
}

//验证合约代码是否合法
function validCC(ccPath) {
    var EXTENSION = '.go';
    var filesList = [];

    wallet.readFileList(ccPath + "/", filesList);
    var isValidCC = false;
    var isValidFolder = false;
    filesList.forEach((item) => {
        if (path.extname(item.filename).toLowerCase() === EXTENSION) {
            isValidCC = true;
            if (item.path === (ccPath + "/")) {
                isValidFolder = true;
            }
        }
    });

    if (isValidFolder==true) {
        return {
            status: true,
            msg:''
        };
    } else  {
        if (isValidCC==true) {
            return {
                status: false,
                errorCode: errCode.ERR_CONTRACT_CODE_INVALID,
                msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_CODE_INVALID)
            };
        }
    }

    return {
        status: false,
        errorCode: errCode.ERR_CONTRACT_CODE_INVALID,
        msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_CODE_INVALID)
    };
}

function pldInstallCCWithUrl(req,peers, ccUrl, address, en_short, version, callback) {
    var filePrefix = en_short.replace(' ', '') + version;
    var filePath = path.join(path.resolve(__dirname, '..'), "artifacts/src/github.com/" + address + "/" + filePrefix + "/");

    fileTool.downloadFile(ccUrl, filePath, filePrefix + ".zip", function(retObj) {
        if (retObj.status==true) {
            var readable = fs.createReadStream(retObj.data).pipe(unzip.Extract({ path: filePath }));
            readable.on('close', function () {
                wallet.walk(filePath, async function (err, results) {
                    if (err) {
                        callback({
                            status: false,
                            errorCode: errCode.ERR_CONTRACT_CODE_UNZIP_FAILURE,
                            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_CODE_UNZIP_FAILURE)
                        });
                        return;
                    }

                    if (results && results.length > 0) {
                        var dirpath = results[0];
                        var validRet = validCC(dirpath);
                        if (validRet.status == false) {
                            callback(validRet);
                            return;
                        }
                        var arr = results[0].split("/");
                        var chaincodePath = arr[arr.length - 4] + "/" + arr[arr.length - 3] + "/" + arr[arr.length - 2] + "/" + arr[arr.length - 1];
                        var chaincodeName = address + "_" + en_short.replace(' ', '');
                        var chaincodeVersion = "v" + version;
                        try {
                            var nodeArr = peers;
                            for (var m = 0; m < nodeArr.length; m++) {
                                var node = nodeArr[m];
                                var msg = await install.installChaincode(node.peerNames, chaincodeName, chaincodePath, chaincodeVersion, config.chaincodeType, node.userName, node.orgName);
                                if (m == (nodeArr.length - 1)) {
                                    if (wallet.isJson(msg) && msg.status == true) {
                                        callback({ status: true, ccPath: chaincodePath, msg: "Install chaincode successfully。" });
                                    } else {
                                        callback({ status: false, errorCode: errCode.ERR_CONTRACT_INSTALL_FAILURE, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_INSTALL_FAILURE) });
                                    }
                                }
                            }
                        } catch (err) {
                            callback({ status: false, errorCode: errCode.ERR_CONTRACT_INSTALL_FAILURE, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_INSTALL_FAILURE)});
                        }
                    } else {
                        callback({ status: false, errorCode: errCode.ERR_CONTRACT_CODE_UNZIP_FAILURE, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_CODE_UNZIP_FAILURE) });
                    }
                });
            });
            readable.on("error", function (e) {
                callback({ status: false, errorCode: errCode.ERR_CONTRACT_INSTALL_FAILURE, msg: e.message });
            });
        } else {//文件下载失败
            callback(retObj);
        }
    });
}

function pldInstallCC(req,peers, ccData, address, en_short, version, callback) {
    var base64Data = ccData.replace(/^data:application\/zip;base64,/, "");
    base64Data = base64Data.replace(/^data:application\/x-zip-compressed;base64,/, "");
    var binaryData = new Buffer(base64Data, "base64").toString("binary");
    var filePrefix = en_short.replace(' ', '') + version;
    var filePath = path.join(path.resolve(__dirname, '..'), "artifacts/src/github.com/" + address + "/" + filePrefix + "/");
    wallet.mkdirsSync(filePath);
    
    var fileName = filePath + filePrefix + ".zip";
    fs.writeFile(fileName, binaryData, "binary", function (err) {
        if (err) {
            callback({ status: false, errorCode: errCode.ERR_CONTRACT_INSTALL_FAILURE, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_INSTALL_FAILURE) });
            return;
        }
        var readable = fs.createReadStream(fileName).pipe(unzip.Extract({ path: filePath }));
        readable.on('close', function () {
            wallet.walk(filePath, async function (err, results) {
                if (err) {
                    callback({ status: false, errorCode: errCode.ERR_CONTRACT_CODE_UNZIP_FAILURE, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_CODE_UNZIP_FAILURE)});
                    return;
                }
                if (results && results.length > 0) {
                    var dirpath = results[0];
                    var validRet = validCC(dirpath);
                    if (validRet.status==false) {
                        callback(validRet);
                        return;
                    }
                    var arr = results[0].split("/");
                    var chaincodePath = arr[arr.length - 4] + "/" + arr[arr.length - 3] + "/" + arr[arr.length - 2] + "/" + arr[arr.length - 1];
                    var chaincodeName = address + "_" + en_short.replace(' ', '');
                    var chaincodeVersion = "v" + version;
                    try {
                        var nodeArr = peers;
                        for (var m = 0; m < nodeArr.length; m++) {
                            var node = nodeArr[m];
                            var msg = await install.installChaincode(node.peerNames, chaincodeName, chaincodePath, chaincodeVersion, config.chaincodeType, node.userName, node.orgName);
                            if (m == (nodeArr.length - 1)) {
                                if (wallet.isJson(msg) && msg.status == true) {
                                    callback({ status: true, ccPath: chaincodePath, msg: "Install chaincode successfully。" });
                                } else {
                                    callback({ status: false, errorCode: errCode.ERR_CONTRACT_INSTALL_FAILURE, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_INSTALL_FAILURE) });
                                }
                            }
                        }
                    } catch (err) {
                        callback({ status: false, errorCode: errCode.ERR_CONTRACT_INSTALL_FAILURE, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_INSTALL_FAILURE) });
                    }
                } else {
                    callback({ status: false, errorCode: errCode.ERR_CONTRACT_CODE_UNZIP_FAILURE, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_CODE_UNZIP_FAILURE) });
                }
            });
        });
        readable.on("error", function (e) {
            callback({ status: false, errorCode: errCode.ERR_CONTRACT_INSTALL_FAILURE, msg: e.message });
        });
    });
}

/**
 * 重新组装节点
 * @param {*} peers 
 */
function restructureNodes(peers) {
    var haveSysNode = false;
    var allNodes = [];
    for (var i = 0; i < peers.length; i++) {
        var orgName = peers[i].orgName;
        if (wallet.isSysNode(orgName)) {
            haveSysNode = true;
        } else {
            allNodes.push(peers[i]);
        }
    }
    if(haveSysNode) {
        var nodes = config.platCCInstallNode;
        for (var i = 0; i < nodes.length; i++) {
            var item = nodes[i];
            allNodes.push({ orgName: item.orgName, userName: item.userName, peerNames: item.peers});
        }
    }
    return allNodes;
}

function pldDeployCC(req, res) {
    logger.debug('pldDeployCC enter');
    let withUrl = true;

    var data = req.body.rawData;
    if (!data) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PARAMETER_ERROR,
            msg: wallet.getErrMsg(req, errCode.ERR_PARAMETER_ERROR)
        });
        return;
    }

    var jsonObj = wallet.hexStrToObj(data);
    if (!jsonObj) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_PARSE_FAILURE)
        });
        return;
    }

    var originHexStr = jsonObj.origin;
    if (!originHexStr) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_CANNOT_BE_NULL)
        });
        return;
    }

    var origin = wallet.hexStrToObj(originHexStr);
    if (!origin) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_PARSE_FAILURE)
        });
        return;
    }

    var signature = jsonObj.signature;
    var ccData = jsonObj.ccData;

    var pubKey = jsonObj.pubKey;
    var name = origin.name;
    var contractSymbol = origin.contractSymbol;
    var version = origin.version;
    var remark = origin.remark;
    var ccUrl = origin.ccUrl;
    var peers = origin.peers;

    if (!name) {
        res.json({
            status: false, 
            errorCode: errCode.ERR_CONTRACT_NAME_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_NAME_CANNOT_BE_NULL)
        });
        return;
    }

    if (name.length < 2 || name.length > 32) {
        res.json({
            status: false,
            errorCode: errCode.ERR_CONTRACT_NAME_MUST_BE_2_TO_32_CHARACTER,
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_NAME_MUST_BE_2_TO_32_CHARACTER)
        });
        return;
    }

    if (!contractSymbol) {
        res.json({
            status: false, 
            errorCode: errCode.ERR_CONTRACT_SYMBOL_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_SYMBOL_CANNOT_BE_NULL)
        });
        return;
    }

    if (contractSymbol.length < 2 || contractSymbol.length > 16) {
        res.json({
            status: false,
            errorCode: errCode.ERR_CONTRACT_SYMBOL_MUST_BE_2_TO_16_CHARACTER,
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_SYMBOL_MUST_BE_2_TO_16_CHARACTER)
        });
        return;
    }

    if (!version) {
        res.json({
            status: false, 
            errorCode: errCode.ERR_CONTRACT_VERSION_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_VERSION_CANNOT_BE_NULL)
        });
        return;
    }

    if (!wallet.validateVersion(version)) {
        res.json({
            status: false, 
            errorCode: errCode.ERR_CONTRACT_VERSION_INVALID,
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_VERSION_INVALID)
        });
        return;
    }

    if (!remark) {
        res.json({
            status: false, 
            errorCode: errCode.ERR_CONTRACT_REMARK_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_REMARK_CANNOT_BE_NULL)
        });
        return;
    }

    if (remark.length < 2 || remark.length > 200) {
        res.json({
            status: false,
            errorCode: errCode.ERR_CONTRACT_REMARK_MUST_BE_2_TO_200_CHARACTER,
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_REMARK_MUST_BE_2_TO_200_CHARACTER)
        });
        return;
    }

    if (withUrl == true) {
        if (!ccUrl) {
            res.json({
                status: false,
                errorCode: errCode.ERR_CONTRACT_URL_CANNOT_BE_NULL,
                msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_URL_CANNOT_BE_NULL)
            });
            return;
        }
    } else {
        if (!ccData) {
            res.json({
                status: false,
                errorCode: errCode.ERR_CONTRACT_CODE_CANNOT_BE_NULL,
                msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_CODE_CANNOT_BE_NULL)
            });
            return;
        }
    }

    if (!peers) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PEER_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_PEER_CANNOT_BE_NULL)
        });
        return;
    }

    if (!Array.isArray(peers)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PEER_MUST_IN_ARRAY,
            msg: wallet.getErrMsg(req, errCode.ERR_PEER_MUST_IN_ARRAY)
        });
        return;
    }

    for (var i = 0; i < peers.length; i++) {
        if (!peers[i].orgName || !peers[i].userName || !peers[i].peerNames) {
            res.json({
                status: false,
                errorCode: errCode.ERR_ORG_USER_PEERS_CANNOT_BE_NULL,
                msg: wallet.getErrMsg(req, errCode.ERR_ORG_USER_PEERS_CANNOT_BE_NULL)
            });
            return;
        }

        if (!Array.isArray(peers[i].peerNames)) {
            res.json({
                status: false,
                errorCode: errCode.ERR_PEER_NAME_MUST_IN_ARRAY,
                msg: wallet.getErrMsg(req, errCode.ERR_PEER_NAME_MUST_IN_ARRAY)
            });
            return;
        }
    }

    //重新组装peers
    //peers = restructureNodes(peers);

    let contractAddress = wallet.getUUID();

    var valid = wallet.isValidAddress(jsonObj.address);
    if (!valid) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, jsonObj.address)
        });
        return;
    }

    if (jsonObj.address != wallet.getAddressWithPubKey(pubKey)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, jsonObj.address)
        });
        return;
    }

    var bl = wallet.verify(originHexStr, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }

    let fcn = 'pldIsCanDeployContract';
    let args = [contractAddress, jsonObj.address];
    wallet.platQuery(fcn, args, res, function (msg) {
        if(msg.status==true) {
            if(msg.data == "1") {
                res.json({
                    status: false,
                    errorCode: errCode.ERR_DEPLOY_CONTRACT_PARAM_ERROR,
                    msg: wallet.getErrMsg(req, errCode.ERR_DEPLOY_CONTRACT_PARAM_ERROR)
                });
            } else if (msg.data == "2") {
                res.json({
                    status: false,
                    errorCode: errCode.ERR_CONTRACT_ALREADY_EXISTED,
                    msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_ALREADY_EXISTED)
                });
            } else if (msg.data == "3") {
                if (withUrl==true) {
                    pldInstallCCWithUrl(req,peers, ccUrl, contractAddress, contractSymbol, version, function (bResult) {
                        if (bResult.status == true) {
                            var createTime = wallet.getDateTimeNoRod();
                            var sendData = {
                                name: origin.name,
                                address: jsonObj.address,
                                contractAddress: contractAddress,
                                contractSymbol: contractSymbol,
                                version: version + "",
                                remark: origin.remark,
                                pubKey: pubKey,
                                ccPath: bResult.ccPath,
                                optTime: createTime
                            };
                            var fcn = "pldDeployCC";
                            var args = [];
                            args.push(JSON.stringify(sendData));
                            args.push(originHexStr);
                            args.push(signature);
                            wallet.platInvoke(fcn, args, res, function (txId) {
                                res.json({ status: true, contractAddress: contractAddress, txId: txId });
                            });
                        } else {
                            res.json(bResult);
                        }
                    });
                } else {
                    pldInstallCC(req,peers, ccData, contractAddress, contractSymbol, version, function (bResult) {
                        if (bResult.status == true) {
                            var createTime = wallet.getDateTimeNoRod();
                            var sendData = {
                                name: origin.name,
                                address: jsonObj.address,
                                contractAddress: contractAddress,
                                contractSymbol: contractSymbol,
                                version: version + "",
                                remark: origin.remark,
                                pubKey: pubKey,
                                ccPath: bResult.ccPath,
                                optTime: createTime
                            };
                            var fcn = "pldDeployCC";
                            var args = [];
                            args.push(JSON.stringify(sendData));
                            args.push(originHexStr);
                            args.push(signature);
                            wallet.platInvoke(fcn, args, res, function (txId) {
                                res.json({ status: true, contractAddress: contractAddress, txId: txId });
                            });
                        } else {
                            res.json(bResult);
                        }
                    });
                }
            }
        } else {
            res.json(msg);
        }
    });
}

function pldInstantiateCC(req, res) {
    logger.debug('pldInstantiateCC enter');
    var data = req.body.rawData;
    if (!data) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PARAMETER_ERROR,
            msg: wallet.getErrMsg(req, errCode.ERR_PARAMETER_ERROR)
        });
        return;
    }

    var jsonObj = wallet.hexStrToObj(data);
    if (!jsonObj) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_PARSE_FAILURE)
        });
        return;
    }

    var originHexStr = jsonObj.origin;
    if (!originHexStr) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_CANNOT_BE_NULL)
        });
        return;
    }

    var origin = wallet.hexStrToObj(originHexStr);
    if (!origin) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_PARSE_FAILURE)
        });
        return;
    }
    
    var peers = origin.peers;
    var peerList = [];
    if (!peers) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PEER_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_PEER_CANNOT_BE_NULL)
        });
        return;
    }

    if (!Array.isArray(peers)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PEER_MUST_IN_ARRAY,
            msg: wallet.getErrMsg(req, errCode.ERR_PEER_MUST_IN_ARRAY)
        });
        return;
    }

    for (var i = 0; i < peers.length; i++) {
        if (!peers[i].orgName || !peers[i].userName || !peers[i].peerNames) {
            res.json({
                status: false,
                errorCode: errCode.ERR_ORG_USER_PEERS_CANNOT_BE_NULL,
                msg: wallet.getErrMsg(req, errCode.ERR_ORG_USER_PEERS_CANNOT_BE_NULL)
            });
            return;
        }

        if (!Array.isArray(peers[i].peerNames)) {
            res.json({
                status: false,
                errorCode: errCode.ERR_PEER_NAME_MUST_IN_ARRAY,
                msg: wallet.getErrMsg(req, errCode.ERR_PEER_NAME_MUST_IN_ARRAY)
            });
            return;
        }

        peerList = peerList.concat(peers[i].peerNames);
    }

    var signature = jsonObj.signature;
    var pubKey = jsonObj.pubKey;

    let bl = wallet.verify(originHexStr, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }

    var args = [];
    if (Array.isArray(origin.args)) {
        args = origin.args;
    } else if (wallet.isJson(origin.args)) {
        if (typeof origin.args == 'string') {
            args.push(origin.args);
        }else{
            args.push(JSON.stringify(origin.args));
        }
    } else {
        res.json({
            status: false,
            errorCode: errCode.ERR_ARGS_MUST_BE_ARRAY_OR_JSON,
            msg: wallet.getErrMsg(req, errCode.ERR_ARGS_MUST_BE_ARRAY_OR_JSON)
        });
        return;
    }

    //pldIsValidContract第二个参数 1:实例化合约;2:升级合约;3:查询合约;4:执行合约;5:删除合约
    wallet.platQuery('pldIsValidContract', [origin.contractAddress, "1"], res, async function (msg) {
        if(msg.status==true) {
            var ccObj = msg.data;
            if (ccObj.mAddress != wallet.getAddressWithPubKey(pubKey)) {
                res.json({
                    status: false,
                    errorCode: errCode.ERR_CONTRACT_AND_ADDRESS_NOT_MATCH,
                    msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_AND_ADDRESS_NOT_MATCH)
                });
                return;
            }

            var channelName = config.channelName;
            var chaincodeName = origin.contractAddress + "_" + ccObj.contractSymbol.replace(' ', '');
            var chaincodeVersion = "v" + ccObj.version;
            var hexStr = wallet.stringToHex(JSON.stringify(args));
            var userName = peers[0].userName;
            var orgName = peers[0].orgName;
            var chaincodeType = config.chaincodeType;
            
            let message = await instantiate.instantiateChaincode(peerList, channelName, chaincodeName, chaincodeVersion, null, chaincodeType, args, userName, orgName);
            if (wallet.isJson(message) && message.status == true) {
                var createTime = wallet.getDateTimeNoRod();
                var timestamp = wallet.getVestingEffectTime();
                var request = {
                    actionType: "init_contract",
                    contractAddress: origin.contractAddress,
                    contractSymbol: ccObj.contractSymbol,
                    pubKey: pubKey,
                    originData: originHexStr,
                    signData: signature,
                    startTime: timestamp,
                    txID: message.txId,
                    reason: "instantiate chaincode with args:" + hexStr,
                    createTime: createTime,
                    transTxID: wallet.getTxID()
                };
                var fcn = "pldSetContractStatusAndTakeOffGas";
                var newArgs = [];
                newArgs.push(JSON.stringify(request));
                wallet.platInvoke(fcn, newArgs, res);
            } else {
                var errMsg = "Failed to order the transaction";
                if (message.indexOf(errMsg) > -1) {
                    res.json({
                        status: false,
                        errorCode: errCode.ERR_INSTANTIATE_CONTRACT_FAILURE,
                        msg: wallet.getErrMsg(req, errCode.ERR_INSTANTIATE_CONTRACT_FAILURE)
                    });
                } else {
                    res.json({
                        status: false,
                        errorCode: errCode.ERR_INSTANTIATE_CONTRACT_FAILURE,
                        msg: message
                    });
                }
            }
        } else {
            res.json(msg);
        }
    });
}

function pldUpgradeCC(req, res) {
    logger.debug('pldUpgradeCC enter');
    let withUrl = true;
    
    var data = req.body.rawData;
    if (!data) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PARAMETER_ERROR,
            msg: wallet.getErrMsg(req, errCode.ERR_PARAMETER_ERROR)
        });
        return;
    }

    var jsonObj = wallet.hexStrToObj(data);
    if (!jsonObj) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_PARSE_FAILURE)
        });
        return;
    }

    var originHexStr = jsonObj.origin;
    if (!originHexStr) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_CANNOT_BE_NULL)
        });
        return;
    }

    var origin = wallet.hexStrToObj(originHexStr);
    if (!origin) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_PARSE_FAILURE)
        });
        return;
    }

    var signature = jsonObj.signature;
    var ccData = jsonObj.ccData;

    var pubKey = jsonObj.pubKey;
    var version = origin.version;
    var ccUrl = origin.ccUrl;
    var peers = origin.peers;
    var peerList = [];

    if (!version) {
        res.json({
            status: false,
            errorCode: errCode.ERR_CONTRACT_VERSION_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_VERSION_CANNOT_BE_NULL)
        });
        return;
    }
    
    if (!peers) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PEER_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_PEER_CANNOT_BE_NULL)
        });
        return;
    }

    if (!Array.isArray(peers)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PEER_MUST_IN_ARRAY,
            msg: wallet.getErrMsg(req, errCode.ERR_PEER_MUST_IN_ARRAY)
        });
        return;
    }

    for (var i = 0; i < peers.length; i++) {
        if (!peers[i].orgName || !peers[i].userName || !peers[i].peerNames) {
            res.json({
                status: false,
                errorCode: errCode.ERR_ORG_USER_PEERS_CANNOT_BE_NULL,
                msg: wallet.getErrMsg(req, errCode.ERR_ORG_USER_PEERS_CANNOT_BE_NULL)
            });
            return;
        }

        if (!Array.isArray(peers[i].peerNames)) {
            res.json({
                status: false,
                errorCode: errCode.ERR_PEER_NAME_MUST_IN_ARRAY,
                msg: wallet.getErrMsg(req, errCode.ERR_PEER_NAME_MUST_IN_ARRAY)
            });
            return;
        }

        peerList = peerList.concat(peers[i].peerNames);
    }

    if (withUrl == true) {
        if (!ccUrl) {
            res.json({
                status: false,
                errorCode: errCode.ERR_CONTRACT_URL_CANNOT_BE_NULL,
                msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_URL_CANNOT_BE_NULL)
            });
            return;
        }
    } else {
        if (!ccData) {
            res.json({
                status: false,
                errorCode: errCode.ERR_CONTRACT_CODE_CANNOT_BE_NULL,
                msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_CODE_CANNOT_BE_NULL)
            });
            return;
        }
    }

    var bl = wallet.verify(originHexStr, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }

    var args = [];
    if (Array.isArray(origin.args)) {
        args = origin.args;
    } else if (wallet.isJson(origin.args)) {
        if (typeof origin.args == 'string') {
            args.push(origin.args);
        }else{
            args.push(JSON.stringify(origin.args));
        }
    } else {
        res.json({
            status: false,
            errorCode: errCode.ERR_ARGS_MUST_BE_ARRAY_OR_JSON,
            msg: wallet.getErrMsg(req, errCode.ERR_ARGS_MUST_BE_ARRAY_OR_JSON)
        });
        return;
    }

    wallet.platQuery('pldIsValidContract', [origin.contractAddress, "2"], res, function (bResult) {
        if (bResult.status == true) {
            var ccObj = bResult.data;

            if (ccObj.mAddress != wallet.getAddressWithPubKey(pubKey)) {
                res.json({
                    status: false,
                    errorCode: errCode.ERR_CONTRACT_AND_ADDRESS_NOT_MATCH,
                    msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_AND_ADDRESS_NOT_MATCH)
                });
                return;
            }

            if (wallet.cmp_version(version, ccObj.version) != 1) {
                res.json({
                    status: false,
                    errorCode: errCode.ERR_CONTRACT_VERSION_TOO_LOW,
                    msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_VERSION_TOO_LOW, ccObj.version)
                });
                return;
            }

            if(ccObj.status==4) {
                res.json({
                    status: false,
                    errorCode: errCode.ERR_CONTRACT_FORBIDDEN,
                    msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_FORBIDDEN)
                });
                return;
            }

            if(withUrl==true) {
                pldInstallCCWithUrl(req,peers, ccUrl, origin.contractAddress, ccObj.contractSymbol, version, async function (msg) {
                    if (msg.status == true) {
                        var channelName = config.channelName;
                        var chaincodeName = origin.contractAddress + "_" + ccObj.contractSymbol.replace(' ', '');
                        var chaincodeVersion = "v" + version;
                        var hexStr = wallet.stringToHex(JSON.stringify(args));
                        var userName = peers[0].userName;
                        var orgName = peers[0].orgName;
                        var chaincodeType = config.chaincodeType;
                        //升级也只需要对同一链上的其中一个节点进行即可
                        let message = await upgrade.upgradeChaincode(peerList, channelName, chaincodeName, chaincodeVersion, null, chaincodeType, args, userName, orgName);
                        if (wallet.isJson(message) && message.status == true) {
                            var createTime = wallet.getDateTimeNoRod();
                            var timestamp = wallet.getVestingEffectTime();
                            var request = {
                                actionType: "upgrade_contract",
                                contractAddress: origin.contractAddress,
                                contractSymbol: ccObj.contractSymbol,
                                version: version,
                                pubKey: pubKey,
                                originData: originHexStr,
                                signData: signature,
                                startTime: timestamp,
                                txID: message.txId,
                                reason: "upgrade chaincode with args:" + hexStr,
                                createTime: createTime,
                                transTxID: wallet.getTxID()
                            };
                            var fcn = "pldSetContractStatusAndTakeOffGas";
                            var newArgs = [];
                            newArgs.push(JSON.stringify(request));
                            wallet.platInvoke(fcn, newArgs, res);
                        } else {
                            res.json({
                                status: false,
                                errorCode: errCode.ERR_CONTRACT_UPGRADE_FAILURE,
                                msg: message
                            });
                        }
                    } else {
                        res.json(msg);
                    }
                });
            } else {
                pldInstallCC(req,peers, ccData, origin.contractAddress, ccObj.contractSymbol, version, async function (msg) {
                    if (msg.status == true) {
                        var channelName = config.channelName;
                        var chaincodeName = origin.contractAddress + "_" + ccObj.contractSymbol.replace(' ', '');
                        var chaincodeVersion = "v" + version;
                        var hexStr = wallet.stringToHex(JSON.stringify(args));
                        var userName = peers[0].userName;
                        var orgName = peers[0].orgName;
                        var chaincodeType = config.chaincodeType;
                        //升级也只需要对同一链上的其中一个节点进行即可
                        let message = await upgrade.upgradeChaincode(peerList, channelName, chaincodeName, chaincodeVersion, null, chaincodeType, args, userName, orgName);
                        if (wallet.isJson(message) && message.status == true) {
                            var createTime = wallet.getDateTimeNoRod();
                            var timestamp = wallet.getVestingEffectTime();
                            var request = {
                                actionType: "upgrade_contract",
                                contractAddress: origin.contractAddress,
                                contractSymbol: ccObj.contractSymbol,
                                version: version,
                                pubKey: pubKey,
                                originData: originHexStr,
                                signData: signature,
                                startTime: timestamp,
                                txID: message.txId,
                                reason: "upgrade chaincode with args:" + hexStr,
                                createTime: createTime,
                                transTxID: wallet.getTxID()
                            };
                            var fcn = "pldSetContractStatusAndTakeOffGas";
                            var newArgs = [];
                            newArgs.push(JSON.stringify(request));
                            wallet.platInvoke(fcn, newArgs, res);
                        } else {
                            res.json({
                                status: false,
                                errorCode: errCode.ERR_CONTRACT_UPGRADE_FAILURE,
                                msg: message
                            });
                        }
                    } else {
                        res.json(msg);
                    }
                });
            }
        } else {
            res.json(bResult);
        }
    });
}

async function pldChaincodeQuery(req, res) {
    logger.debug('pldChaincodeQuery enter');
    let account = req.params.account;
    let args = req.body.args;
    let fcn = req.body.fcn;
    let channelName = config.channelName;

    if (!account) {
        res.json({
            status: false,
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

    if (!args) {
        res.json({
            status: false,
            errorCode: errCode.ERR_CONTRACT_INVOKE_ARGS_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_INVOKE_ARGS_CANNOT_BE_NULL)
        });
        return;
    }

    var peerInfo = await getPeerNode(account);//获取节点信息

    wallet.platQuery('pldIsValidContract', [account, "3"], res, async function (msg) {
        if (msg.status == true) {
            var ccObj = msg.data;
            if (ccObj.status == 1) {
                res.json({
                    status: false,
                    errorCode: errCode.ERR_CONTRACT_NOT_INSTANTIATED_YET,
                    msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_NOT_INSTANTIATED_YET)
                });
                return;
            } else if (ccObj.status == 4) {
                res.json({
                    status: false,
                    errorCode: errCode.ERR_CONTRACT_FORBIDDEN,
                    msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_FORBIDDEN)
                });
                return;
            }

            args = wallet.parseParams(args);
            let chaincodeName = account + "_" + ccObj.contractSymbol.replace(' ', '');
            let message = await query.queryChaincode(peerInfo.peerNames[0], channelName, chaincodeName, args, fcn, peerInfo.userName, peerInfo.orgName);
            res.json(message);
        } else {
            res.json(msg);
        }
    });
}

/**
 * 根据合约地址获取节点信息，如果未找到对应的用户节点信息，就取系统的节点信息
 * @param {*} contractAddress 
 */
async function getPeerNode(contractAddress) {
    var results = await db.syncQuery("SELECT b.name,b.org_name from t_cc_peer_rel a inner join t_peer_info b on b.name=a.peer_name and b.user_id=a.user_id where a.contract_address=?", [contractAddress]);
    if (results && results.length > 0) {
        var item = results[0];
        return {
            userName:"user",
            orgName:item.org_name,
            peerNames:[item.name]
        }
    } else {
        var nodes = config.platCCInstallNode;
        return {
            userName: nodes[0].userName,
            orgName: nodes[0].orgName,
            peerNames: [nodes[0].peers[0]]
        }
    }
}

/**
 * 删除合约时，需要从哪些peer节点删除合约容器
 * @param {*} contractAddress 
 */
async function getDeletePeerNode(contractAddress) {
    var results = await db.syncQuery("SELECT distinct b.node_ip from t_cc_peer_rel a inner join t_peer_info b on b.name=a.peer_name where a.contract_address=?", [contractAddress]);
    if (results && results.length > 0) {
        var peers = [];
        for (var i = 0; i < results.length;i++) {
            peers.push(results[i].node_ip);
        }
        return peers;
    }
    return null;
}

async function pldChaincodeInvoke(req, res) {
    logger.debug('pldChaincodeInvoke enter');
    var account = req.params.account;
    var fcn = req.body.fcn;
    var args = req.body.args;
    var sender = req.body.sender;//交易发起者
    var pubKey = req.body.pubKey;//交易发起者公钥
    var originData = req.body.originData;//交易原数据,必须为字符串
    var signature  = req.body.signature;//交易签名

    if (!account) {
        res.json({
            status: false,
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

    var peerInfo = await getPeerNode(account);//获取节点信息
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
            res.json({
                status: false,
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
                msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, sender)
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

    wallet.platQuery('pldIsValidContract', [account, "4"], res, async function (mResult) {
        if (mResult.status == true) {
            var ccObj = mResult.data;
            if (ccObj.status == 1) {
                res.json({
                    status: false,
                    errorCode: errCode.ERR_CONTRACT_NOT_INSTANTIATED_YET,
                    msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_NOT_INSTANTIATED_YET)
                });
                return;
            } else if (ccObj.status == 4) {
                res.json({
                    status: false,
                    errorCode: errCode.ERR_CONTRACT_FORBIDDEN,
                    msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_FORBIDDEN)
                });
                return;
            }

            if (config.gasType == "1") {
                if (ccObj.status == 3) {
                    res.json({
                        status: false,
                        errorCode: errCode.ERR_NO_ENOUGH_GAS,
                        msg: wallet.getErrMsg(req, errCode.ERR_NO_ENOUGH_GAS)
                    });
                    return;
                }
            }

            args = wallet.parseParams(args);
            var channelName = config.channelName;
            let chaincodeName = account + "_" + ccObj.contractSymbol.replace(' ', '');
            var hexStr = wallet.stringToHex(JSON.stringify(args));
            //peers只少得有两个，否则会报背书策略有问题
            let message = await invoke.invokeChaincode(peerInfo.peerNames, channelName, chaincodeName, fcn, args, peerInfo.userName, peerInfo.orgName);
            if (wallet.isJson(message) && message.status == true) {
                if (config.gasType == "1") {//收取合约用户手续费
                    var createTime = wallet.getDateTimeNoRod();
                    var timestamp = wallet.getVestingEffectTime();
                    var request = {
                        gasType: config.gasType,
                        actionType: "invoke_contract",
                        contractAddress: account,
                        contractSymbol: ccObj.contractSymbol,
                        //sender: sender,
                        //pubKey: pubKey,
                        //originData: originHexStr,
                        //signData: signature,
                        startTime: timestamp,
                        txID: message.txId,
                        reason: "invoke chaincode with function:" + fcn + " args:" + hexStr,
                        createTime: createTime,
                        transTxID: wallet.getTxID()
                    };
                    var gasfcn = "pldContractInvokeTakeOffGas";
                    var newArgs = [];
                    newArgs.push(JSON.stringify(request));
                    wallet.platInvoke(gasfcn, newArgs, res);
                } else if (config.gasType == "2") {//收取执行者手续费
                    var createTime = wallet.getDateTimeNoRod();
                    var timestamp = wallet.getVestingEffectTime();
                    var request = {
                        gasType: config.gasType,
                        actionType: "invoke_contract",
                        contractAddress: account,
                        contractSymbol: ccObj.contractSymbol,
                        sender: sender,
                        pubKey: pubKey,
                        originData: originData,
                        signData: signature,
                        startTime: timestamp,
                        txID: message.txId,
                        reason: "invoke chaincode with function:" + fcn + " args:" + hexStr,
                        createTime: createTime,
                        transTxID: wallet.getTxID()
                    };
                    var gasfcn = "pldContractInvokeTakeOffGas";
                    var newArgs = [];
                    newArgs.push(JSON.stringify(request));
                    wallet.platInvoke(gasfcn, newArgs, res);
                }
            } else {
                res.json({
                    status: false,
                    errorCode: errCode.ERR_CONTRACT_INVOKE_FAILURE,
                    msg: message
                });
            }
        } else {
            res.json(mResult);
        }
    });
}

function pldDeleteContract(req, res) {
    logger.debug('pldDeleteContract enter');
    var data = req.body.rawData;
    if (!data) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PARAMETER_ERROR,
            msg: wallet.getErrMsg(req, errCode.ERR_PARAMETER_ERROR)
        });
        return;
    }

    var jsonObj = wallet.hexStrToObj(data);
    if (!jsonObj) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_PARSE_FAILURE)
        });
        return;
    }

    var originHexStr = jsonObj.origin;
    if (!originHexStr) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_CANNOT_BE_NULL)
        });
        return;
    }

    var origin = wallet.hexStrToObj(originHexStr);
    if (!origin) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_PARSE_FAILURE)
        });
        return;
    }

    var signature = jsonObj.signature;
    var pubKey = jsonObj.pubKey;

    if (!origin.version) {
        res.json({
            status: false,
            errorCode: errCode.ERR_CONTRACT_VERSION_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_VERSION_CANNOT_BE_NULL)
        });
        return;
    }

    let bl = wallet.verify(originHexStr, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }
    
    wallet.platQuery('pldIsValidContract', [origin.contractAddress, "5"], res, function (bResult) {
        if (bResult.status == true) {
            var ccObj = bResult.data;
            if (ccObj.mAddress != wallet.getAddressWithPubKey(pubKey)) {
                res.json({
                    status: false,
                    errorCode: errCode.ERR_CONTRACT_AND_ADDRESS_NOT_MATCH,
                    msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_AND_ADDRESS_NOT_MATCH)
                });
                return;
            }

            var ret = wallet.cmp_version(origin.version, ccObj.version);
            //合约状态:-1、已删除 1、待初始化 2、正在运行 3、余额不足 4、合约已禁用
            if (ret == -1 || ccObj.status == "1") {//删除历史版本(未启用的合约也可以删除)
                var args = [origin.contractAddress, origin.version, pubKey, originHexStr, signature, wallet.getDateTimeNoRod()];
                wallet.platInvoke('pldDeleteContract', args, res, async function (txId) {
                    //res.json({ status: true, msg: '删除成功。' });
                    var peers = await getDeletePeerNode(origin.contractAddress);
                    syncTask.syncDeleteCC(origin.contractAddress, ccObj.contractSymbol, origin.version, req,res, peers);
                });
            } else if (ret == 0) {//删除当前版本
                res.json({
                    status: false,
                    errorCode: errCode.ERR_CANNOT_DELETE_NEWEST_VERSION_CONTRACT,
                    msg: wallet.getErrMsg(req, errCode.ERR_CANNOT_DELETE_NEWEST_VERSION_CONTRACT)
                });
            } else if (ret == 1) {//不存在的版本
                res.json({
                    status: false,
                    errorCode: errCode.ERR_CONTRACT_VERSION_NOT_EXISTED,
                    msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_VERSION_NOT_EXISTED)
                });
            }
        } else {
            res.json(bResult);
        }
    });
}

function pldSetInstantiateContractGas(req,res) {
    logger.debug('pldSetInstantiateContractGas enter');
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

    if (!sender) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!wallet.GeZeroNumric(origin.instantiateContractGas)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_GAS_MUST_GREATER_THAN_OR_EQUAL_0,
            msg: wallet.getErrMsg(req, errCode.ERR_GAS_MUST_GREATER_THAN_OR_EQUAL_0)
        });
        return;
    }

    if (!wallet.isValidAddress(sender)) {
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

    let bl = wallet.verify(originHexStr, signature, pubKey);
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

    var fcn = "pldSetInstantiateContractGas";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function pldQueryInstantiateContractGas(req,res) {
    logger.debug('pldQueryInstantiateContractGas enter');
    let fcn = 'pldQueryInstantiateContractGas';
    wallet.platQuery(fcn, "", res, function (msg) {
        if (msg.status == true) {
            res.json({ status: true, gas: msg.data.gas, decimalUnits: msg.data.decimalUnits });
        } else {
            res.json(msg);
        }
    });
}

function pldSetInvokeContractGas(req,res) {
    logger.debug('pldSetInvokeContractGas enter');
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

    if (!sender) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!wallet.GeZeroNumric(origin.invokeContractGas)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_GAS_MUST_GREATER_THAN_OR_EQUAL_0,
            msg: wallet.getErrMsg(req, errCode.ERR_GAS_MUST_GREATER_THAN_OR_EQUAL_0)
        });
        return;
    }

    if (!wallet.isValidAddress(sender)) {
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

    let bl = wallet.verify(originHexStr, signature, pubKey);
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

    var fcn = "pldSetInvokeContractGas";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function pldQueryInvokeContractGas(req,res) {
    logger.debug('pldQueryInvokeContractGas enter');
    let fcn = 'pldQueryInvokeContractGas';
    wallet.platQuery(fcn, "", res, function (msg) {
        if (msg.status == true) {
            res.json({ status: true, gas: msg.data.gas, decimalUnits: msg.data.decimalUnits });
        } else {
            res.json(msg);
        }
    });
}

module.exports = {
    pldWalletTokenProvideAuthority: pldWalletTokenProvideAuthority,
    pldWalletTokenConfirm: pldWalletTokenConfirm,
    pldWalletTokenRevoke: pldWalletTokenRevoke,
    pldWalletTokenAddManager: pldWalletTokenAddManager,
    pldWalletTokenRemoveManager: pldWalletTokenRemoveManager,
    pldWalletTokenQueryAuthority: pldWalletTokenQueryAuthority,
    pldWalletTokenQueryConfirmInfo: pldWalletTokenQueryConfirmInfo,
    pldWalletTokenSetManagerThreshold: pldWalletTokenSetManagerThreshold,
    pldTransfer: pldTransfer,
    pldMultiTransfer: pldMultiTransfer,
    pldApprove: pldApprove,
    pldIssueToken: pldIssueToken,
    pldSetIssueTokenGas: pldSetIssueTokenGas,
    pldQueryIssueTokenGas: pldQueryIssueTokenGas,
    pldDeployCC: pldDeployCC,
    pldInstantiateCC: pldInstantiateCC,
    pldUpgradeCC: pldUpgradeCC,
    pldChaincodeQuery: pldChaincodeQuery,
    pldChaincodeInvoke: pldChaincodeInvoke,
    pldDeleteContract: pldDeleteContract,
    pldSetInstantiateContractGas: pldSetInstantiateContractGas,
    pldQueryInstantiateContractGas: pldQueryInstantiateContractGas,
    pldSetInvokeContractGas: pldSetInvokeContractGas,
    pldQueryInvokeContractGas: pldQueryInvokeContractGas
}
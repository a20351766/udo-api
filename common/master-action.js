'use strict';

var wallet = require('./wallet.js');
var WAValidator = require('wallet-address-validator');
var errCode = require('./errorcode.js');

function pause(req,res) {
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

    var fcn = "pause";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function resume(req,res) {
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

    var fcn = "resume";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function setMajorityThreshold(req,res) {
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

    var fcn = "setMajorityThreshold";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function setMasterThreshold(req, res) {
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

    var fcn = "setMasterThreshold";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function replaceManager(req,res) {
    var sender = req.body.address;
    var pubKey = req.body.pubKey;
    var originHexStr = req.body.origin;
    var signature = req.body.signature;

    var origin = wallet.hexStrToObj(originHexStr);
    if (!origin) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MERR_ORIGIN_DATA_PARSE_FAILUREATCH_PUBLICKEY)
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

    if (!origin.oldAddress) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
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
        || !wallet.isValidAddress(origin.oldAddress)
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
    var fcn = "replaceManager";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function removeManager(req,res) {
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

    var fcn = "removeManager";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function addManager(req,res) {
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

    var fcn = "addManager";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

module.exports = {
    pause: pause,
    resume: resume,
    setMajorityThreshold: setMajorityThreshold,
    setMasterThreshold: setMasterThreshold,
    replaceManager: replaceManager,
    removeManager: removeManager,
    addManager: addManager
}
'use strict';

var wallet = require('./wallet.js');
var errCode = require('./errorcode.js');
var log4js = require('log4js');
var logger = log4js.getLogger('manager-action');

function confirm(req,res) {
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
    var realAddr = wallet.getAddressWithPubKey(pubKey);
    if (realAddr!= sender) {
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

    var fcn = "confirm";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function revoke(req,res) {
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
    var realAddr = wallet.getAddressWithPubKey(pubKey);
    if (realAddr!= sender) {
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

    var fcn = "revoke";
    var args = [JSON.stringify(sendData)];
   
    wallet.platInvoke(fcn, args, res);
}

function setRequireNum(req, res, fcn) {
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
    if (!wallet.GeZeroNumric(origin.number)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_MAIN_COIN_BUMBER_MUST_GREATER_THAN_OR_EQUAL_0,
            msg: wallet.getErrMsg(req, errCode.ERR_MAIN_COIN_BUMBER_MUST_GREATER_THAN_OR_EQUAL_0)
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

    var sendData = {
        sender: sender,
        pubKey: "",
        originData: originHexStr,
        signature: signature,
        createTime: wallet.getDateTimeNoRod()
    };

    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function returnGasConfig(req,res) {
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

    if (!wallet.GeZeroInt(origin.initReleaseRatio)
        || ((+origin.initReleaseRatio) < 0 || (+origin.initReleaseRatio) > 100)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_GAS_RETURN_INIT_RELEASE_RATIO_MUST_0_TO_100,
            msg: wallet.getErrMsg(req, errCode.ERR_GAS_RETURN_INIT_RELEASE_RATIO_MUST_0_TO_100)
        });
        return;
    }
    if (!wallet.GtZeroInt(origin.interval)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_GAS_RETURN_INTERVAL_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_GAS_RETURN_INTERVAL_MUST_GREATER_THAN_0)
        });
        return;
    }
    if (!wallet.GeZeroInt(origin.releaseRatio)
        || ((+origin.releaseRatio) < 0 || (+origin.releaseRatio) > 100)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_GAS_RETURN_RELEASE_RATIO_MUST_0_TO_100,
            msg: wallet.getErrMsg(req, errCode.ERR_GAS_RETURN_RELEASE_RATIO_MUST_0_TO_100)
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

    var sendData = {
        sender: sender,
        pubKey: "",
        originData: originHexStr,
        signature: signature,
        createTime: wallet.getDateTimeNoRod()
    };

    var fcn = "returnGasConfig";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function presaleVesting(req,res) {
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

    if (!origin.tokenID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKENID_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKENID_CAN_NOT_BE_NULL)
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

    if (!origin.data.address) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!wallet.GeZeroNumric(origin.data.initReleaseAmount)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_VESTING_INIT_RELEASE_AMOUNT_MUST_GREATER_THAN_OR_EQ_0,
            msg: wallet.getErrMsg(req, errCode.ERR_VESTING_INIT_RELEASE_AMOUNT_MUST_GREATER_THAN_OR_EQ_0)
        });
        return;
    }

    if (!wallet.GtZeroNumric(origin.data.amount)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_VESTING_AMOUNT_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_VESTING_AMOUNT_MUST_GREATER_THAN_0)
        });
        return;
    }

    if (!wallet.GtZeroInt(origin.data.interval)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_VESTING_INTERVAL_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_VESTING_INTERVAL_MUST_GREATER_THAN_0)
        });
        return;
    }

    if (!wallet.GtZeroInt(origin.data.periods)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_VESTING_PERIODS_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_VESTING_PERIODS_MUST_GREATER_THAN_0)
        });
        return;
    }

    if (!origin.data.startTime) {
        res.json({
            status: false,
            errorCode: errCode.ERR_VESTING_START_TIME_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_VESTING_START_TIME_MUST_GREATER_THAN_0)
        });
        return;
    }

    var currTime = wallet.getStdDateTime();
    var timestamp = (new Date()).getTime() / 1000;//转换成秒
    if (origin.data.startTime <= timestamp) {
        res.json({
            status: false,
            errorCode: errCode.ERR_VESTING_START_TIME_MUST_GREATER_THAN_CURRENT_TIME,
            msg: wallet.getErrMsg(req, errCode.ERR_VESTING_START_TIME_MUST_GREATER_THAN_CURRENT_TIME)
        });
        return;
    }
    if (!wallet.isValidAddress(sender)
        || !wallet.isValidAddress(origin.data.address)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, origin.data.address)
        });
        return;
    }
    var realAddr = wallet.getAddressWithPubKey(pubKey);
    if (sender != realAddr) {
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
        createTime: currTime
    };
    var fcn = "presaleVesting";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function batchPresaleVesting(req,res) {
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

    if (!origin.tokenID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKENID_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKENID_CAN_NOT_BE_NULL)
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

    var currTime = wallet.getStdDateTime();
    for (var i = 0; i < origin.data.length; i++) {
        var item = origin.data[i];

        if (!item.address) {
            res.json({
                status: false,
                errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
                msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
            });
            return;
        }
        if (!wallet.isValidAddress(item.address)) {
            res.json({
                status: false,
                errorCode: errCode.ERR_INVALID_ADDRESS,
                msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, item.address)
            });
            return;
        }
        if (!wallet.GeZeroNumric(item.initReleaseAmount)) {
            res.json({
                status: false,
                errorCode: errCode.ERR_VESTING_INIT_RELEASE_AMOUNT_MUST_GREATER_THAN_OR_EQ_0,
                msg: wallet.getErrMsg(req, errCode.ERR_VESTING_INIT_RELEASE_AMOUNT_MUST_GREATER_THAN_OR_EQ_0)
            });
            return;
        }
        if (!wallet.GtZeroNumric(item.amount)) {
            res.json({
                status: false,
                errorCode: errCode.ERR_VESTING_AMOUNT_MUST_GREATER_THAN_0,
                msg: wallet.getErrMsg(req, errCode.ERR_VESTING_AMOUNT_MUST_GREATER_THAN_0)
            });
            return;
        }
        if (!wallet.GtZeroInt(item.interval)) {
            res.json({
                status: false,
                errorCode: errCode.ERR_VESTING_INTERVAL_MUST_GREATER_THAN_0,
                msg: wallet.getErrMsg(req, errCode.ERR_VESTING_INTERVAL_MUST_GREATER_THAN_0)
            });
            return;
        }
        if (!wallet.GtZeroInt(item.periods)) {
            res.json({
                status: false,
                errorCode: errCode.ERR_VESTING_PERIODS_MUST_GREATER_THAN_0,
                msg: wallet.getErrMsg(req, errCode.ERR_VESTING_PERIODS_MUST_GREATER_THAN_0)
            });
            return;
        }
        if (!item.startTime) {
            res.json({
                status: false,
                errorCode: errCode.ERR_VESTING_START_TIME_MUST_GREATER_THAN_0,
                msg: wallet.getErrMsg(req, errCode.ERR_VESTING_START_TIME_MUST_GREATER_THAN_0)
            });
            return;
        }
       
        var timestamp = (new Date()).getTime() / 1000;//转换成秒
        if (item.startTime <= timestamp) {
            res.json({
                status: false,
                errorCode: errCode.ERR_VESTING_START_TIME_MUST_GREATER_THAN_CURRENT_TIME,
                msg: wallet.getErrMsg(req, errCode.ERR_VESTING_START_TIME_MUST_GREATER_THAN_CURRENT_TIME)
            });
            return;
        }
    }
    var realAddr = wallet.getAddressWithPubKey(pubKey);
    if (sender != realAddr) {
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
        createTime: currTime
    };

    var fcn = "batchPresaleVesting";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function presale(req,res) {
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

    if (!origin.funcName) {
        res.json({
            status: false,
            errorCode: errCode.ERR_FUNCTION_NAME_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_FUNCTION_NAME_CANNOT_BE_NULL)
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

    if (!origin.data.address) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    if (!wallet.GtZeroNumric(origin.data.number)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PRESALE_NUMBER_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_PRESALE_NUMBER_MUST_GREATER_THAN_0)
        });
        return;
    }

    if (!wallet.isValidAddress(sender)
        || !wallet.isValidAddress(origin.data.address)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS)
        });
        return;
    }
    var realAddr = wallet.getAddressWithPubKey(pubKey);
    if (sender != realAddr) {
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
        originData:　originHexStr,
        signature: signature,
        createTime: wallet.getDateTimeNoRod()
    };
    var fcn = "presale";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function batchPresale(req,res) {
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
    if (!origin.funcName) {
        res.json({
            status: false,
            errorCode: errCode.ERR_FUNCTION_NAME_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_FUNCTION_NAME_CANNOT_BE_NULL)
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
    
    for (var i = 0; i < origin.data.length; i++) {
        var item = origin.data[i];
        if (!item.address) {
            res.json({
                status: false,
                errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
                msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
            });
            return;
        }
        if (!wallet.isValidAddress(item.address)) {
            res.json({
                status: false,
                errorCode: errCode.ERR_INVALID_ADDRESS,
                msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, item.address)
            });
            return;
        }

        if (!wallet.GtZeroNumric(item.number)) {
            res.json({
                status: false,
                errorCode: errCode.ERR_PRESALE_NUMBER_MUST_GREATER_THAN_0,
                msg: wallet.getErrMsg(req, errCode.ERR_PRESALE_NUMBER_MUST_GREATER_THAN_0)
            });
            return;
        }
    }

    var realAddr = wallet.getAddressWithPubKey(pubKey);
    if (sender != realAddr) {
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

    var fcn = "batchPresale";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function issueToken(req,res) {
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
    var valid = wallet.isValidAddress(sender);
    if (!valid) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, sender)
        });
        return;
    }
    var realAddr = wallet.getAddressWithPubKey(pubKey);
    if (sender != realAddr) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, sender)
        });
        return;
    }

    valid = wallet.isValidAddress(origin.address);
    if (!valid) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, origin.address)
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
    if (origin.name.length < 2 || origin.name.length > 32) {
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

    if (("" + origin.totalNumber).indexOf(".") > -1) {
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

    if (!wallet.GtZeroNumric(origin.enableNumber)) {
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

    let bl = wallet.verify(originHexStr, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }
    //校验成功
    var currTime = wallet.getDateTimeNoRod();
    var tokenID = wallet.getUUID();
    var sendData = {
        tokenID: tokenID,
        sender: sender,
        pubKey: pubKey,
        originData: originHexStr,
        signature: signature,
        createTime: currTime
    };
    var fcn = "issueToken";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res, function (txId) {
        res.json({
            status: true,
            txId: txId,
            tokenId: tokenID
        });
    });
}

function seoToken(req,res) {
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
    var valid = wallet.isValidAddress(sender);
    if (!valid) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, sender)
        });
        return;
    }
    var realAddr = wallet.getAddressWithPubKey(pubKey);
    if (sender != realAddr) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, sender)
        });
        return;
    }

    valid = wallet.isValidAddress(origin.address);
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
    if (!wallet.GtZeroNumric(origin.issueNumber)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_SEO_TOKEN_ISSUE_NUMBER_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_SEO_TOKEN_ISSUE_NUMBER_MUST_GREATER_THAN_0)
        });
        return;
    }
    if (("" + origin.issueNumber).indexOf(".") > -1) {
        res.json({
            status: false,
            errorCode: errCode.ERR_SEO_TOKEN_ISSUE_NUMBER_MUST_BE_INTEGER,
            msg: wallet.getErrMsg(req, errCode.ERR_SEO_TOKEN_ISSUE_NUMBER_MUST_BE_INTEGER)
        });
        return;
    }

    if (("" + origin.issueNumber).length > 16) {
        res.json({
            status: false,
            errorCode: errCode.ERR_SEO_TOKEN_ISSUE_NUMBER_CANNOT_BE_GREATER_THAN_16_DIGIT_NUMBER,
            msg: wallet.getErrMsg(req, errCode.ERR_SEO_TOKEN_ISSUE_NUMBER_CANNOT_BE_GREATER_THAN_16_DIGIT_NUMBER)
        });
        return;
    }
    if (!wallet.GtZeroNumric(origin.enableNumber)) {
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
    if (validRet.status==false) {
        res.json(validRet);
        return;
    }

    let bl = wallet.verify(originHexStr, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }
    //校验成功
    var currTime = wallet.getDateTimeNoRod();
    var sendData = {
        sender: sender,
        pubKey: pubKey,
        originData: originHexStr,
        signature: signature,
        createTime: currTime
    };

    var fcn = "seoToken";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function tokenReleasePlan(req,res) {
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
    var realAddr = wallet.getAddressWithPubKey(pubKey);
    if (sender != realAddr) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, sender)
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

    if (!wallet.GtZeroNumric(origin.releaseNumber)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_RELEASE_NUMBER_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_RELEASE_NUMBER_MUST_GREATER_THAN_0)
        });
        return;
    }
    if (!wallet.GtZeroInt(origin.releaseTime)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_RELEASE_TIME_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_RELEASE_TIME_MUST_GREATER_THAN_0)
        });
        return;
    }
    var currTime = wallet.getStdDateTime();
    var timestamp = (new Date()).getTime() / 1000;//转换成秒
    if (origin.releaseTime <= timestamp) {
        res.json({
            status: false,
            errorCode: errCode.ERR_RELEASE_TIME_MUST_GREATER_THAN_CURRENT_TIME,
            msg: wallet.getErrMsg(req, errCode.ERR_RELEASE_TIME_MUST_GREATER_THAN_CURRENT_TIME)
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
        signature: signature
    };

    var fcn = "tokenReleasePlan";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function updateChargeGas(req,res) {
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

    if (!wallet.GeZeroNumric(origin.chargeGas)) {
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
    var realAddr = wallet.getAddressWithPubKey(pubKey);
    if (realAddr != sender) {
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

    var fcn = "updateChargeGas";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function updateTokenStatus(req,res) {
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

    if (!wallet.GeZeroInt(origin.status)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKEN_STATUS_INVALID,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKEN_STATUS_INVALID)
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

    var fcn = "updateTokenStatus";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function lockWallet(req,res) {
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

    if (wallet.getAddressWithPubKey(pubKey) != sender) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, sender)
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

    var fcn = "lockWallet";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function unlockWallet(req,res) {
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

    if (wallet.getAddressWithPubKey(pubKey) != sender) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, sender)
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

    var fcn = "unlockWallet";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function lockToken(req,res) {
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
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }
    if (!wallet.GtZeroNumric(origin.freezeNumber)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_FREEZE_NUMBER_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_FREEZE_NUMBER_MUST_GREATER_THAN_0)
        });
        return;
    }
    var releaseTime = origin.releaseTime;
    if (releaseTime == "") {
        releaseTime = "0";
    } else if (!wallet.GeZeroInt(releaseTime)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_RELEASE_TIME_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_RELEASE_TIME_MUST_GREATER_THAN_0)
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

    var valid = wallet.isValidAddress(origin.address);
    if (!valid) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, origin.address)
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

    var fcn = "lockToken";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

function unlockToken(req,res) {
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
    var id = origin.id;
    if (id == "") {
        id = "0";
    } else if (!wallet.GeZeroInt(id)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_UNLOCK_TOKEN_ID_MUST_GREATER_THAN_OR_EQ_0,
            msg: wallet.getErrMsg(req, errCode.ERR_UNLOCK_TOKEN_ID_MUST_GREATER_THAN_OR_EQ_0)
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

    var valid = wallet.isValidAddress(origin.address);
    if (!valid) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, origin.address)
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

    var fcn = "unlockToken";
    var args = [];
    args.push(JSON.stringify(sendData));

    wallet.platInvoke(fcn, args, res);
}

module.exports = {
    confirm: confirm,
    revoke: revoke,
    setRequireNum: setRequireNum,
    returnGasConfig: returnGasConfig,
    presaleVesting: presaleVesting,
    batchPresaleVesting: batchPresaleVesting,
    presale: presale,
    batchPresale: batchPresale,
    issueToken: issueToken,
    seoToken: seoToken,
    tokenReleasePlan: tokenReleasePlan,
    updateChargeGas: updateChargeGas,
    updateTokenStatus: updateTokenStatus,
    lockWallet: lockWallet,
    unlockWallet: unlockWallet,
    lockToken: lockToken,
    unlockToken: unlockToken
}
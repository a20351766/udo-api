'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('travel');
var config = require('../config.json');
var wallet = require('./wallet.js');
var errCode = require('./errorcode.js');

function addTravelUser(req, res) {
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
    var pubKey = jsonObj.pubKey;

    if (!origin.encryptedTravelUserInfo) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
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

    var user = {
        address: origin.address,
        encryptedTravelUserInfo: origin.encryptedTravelUserInfo
    };

    var fcn = "addTravelUser";
    var args = [];
    args.push(JSON.stringify(user));
    args.push(pubKey);
    args.push(originStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res);
}

function queryTravelUser(req, res) {
    let address = req.params.address;
    let fcn = 'queryTravelUser';
    wallet.platQuery(fcn, address, res);
}

function modifyTravelUserInfo(req, res) {
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
    var pubKey = jsonObj.pubKey;

    if (!origin.encryptedTravelUserInfo) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PARAMETER_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_PARAMETER_CANNOT_BE_NULL)
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
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS,origin.address)
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

    var user = {
        address: origin.address,
        encryptedTravelUserInfo: origin.encryptedTravelUserInfo
    };

    var fcn = "modifyTravelUserInfo";
    var args = [];
    args.push(JSON.stringify(user));
    args.push(pubKey);
    args.push(originStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res);
}

function addTravelSoftText(req, res) {
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
    var pubKey = jsonObj.pubKey;

    if (!origin.text) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
        });
        return;
    }

    if (!origin.createTime) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
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
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS,origin.address)
        });
        return;
    }

    let address = wallet.getAddressWithPubKey(pubKey);
    if (origin.address != address) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,origin.address)
        });
        return;
    }

    let originStr = JSON.stringify(origin);
    let bl = wallet.verify(originStr, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }

    var user = {
        address: origin.address,
        text: origin.text,
        images: origin.images,
        labels: origin.labels,
        location: origin.location,
        createTime: origin.createTime,
        softTextID: wallet.getUUID()
    };

    var fcn = "addTravelSoftText";
    var args = [];
    args.push(JSON.stringify(user));
    args.push(pubKey);
    args.push(originStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res, function (txId) {
        res.json({
            status: true,
            txId: txId,
            softTextID: user.softTextID
        });
    });
}

function delTravelSoftText(req, res) {
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
    var pubKey = jsonObj.pubKey;

    if (!origin.softTextID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
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

    var user = {
        address: origin.address,
        softTextID: origin.softTextID
    };

    var fcn = "delTravelSoftText";
    var args = [];
    args.push(JSON.stringify(user));
    args.push(pubKey);
    args.push(originStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res);
}

function modifyTravelSoftTextImageUrl(req, res) {
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
    var pubKey = jsonObj.pubKey;

    if (origin.travelSoftTextImages.length == 0) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
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

    var user = {
        address: origin.address,
        travelSoftTextImages: origin.travelSoftTextImages
    };

    var fcn = "modifyTravelSoftTextImageUrl";
    var args = [];
    args.push(JSON.stringify(user));
    args.push(pubKey);
    args.push(originStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res);
}

function queryTravelSoftText(req, res) {
    let softTextID = req.params.softTextID;
    let fcn = 'queryTravelSoftText';
    wallet.platQuery(fcn, softTextID, res);
}

function queryTravelSoftTextList(req, res) {
    let address = req.params.address;
    let fcn = 'queryTravelSoftTextList';
    wallet.platQuery(fcn, address, res);
}

function addTravelNote(req, res) {
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
    var pubKey = jsonObj.pubKey;

    if (!origin.title) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
        });
        return;
    }

    if (!origin.text) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
        });
        return;
    }

    if (!origin.createTime) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
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

    var user = {
        address: origin.address,
        title: origin.title,
        text: origin.text,
        coverImage: origin.coverImage,
        coverImageHash: origin.coverImageHash,
        images: origin.images,
        location: origin.location,
        createTime: origin.createTime,
        travelNoteID: wallet.getUUID()
    };

    var fcn = "addTravelNote";
    var args = [];
    args.push(JSON.stringify(user));
    args.push(pubKey);
    args.push(originStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res, function (txId) {
        res.json({
            status: true,
            txId: txId,
            travelNoteID: user.travelNoteID
        });
    });
}

function delTravelNote(req, res) {
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
    var pubKey = jsonObj.pubKey;

    if (!origin.travelNoteID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
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

    var user = {
        address: origin.address,
        travelNoteID: origin.travelNoteID
    };

    var fcn = "delTravelNote";
    var args = [];
    args.push(JSON.stringify(user));
    args.push(pubKey);
    args.push(originStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res);
}

function modifyTravelNoteImageUrl(req, res) {
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
    var pubKey = jsonObj.pubKey;

    if (origin.travelNoteImages.length == 0) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
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
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS,origin.address)
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

    var user = {
        address: origin.address,
        travelNoteImages: origin.travelNoteImages
    };

    var fcn = "modifyTravelNoteImageUrl";
    var args = [];
    args.push(JSON.stringify(user));
    args.push(pubKey);
    args.push(originStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res);
}

function queryTravelNote(req, res) {
    let travelNoteID = req.params.travelNoteID;
    let fcn = 'queryTravelNote';
    wallet.platQuery(fcn, travelNoteID, res);
}

function queryTravelNoteList(req, res) {
    let address = req.params.address;
    let fcn = 'queryTravelNoteList';
    wallet.platQuery(fcn, address, res);
}


function addTravelShortVideo(req, res) {
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
    var pubKey = jsonObj.pubKey;

    if (!origin.text) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
        });
        return;
    }

    if (!origin.video) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
        });
        return;
    }

    if (!origin.createTime) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
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
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS,origin.address)
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

    var user = {
        address: origin.address,
        text: origin.text,
        video: origin.video,
        videoHash: origin.videoHash,
        labels: origin.labels,
        location: origin.location,
        createTime: origin.createTime,
        shortVideoID: wallet.getUUID()
    };

    var fcn = "addTravelShortVideo";
    var args = [];
    args.push(JSON.stringify(user));
    args.push(pubKey);
    args.push(originStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res, function (txId) {
        res.json({
            status: true,
            txId: txId,
            shortVideoID: user.shortVideoID
        });
    });
}

function delTravelShortVideo(req, res) {
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
    var pubKey = jsonObj.pubKey;

    if (!origin.shortVideoID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
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

    var user = {
        address: origin.address,
        shortVideoID: origin.shortVideoID
    };

    var fcn = "delTravelShortVideo";
    var args = [];
    args.push(JSON.stringify(user));
    args.push(pubKey);
    args.push(originStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res);
}

function modifyTravelShortVideoUrl(req, res) {
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
    var pubKey = jsonObj.pubKey;

    if (origin.shortVideoInfos.length == 0) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
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

    var user = {
        address: origin.address,
        shortVideoInfos: origin.shortVideoInfos
    };

    var fcn = "modifyTravelShortVideoUrl";
    var args = [];
    args.push(JSON.stringify(user));
    args.push(pubKey);
    args.push(originStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res);
}

function queryTravelShortVideo(req, res) {
    let shortVideoID = req.params.shortVideoID;
    let fcn = 'queryTravelShortVideo';
    wallet.platQuery(fcn, shortVideoID, res);
}

function queryTravelShortVideoList(req, res) {
    let address = req.params.address;
    let fcn = 'queryTravelShortVideoList';
    wallet.platQuery(fcn, address, res);
}

function addTravelComment(req, res) {
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
            msg: err
        });
        return;
    }

    var origin = jsonObj.origin;
    var signature = jsonObj.signature;
    var pubKey = jsonObj.pubKey;

    if (!origin.subjectID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
        });
        return;
    }

    if (!origin.subjectType) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
        });
        return;
    }

    //SV: short video; ST: soft text; TN: travel note
    if (origin.subjectType !== 'SV' && origin.subjectType !== 'ST' && origin.subjectType !== 'TN') {
        res.json({
            status: false,
            errorCode: errCode.ERR_PARAMETER_ERROR,
            msg: wallet.getErrMsg(req, errCode.ERR_PARAMETER_ERROR)
        });
        return;
    }

    if (!origin.text) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
        });
        return;
    }

    if (!origin.createTime) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
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
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS,origin.address)
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

    var user = {
        subjectID: origin.subjectID,
        subjectType: origin.subjectType,
        address: origin.address,
        firstLevelCommentID: origin.firstLevelCommentID,
        text: origin.text,
        createTime: origin.createTime,
        commentID: wallet.getUUID()
    };

    var fcn = "addTravelComment";
    var args = [];
    args.push(JSON.stringify(user));
    args.push(pubKey);
    args.push(originStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res, function (txId) {
        res.json({
            status: true,
            txId: txId,
            commentID: user.commentID
        });
    });
}

function queryTravelComment(req, res) {
    let commentID = req.params.commentID;
    let fcn = 'queryTravelComment';
    wallet.platQuery(fcn, commentID, res);
}

function queryTravelCommentList(req, res) {
    let subjectID = req.params.subjectID;
    let fcn = 'queryTravelCommentList';
    wallet.platQuery(fcn, subjectID, res);
}

function queryTravelCommentListByAddress(req, res) {
    let address = req.params.address;
    let fcn = 'queryTravelCommentListByAddress';
    wallet.platQuery(fcn, address, res);
}

function addTravelLike(req, res) {
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
    var pubKey = jsonObj.pubKey;

    if (!origin.subjectID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
        });
        return;
    }

    if (!origin.subjectType) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
        });
        return;
    }

    //SV: short video; ST: soft text; TN: travel note
    if (origin.subjectType !== 'SV' && origin.subjectType !== 'ST' && origin.subjectType !== 'TN') {
        res.json({
            status: false,
            errorCode: errCode.ERR_PARAMETER_ERROR,
            msg: wallet.getErrMsg(req, errCode.ERR_PARAMETER_ERROR)
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

    var user = {
        subjectID: origin.subjectID,
        subjectType: origin.subjectType,
        address: origin.address
    };

    var fcn = "addTravelLike";
    var args = [];
    args.push(JSON.stringify(user));
    args.push(pubKey);
    args.push(originStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res, function (txId) {
        res.json({
            status: true,
            txId: txId
        });
    });
}

function queryTravelLikeList(req, res) {
    let subjectID = req.params.subjectID;
    let fcn = 'queryTravelLikeList';
    wallet.platQuery(fcn, subjectID, res);
}

function addTravelAmountOfReading(req, res) {
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
    var pubKey = jsonObj.pubKey;

    if (!origin.subjectID) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
        });
        return;
    }

    if (!origin.subjectType) {
        res.json({
            status: false,
            errorCode: errCode.ERR_LACK_IMPORTANT_PARAMETER,
            msg: wallet.getErrMsg(req, errCode.ERR_LACK_IMPORTANT_PARAMETER)
        });
        return;
    }

    //SV: short video; ST: soft text; TN: travel note
    if (origin.subjectType !== 'SV' && origin.subjectType !== 'ST' && origin.subjectType !== 'TN') {
        res.json({
            status: false,
            errorCode: errCode.ERR_PARAMETER_ERROR,
            msg: wallet.getErrMsg(req, errCode.ERR_PARAMETER_ERROR)
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

    var user = {
        subjectID: origin.subjectID,
        subjectType: origin.subjectType,
        address: origin.address
    };

    var fcn = "addTravelAmountOfReading";
    var args = [];
    args.push(JSON.stringify(user));
    args.push(pubKey);
    args.push(originStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res, function (txId) {
        res.json({
            status: true,
            txId: txId
        });
    });
}

function queryTravelAmountOfReadingList(req, res) {
    let subjectID = req.params.subjectID;
    let fcn = 'queryTravelAmountOfReadingList';
    wallet.platQuery(fcn, subjectID, res);
}

function addTravelInvite(req, res) {
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
    var pubKey = jsonObj.pubKey;

    if (!origin.inviteeAddress) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    var valid = wallet.isValidAddress(origin.inviteeAddress);
    if (!valid) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS,origin.inviteeAddress)
        });
        return;
    }

    if (!origin.inviterAddress) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL)
        });
        return;
    }

    var valid = wallet.isValidAddress(origin.inviterAddress);
    if (!valid) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS,origin.inviterAddress)
        });
        return;
    }

    let inviterAddress = wallet.getAddressWithPubKey(pubKey);
    if (origin.inviterAddress != inviterAddress) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,origin.inviterAddress)
        });
        return;
    }

    let originStr = JSON.stringify(origin);
    let bl = wallet.verify(originStr, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }

    var user = {
        inviteeAddress: origin.inviteeAddress,
        inviterAddress: origin.inviterAddress
    };

    var fcn = "addTravelInvite";
    var args = [];
    args.push(JSON.stringify(user));
    args.push(pubKey);
    args.push(originStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res, function (txId) {
        res.json({
            status: true,
            txId: txId
        });
    });
}

function queryTravelInviteList(req, res) {
    let address = req.params.address;
    let fcn = 'queryTravelInviteList';
    wallet.platQuery(fcn, address, res);
}

function queryTravelBeInvited(req, res) {
    let address = req.params.address;
    let fcn = 'queryTravelBeInvited';
    wallet.platQuery(fcn, address, res);
}

module.exports = {
    addTravelUser: addTravelUser,
    queryTravelUser: queryTravelUser,
    modifyTravelUserInfo: modifyTravelUserInfo,
    addTravelSoftText: addTravelSoftText,
    delTravelSoftText: delTravelSoftText,
    modifyTravelSoftTextImageUrl: modifyTravelSoftTextImageUrl,
    queryTravelSoftText: queryTravelSoftText,
    queryTravelSoftTextList: queryTravelSoftTextList,
    addTravelNote: addTravelNote,
    delTravelNote: delTravelNote,
    modifyTravelNoteImageUrl: modifyTravelNoteImageUrl,
    queryTravelNote: queryTravelNote,
    queryTravelNoteList: queryTravelNoteList,
    addTravelShortVideo: addTravelShortVideo,
    delTravelShortVideo: delTravelShortVideo,
    modifyTravelShortVideoUrl: modifyTravelShortVideoUrl,
    queryTravelShortVideo: queryTravelShortVideo,
    queryTravelShortVideoList: queryTravelShortVideoList,
    addTravelComment: addTravelComment,
    queryTravelComment: queryTravelComment,
    queryTravelCommentList: queryTravelCommentList,
    queryTravelCommentListByAddress: queryTravelCommentListByAddress,
    addTravelLike: addTravelLike,
    queryTravelLikeList: queryTravelLikeList,
    addTravelAmountOfReading: addTravelAmountOfReading,
    queryTravelAmountOfReadingList: queryTravelAmountOfReadingList,
    addTravelInvite: addTravelInvite,
    queryTravelInviteList: queryTravelInviteList,
    queryTravelBeInvited: queryTravelBeInvited
}

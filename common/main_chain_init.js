'use strict';

var channels = require('../app/create-channel.js');
var join = require('../app/join-channel.js');
var install = require('../app/install-chaincode.js');
var upgrade = require('../app/upgrade-chaincode.js');
var instantiate = require('../app/instantiate-chaincode.js');
var helper = require('../app/helper.js');
var wallet = require('./wallet.js');
var config = require('../config.json');
var errCode = require('./errorcode.js');

async function createChannel(req,res) {
    var channelName = req.body.channelName;
    var channelConfigPath = req.body.channelConfigPath;
    if (!channelName) {
        res.json({ status: false, errorCode: errCode.ERR_CHANNEL_NAME_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHANNEL_NAME_CANNOT_BE_NULL)});
        return;
    }
    if (!channelConfigPath) {
        res.json({ status: false, errorCode: errCode.ERR_CHANNEL_CONFIG_PATH_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHANNEL_CONFIG_PATH_CANNOT_BE_NULL)});
        return;
    }

    let message = await channels.createChannel(channelName, channelConfigPath, req.body.username, req.body.orgname);
    res.json(message);
}

async function joinChannel(req,res) {
    var channelName = req.params.channelName;
    var peers = req.body.peers;
    if (!channelName) {
        res.json({ status: false, errorCode: errCode.ERR_CHANNEL_NAME_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHANNEL_NAME_CANNOT_BE_NULL) });
        return;
    }
    if (!peers || peers.length == 0) {
        res.json({ status: false, errorCode: errCode.ERR_CHANNEL_JOIN_PEER_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHANNEL_JOIN_PEER_CANNOT_BE_NULL)});
        return;
    }

    let message = await join.joinChannel(channelName, peers, req.body.username, req.body.orgname);
    res.json(message);
}

async function  installChaincode(req,res) {
    var peers = req.body.peers;
    var chaincodeName = req.body.chaincodeName;
    var chaincodePath = req.body.chaincodePath;
    var chaincodeVersion = req.body.chaincodeVersion;
    var chaincodeType = config.chaincodeType;

    if (!peers || peers.length == 0) {
        res.json({ status: false, errorCode: 
            errCode.ERR_CHANNEL_JOIN_PEER_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHANNEL_JOIN_PEER_CANNOT_BE_NULL) });
        return;
    }
    if (!chaincodeName) {
        res.json({ status: false, 
            errorCode: errCode.ERR_CHANNEL_CHAINCODE_NAME_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHANNEL_CHAINCODE_NAME_CANNOT_BE_NULL) });
        return;
    }
    if (!chaincodePath) {
        res.json({ status: false, 
            errorCode: errCode.ERR_CHANNEL_CHAINCODE_PATH_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHANNEL_CHAINCODE_PATH_CANNOT_BE_NULL) });
        return;
    }
    if (!chaincodeVersion) {
        res.json({ status: false, 
            errorCode: errCode.ERR_CHANNEL_CHAINCODE_VERSION_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHANNEL_CHAINCODE_VERSION_CANNOT_BE_NULL) });
        return;
    }

    let message = await install.installChaincode(peers, chaincodeName, chaincodePath, chaincodeVersion, chaincodeType, req.body.username, req.body.orgname);
    res.json(message);
}

async function upgradeCahincode(req, res) {
    var fcn = null;
    var chaincodeName = req.body.chaincodeName;
    var chaincodeVersion = req.body.chaincodeVersion;
    var peers = req.body.peers;
    var username = req.body.username;
    var orgName = req.body.orgname;

    var channelName = config.channelName;
    var chaincodeType = config.chaincodeType;
    var args = ["upgrade"];

    let message = await upgrade.upgradeChaincode(peers, channelName, chaincodeName, chaincodeVersion, fcn, chaincodeType, args, username, orgName);
    if (wallet.isJson(message)) {
        res.json(message);
    } else {
        res.json({ status: false, errorCode: errCode.ERR_CHAINCODE_UPGRADE_FAILURE, msg: wallet.getErrMsg(req, errCode.ERR_CHAINCODE_UPGRADE_FAILURE)});
    }
}

async function instantiateChaincode(req, res) {
    var peers = req.body.peers;
    var channelName = config.channelName;
    var chaincodeName = config.chaincodeName; 
    var chaincodeVersion = config.chaincodeVersion;
    var chaincodeType = config.chaincodeType;

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
        //{"origin":{"fromAddress":"abcdefg","toAddress":"hijklmn","number":"10"},"signature":"test"}
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

    //var valid = wallet.isValidAddress('1KFzzGtDdnq5hrwxXGjwVnKzRbvf8WVxck');
    var valid = wallet.isValidAddress(origin.address);
    if (!valid) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS,origin.address)
        });
        return;
    }

    valid = wallet.isValidAddress(origin.gasAddress);
    if (!valid) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS,origin.gasAddress)
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

    if (!wallet.GtZeroNumric(origin.issuePrice)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ISSUE_PRICE_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_ISSUE_PRICE_MUST_GREATER_THAN_0)
        });
        return;
    }

    let address = wallet.getAddressWithPubKey(pubKey);
    if (origin.address != address) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, address)
        });
        return;
    }
    let originStr = JSON.stringify(origin);
    let bl = wallet.verify(originStr, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }

    //校验成功
    var fcn = req.body.fcn;
    var name = origin.name;
    var totalNumber = origin.totalNumber;

    if (!name) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKEN_NAME_CANNOT_BE_NULL,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKEN_NAME_CANNOT_BE_NULL)
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

    if (!wallet.GtZeroNumric(totalNumber)) {
        res.json({
            status: false,
            errorCode: errCode.ERR_TOKEN_TOTAL_NUMBER_MUST_GREATER_THAN_0,
            msg: wallet.getErrMsg(req, errCode.ERR_TOKEN_TOTAL_NUMBER_MUST_GREATER_THAN_0)
        });
        return;
    }

    origin["issueTime"] = wallet.getDateTimeNoRod();
    origin["decimalUnits"] = +origin.decimalUnits;
    origin["totalNumber"] = origin.totalNumber + "";
    origin["issuePrice"] = origin.issuePrice + "";

    var tokenID = wallet.getUUID();
    var gasPubKeys = helper.getAllCertPubKeys();

    var genisisRequest = {
        tokenID: tokenID,
        address: origin.address,
        gasAddress: origin.gasAddress,
        chargeGas: origin.chargeGas + "",
        pubKey: origin.pubKey,
        genisisInfo: origin,
        gasPubKeys: gasPubKeys
    };
    var args = [];
    args.push(JSON.stringify(genisisRequest));
    var username = config.platInstantiate.userName;
    var orgName = config.platInstantiate.orgName;

    try {
        let message = await instantiate.instantiateChaincode(peers, channelName, chaincodeName, chaincodeVersion, fcn, chaincodeType, args, username, orgName);
        if (wallet.isJson(message) && message.status == true) {
            res.json({
                status: true,
                tokenID: tokenID,
                msg: 'Creation of the Genesis Block was successful.'
            });
        } else {
            res.json({ status: false, errorCode: errCode.ERR_INSTANTIATE_CONTRACT_FAILURE, msg: wallet.getErrMsg(req, errCode.ERR_INSTANTIATE_CONTRACT_FAILURE) });
        }
    }catch(err) {
        res.json({ status: false, errorCode: errCode.ERR_INSTANTIATE_CONTRACT_FAILURE, msg: wallet.getErrMsg(req, errCode.ERR_INSTANTIATE_CONTRACT_FAILURE) });
    }
}

module.exports = {
    createChannel: createChannel,
    joinChannel: joinChannel,
    installChaincode: installChaincode,
    upgradeCahincode: upgradeCahincode,
    instantiateChaincode: instantiateChaincode
}
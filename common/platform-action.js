'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('platform-action');
var path = require('path');
var fs = require('fs');
var unzip = require("unzip2");
var db = require('./mysql_pool')
var wallet = require('./wallet.js');
var WAValidator = require('wallet-address-validator');
var install = require('../app/install-chaincode.js');
var instantiate = require('../app/instantiate-chaincode.js');
var upgrade = require('../app/upgrade-chaincode.js');
var execCmd = require('./cmd_line');
var config = require('../config.json');
var syncTask = require('./sync-task.js');
var fileTool = require('./file_download.js');
var errCode = require('./errorcode.js');

function chainEnter(req,res) {
    var data = req.body.rawData;
    if (!data) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PARAMETER_ERROR,
            msg: wallet.getErrMsg(req, errCode.ERR_PARAMETER_ERROR)
        });
        return;
    }

    var origin = wallet.hexStrToObj(data);
    if (!origin) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: wallet.getErrMsg(req, errCode.ERR_ORIGIN_DATA_PARSE_FAILURE)
        });
        return;
    }
    var name = origin.name;
    var en_short = origin.en_short;
    var contact_name = origin.contact_name;
    var contact_tel = origin.contact_tel;
    var remark = origin.remark;
    var e_mail = origin.e_mail;

    if (!name) {
        res.json({ status: false, errorCode: errCode.ERR_CHAIN_NAME_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHAIN_NAME_CANNOT_BE_NULL) });
        return;
    }
    if (!en_short) {
        res.json({ status: false, errorCode: errCode.ERR_CHAIN_NAME_SHORT_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHAIN_NAME_SHORT_CANNOT_BE_NULL) });
        return;
    }
    if (!contact_name) {
        res.json({ status: false, errorCode: errCode.ERR_CHAIN_CONTACT_NAME_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHAIN_CONTACT_NAME_CANNOT_BE_NULL) });
        return;
    }
    if (!contact_tel) {
        res.json({ status: false, errorCode: errCode.ERR_CHAIN_CONTACT_TELEPHONE_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHAIN_CONTACT_TELEPHONE_CANNOT_BE_NULL) });
        return;
    }

    if (!remark) {
        res.json({ status: false, errorCode: errCode.ERR_CHAIN_REMARK_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHAIN_REMARK_CANNOT_BE_NULL) });
        return;
    }

    if (e_mail) {
        if (!wallet.isValidEmail(e_mail)) {
            res.json({ status: false, errorCode: errCode.ERR_EMAIL_INVALID, msg: wallet.getErrMsg(req, errCode.ERR_EMAIL_INVALID) });
            return;
        }
    }

    db.asyncQuery("select * from t_chain_enter where en_short=?", [en_short.trim()], function (err, results, fields) {
        if (err) {
            res.json({ status: false, errorCode: errCode.ERR_CHAIN_QUERY_FAILURE, msg: err.sqlMessage });
            return;
        }
        if (results.length > 0) {
            res.json({ status: false, errorCode: errCode.ERR_CHAIN_NAME_SHORT_ALREADY_EXISTED, msg: wallet.getErrMsg(req, errCode.ERR_CHAIN_NAME_SHORT_ALREADY_EXISTED) });
            return;
        }
        var chianObj = {
            name: name.trim(),
            en_short: en_short.trim(),
            contact_name: contact_name.trim(),
            contact_tel: contact_tel.trim(),
            remark: remark.trim(),
            e_mail: e_mail.trim(),
            status: 1,
            create_time: wallet.getStdDateTime()
        };
        db.asyncQuery('insert into t_chain_enter SET ?', chianObj, function (err, results, fields) {
            if (err) {
                res.json({ status: false, errorCode: errCode.ERR_CHAIN_ADD_FAILURE, msg: err.sqlMessage });
                return;
            }
            res.json({ status: true, data: results.insertId });
        });
    });
}

function chainEnterUpdate(req,res) {
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
    var name = origin.name;
    var en_short = origin.en_short;
    var contract_name = origin.contract_name;
    var contract_tel = origin.contract_tel;
    var remark = origin.remark;

    if (!origin.id) {
        res.json({ status: false, errorCode: errCode.ERR_CHAIN_RECORD_ID_CANNOT_BE_NULL, msg: "记录ID不能为空！" });
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
    
    if (!name) {
        res.json({ status: false, errorCode: errCode.ERR_CHAIN_NAME_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHAIN_NAME_CANNOT_BE_NULL) });
        return;
    }
    if (!en_short) {
        res.json({ status: false, errorCode: errCode.ERR_CHAIN_NAME_SHORT_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHAIN_NAME_SHORT_CANNOT_BE_NULL) });
        return;
    }
    if (!contract_name) {
        res.json({ status: false, errorCode: errCode.ERR_CHAIN_CONTACT_NAME_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHAIN_CONTACT_NAME_CANNOT_BE_NULL) });
        return;
    }
    if (!contract_tel) {
        res.json({ status: false, errorCode: errCode.ERR_CHAIN_CONTACT_TELEPHONE_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHAIN_CONTACT_TELEPHONE_CANNOT_BE_NULL) });
        return;
    }
    if (!remark) {
        res.json({ status: false, errorCode: errCode.ERR_CHAIN_REMARK_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHAIN_REMARK_CANNOT_BE_NULL) });
        return;
    }

    let originStr = JSON.stringify(origin);
    let bl = wallet.verify(originStr, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }
    let fcn = 'isEnoughBalance';
    let args = [address, 'createChainCondition'];
    wallet.platQuery(fcn, args, res, function (msg) {
        if (msg.status == 'true') {
            var args = [name.trim(), en_short.trim(), contract_name.trim(), contract_tel.trim(), remark.trim(),origin.id,address];
            db.asyncQuery('update t_chain_enter SET name=?,en_short=?,contract_name=?,contract_tel=?,remark=? where id=? and address=? and status in (1,2,3)', args, function (err, results, fields) {
                if (err) {
                    res.json({ status: false, errorCode: errCode.ERR_CHAIN_INFO_UPDATE_FAILURE, msg: err.sqlMessage });
                    return;
                }
                if (results) {
                    res.json({ status: true, msg: 'Modify successfully。' });
                }
            });
        } else {
            res.json({ status: false, errorCode: errCode.ERR_NO_ENOUGH_MAIN_COIN, msg: wallet.getErrMsg(req, errCode.ERR_NO_ENOUGH_MAIN_COIN) });
        }
    });
}

function chainEnterCommit(req, res) {
    var data = req.body.rawData;
    if (!data) {
        res.json({
            status: false,
            errorCode: errCode.ERR_PARAMETER_ERROR,
            msg: wallet.getErrMsg(req, errCode.ERR_NO_ENOUGERR_PARAMETER_ERRORH_MAIN_COIN)
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
    var pubKey = origin.pubKey;

    if (!origin.id) {
        res.json({ status: false, errorCode: errCode.ERR_CHAIN_RECORD_ID_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHAIN_RECORD_ID_CANNOT_BE_NULL) });
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

    db.asyncQuery("update t_chain_enter set status=2 where status=1 and id=? and address=?", [origin.id, address], function (err, results, fields) {
        if (err) {
            res.json({ status: false, errorCode: errCode.ERR_CHAIN_INFO_UPDATE_FAILURE, msg: err.sqlMessage });
            return;
        }
        res.json({ status: true, msg: 'Commit successfully【' + results.affectedRows + "】rows data。" });
    });
}

function chainEnterSearch(req,res) {
    var keyWord = req.body.keyWord;
    if (!keyWord) {
        db.asyncQuery("select * from t_chain_enter order by create_time desc limit 0,20", null, function (err, results, fields) {
            if (err) {
                res.json({ status: false, errorCode: errCode.ERR_CHAIN_QUERY_FAILURE, msg: err.sqlMessage });
                return;
            }
            res.json({ status: true, data: results });
        });
    } else {
        db.asyncQuery("select * from t_chain_enter where (name like '%" + keyWord + "%' OR en_short like '%" + keyWord + "%' OR contact_name like '%" + keyWord + "%' OR contact_tel like '%" + keyWord + "%') limit 0,20", null, function (err, results, fields) {
            if (err) {
                res.json({ status: false, errorCode: errCode.ERR_CHAIN_QUERY_FAILURE, msg: err.sqlMessage });
                return;
            }
            res.json({ status: true, data: results });
        });
    }
}

function chainEnterInfo(req,res) {
    var id = req.params.id;
    if (!id) {
        res.json({ status: false, errorCode: errCode.ERR_CHAIN_RECORD_ID_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHAIN_RECORD_ID_CANNOT_BE_NULL) });
        return;
    }
    db.asyncQuery("select * from t_chain_enter where id=?", [id], function (err, results, fields) {
        if (err) {
            res.json({ status: false, errorCode: errCode.ERR_CHAIN_QUERY_FAILURE, msg: err.sqlMessage });
            return;
        }
        res.json({ status: true, data: results });
    });
}

function chainEnterDelete(req,res) {
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
    var pubKey = origin.pubKey;

    if (!origin.id) {
        res.json({ status: false, errorCode: errCode.ERR_CHAIN_RECORD_ID_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CHAIN_RECORD_ID_CANNOT_BE_NULL) });
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

    db.asyncQuery("delete from t_chain_enter where status=1 and id=? and address=?", [origin.id, address], function (err, results, fields) {
        if (err) {
            res.json({ status: false, errorCode: errCode.ERR_CHAIN_INFO_DELETE_FAILURE, msg: err.sqlMessage });
            return;
        }
        res.json({ status: true, msg: 'Delete successfully of【' + results.affectedRows + "】rows data。" });
    });
}

function deployeCC(req, res,withUrl) {
    //var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
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
    
    if (!name) {
        res.json({ status: false, errorCode: errCode.ERR_CONTRACT_NAME_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_NAME_CANNOT_BE_NULL) });
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
        res.json({ status: false, errorCode: errCode.ERR_CONTRACT_SYMBOL_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_SYMBOL_CANNOT_BE_NULL) });
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
        res.json({ status: false, errorCode: errCode.ERR_CONTRACT_VERSION_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_VERSION_CANNOT_BE_NULL) });
        return;
    }
    if (!wallet.validateVersion(version)) {
        res.json({ status: false, errorCode: errCode.ERR_CONTRACT_VERSION_INVALID, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_VERSION_INVALID)});
        return;
    }
    if (!remark) {
        res.json({ status: false, errorCode: errCode.ERR_CONTRACT_REMARK_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_REMARK_CANNOT_BE_NULL) });
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

    if (withUrl==true) {
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
            res.json({ status: false, errorCode: errCode.ERR_CONTRACT_CODE_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_CODE_CANNOT_BE_NULL) });
            return;
        }
    }

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

    let fcn = 'isCanDeployeContract';
    let args = [contractAddress, jsonObj.address];
    wallet.platQuery(fcn, args, res, function (msg) {
        if(msg.status==true) {
            if(msg.data == "1") {
                res.json({ status: false, errorCode: errCode.ERR_DEPLOY_CONTRACT_PARAM_ERROR, msg: wallet.getErrMsg(req, errCode.ERR_DEPLOY_CONTRACT_PARAM_ERROR) });
            } else if (msg.data == "2") {
                res.json({ status: false, errorCode: errCode.ERR_CONTRACT_ALREADY_EXISTED, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_ALREADY_EXISTED) });
            } else if (msg.data == "4") {
                res.json({ status: false, errorCode: errCode.ERR_NO_ENOUGH_MAIN_COIN, msg: wallet.getErrMsg(req, errCode.ERR_NO_ENOUGH_MAIN_COIN) });
            } else if (msg.data == "5") {
                res.json({ status: false, errorCode: errCode.ERR_GAS_RETURN_NOT_SET, msg: wallet.getErrMsg(req, errCode.ERR_GAS_RETURN_NOT_SET) });
            } else if (msg.data == "3") {
                if (withUrl==true) {
                    installCCWithUrl(req,ccUrl,contractAddress, contractSymbol, version, function (bResult) {
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
                            var fcn = "deployeCC";
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
                    installCC(req,ccData, contractAddress, contractSymbol, version, function (bResult) {

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
                            var fcn = "deployeCC";
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

function installCCWithUrl(req,ccUrl, address, en_short, version, callback) {
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
                        var validRet = validCC(req,dirpath);
                        if (validRet.status == false) {
                            callback(validRet);
                            return;
                        }
                        var arr = results[0].split("/");
                        var chaincodePath = arr[arr.length - 4] + "/" + arr[arr.length - 3] + "/" + arr[arr.length - 2] + "/" + arr[arr.length - 1];
                        var chaincodeName = address + "_" + en_short.replace(' ', '');
                        var chaincodeVersion = "v" + version;
                        try {
                            var nodeArr = config.busnCCInstallNode;
                            for (var m = 0; m < nodeArr.length; m++) {
                                var node = nodeArr[m];
                                var msg = await install.installChaincode(node.peers, chaincodeName, chaincodePath, chaincodeVersion, config.chaincodeType, node.userName, node.orgName);
                                if (m == (nodeArr.length - 1)) {
                                    if (wallet.isJson(msg) && msg.status == true) {
                                        callback({ status: true, ccPath: chaincodePath, msg: "Install chaincode successfully。" });
                                    } else {
                                        callback({ status: false, errorCode: errCode.ERR_CONTRACT_INSTALL_FAILURE, msg: msg });
                                    }
                                }
                            }
                        } catch (err) {
                            callback({ status: false, errorCode: errCode.ERR_CONTRACT_INSTALL_FAILURE, msg: "Install chaincode failure,err:" + err });
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

function installCC(req,ccData, address,en_short,version,callback) {
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
                    callback({ status: false, errorCode: errCode.ERR_CONTRACT_CODE_UNZIP_FAILURE, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_CODE_UNZIP_FAILURE) });
                    return;
                }
                if (results && results.length > 0) {
                    var dirpath = results[0];
                    var validRet = validCC(req,dirpath);
                    if (validRet.status==false) {
                        callback(validRet);
                        return;
                    }
                    var arr = results[0].split("/");
                    var chaincodePath = arr[arr.length - 4] + "/" + arr[arr.length - 3] + "/" + arr[arr.length - 2] + "/" + arr[arr.length - 1];
                    var chaincodeName = address + "_" + en_short.replace(' ', '');
                    var chaincodeVersion = "v" + version;
                    try {
                        var nodeArr = config.busnCCInstallNode;
                        for (var m = 0; m < nodeArr.length; m++) {
                            var node = nodeArr[m];
                            var msg = await install.installChaincode(node.peers, chaincodeName, chaincodePath, chaincodeVersion, config.chaincodeType, node.userName, node.orgName);
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

//验证合约代码是否合法
function validCC(req,ccPath) {
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
        return {status: true, msg:''};
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

//instantiate chaincode
function instantiateCC(req, res) {
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
        res.json({ status: false, errorCode: errCode.ERR_ARGS_MUST_BE_ARRAY_OR_JSON, msg: wallet.getErrMsg(req, errCode.ERR_ARGS_MUST_BE_ARRAY_OR_JSON) });
        return;
    }

    wallet.platQuery('isValidContract', [origin.contractAddress], res, async function (msg) {
        if(msg.status==true) {
            var ccObj = msg.data;
            if (ccObj.mAddress != wallet.getAddressWithPubKey(pubKey)) {
                res.json({
                    status: false,
                    errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
                    msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, ccObj.mAddress)
                });
                return;
            }
            var channelName = config.channelName;
            var chaincodeName = origin.contractAddress + "_" + ccObj.contractSymbol.replace(' ', '');
            var chaincodeVersion = "v" + ccObj.version;
            var hexStr = wallet.stringToHex(JSON.stringify(args));
            var userName = config.busnInstantiate.userName;
            var orgName = config.busnInstantiate.orgName;
            var chaincodeType = config.chaincodeType;
            //实例化只需要初始化同一链中的其中一个节点就可以了
            let message = await instantiate.instantiateChaincode(null, channelName, chaincodeName, chaincodeVersion, null, chaincodeType,args, userName, orgName);
            
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
                    createTime: createTime
                };
                var fcn = "takeOffCCGas";
                var newArgs = [];
                newArgs.push(JSON.stringify(request));
                wallet.platInvoke(fcn, newArgs, res, function (txId) {
                    wallet.platQuery("queryChargeGas", "query_gas", res, function (gasMsg) {
                        if (gasMsg.status == true) {
                            var gasObj = {
                                channelName: channelName,
                                ccName: ccObj.contractSymbol,
                                ccVersion: ccObj.version,
                                fcnName: "instantiateChaincode",
                                args: JSON.stringify(args),
                                address: ccObj.mAddress,
                                contractAddr: ccObj.contractAddress,
                                gasUsed: gasMsg.data.gas,
                                txId: message.txId,
                                status: 1,
                                feeType: 1,
                                createTime: wallet.getStdDateTime()
                            };
                            db.asyncQuery('insert into t_charge_record SET ?', gasObj, function (err, results, fields) {
                                if (err) {
                                    res.json({ status: false, errorCode: errCode.ERR_GAS_RECORD_INSERT_FAILURE, msg: err.sqlMessage });
                                    return;
                                }
                                res.json(message);
                            });
                        } else {
                            res.json(gasMsg);
                        }
                    });
                });
            } else {
                var errMsg = "Failed to order the transaction";
                if (message.indexOf(errMsg) > -1) {
                    res.json({ status: false, errorCode: errCode.ERR_INSTANTIATE_CONTRACT_FAILURE, msg: wallet.getErrMsg(req, errCode.ERR_INSTANTIATE_CONTRACT_FAILURE) });
                } else {
                    res.json({ status: false, errorCode: errCode.ERR_INSTANTIATE_CONTRACT_FAILURE, msg: message });
                }
            }
        } else {
            res.json(msg);
        }
    });
}

//instantiate chaincode
function upgradeCC(req, res, withUrl) {
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
    if (!version) {
        res.json({ status: false, errorCode: errCode.ERR_CONTRACT_VERSION_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_VERSION_CANNOT_BE_NULL) });
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
            res.json({ status: false, errorCode: errCode.ERR_CONTRACT_CODE_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_CODE_CANNOT_BE_NULL) });
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
        res.json({ status: false, errorCode: errCode.ERR_ARGS_MUST_BE_ARRAY_OR_JSON, msg: wallet.getErrMsg(req, errCode.ERR_ARGS_MUST_BE_ARRAY_OR_JSON) });
        return;
    }
    wallet.platQuery('isValidContract', [origin.contractAddress], res, function (bResult) {
        if (bResult.status == true) {
            var ccObj = bResult.data;

            if (ccObj.mAddress != wallet.getAddressWithPubKey(pubKey)) {
                res.json({
                    status: false,
                    errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
                    msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, ccObj.mAddress) 
                });
                return;
            }

            if (wallet.cmp_version(version, ccObj.version) != 1) {
                res.json({ status: false, errorCode: errCode.ERR_CONTRACT_VERSION_TOO_LOW, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_VERSION_TOO_LOW, ccObj.version)  });
                return;
            }
            if(ccObj.status==4) {
                res.json({ status: false, errorCode: errCode.ERR_CONTRACT_FORBIDDEN, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_FORBIDDEN)  });
                return;
            }
            if(withUrl==true) {
                installCCWithUrl(req,ccUrl, origin.contractAddress, ccObj.contractSymbol, version, async function (msg) {
                    if (msg.status == true) {
                        var channelName = config.channelName;
                        var chaincodeName = origin.contractAddress + "_" + ccObj.contractSymbol.replace(' ', '');
                        var chaincodeVersion = "v" + version;
                        var hexStr = wallet.stringToHex(JSON.stringify(args));
                        var userName = config.busnInstantiate.userName;
                        var orgName = config.busnInstantiate.orgName;
                        var chaincodeType = config.chaincodeType;
                        //升级也只需要对同一链上的其中一个节点进行即可
                        let message = await upgrade.upgradeChaincode(null, channelName, chaincodeName, chaincodeVersion, null, chaincodeType, args, userName, orgName);
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
                                createTime: createTime
                            };
                            var fcn = "takeOffCCGas";
                            var newArgs = [];
                            newArgs.push(JSON.stringify(request));
                            wallet.platInvoke(fcn, newArgs, res, function (txId) {
                                wallet.platQuery("queryChargeGas", "query_gas", res, function (gasMsg) {
                                    if (gasMsg.status == true) {
                                        var gasObj = {
                                            channelName: channelName,
                                            ccName: ccObj.contractSymbol,
                                            ccVersion: ccObj.version,
                                            fcnName: "upgradeChaincode",
                                            args: JSON.stringify(args),
                                            address: ccObj.mAddress,
                                            contractAddr: ccObj.contractAddress,
                                            gasUsed: gasMsg.data.gas,
                                            txId: message.txId,
                                            status: 1,
                                            feeType: 2,
                                            createTime: wallet.getStdDateTime()
                                        };
                                        db.asyncQuery('insert into t_charge_record SET ?', gasObj, function (err, results, fields) {
                                            if (err) {
                                                res.json({ status: false, errorCode: errCode.ERR_GAS_RECORD_INSERT_FAILURE, msg: err.sqlMessage });
                                                return;
                                            }
                                            res.json(message);
                                        });
                                    } else {
                                        res.json(gasMsg);
                                    }
                                });
                            });

                        } else {
                            res.json({ status: false, errorCode: errCode.ERR_CONTRACT_UPGRADE_FAILURE, msg: message });
                        }
                    } else {
                        res.json(msg);
                    }
                });
            } else {
                installCC(req,ccData, origin.contractAddress, ccObj.contractSymbol, version, async function (msg) {
                    if (msg.status == true) {
                        var channelName = config.channelName;
                        var chaincodeName = origin.contractAddress + "_" + ccObj.contractSymbol.replace(' ', '');
                        var chaincodeVersion = "v" + version;
                        var hexStr = wallet.stringToHex(JSON.stringify(args));
                        var userName = config.busnInstantiate.userName;
                        var orgName = config.busnInstantiate.orgName;
                        var chaincodeType = config.chaincodeType;
                        //升级也只需要对同一链上的其中一个节点进行即可
                        let message = await upgrade.upgradeChaincode(null, channelName, chaincodeName, chaincodeVersion, null, chaincodeType, args, userName, orgName);
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
                                createTime: createTime
                            };
                            var fcn = "takeOffCCGas";
                            var newArgs = [];
                            newArgs.push(JSON.stringify(request));
                            wallet.platInvoke(fcn, newArgs, res, function (txId) {
                                wallet.platQuery("queryChargeGas", "query_gas", res, function (gasMsg) {
                                    if (gasMsg.status == true) {
                                        var gasObj = {
                                            channelName: channelName,
                                            ccName: ccObj.contractSymbol,
                                            ccVersion: ccObj.version,
                                            fcnName: "upgradeChaincode",
                                            args: JSON.stringify(args),
                                            address: ccObj.mAddress,
                                            contractAddr: ccObj.contractAddress,
                                            gasUsed: gasMsg.data.gas,
                                            txId: message.txId,
                                            status: 1,
                                            feeType: 2,
                                            createTime: wallet.getStdDateTime()
                                        };
                                        db.asyncQuery('insert into t_charge_record SET ?', gasObj, function (err, results, fields) {
                                            if (err) {
                                                res.json({ status: false, errorCode: errCode.ERR_GAS_RECORD_INSERT_FAILURE, msg: err.sqlMessage });
                                                return;
                                            }
                                            res.json(message);
                                        });
                                    } else {
                                        res.json(gasMsg);
                                    }
                                });
                            });

                        } else {
                            res.json({ status: false, errorCode: errCode.ERR_CONTRACT_UPGRADE_FAILURE, msg: message });
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
/**
 * 只能是api部署环境与链的节点在同一台机器上时方可有效
 * @param {合约帐户地址} address 
 * @param {合约名称英文简写} en_short 
 * @param {合约版本} version 
 * @param {回调函数}}} callback 
 */
function cmdLineExec(address,en_short,version,callback) {
    execCmd.execCmd("docker ps -a -f name=dev-peer", function (result) {
        var arr = result.stdout.split(/\r?\n/ig)
        var arr2 = [];
        for (var i = 0; i < arr.length; i++) {
            arr2 = arr2.concat(arr[i].split(/\s+/));
        }
        var containerIds = [];
        var images = [];
        for (var i = 0; i < arr2.length; i++) {
            var source = address.toLowerCase() + "_" + en_short.replace(' ','')+"-v"+version;
            if (arr2[i].indexOf(source) >= 0) {
                if (arr2[i - 1].length >= 10) {
                    containerIds.push(arr2[i - 1]);
                    images.push(arr2[i]);
                }
            }
        }
        for (var i = 0; i < containerIds.length; i++) {
            execCmd.execCmd("docker stop " + containerIds[i], function (result) { });
        }
        for (var i = 0; i < containerIds.length; i++) {
            execCmd.execCmd("docker rm " + containerIds[i], function (result) { });
        }
        for (var i = 0; i < images.length; i++) {
            execCmd.execCmd("docker rmi -f " + images[i], function (result) { });
        }
        execCmd.execCmd("docker ps -a -f name=^/peer[0-9]+\\.{1}", function (result) {
            var arr = result.stdout.split(/\r?\n/ig)
            var arr2 = [];
            for (var i = 0; i < arr.length; i++) {
                arr2 = arr2.concat(arr[i].split(/\s+/));
            }
            var hosts = [];
            for (var i = 0; i < arr2.length; i++) {
                var reg = /^peer[0-9]+\.org[0-9]+\.\S+$/;
                if (reg.test(arr2[i])) {
                    hosts.push(arr2[i]);
                }
            }
            for (var i = 0; i < hosts.length; i++) {
                execCmd.execCmd("docker exec " + hosts[i] + " bash -c \"cd /var/hyperledger/production/chaincodes && rm -rf " + address + "_" + en_short.replace(' ', '') + ".v" + version + "\"", function (result) { 
                    callback();
                });
            }
        });
    });
}

//delete chaincode
function deleteCC(req, res) {
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
        res.json({ status: false, errorCode: errCode.ERR_CONTRACT_VERSION_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_VERSION_CANNOT_BE_NULL)  });
        return;
    }
    let bl = wallet.verify(originHexStr, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }
    
    wallet.platQuery('isValidContract', [origin.contractAddress], res, function (bResult) {
        if (bResult.status == true) {
            var ccObj = bResult.data;
            if (ccObj.mAddress != wallet.getAddressWithPubKey(pubKey)) {
                res.json({
                    status: false,
                    errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
                    msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, ccObj.mAddress)
                });
                return;
            }
            var ret = wallet.cmp_version(origin.version, ccObj.version);
            //合约状态:-1、已删除 1、待初始化 2、正在运行 3、余额不足 4、合约已禁用
            if (ret == -1 || ccObj.status == "1") {//删除历史版本(未启用的合约也可以删除)
                var args = [origin.contractAddress, origin.version, pubKey, originHexStr, signature, wallet.getDateTimeNoRod()];
                wallet.platInvoke('deleteCC', args, res, function (txId) {
                    //res.json({ status: true, msg: '删除成功。' });
                    syncTask.syncDeleteCC(origin.contractAddress, ccObj.contractSymbol, origin.version, req,res);
                });
            } else if (ret == 0) {//删除当前版本
                res.json({ status: false, errorCode: errCode.ERR_CANNOT_DELETE_NEWEST_VERSION_CONTRACT, msg: wallet.getErrMsg(req, errCode.ERR_CANNOT_DELETE_NEWEST_VERSION_CONTRACT) });
            } else if (ret == 1) {//不存在的版本
                res.json({ status: false, errorCode: errCode.ERR_CONTRACT_VERSION_NOT_EXISTED, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_VERSION_NOT_EXISTED) });
            }
        } else {
            res.json(bResult);
        }
    });
    /*
        var ccObj = results[0];
        cmdLineExec(ccObj.contract_addr, ccObj.en_short,ccObj.version,function(){
            
        });*/
}

function ccSearch(req, res) {
    var address = req.body.address;
    if (!address) {
        res.json({ status: false, errorCode: errCode.ERR_ADDRESS_CAN_NOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_CAN_NOT_BE_NULL) });
        return;
    }
    wallet.platQuery('queryContractList', [address], res);
}

function ccInfo(req, res) {
    var address = req.params.address;
    var version = req.params.version;

    if (!address) {
        res.json({ status: false, errorCode: errCode.ERR_CONTRACT_ADDRESS_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_ADDRESS_CANNOT_BE_NULL) });
        return;
    }
    if (version=="-1") {
        version = "";
    }
    wallet.platQuery('queryContractInfo', [address, version], res, function (bResult) {
        if (bResult.status==true) {
            var contract = bResult.data;

            if(contract) {
                res.json({ status: true, data: contract });
            } else {
                res.json({ status: false, errorCode: errCode.ERR_CONTRACT_INFO_NOT_EXISTED, msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_INFO_NOT_EXISTED) });
            }
        } else {
            wallet.writeJson(bResult);
        }
    });
}

function issueToken(req,res) {
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
        effectTime: effectTime
    };

    var fcn = "publishToken";
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

//禁用合约
function disableContract(req, res) {
    disableOrEnableContract("disableContract",req,res);
}

//启用合约
function enableContract(req, res) {
    disableOrEnableContract("enableContract", req, res);
}

function disableOrEnableContract(fcn,req, res) {
    var address = req.body.address;
    var pubKey = req.body.pubKey;
    var contractAddress = req.body.contractAddress;
    var signature = req.body.signature;

    if (!address) {
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

    if (!contractAddress) {
        res.json({
            status: false,
            errorCode: errCode.ERR_CONTRACT_ADDRESS_CANNOT_BE_NULL, 
            msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_ADDRESS_CANNOT_BE_NULL)
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

    var valid = wallet.isValidAddress(address);
    if (!valid) {
        res.json({
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: wallet.getErrMsg(req, errCode.ERR_INVALID_ADDRESS, address)
        });
        return;
    }
    if (wallet.getAddressWithPubKey(pubKey) != address) {
        res.json({
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: wallet.getErrMsg(req, errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY, address)
        });
        return;
    }

    let bl = wallet.verify(contractAddress, signature, pubKey);
    if (!bl.status) {
        res.json(bl);
        return;
    }
    var args = [];
    args.push(address);
    args.push(pubKey);
    args.push(contractAddress);
    args.push(signature);

    wallet.platInvoke(fcn, args, res, function (txId) {
        res.json({
            status: true,
            txId: txId
        });
    });
}

//获取区块的额外信息
function queryBlockExtInfo(req, res) {
    var blockId = req.params.id;
    if (!blockId) {
        res.json({ status: false, errorCode: errCode.ERR_BLOCK_ID_OR_HASH_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_BLOCK_ID_OR_HASH_CANNOT_BE_NULL) });
        return;
    }
    db.asyncQuery("select blockId,channelId,previousHash,currentHash,blockSize,DATE_FORMAT(createTime,'%Y-%m-%d %H:%i:%s') as createTime from t_block_ext_info where blockId=?", [blockId], function (err, results, fields) {
        if (err) {
            res.json({ status: false, errorCode: errCode.ERR_BLOCK_NOT_EXISTED, msg: err.sqlMessage });
            return;
        }
        if (results.length==0) {
            res.json({ status: false, errorCode: errCode.ERR_BLOCK_NOT_EXISTED, msg: wallet.getErrMsg(req, errCode.ERR_BLOCK_NOT_EXISTED) });
        } else {
            res.json({ status: true, data: results[0] });
        }
    });
}

//获取手续费交易记录
function queryGasRecords(req, res) {
    var number = req.params.number;
    var pageSize = req.params.pageSize;
    if (!number) {
        res.json({ status: false, errorCode: errCode.ERR_PARAMETER_CANNOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_ERR_PARAMETER_CANNOT_BE_NULLBLOCK_NOT_EXISTED) });
        return;
    }
    if (!pageSize) {
        pageSize = 20;
    }
    db.asyncQuery("SELECT id,ccName,ccVersion,fcnName,args,contractAddr,address,gasUsed,txId,DATE_FORMAT(createTime,'%Y-%m-%d %H:%i:%s') as createTime,returnTxId  FROM t_charge_record WHERE id>? ORDER BY id ASC limit 0," + pageSize, [number], function (err, results, fields) {
        if (err) {
            res.json({ status: false, errorCode: errCode.ERR_RECORD_NOT_EXISTED, msg: err.sqlMessage });
            return;
        }
        if (results.length == 0) {
            res.json({ status: false, errorCode: errCode.ERR_RECORD_NOT_EXISTED, msg: wallet.getErrMsg(req, errCode.ERR_RECORD_NOT_EXISTED)  });
        } else {
            res.json({ status: true, data: results });
        }
    });
}

function querySignInfoByToken(req, res) {
    var tokenID = req.params.tokenID;
    if (!tokenID) {
        res.json({ status: false, errorCode: errCode.ERR_TOKENID_CAN_NOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_TOKENID_CAN_NOT_BE_NULL) });
        return;
    }
    wallet.platQuery('querySignInfoByToken', [tokenID], res);
}

function queryManagerList(req, res) {
    var tokenID = req.params.tokenID;
    if (!tokenID) {
        res.json({ status: false, errorCode: errCode.ERR_TOKENID_CAN_NOT_BE_NULL, msg: wallet.getErrMsg(req, errCode.ERR_TOKENID_CAN_NOT_BE_NULL) });
        return;
    }
    wallet.platQuery('queryManagerList', [tokenID], res);
}

function queryPublishTokenRequireNum(req, res) {
    wallet.platQuery('queryPublishTokenRequireNum', [], res);
}

function queryPublishCCRequireNum(req, res) {
    wallet.platQuery('queryPublishCCRequireNum', [], res);
}

function queryReturnGasConfig(req, res) {
    wallet.platQuery('queryReturnGasConfig', [], res);
}

module.exports = {
    issueToken, issueToken,
    chainEnter: chainEnter,
    chainEnterCommit: chainEnterCommit,
    chainEnterInfo: chainEnterInfo,
    chainEnterUpdate: chainEnterUpdate,
    chainEnterSearch: chainEnterSearch,
    chainEnterDelete: chainEnterDelete,
    deployeCC: deployeCC,
    instantiateCC: instantiateCC,
    upgradeCC: upgradeCC,
    deleteCC: deleteCC,
    ccSearch: ccSearch,
    ccInfo: ccInfo,
    queryBlockExtInfo: queryBlockExtInfo,
    queryGasRecords: queryGasRecords,
    querySignInfoByToken: querySignInfoByToken,
    queryManagerList: queryManagerList,
    queryReturnGasConfig: queryReturnGasConfig,
    queryPublishTokenRequireNum: queryPublishTokenRequireNum,
    queryPublishCCRequireNum: queryPublishCCRequireNum,
    disableContract: disableContract,
    enableContract: enableContract,
    installCCWithUrl: installCCWithUrl,
    installCC: installCC
}
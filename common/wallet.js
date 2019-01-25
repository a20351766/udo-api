var bitcoin = require('bitcoinjs-lib');
const uuidV1 = require('uuid/v1');// Generate a v1 UUID (time-based)
var bigi = require('bigi');
var path = require('path');
var fs = require('fs-extra');
var moment = require('moment');
var log4js = require('log4js');
var bignum = require('bignum');
var WAValidator = require('wallet-address-validator');
var logger = log4js.getLogger('WalletModule');
var config = require('../config.json');
var query = require('../app/query.js');
var invoke = require('../app/invoke-transaction.js');
var errCode = require('./errorcode.js');
var strFmt = require('util');

function getUUID() {
    var str = uuidV1();
    str = str.replace(/-/g,'')
    return str;
}

function getTxID() {
    var str1 = uuidV1();
    var rand = Math.round(Math.random()*8999)+1000;
    var str2 = rand+str1;

    str2 = str2.replace(/-/g,'')
    return str2;
}

/**
 * 生成钱包地址
 */
function newWallet() {
    try {
        let uuid = uuidV1();
        var hash = bitcoin.crypto.sha256(Buffer.from(uuid));
        var d = bigi.fromBuffer(hash);
        var keyPair = new bitcoin.ECPair(d);
        var address = keyPair.getAddress();
        var pubKey = keyPair.getPublicKeyBuffer().toString('hex');
        return {
            status:true,
            publicKey: pubKey,
            privateKey: keyPair.toWIF(),
            address: config.addressPrefix+address
        };
    }catch(e) {
        return {
            status: false,
            publicKey: '',
            privateKey: '',
            address: '',
            errorCode: errCode.ERR_CREATE_WALLET_FAILURE,
            msg:'生成钱包地址出错!'
        };
    }
}

/**
 * 通过公钥获取钱包地址
 */
function getAddressWithPubKey(pubKey) {
    try {
        let publicKeyBuffer = new Buffer(pubKey, 'hex')
        let keyPair = bitcoin.ECPair.fromPublicKeyBuffer(publicKeyBuffer,bitcoin.networks.bitcoin);
        return config.addressPrefix+keyPair.getAddress();  
    } catch (e) {
        return null;
    }
}

/**
 * 交易签名
 * @param {*} privateKeyWIF 16进制格式私钥
 * @param {*} data 要签名的数据
 */
function sign(privateKeyWIF,data) {
    try {
        var keyPair = bitcoin.ECPair.fromWIF(privateKeyWIF);
        var txHash = bitcoin.crypto.sha256(Buffer.from(data));

        var ecsign = keyPair.sign(txHash);
        var signedBuffer = ecsign.toDER();
        var signedStr = signedBuffer.toString('hex');

        return { status: true, data: signedStr };
    } catch (e) {
    }
    return { status: false, errorCode: errCode.ERR_SIGN_FAILURE, msg: '签名失败!' }
}

/**
 *  根据私钥获取公钥
 */
function getPubKeyFromPrivateKey(privateKey) {
    var keyPair = bitcoin.ECPair.fromWIF(privateKey);
    return keyPair.getPublicKeyBuffer().toString('hex');
}

function createTx() {
    try {
        var keyPair = bitcoin.ECPair.fromWIF('L1i76kACgWKDW6ocMYj7wkCDjH12JaQsJLNnQSAbKc5s5ESDC7nN');
        var txHash = bitcoin.crypto.sha256(Buffer.from('1234567890'));
        var ecsign = keyPair.sign(txHash);

        var signedBuffer = ecsign.toDER();
        var signedStr = signedBuffer.toString('hex');
        return { status: 1, txHash: txHash.toString('hex'), signedStr: signedStr };
    } catch (e) {
    }
    return { status: 0, errorCode: errCode.ERR_CREATE_TX_FAILURE, msg: '创建交易失败!' }
}

function sha256(str) {
    var txHash = bitcoin.crypto.sha256(Buffer.from(str));
    return txHash.toString('hex');
}

function createTx2() {
    try {
        var alice = bitcoin.ECPair.fromWIF('L1i76kACgWKDW6ocMYj7wkCDjH12JaQsJLNnQSAbKc5s5ESDC7nN');
        var txb = new bitcoin.TransactionBuilder();

        txb.addInput('61d520ccb74288c96bc1a2b20ea1c0d5a704776dd0164a396efec3ea7040349d', 0) // Alice's previous transaction output, has 15000 satoshis
        txb.addOutput('1cMh228HTCiwS8ZsaakH8A8wze1JR5ZsP', 12000)
        // (in)15000 - (out)12000 = (fee)3000, this is the miner fee

        txb.sign(0, alice);
        return {status: 1, txHex: txb.build().toHex()};
    } catch(e) { 
    }
    return {status:0, txHex:'', errorCode:errCode.ERR_CREATE_TX_FAILURE, msg:'创建交易失败!'}
}

/**
 * 验证交易
 * @param origin 原数据
 * @param signedStr 签名后的数据
 * @param publicKey 公钥
 */
function verify(origin, signedStr,publicKey) {
    try {
        let keyPair = bitcoin.ECPair.fromPublicKeyBuffer(Buffer.from(publicKey, 'hex'));

        let ecsign = bitcoin.ECSignature.fromDER(Buffer.from(signedStr, 'hex'));
        let txHash = bitcoin.crypto.sha256(Buffer.from(origin));
        let result = keyPair.verify(Buffer.from(txHash, 'hex'), ecsign);
        if(result) {
            return { status: true};
        }
    }catch(e) {
    }
    return {status:false,errorCode:errCode.ERR_VERIFY_FAILURE,msg:'交易验证失败！'};
}

/**
 * 获取加密字符串
 * @param str 
 */
function sha1(str) {
    return bitcoin.crypto.sha1(Buffer.from(str)).toString('hex');
}

/**
 let uuid = uuidV1();
	var hash = bitcoin.crypto.sha256(Buffer.from(uuid));
	var d = bigi.fromBuffer(hash);
	var keyPair = new bitcoin.ECPair(d);
	var address = keyPair.getAddress();
    var pubKey = keyPair.getPublicKeyBuffer().toString('hex');
    
	var hash = bitcoin.crypto.sha256(Buffer.from('correct horse battery staple'))
	var ecsign = keyPair.sign(hash);

	var signedBuffer = ecsign.toDER();
	var signedStr = signedBuffer.toString('hex');

	var ecsign2 = bitcoin.ECSignature.fromDER(Buffer.from(signedStr, 'hex'));
	var result = keyPair.verify(hash, ecsign2);
	res.json({
		pubKey: result,
		privateKey: keyPair.toWIF(),
		address: address
	});
 */

function hexToStringWide(hexStr) {
    return new Buffer(hexStr, 'hex').toString('utf8');
}

/**
 * 将字符串转换成16进制
 * @param str 
 */
function stringToHex(str) {
    return new Buffer(str).toString('hex');
}

function isJson(text) {
    if (text == "true" ||text=="false") {
        return false;
    }
    var isjson = typeof (text) == "object" && Object.prototype.toString.call(text).toLowerCase() == "[object object]" && !text.length;
    if (isjson)
        return true;
    /*
    if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
        return true;
    }*/
    if (typeof text == 'string') {
        try {
            var obj = JSON.parse(text);
            if (typeof obj == 'object' && obj) {
                return true;
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    }

    return false;
}

function GtZeroNumric(val) {
    val = val + "";
    if (!val) {
        return false;
    }
    var reg = /^0\.0*$/;
    if (val == "" || reg.test(val)) {
        return false
    }
    reg = /(^[1-9]([0-9]+)?(\.[0-9]{1,})?$)|(^[0-9]\.[0-9]([0-9])*$)/;
    return reg.test(val);
}

function GeZeroNumric(val) {
    val = val + "";
    if (!val) {
        return false;
    }
    var reg = /^0\.0*$/;
    if (val == "" || reg.test(val)) {
        return false
    }
    //var reg = /(^[1-9]([0-9]+)?(\.[0-9]{1,2})?$)|(^(0){1}$)|(^[0-9]\.[0-9]([0-9])?$)/;
    reg = /(^[1-9]([0-9]+)?(\.[0-9]{1,})?$)|(^(0){1}$)|(^[0-9]\.[0-9]([0-9])*$)/;
    return reg.test(val);
}

function GeZeroInt(val) {
    val = val + "";
    if(val=="0") {
        return true;
    }
    if (!val) {
        return false;
    }
    var reg = /^\d+$/;
    return reg.test(val);
}

function GtZeroInt(val) {
    val = val + "";
    if (!val) {
        return false;
    }
    var reg = /^[1-9]\d*$/;
    return reg.test(val);
}
//假定字符串的每节数都在5位以下
function toNum(a) {
    var a = a.toString();
    //也可以这样写 var c=a.split(/\./);
    var c = a.split('.');
    var num_place = ["", "0", "00", "000", "0000"], r = num_place.reverse();
    for (var i = 0; i < c.length; i++) {
        var len = c[i].length;
        c[i] = r[len] + c[i];
    }
    var res = c.join('');
    return res;
}
function cmp_version(a, b) {
    var _a = toNum(a), _b = toNum(b);
    if (_a == _b) return 0;
    if (_a > _b) return 1;
    if (_a < _b) return -1;
}
function validateVersion(version) {
    if (!version)
        return false;
    var reg = /(^\d+\.\d+\.\d+\.\d+$)|(^\d+\.\d+\.\d+$)|(^\d+$)|(^\d+\.\d+$)/;
    return reg.test(version);
}
// 递归创建目录 异步方法  
function mkdirs(dirname, callback) {
    fs.exists(dirname, function (exists) {
        if (exists) {
            callback();
        } else {
            // console.log(path.dirname(dirname));  
            mkdirs(path.dirname(dirname), function () {
                fs.mkdir(dirname, callback);
                console.log('在' + path.dirname(dirname) + '目录创建好' + dirname + '目录');
            });
        }
    });
}
// 递归创建目录 同步方法
function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}
//A parallel loop
var walk = function (dir, done) {
    var results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function (file) {
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    if (file.indexOf("_MACOSX")==-1)
                        results.push(file);
                }
                if (!--pending) done(null, results);
            });
        });
    });
};
/**
 * YYYYMMDDHHmmss
 */
function getDateTimeNoRod() {
    var timeStamp = (new Date()).getTime();
    return moment(timeStamp).format('YYYYMMDDHHmmss');//YYYY-MM-DD HH:mm:ss
}

/**
 * 比较两个日期字符串的大小
 * @param {*} date1 
 * @param {*} date2 
 */
function compareDate(date1,date2) {
    var t1 = new Date(date1).getTime();
    var t2 = new Date(date2).getTime();
    if (t1>t2) {
        return 1;
    } else if (t1 == t2) {
        return 0;
    }
    return -1;
}

/**
 * 获取block的创建时间
 * @param {Object} blockObj 
 */
function getBlockCreateTime(blockObj) {
    var datas = blockObj.data.data;
    let txLen = datas.length;
    if (txLen > 0) {
        var tx = datas[txLen - 1];
        var d = new Date(tx.payload.header.channel_header.timestamp);
        return parseDateTime(d);
    }
    return "";
}

/**
 * @param {Date} d
 * YYYY-MM-DD HH:mm:ss
 */
function parseDateTime(d) {
    var timeStamp = d.getTime();
    //添加1秒后时间
    return moment(timeStamp).add(1, 's').format('YYYY-MM-DD HH:mm:ss');//YYYY-MM-DD HH:mm:ss
}

/**
 * YYYY-MM-DD HH:mm:ss
 */
function getStdDateTime() {
    var timeStamp = (new Date()).getTime();
    return moment(timeStamp).format('YYYY-MM-DD HH:mm:ss');//YYYY-MM-DD HH:mm:ss
}

/**
 * 获取股权生效时间
 */
function getVestingEffectTime() {
    return parseInt((new Date()).getTime() / 1000) + 300;//转换成秒
}

function isFunction(obj) {
    //return Object.prototype.toString.call(obj) === 'object Function'
    return typeof obj == 'function';
}

function baseValidate(peers, userName, orgName, fcn) {
    if (!peers) {
        return { status: false, errorCode: errCode.ERR_PEER_CANNOT_BE_NULL, msg: '需指定网络节点的名称！' };
    }
    if (!userName) {
        return { status: false, errorCode: errCode.ERR_PEER_USER_CANNOT_BE_NULL, msg: '访问节点的用户不能为空！' };
    }
    if (!orgName) {
        return { status: false, errorCode: errCode.ERR_PEER_ORG_CANNOT_BE_NULL, msg: '节点所在的组织不能为空！' };
    }
    if (!fcn) {
        return { status: false, errorCode: errCode.ERR_FUNCTION_CANNOT_BE_NULL, msg: '调用合约的方法名不能为空！' };
    }
    return null;
}

async function baseQuery(peer, userName, orgName,fcn, args, res, callback) {
    var vResult = baseValidate(peer, userName, orgName, fcn);
    if (vResult) {
        if (!res) {
            callback(vResult);
            return;
        } else {
            writeJson(res, vResult);
            return;
        }
    }
    
    if (!Array.isArray(args)) {
        args = [args];
    }
    var channelName = config.channelName;
    var chaincodeName = config.chaincodeName;
    // args = args.replace(/'/g, '"');
    // args = JSON.parse(args);

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, userName, orgName);
    if (isFunction(callback)) {
        callback(message);
    } else {
        if (res) {
            writeJson(res, message);
        }
    }
}

function platQuery(fcn, args, res, callback) { 
    var peer = config.platQueryNode.peers[0];
    var orgName = config.platQueryNode.orgName;
    var userName = config.platQueryNode.userName;
    baseQuery(peer, userName, orgName, fcn, args, res, callback);
}

function busnQuery(fcn, args, res, callback) {
    var peer = config.busnQueryNode.peers[0];
    var orgName = config.busnQueryNode.orgName;
    var userName = config.busnQueryNode.userName;
    baseQuery(peer, userName, orgName, fcn, args, res, callback);
}

/**
 * 同步执行合约的查询方法
 * @param {*} fcn 
 * @param {*} args 
 */
async function syncPlatQuery(fcn, args) {
    var peer = config.platQueryNode.peers[0];
    var orgName = config.platQueryNode.orgName;
    var userName = config.platQueryNode.userName;

    var vResult = baseValidate(peer, userName, orgName, fcn);
    if (vResult) {
        return vResult;
    }

    if (!Array.isArray(args)) {
        args = [args];
    }
    var channelName = config.channelName;
    var chaincodeName = config.chaincodeName;
    // args = args.replace(/'/g, '"');
    // args = JSON.parse(args);

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, userName, orgName);
    return message;
}
/**
 * 执行链码操作
 * @param {方法名} fcn 
 * @param {数组对象} args 
 * @param {response响应对象} res 
 */
async function baseInvoke(peers,userName,orgName,fcn, args, res, callback) {
    var vResult = baseValidate(peers, userName, orgName, fcn);
    if (vResult) {
        if (!res) {
            if (!callback) {
                return vResult;
            } else {
                callback(vResult);
            }
            return;
        } else {
            writeJson(res, vResult)
            return;
        }
    }

    var chaincodeName = config.chaincodeName;
    var channelName = config.channelName;
    if (typeof peers === 'string') {
        peers = [peers];
    }
    if (typeof args === 'string') {
        args = [args];
    }
    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, userName, orgName);
    var trnsObj = null;
    if (fcn == "transfer" || fcn == "pldTransfer") {
        if (typeof message === 'string') {
            if (message.indexOf('MVCC_READ_CONFLICT') > -1
                || message.indexOf('PHANTOM_READ_CONFLICT') > -1) {
                trnsObj = JSON.parse(args[0]);
                var statusMsg = await platInvoke('updateTransferFailure', args, null, null);
                writeJson(res,{ status: false, errorCode: errCode.ERR_TRANSFER_FAILURE, msg: '转账失败！' });
                return;
            }
        } else {
            try {
                trnsObj = JSON.parse(args[0]);
                delete global.addressMap[trnsObj.fromAddress];
                delete global.addressMap[trnsObj.toAddress];
            } catch (e) { }
        }
    }
    if (res) {
        if (isJson(message)) {
            if (isFunction(callback)) {
                callback(message.txId);
            } else {
                if ((fcn == "transfer" || fcn == "pldTransfer") && trnsObj) {
                    message.txId = trnsObj.txId;
                }
                writeJson(res, message)
            }
        } else {
            writeJson(res, {
                status: false,
                errorCode: message,
                msg: message
            });
        }
    } else {
        if (isJson(message)) {
            if (!callback) {
                return message;
            } else {
                callback(message);
            }
        } else {
            var ret = {
                status: false,
                errorCode: errCode.ERR_INVOKE_FAILURE,
                msg: message
            };
            if (!callback) {
                return ret;
            } else {
                callback(ret);
            }
        }
    }
}

/**
 * 平台链码操作
 * @param {方法名} fcn 
 * @param {数组对象} args 
 * @param {response响应对象} res 
 * @param {回调函数} callback
 */
async function platInvoke(fcn, args, res, callback) {
    var peers = config.platInvokeNode.peers;
    var orgName = config.platInvokeNode.orgName;
    var userName = config.platInvokeNode.userName;
    return await baseInvoke(peers, userName, orgName, fcn, args, res, callback);
}

function parseParams(args) {
    if (typeof args === 'string') {
        args = args.replace(/'/g, '"');
    }
    if (!Array.isArray(args)) {
        try {
            var obj = JSON.parse(args);
            if (Array.isArray(obj)) {
                args = obj;
            } else {
                args = [args];
            }
        } catch (e) {
            if (isJson(args)) {
                args = [JSON.stringify(args)];
            } else {
                args = [args];
            }
        }
    }
    return args;
}

class ZtSleep {
    /**
    * 异步延迟
    * @param {number} time 延迟的时间,单位毫秒
    */
    static sleep(time = 0) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, time);
        })
    };
};

function hexStrToObj(hexStr) {
    var jsonObj = null;
    try {
        var srcStr = hexToStringWide(hexStr);
        jsonObj = JSON.parse(srcStr);
    } catch (err) {
        logger.error('将16进制格式数据解析成对象时出错!' + err);
    }
    return jsonObj;
}

//验证邮件格式
function isValidEmail(value) {
    //var reg = /[a-zA-Z0-9]{1,10}@[a-zA-Z0-9]{1,5}\.[a-zA-Z0-9]{1,5}/;
    var reg = /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/;
    if (reg.test(value)) {
        return true;
    }
    return false;
}

//验证地址是否合法
function isValidAddress(address) {
    var prefix = config.addressPrefix;
    var len = prefix.length;
    var tempStr = address.substring(0,len);
    if (tempStr == prefix) {
        var newAddr =  address.substring(len, address.length);
        return WAValidator.validate(newAddr, 'BTC');
    }
    return false;
}

//获取文件夹下的所有文件
function readFileList(filePath, filesList) {
    var files = fs.readdirSync(filePath);
    files.forEach(function (itm, index) {
        if (itm.indexOf("DS_Store")==-1) {
            var stat = fs.statSync(filePath + itm);
            if (stat.isDirectory()) {
                //递归读取文件
                readFileList(filePath + itm + "/", filesList)
            } else {
                var obj = {};//定义一个对象存放文件的路径和名字
                obj.path = filePath;//路径
                obj.filename = itm//名字
                filesList.push(obj);
            }
        }
    });
}

//验证发行价格
function validateIssuePrice(price) {
    var tempPrice = "" + price;
    if (!GtZeroNumric(tempPrice)) {
        return {
            status: false,
            errorCode: errCode.ERR_PRICE_PARAM_INVALID,
            msg: '发行价格必须为数字!'
        };
    }

    if (tempPrice.length > 17) {
        return {
            status: false,
            errorCode: errCode.ERR_PRICE_PARAM_INVALID,
            msg: '发行价格总长度不能超过17位!'
        };
    }
    if (tempPrice.indexOf(".")>-1) {
        //12313.122 5
        var start = tempPrice.substring(0, tempPrice.indexOf("."));
        var end = tempPrice.substring(tempPrice.indexOf(".") + 1, tempPrice.length);
        if (start.length>10) {
            return {
                status: false,
                errorCode: errCode.ERR_PRICE_PARAM_INVALID,
                msg: '小数点前面部分不能超过10位!'
            };
        }
        if (end.length > 6) {
            return {
                status: false,
                errorCode: errCode.ERR_PRICE_PARAM_INVALID,
                msg: '小数点后面部分不能超过6位!'
            };
        }
    } else if (tempPrice.length > 10) {
        return {
            status: false,
            errorCode: errCode.ERR_PRICE_PARAM_INVALID,
            msg: '发行价格不能超过10位的整数!'
        };
    }
    return {
        status: true,
        msg: ''
    };
}

/**
 * 大整型数据相加
 * @param {integer} aBig
 * @param {integer} bBig
 */
function bigIntAdd(aBig,bBig) {
    var b = bignum('' + aBig).add('' + bBig);
    return b;
}
/**
 * 是否是平台系统节点
 * @param {*} name 组织名称或节点名称
 */
function isSysNode(name) {
    var nodes = config.platCCInstallNode;
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].orgName == name) {
            return true;
        } else {
            var peerNames = nodes[i].peerNames;
            for (var j = 0; j < peerNames.length;j++) {
                if (peerNames[j] == name) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * 根据不同的语言获取对应的国际化信息
 * @param {*} req http.request
 * @param {*} error_code 错误码
 */
function getErrMsg(req, error_code) {
    var language = req.header('language');//语言 zh:中文 en:英文
    var origin = "";
    if (language == 'zh') {//中文
        origin = errCode.GetErrorString(errCode.Chinease, error_code);
    } else if (language == 'tw') {//繁体
        origin = errCode.GetErrorString(errCode.ChineseTraditional, error_code);
    } else {//英文
        origin = errCode.GetErrorString(errCode.English, error_code);
    }
    var len = arguments.length;
    if(len > 2) {
        switch (len) {
            case 3:
                origin = strFmt.format(origin, arguments[2]);
                break;
            case 4:
                origin = strFmt.format(origin, arguments[2], arguments[3]);
                break;
            case 4:
                origin = strFmt.format(origin, arguments[2], arguments[3], arguments[4]);
                break;
            default: 
        }
    } 
    return origin;
}

/**
 * 输出json格式
 * @param {*} res 
 * @param {*} obj 
 */
function writeJson(res,obj) {
    var lang = res["language"];
    if (obj && obj.errorCode) {
        var msg = "";
        if (lang == 'en') {//英文
            msg = errCode.GetErrorString(errCode.English, obj.errorCode);
        } else if (lang == 'tw') {//繁体
            msg = errCode.GetErrorString(errCode.ChineseTraditional, obj.errorCode);
        } else {//中文
            msg = errCode.GetErrorString(errCode.Chinease, obj.errorCode);
        }
        obj["msg"] = msg;
    }
    res.json(obj);
}

module.exports = {
    getUUID: getUUID,
    getTxID: getTxID,
    newWallet: newWallet,
    verify: verify,
    createTx: createTx,
    sha1: sha1,
    hexToStringWide: hexToStringWide,
    stringToHex: stringToHex,
    hexStrToObj: hexStrToObj,
    isJson: isJson,
    GtZeroNumric: GtZeroNumric,
    GeZeroNumric: GeZeroNumric,
    GeZeroInt: GeZeroInt,
    GtZeroInt: GtZeroInt,
    getAddressWithPubKey: getAddressWithPubKey,
    ZtSleep: ZtSleep,
    syncPlatQuery: syncPlatQuery,
    platQuery: platQuery,
    busnQuery: busnQuery,
    platInvoke: platInvoke,
    getStdDateTime: getStdDateTime,
    getDateTimeNoRod: getDateTimeNoRod,
    compareDate: compareDate,
    parseDateTime: parseDateTime,
    getBlockCreateTime: getBlockCreateTime,
    getVestingEffectTime: getVestingEffectTime,
    isFunction: isFunction,
    cmp_version: cmp_version,
    validateVersion: validateVersion,
    validateIssuePrice: validateIssuePrice,
    mkdirsSync: mkdirsSync,
    mkdirs: mkdirs,
    walk: walk,
    parseParams: parseParams,
    isValidEmail: isValidEmail,
    sha256: sha256,
    isValidAddress: isValidAddress,
    readFileList: readFileList,
    bigIntAdd: bigIntAdd,
    sign: sign,
    getPubKeyFromPrivateKey: getPubKeyFromPrivateKey,
    isSysNode: isSysNode,
    getErrMsg: getErrMsg,
    writeJson: writeJson
}
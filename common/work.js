require('../config.js');
var config = require('../config.json');
var wallet = require('../common/wallet.js');
var invoke = require('../app/invoke-transaction.js');
var errCode = require('./errorcode.js');

var log4js = require('log4js');
var logger = log4js.getLogger('WorkerLogger');

var transfer = async function transfer(data) {//定义算法
    if (!data) {
        return {
            status: false,
            errorCode: errCode.ERR_PARAMETER_CANNOT_BE_NULL,
            msg: '请求参数错误!'
        };
    }

    var jsonObj = null;
    try {
        var rawData = wallet.hexToStringWide(data);
        jsonObj = JSON.parse(rawData);
    } catch (err) {
        return {
            status: false,
            errorCode: errCode.ERR_ORIGIN_DATA_PARSE_FAILURE,
            msg: err
        };
    }

    var origin = jsonObj.origin;
    var signature = jsonObj.signature;
    var pubKey = origin.pubKey;

    if (!wallet.GtZeroNumric(origin.number)) {
        return {
            status: false,
            errorCode: errCode.ERR_TRANSFER_NUMBER_MUST_GREATER_THAN_0,
            msg: '转账数量必须为大于0的数字!'
        };
    }

    var valid = wallet.isValidAddress(origin.fromAddress);
    if (!valid) {
        return {
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: '无效的钱包地址' + origin.fromAddress + ' !'
        };
    }

    var valid = wallet.isValidAddress(origin.toAddress);
    if (!valid) {
        return {
            status: false,
            errorCode: errCode.ERR_INVALID_ADDRESS,
            msg: '无效的钱包地址 ' + origin.toAddress + ' !'
        };
    }

    let address = wallet.getAddressWithPubKey(pubKey);
    if (origin.fromAddress != address) {
        return {
            status: false,
            errorCode: errCode.ERR_ADDRESS_NOT_MATCH_PUBLICKEY,
            msg: '非法使用该钱包 ' + origin.fromAddress + ' !'
        };
    }
    let originStr = JSON.stringify(origin);
    let bl = wallet.verify(originStr, signature, pubKey);
    if (!bl.status) {
        return bl;
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

    var peers = config.platInvokeNode.peers;
    var orgName = config.platInvokeNode.orgName;
    var userName = config.platInvokeNode.userName;

    var chaincodeName = config.chaincodeName;
    var channelName = config.channelName;

    if (typeof peers === 'string') {
        peers = [peers];
    }
    if (typeof args === 'string') {
        args = [args];
    }

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, userName, orgName);
    if (typeof message === 'string') {
        if (message.indexOf('MVCC_READ_CONFLICT') > -1
            || message.indexOf('PHANTOM_READ_CONFLICT') > -1) {
            var statusMsg = await wallet.platInvoke('updateTransferFailure', args, null, null);
            return { status: false, errorCode: errCode.ERR_TRANSFER_FAILURE, msg: '转账失败！' };
        }
    }

    if (wallet.isJson(message)) {
        if (message.status==true) {
            message.txId = trans.txId;
        }
        return message;
    } else {
        return { status: false, errorCode: errCode.ERR_TRANSFER_FAILURE, msg: message };
    }
}

process.on('message', async function (m) {
    //接收主进程发送过来的消息
    if (typeof m === 'object') {
        //转账
        let result = await transfer(m.data);
        //计算完毕返回结果
        process.send(result);
    }
});
process.on('SIGHUP', function () {
    process.exit();//收到kill信息，进程退出
});
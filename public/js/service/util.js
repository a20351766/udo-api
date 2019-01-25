let bitcoin = require('bitcoinjs-lib')

/**
 * 将字符串转换成16进制
 * @param str 
 */
function stringToHex(str) {
    return new Buffer(str).toString('hex');
}

/**
 *  根据私钥获取公钥
 */
function getPubKeyFromPrivateKey(privateKey) {
    var keyPair = bitcoin.ECPair.fromWIF(privateKey);
    return keyPair.getPublicKeyBuffer().toString('hex');
}

/**
 * 对字符串通过私钥进行签名
 * @param str 
 */
function generateSign(originStr,privateKey) {
    try {
        //L1i76kACgWKDW6ocMYj7wkCDjH12JaQsJLNnQSAbKc5s5ESDC7nN
        var keyPair = bitcoin.ECPair.fromWIF(privateKey);
        var txHash = bitcoin.crypto.sha256(Buffer.from(originStr));
        var ecsign = keyPair.sign(txHash);

        var signedBuffer = ecsign.toDER();
        var signedStr = signedBuffer.toString('hex');
        return signedStr;
    } catch (e) {
        return "";
    }
    return "";
}

module.exports = {
    stringToHex,
    getPubKeyFromPrivateKey,
    generateSign
}
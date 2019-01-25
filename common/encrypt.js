const crypto = require('crypto-browserify');
var bitcoin = require('bitcoinjs-lib');
var bigi = require('bigi');
function encrypt(publicKey, privateKey, text) {
    const ecdhA = crypto.createECDH('secp256k1');
    ecdhA.generateKeys('hex', 'compressed');
    ecdhA.setPrivateKey(privateKey, 'hex');
    const secret = ecdhA.computeSecret(publicKey, 'hex');
    console.log("encrypt1:="+secret);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-ctr', secret, iv);
    let crypted = iv.toString('binary');
    crypted += cipher.update(text, 'binary', 'binary');
    
    crypted += cipher.final('binary');

    return crypted;
}
/**
 *  根据私钥获取公钥
 */
function getPubKeyFromPrivateKey(privateKey) {
    var d = bigi.fromBuffer(Buffer(privateKey,'hex'));
    var keyPair = new bitcoin.ECPair(d, null, bitcoin.networks.bitcoin);
    return keyPair.getPublicKeyBuffer().toString('hex');
}

function decrypt(publicKey, privateKey, crypted) {
    //publicKey = getPubKeyFromPrivateKey(privateKey);
    //console.log(publicKey)
    const ecdhB = crypto.createECDH('secp256k1');
    ecdhB.generateKeys('hex');
    ecdhB.setPrivateKey(privateKey, 'hex');
    const secret = ecdhB.computeSecret(publicKey, 'hex');
    console.log("encrypt2:=" + secret);
    const iv = crypted.slice(0, 16);
    const decipher = crypto.createCipheriv(
        'aes-256-ctr',
        secret,
        new Buffer(iv, 'binary')
    );
    let text = decipher.update(crypted.slice(16), 'binary', 'binary');
    text += decipher.final('binary');
    return text;
}

module.exports = {
    encrypt,
    decrypt,
};
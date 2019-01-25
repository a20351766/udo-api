'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('bancor');
var wallet = require('./wallet.js');
var errCode = require('./errorcode.js');

function issueSmartToken(req, res) {
    logger.debug('issueSmartToken enter');
    var pubKey = req.body.pubKey;
    var originJsonStr = req.body.origin;
    var signature = req.body.signature;

    var fcn = "issueSmartToken";
    var args = [];
    args.push(pubKey);
    args.push(originJsonStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res);
}

function purchaseSmartToken(req, res) {
    logger.debug('purchaseSmartToken enter');
    var pubKey = req.body.pubKey;
    var originJsonStr = req.body.origin;
    var signature = req.body.signature;

    var fcn = "purchaseSmartToken";
    var args = [];
    args.push(pubKey);
    args.push(originJsonStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res);
}

function saleSmartToken(req, res) {
    logger.debug('saleSmartToken enter');
    var pubKey = req.body.pubKey;
    var originJsonStr = req.body.origin;
    var signature = req.body.signature;

    var fcn = "saleSmartToken";
    var args = [];
    args.push(pubKey);
    args.push(originJsonStr);
    args.push(signature);

    wallet.platInvoke(fcn, args, res);
}

function querySmartToken(req, res) {
    let tokenId = req.params.tokenId;
    let fcn = 'querySmartToken';
    wallet.platQuery(fcn, tokenId, res);
}

module.exports = {
    issueSmartToken: issueSmartToken,
    purchaseSmartToken: purchaseSmartToken,
    saleSmartToken: saleSmartToken,
    querySmartToken: querySmartToken
}

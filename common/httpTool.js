'use strict';

var http = require('http');
const extend = require('extend');
var querystring = require('querystring');

var defaultOptions = {
    host: '127.0.0.1', // 请求地址 域名，google.com等..
    port: 4000,
    path: '', // 具体路径eg:/upload
    method: 'GET', // 请求方式, 这里以post为例
    headers: { // 必选信息,  可以抓包工看一下
        'Content-Type': 'application/json'
    }
};

function http_get(options, callback) {
    const extOptions = extend(true, defaultOptions, options);
    var req = http.get(extOptions, function (res) {
        var resData = "";
        res.on("data", function (data) {
            resData += data;
        });
        res.on("end", function () {
            callback(null, JSON.parse(resData));
        });
    });
    req.on('error', function(e){
        callback(e.message, null);
    });
}

function http_post(options, params, callback) {
    var postData = querystring.stringify(params);
    const extOptions = extend(true, defaultOptions, options);
    extOptions["method"] = "POST";
    var headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
    };
    extOptions["headers"] = headers;
    var req = http.request(extOptions, (res) => {
        res.setEncoding('utf8');
        var resData = "";
        res.on('data', (chunk) => {
            resData += chunk;
        });
        res.on('end', () => {
            callback(null, JSON.parse(resData));
        });
    });
    /*
    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log("body: " + chunk);
        });
        res.on('end',function(chunk){
            console.log("body: " + chunk);
        })
    });*/
    req.on('error', (e) => {
        callback(e.message, null);
    });
    // write data to request body
    req.write(postData);
    req.end();
}

function http_post_json(options,params,callback) {
    var content = JSON.stringify(params);
    const extOptions = extend(true, defaultOptions, options);
    extOptions["method"] = "POST";
    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': content.length
    };
    extOptions["headers"] = headers;

    var req = http.request(extOptions, function (res) {
        var _data = '';
        res.on('data', function (chunk) {
            _data += chunk;
        });
        res.on('end', function () {
            callback(null, _data);
        });
    });
    req.on('error', (e) => {
        callback(e.message, null);
    });
    req.write(content);
    req.end();
}

module.exports = {
    http_get: http_get,
    http_post: http_post,
    http_post_json: http_post_json
}
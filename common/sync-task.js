'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('sync-task');
var config = require('../config.json');
var async = require('async');
var httpTool = require('./httpTool.js');
var wallet = require('./wallet.js')
var errCode = require('./errorcode.js');

function syncDeleteCC(contractAddress, contractSymbol, version,req,res,peers) {
    if (!peers) {
        peers = config.peers;
    }
    var task = [];
    task.push(function (callback) {
        //循环
        async.eachSeries(peers, function (peer, cb) {
            execTask(peer, contractAddress, contractSymbol, version, cb)
        }, function (err) {
            if (err) return callback(err,null);
            callback(null,null)
        });
    });
    async.waterfall(task, function (err, result) {//所有任务执行完成后需执行的函数
        if (err) {
            res.json({ status: false, 
                errorCode: errCode.ERR_CONTRACT_DELETE_FAILURE, 
                msg: wallet.getErrMsg(req, errCode.ERR_CONTRACT_DELETE_FAILURE)
            });
            return;
        }
        res.json({ status: true, msg: 'Delete successfully。' });
    });
}

function execTask(peer, contractAddress, contractSymbol, version, cb) {
    var options = {
        host: peer,
        port: config.deleteCCPort
    };
    var params = {
        "method": "deletecc",
        "params": [contractAddress, contractSymbol, version]
    };
    httpTool.http_post_json(options, params, function (msg, result) {
        cb();//省略的话会导致死循环(执行未完成的操作)
    });
}
/*
//初始化
var async_lists = [{ aa: 11, bb: 21 }, { aa: 31, bb: 41 }, { aa: 51, bb: 61 }, { aa: 71, bb: 81 }, { aa: 91, bb: 91 }];
var task = [];
task.push(function (callback) {
    console.log('第一个task任务');
    //循环
    async.eachSeries(async_lists, function (async_list, cb) {
        task_a(async_list, cb)
    }, function (err) {
        if (err) return callback(err);
        //重新赋值
        async_lists = [{ aa: 12, bb: 22 }, { aa: 32, bb: 42 }, { aa: 52, bb: 62 }, { aa: 72, bb: 82 }, { aa: 92, bb: 92 }];
        callback()
    });
})
task.push(function (callback) {
    console.log('第二个task任务');
    async.eachSeries(async_lists, function (async_list, cb) {
        task_a(async_list, cb)
    }, function (err) {
        if (err) return callback(err);
        async_lists = [{ aa: 13, bb: 23 }, { aa: 33, bb: 43 }, { aa: 53, bb: 63 }, { aa: 73, bb: 83 }, { aa: 93, bb: 93 }];
        callback()
    });
})
task.push(function (callback) {
    console.log('第三个task任务');
    async.eachSeries(async_lists, function (async_list, cb) {
        task_a(async_list, cb)
    }, function (err) {
        if (err) return callback(err);
        callback()
    });
})

//最外层流程控制
async.waterfall(task, function (err, result) {
    if (err) return console.log(err);
    console.log('成功');
})

function task_a(async_list, cb) {
    var task2 = [];
    task2.push(function (cb) {
        console.log('第一次 : ', async_list);
        setTimeout(function () {
            cb()
        }, 1000);
    })
    task2.push(function (cb) {
        console.log('第二次 : ', async_list);
        console.log('---------------------------');
        setTimeout(function () {
            cb()
        }, 1000);
    })
    //循环内流程控制
    async.waterfall(task2, function (err, result) {
        if (err) return cb(err);
        cb();
    })
}*/
module.exports = {
    syncDeleteCC: syncDeleteCC
}
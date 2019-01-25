// Dependencies
var fs = require('fs');
var url = require('url');
var http = require('http');
var exec = require('child_process').exec;
var errCode = require('./errorcode.js');
/**
 * 文件下载
 * @param {*} srcUrl 文件的url地址
 * @param {*} destPath 存储文件的目录
 * @param {*} destFileName 要存储的文件名称
 * @param {*} callback 回调函数
 */
function downloadFile(srcUrl,destPath,destFileName,callback) {
    // We will be downloading the files to a directory, so make sure it's there
    // This step is not required if you have manually created the directory
    var endPrefix = destPath.substring(destPath.length - 1, destPath.length);
    if (endPrefix != "/") {
        destPath += "/";
    }
    var mkdir = 'mkdir -p ' + destPath;
    var child = exec(mkdir, function (err, stdout, stderr) {
        if (err) {
            callback({status:false,errorCode:errCode.ERR_DOWNLOAD_CONTRACT_CODE_FAILURE,msg:err});
        } else {
            var options = {
                host: url.parse(srcUrl).host,
                port: 80,
                path: url.parse(srcUrl).pathname
            };

            //var file_name = url.parse(srcUrl).pathname.split('/').pop();
            var file = fs.createWriteStream(destPath + destFileName);

            http.get(options, function (res) {
                res.on('data', function (data) {
                    file.write(data);
                }).on('end', function () {
                    file.end();
                    callback({ status: true, data: destPath + destFileName });
                });
            });
        }
    });
}

exports.downloadFile = downloadFile;
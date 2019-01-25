var exec = require('child_process').exec;  //引入child_process模块
var execFile = require('child_process').execFile;

exports.execCmd = function (cmdStr, next) {
    exec(cmdStr, function (err, stdout, stderr) {
        next({
            err: err,
            stdout: stdout,
            stderr: stderr
        });
    });
}

exports.execFile = function (shellFileName, next) {
    execFile(shellFileName, ['-H', '192.168.1.1', '-U', 'root', '-P', '123456', '-N', '654321'], null, function (err, stdout, stderr) {
        next(err, stdout, stderr);
    });
}
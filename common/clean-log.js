var task = require('./time-task.js')

process.on('message', async function (m) {
    //接收主进程发送过来的消息
    if (typeof m === 'object') {

        //清理日志
        task.cleanLog();

        //计算完毕返回结果,在这里不需要停止此进程
        process.send('');
    }
});
process.on('SIGHUP', function () {
    process.exit();//收到kill信息，进程退出
});
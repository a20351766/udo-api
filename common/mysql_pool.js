var mysql = require("mysql");
/*
const pool = mysql.createPool({
    connectionLimit: 100,
    host: 'rm-wz9844gg8zu942tq9ro.mysql.rds.aliyuncs.com',
    user: 'udolink',
    password: 'sSHY4wmddyNfRIg',
    database: 'udo_db',
    port: '3306'
});*/

var pool = mysql.createPool({
    connectionLimit: 10,
    host: '127.0.0.1',
    user: 'root',
    password: '122003',
    database: 'udo_db',
    port: '3306'
});

var asyncQuery = function (sql, options, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            callback(err, null, null);
        } else {
            conn.query(sql, options, function (err, results, fields) {
                //释放连接  
                conn.release();
                //事件驱动回调  
                callback(err, results, fields);
            });
        }
    });
};

// 接收一个sql语句 以及所需的values
// 这里接收第二参数values的原因是可以使用mysql的占位符 '?'
// 比如 query(`select * from my_database where id = ?`, [1])
let syncQuery = function (sql, values) {
    // 返回一个 Promise
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, connection) {
            if (err) {
                reject(err)
            } else {
                connection.query(sql, values, (err, rows) => {

                    if (err) {
                        reject(err)
                    } else {
                        resolve(rows)
                    }
                    // 结束会话
                    connection.release()
                })
            }
        })
    })
}

module.exports = {
    asyncQuery: asyncQuery,
    syncQuery: syncQuery
}
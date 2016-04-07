var mysql = require('mysql');

exports.DbConnection = mysql.createPool({
    "host" : "localhost",
    "user" : "root",
    "password" : "123456",
    "database" : "cn_stock",
    "connectionLimit" : 1,
    "multipleStatements" : true 
});


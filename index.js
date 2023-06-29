const mysql = require('mysql');
const express = require("express");
const port = 3000;
const app = express;



var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : null,
  database: 'testbeca'
});

//databse connection
connection.connect(function(err) {
    if (err) {
        console.log(err.code);
        console.log(err.fatal);
    } else {
        console.log("Conexion funciona");
    }
});

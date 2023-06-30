const mysql = require('mysql');
const express = require("express");
const axios = require('axios');
const app = express();
const session = require('express-session');
const path = require('path');


var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  contrasena : null,
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

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

// http://localhost:3000/
app.get('/api/login', async function(req, res) {
    try {
      const externalUrl = 'http://localhost:9000'; // Cambia esta URL por la correcta
      const { data } = await axios.get(externalUrl);
      res.send(data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al obtener los datos');
    }
  });

// http://localhost:3000/auth
app.post('/api/login', function(req, res) {
	// Capture the input fields
	let correo = req.body.correo;
	let contrasena = req.body.contrasena;
	// Ensure the input fields exists and are not empty
	if (correo && contrasena) {
		// Execute SQL query that'll select the account from the database based on the specified correo and contrasena
		connection.query('SELECT * FROM usuarios WHERE correo = ? AND contrasena = ?', [correo, contrasena], function(error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				req.session.loggedin = true;
				req.session.correo = correo;
				// Redirect to home page
				res.redirect('/api/login');
			} else {
				res.send('Usuario y/o Contraseña Incorrecta');
			}			
			res.end();
		});
	} else {
		res.send('Por favor ingresa Usuario y Contraseña!');
		res.end();
	}
});

// http://localhost:3000/api/login
app.get('/api/login', function(req, response) {
	// If the user is loggedin
	if (req.session.loggedin) {
		// Output correo
		response.send('Te has logueado satisfactoriamente:, ' + req.session.correo + '!');
	} else {
		// Not logged in
		response.send('¡Inicia sesión para ver esta página!');
	}
	response.end();
});

app.listen(3000);


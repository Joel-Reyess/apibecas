const mysql = require('mysql');
const express = require("express");
//const fileUpload = require('express-fileupload');
const multer  = require('multer');
const axios = require('axios');
const cors = require("cors");
const app = express();
const session = require('express-session');
const path = require('path');

app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

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
      const externalUrl = 'http://127.0.0.1';
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
app.get('/api/login', function(req, res) {
	// If the user is loggedin
	if (req.session.loggedin) {
		// Output correo
		res.send('Te has logueado satisfactoriamente:, ' + req.session.correo + '!');
	} else {
		// Not logged in
		res.send('¡Inicia sesión para ver esta página!');
	}
	res.end();
});

app.post('/api/form', async function(req, res) {
  let nombre = req.body.nombre;
  let matricula = req.body.matricula;
  let curp = req.body.curp;
  let telefono = req.body.telefono;
  let correoinstitucional = req.body.correoinstitucional;
  let beca = req.body.beca;
  let carrera = req.body.carrera;
  let area = req.body.area;
  let grado = req.body.grado;
  let cuatrimestre = req.body.cuatrimestre;
  let grupo = req.body.grupo;
  let correotutor = req.body.correotutor;
  let genero = req.body.genero;
  let estado = req.body.estado;

  if (nombre && matricula && curp && telefono && correoinstitucional && beca && carrera && area && grado && cuatrimestre
	&& grupo && correotutor && genero && estado) {
    connection.query(
      'INSERT INTO solicitud (nombre, matricula, curp, telefono, correoinstitucional, beca, carrera, area, grado, cuatrimestre, grupo, correotutor, genero, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, matricula, curp, telefono, correoinstitucional, beca, carrera, area, grado, cuatrimestre, grupo, correotutor, genero, estado],
      function(error, results, fields) {
        if (error) throw error;
        res.redirect('/api/form');
        res.end();
      }
    );
  } else {
    res.send('Por favor ingresa Nombre, Matrícula y CURP!');
  }
});

// http://localhost:3000/api/form
app.get('/api/form', function(req, res) {
  connection.query('SELECT * FROM solicitud ORDER BY id DESC LIMIT 1', function(error, results, fields) {
    if (error) {
      console.error('Error al obtener los datos:', error);
      res.status(500).send('Error al obtener los datos');
    } else {
      // Devuelve los datos obtenidos de la base de datos como respuesta JSON
      res.json(results[0]);
    }
  });
});

app.get('/api/becas/1', async function(req, res) {
  try {
    const externalUrl = 'http://127.0.0.1';
    const { data } = await axios.get(externalUrl);
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener los datos');
  }
});

app.get("/api/becas/1", (req, res) => {
  const query = "SELECT * FROM beca INNER JOIN solicitud ON beca.idbeca = solicitud.beca WHERE idbeca = 1;";

  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error al obtener las becas:", error);
      res.status(500).json({ error: "Error al obtener las becas" });
    } else {
      res.json(results);
    }
  });
});

app.listen(3000);

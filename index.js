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

app.get('/api/form', async function(req, res) {
  try {
    const externalUrl = 'http://127.0.0.1';
    const { data } = await axios.get(externalUrl);
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener los datos');
  }
});

app.post('/api/form', async function(req, res) {
  let nombre = req.body.nombre;
  let matricula = req.body.matricula;
  let curp = req.body.curp;
  let telefono = req.body.telefono;
  let correoinstitucional = req.body.correoinstitucional;
  let idbeca = req.body.beca;
  let idcarrera = req.body.carrera;
  let idarea = req.body.area;
  let idgrado = req.body.grado;
  let cuatrimestre = req.body.cuatrimestre;
  let grupo = req.body.grupo;
  let correotutor = req.body.correotutor;
  let idgenero = req.body.genero;
  let idestado = req.body.estado;

  if (nombre && matricula && curp && telefono && correoinstitucional && idbeca && idcarrera && idarea && idgrado && cuatrimestre
	&& grupo && correotutor && idgenero && idestado) {
    connection.query(
      'INSERT INTO solicitud (nombre, matricula, curp, telefono, correoinstitucional, idbeca, idcarrera, idarea, idgrado, cuatrimestre, grupo, correotutor, idgenero, idestado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, matricula, curp, telefono, correoinstitucional, idbeca, idcarrera, idarea, idgrado, cuatrimestre, grupo, correotutor, idgenero, idestado],
      function(error, results, fields) {
        if (error) {
          console.error('Error al insertar los datos:', error);
          res.status(500).send('Error al insertar los datos');
        } else {
          res.status(200).send('Datos insertados correctamente');
        }
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

app.get('/api/becas/1', function(req, res) {
  connection.query('SELECT * FROM beca WHERE idbeca = 1', function(error, results, fields) {
    if (error) {
      console.error('Error al obtener las becas:', error);
      res.status(500).json({ error: 'Error al obtener las becas' });
    } else {
      res.json(results[0]);
    }
  });
});

connection.query(`
  CREATE PROCEDURE GetBecaById(IN becaId INT)
  BEGIN
    SELECT * FROM beca WHERE idbeca = becaId;
  END
`, function(error, results, fields) {
  if (error) {
    console.error('Error al crear el procedimiento almacenado:', error);
  } else {
    console.log('Procedimiento almacenado creado exitosamente');
  }
});

app.get('/api/becas/2', function(req, res) {
  connection.query('CALL GetBecaById(2)', function(error, results, fields) {
    if (error) {
      console.error('Error al obtener las becas:', error);
      res.status(500).json({ error: 'Error al obtener las becas' });
    } else {
      res.json(results[0][0]);
    }
  });
});

connection.query(`
  CREATE PROCEDURE GetBecaDep(IN becaIdep INT)
  BEGIN
    SELECT * FROM beca WHERE idbeca = becaIdep;
  END
`, function(error, results, fields) {
  if (error) {
    console.error('Error al crear el procedimiento almacenado:', error);
  } else {
    console.log('Procedimiento almacenado deportivo creado exitosamente');
  }
});

app.get('/api/becas/3', async function(req, res) {
  connection.query('CALL GetBecaDep(3)', function(error, results, fields) {
    if (error) {
      console.error('Error al obtener las becas:', error);
      res.status(500).json({ error: 'Error al obtener las becas' });
    } else {
      res.json(results[0][0]);
    }
  });
});

connection.query('DROP PROCEDURE IF EXISTS GetBecaEcono', async function(error, results, fields) {
  if (error) {
    console.error('Error al eliminar el procedimiento almacenado:', error);
  } else {
    console.log('Procedimiento almacenado eliminado exitosamente');
    // Aquí puedes crear el procedimiento almacenado nuevamente
    connection.query('CREATE PROCEDURE GetBecaEcono(IN becaId INT) BEGIN SELECT * FROM beca WHERE idbeca = becaId; END', function(error, results, fields) {
      if (error) {
        console.error('Error al crear el procedimiento almacenado:', error);
      } else {
        console.log('Procedimiento almacenado creado para beca economica exitosamente');
      }
    });
  }
});

app.get('/api/becas/4', async function(req, res) {
  connection.query('CALL GetBecaEcono(4)', function(error, results, fields) {
    if (error) {
      console.error('Error al obtener las becas:', error);
      res.status(500).json({ error: 'Error al obtener las becas' });
    } else {
      res.json(results[0][0]);
    }
  });
});

app.get('/api/columns', async function(req, res) {
  connection.query(`
    CREATE PROCEDURE GetAllRecords(IN solicitud)
    BEGIN
      SELECT nombre, matricula, correoinstitucional, idbeca, idcarrera, idarea, idgenero FROM solicitud;
    END
  `, function(error, results, fields) {   
    if (error) {
      console.error('Error al crear el procedimiento almacenado de obtener multiples datos', error);
    } else {
      connection.query('CALL GetAllRecords(<nombre_de_tu_tabla>)', function(error, results, fields) {
        if (error) {
          console.error('Error al ejecutar el procedimiento almacenado GetAllRecords', error);
          res.status(500).json({ error: 'Error al ejecutar el procedimiento almacenado' });
        } else {
          // Asignar los resultados a la variable data
          data.value = results[0];
          console.log('Se obtuvieron las columnas de las solicitudes correctamente');
          res.json(results[0]);
        }
      });
    }
  });
});



app.get('/api/estados/1', async function(req, res) {
  connection.query('SELECT * FROM estado WHERE idestado = 1', function(error, results, fields) {
    if (error) {
      console.error('Error al obtener el estado:', error);
      res.status(500).json({ error: 'Error al obtener el estado' });
    } else {
      res.json(results[0]);
    }
  });
});

app.get('/api/becas/all', async function(req, res) {
  connection.query('SELECT * FROM beca', function(error, results, fields) {
    if (error) {
      console.error('Error al obtener la beca:', error);
      res.status(500).json({ error: 'Error al obtener la beca' });
    } else {
      res.json(results);
    }
  });
});

app.get('/api/carrera', async function(req, res) {
  connection.query('SELECT * FROM carrera', function(error, results, fields) {
    if (error) {
      console.error('Error al obtener la carrera:', error);
      res.status(500).json({ error: 'Error al obtener la carrera' });
    } else {
      res.json(results);
    }
  });
});

app.get('/api/area', async function(req, res) {
  connection.query('SELECT * FROM area', function(error, results, fields) {
    if (error) {
      console.error('Error al obtener el area:', error);
      res.status(500).json({ error: 'Error al obtener el area' });
    } else {
      res.json(results);
    }
  });
});

app.get('/api/grado', async function(req, res) {
  connection.query('SELECT * FROM grado', function(error, results, fields) {
    if (error) {
      console.error('Error al obtener el grado:', error);
      res.status(500).json({ error: 'Error al obtener el grado' });
    } else {
      res.json(results);
    }
  });
});
app.get('/api/genero', async function(req, res) {
  connection.query('SELECT * FROM genero', function(error, results, fields) {
    if (error) {
      console.error('Error al obtener el genero:', error);
      res.status(500).json({ error: 'Error al obtener el genero' });
    } else {
      res.json(results);
    }
  });
});

app.post('/api/form/carta', async function(req, res) {
  let nombre = req.body.nombre;
  let matricula = req.body.matricula;
  let domicilio = req.body.domicilio;
  let telefono = req.body.telefono;
  let celular = req.body.celular;
  let correoper = req.body.correoper;
  let nacimiento = req.body.nacimiento;
  let estadocivil = req.body.estadocivil;
  let genero = req.body.genero;
  let beca = req.body.beca;
  let nivelestudios = req.body.nivelestudios;
  let nombreescuela = req.body.nombreescuela;
  let tipoescuela = req.body.tipoescuela;
  let municipio = req.body.municipio;
  let promedio = req.body.promedio;
  let carrera = req.body.carrera;
  let area = req.body.area;
  let cuatrisoli = req.body.cuatrisoli;
  let grupo = req.body.grupo;
  let promedioult = req.body.promedioult;
  let apoyo = req.body.apoyo;
  let nombreapoyo = req.body.nombreapoyo;
  let cuanto = req.body.cuanto;
  let motivo = req.body.motivo;
  

  if (nombre && matricula && domicilio && telefono && celular && correoper && nacimiento && estadocivil && genero && beca && nivelestudios && nombreescuela && tipoescuela && municipio && promedio && carrera && area && cuatrisoli && promedioult
	&& grupo && apoyo && nombreapoyo && cuanto && motivo) {
    connection.query(
      'INSERT INTO carta (nombre, matricula, domicilio, telefono, celular, correoper, nacimiento, estadocivil, genero, beca, nivelestudios, nombreescuela, tipoescuela, municipio, promedio, carrera, area, cuatrisoli, promedioult, grupo, apoyo, nombreapoyo, cuanto, motivo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?, ?, ?)',
      [nombre, matricula, domicilio, telefono, celular, correoper, nacimiento, estadocivil, genero, beca, nivelestudios, nombreescuela, tipoescuela, municipio, promedio, carrera, area, cuatrisoli, promedioult, grupo, apoyo, nombreapoyo, cuanto, motivo],
      function(error, results, fields) {
        if (error) {
          console.error('Error al insertar los datos:', error);
          res.status(500).send('Error al insertar los datos');
        } else {
          res.status(200).send('Datos insertados correctamente');
        }
      }
    );
  } else {
    res.send('Por favor ingresa Nombre, Matrícula y CURP!');
  }
});

app.listen(3000);

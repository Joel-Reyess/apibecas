const mysql = require('mysql');
const express = require("express");
const multer  = require('multer');
const axios = require('axios');
const cors = require("cors");
const app = express();
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { error } = require('console');

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


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage })

app.post('/upload', upload.fields([
  { name: 'credencial', maxCount: 1 },
  { name: 'boleta', maxCount: 1 },
  { name: 'comprobante', maxCount: 1 },
  { name: 'compromiso', maxCount: 1 },
  { name: 'conducta', maxCount: 1 },
  { name: 'medico', maxCount: 1 },
  { name: 'constancia', maxCount: 1 },
  { name: 'escrito', maxCount: 1 },
  { name: 'pagoref', maxCount: 1 },
]), (req, res) => {
  try {
    const files = req.files;
    const insertedFiles = [];

    for (const key in files) {
      if (Object.hasOwnProperty.call(files, key)) {
        const file = files[key][0];
        const filePath = path.join(__dirname, 'uploads', file.filename);
        fs.renameSync(file.path, filePath);
        insertedFiles.push(filePath); // Solo guarda la ruta del archivo en el arreglo
      }
    }

    // Insertar las rutas de los archivos en la base de datos
    if (insertedFiles.length > 0) {
      const query = 'INSERT INTO documentos (documento) VALUES ?';
      const values = insertedFiles.map(file => [file]);

      connection.query(query, [values], (err, result) => {
        if (err) {
          console.error('Error al insertar en la base de datos:', err);
          res.status(500).json({ message: 'Error al insertar en la base de datos' });
        } else {
          console.log('Archivos insertados en la base de datos');
          res.status(200).json({ message: 'Archivos cargados y almacenados correctamente' });
        }
      });
    } else {
      res.status(400).json({ message: 'No se recibieron archivos para cargar' });
    }
  } catch (error) {
    console.error('Error al cargar los archivos:', error);
    res.status(500).json({ message: 'Error al cargar los archivos' });
  }
});

app.get('/api/solicitud/:idsolicitud', async function(req, res) {
  const idsolicitud = req.params.idsolicitud;
  // Realiza la consulta a la base de datos para obtener los detalles del registro con el ID dado
  connection.query(
    'SELECT * FROM solicitud WHERE idsolicitud = ?',
    [idsolicitud],
    (error, results) => {
      if (error) {
        console.error('Error al obtener los detalles del registro:', error);
        res.status(500).json({ error: 'Error al obtener los detalles del registro' });
      } else {
        if (results.length === 0) {
          res.status(404).json({ error: 'Registro no encontrado' });
        } else {
          // Suponiendo que 'results' contiene los detalles del registro en formato JSON
          const registro = results[0]; // Como solo debería haber un resultado, seleccionamos el primer elemento
          res.json(registro);
        }
      }
    }
  );
});

// Ruta para actualizar el estado de un registro por su ID
app.put('/api/solicitud/:idsolicitud', async function(req, res) {
  const idsolicitud = req.params.idsolicitud;
  const { idestado } = req.body;

  // Realiza la consulta a la base de datos para actualizar el estado del registro
  connection.query(
    'UPDATE solicitud SET idestado = ? WHERE idsolicitud = ?',
    [idestado, idsolicitud],
    (error, results) => {
      if (error) {
        console.error('Error al actualizar el estado del registro:', error);
        res.status(500).json({ error: 'Error al actualizar el estado del registro' });
      } else {
        if (results.affectedRows === 0) {
          // No se encontró el registro con el ID proporcionado
          res.status(404).json({ error: 'Registro no encontrado' });
        } else {
          // Se actualizó el estado del registro correctamente
          res.json({ message: 'Registro actualizado correctamente' });
        }
      }
    }
  );
});

// Ruta para actualizar el porcentaje de un registro por su ID
app.put('/api/solicitudes/:idsolicitud', async function(req, res) {
  const idsolicitud = req.params.idsolicitud;
  const { idestado, porcentaje } = req.body;

  // Realiza la consulta a la base de datos para actualizar el porcentaje del registro
  connection.query(
    'UPDATE solicitud SET idestado = ?, porcentaje = ? WHERE idsolicitud = ?',
    [idestado, porcentaje, idsolicitud],
    (error, results) => {
      if (error) {
        console.error('Error al actualizar el porcentaje del registro:', error);
        res.status(500).json({ error: 'Error al actualizar el porcentaje del registro' });
      } else {
        if (results.affectedRows === 0) {
          // No se encontró el registro con el ID proporcionado
          res.status(404).json({ error: 'Registro no encontrado' });
        } else {
          // Se actualizó el porcentaje del registro correctamente
          res.json({ message: 'Registro actualizado correctamente' });
        }
      }
    }
  );
});

app.get('/api/solicitud/enproceso', async function(req, res) {
  connection.query(
    'SELECT * FROM solicitud WHERE idestado = 2', // ID 2 corresponde al estado "En proceso"
    (error, results) => {
      if (error) {
        console.error('Error al obtener los detalles del registro:', error);
        res.status(500).json({ error: 'Error al obtener los detalles del registro' });
      } else {
        res.json(results);
      }
    }
  );
});

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

connection.query('DROP PROCEDURE IF EXISTS GetBecaExce', async function(error, results, fields) {
  if (error) {
    console.error('Error al eliminar el procedimiento almacenado:', error);
  } else {
    console.log('Procedimiento almacenado eliminado exitosamente');
    // Aquí puedes crear el procedimiento almacenado nuevamente
    connection.query('CREATE PROCEDURE GetBecaExce(IN becaId INT) BEGIN SELECT * FROM beca WHERE idbeca = becaId; END', function(error, results, fields) {
      if (error) {
        console.error('Error al crear el procedimiento almacenado:', error);
      } else {
        console.log('Procedimiento almacenado creado para beca Excelencia exitosamente');
      }
    });
  }
});

app.get('/api/becas/5', async function(req, res) {
  connection.query('CALL GetBecaExce(5)', function(error, results, fields) {
    if (error) {
      console.error('Error al obtener las becas de excelencia:', error);
      res.status(500).json({ error: 'Error al obtener las becas de excelencia' });
    } else {
      res.json(results[0][0]);
    }
  });
});

connection.query('DROP PROCEDURE IF EXISTS GetBecaInclu', async function(error, results, fields) {
  if (error) {
    console.error('Error al eliminar el procedimiento almacenado:', error);
  } else {
    console.log('Procedimiento almacenado eliminado exitosamente');
    // Aquí puedes crear el procedimiento almacenado nuevamente
    connection.query('CREATE PROCEDURE GetBecaInclu(IN becaId INT) BEGIN SELECT * FROM beca WHERE idbeca = becaId; END', function(error, results, fields) {
      if (error) {
        console.error('Error al crear el procedimiento almacenado:', error);
      } else {
        console.log('Procedimiento almacenado creado para beca Inclucion exitosamente');
      }
    });
  }
});

app.get('/api/becas/6', async function(req, res) {
  connection.query('CALL GetBecaInclu(6)', function(error, results, fields) {
    if (error) {
      console.error('Error al obtener las becas de Inclusion:', error);
      res.status(500).json({ error: 'Error al obtener las becas de Inclulsion' });
    } else {
      res.json(results[0][0]);
    }
  });
});

connection.query('DROP PROCEDURE IF EXISTS GetBecaPost', async function(error, results, fields) {
  if (error) {
    console.error('Error al eliminar el procedimiento almacenado:', error);
  } else {
    console.log('Procedimiento almacenado eliminado exitosamente');
    // Aquí puedes crear el procedimiento almacenado nuevamente
    connection.query('CREATE PROCEDURE GetBecaPost(IN becaId INT) BEGIN SELECT * FROM beca WHERE idbeca = becaId; END', function(error, results, fields) {
      if (error) {
        console.error('Error al crear el procedimiento almacenado:', error);
      } else {
        console.log('Procedimiento almacenado creado para beca Postgrado exitosamente');
      }
    });
  }
});

app.get('/api/becas/7', async function(req, res) {
  connection.query('CALL GetBecaPost(7)', function(error, results, fields) {
    if (error) {
      console.error('Error al obtener las becas de Postgrado:', error);
      res.status(500).json({ error: 'Error al obtener las becas de Postgrado' });
    } else {
      res.json(results[0][0]);
    }
  });
});

connection.query('DROP PROCEDURE IF EXISTS GetBecaRefe', async function(error, results, fields) {
  if (error) {
    console.error('Error al eliminar el procedimiento almacenado:', error);
  } else {
    console.log('Procedimiento almacenado eliminado exitosamente');
    // Aquí puedes crear el procedimiento almacenado nuevamente
    connection.query('CREATE PROCEDURE GetBecaRefe(IN becaId INT) BEGIN SELECT * FROM beca WHERE idbeca = becaId; END', function(error, results, fields) {
      if (error) {
        console.error('Error al crear el procedimiento almacenado:', error);
      } else {
        console.log('Procedimiento almacenado creado para beca Referencia exitosamente');
      }
    });
  }
});

app.get('/api/becas/8', async function(req, res) {
  connection.query('CALL GetBecaRefe(8)', function(error, results, fields) {
    if (error) {
      console.error('Error al obtener las becas de Referencia:', error);
      res.status(500).json({ error: 'Error al obtener las becas de Referencia' });
    } else {
      res.json(results[0][0]);
    }
  });
});

connection.query('DROP PROCEDURE IF EXISTS GetBecaRein', async function(error, results, fields) {
  if (error) {
    console.error('Error al eliminar el procedimiento almacenado:', error);
  } else {
    console.log('Procedimiento almacenado eliminado exitosamente');
    // Aquí puedes crear el procedimiento almacenado nuevamente
    connection.query('CREATE PROCEDURE GetBecaRein(IN becaId INT) BEGIN SELECT * FROM beca WHERE idbeca = becaId; END', function(error, results, fields) {
      if (error) {
        console.error('Error al crear el procedimiento almacenado:', error);
      } else {
        console.log('Procedimiento almacenado creado para beca Reincorporacion exitosamente');
      }
    });
  }
});

app.get('/api/becas/9', async function(req, res) {
  connection.query('CALL GetBecaRein(9)', function(error, results, fields) {
    if (error) {
      console.error('Error al obtener las becas de Reincorporacion:', error);
      res.status(500).json({ error: 'Error al obtener las becas de Reincorporacion' });
    } else {
      res.json(results[0][0]);
    }
  });
});

connection.query('DROP PROCEDURE IF EXISTS GetBecaTrans', async function(error, results, fields) {
  if (error) {
    console.error('Error al eliminar el procedimiento almacenado:', error);
  } else {
    console.log('Procedimiento almacenado eliminado exitosamente');
    // Aquí puedes crear el procedimiento almacenado nuevamente
    connection.query('CREATE PROCEDURE GetBecaTrans(IN becaId INT) BEGIN SELECT * FROM beca WHERE idbeca = becaId; END', function(error, results, fields) {
      if (error) {
        console.error('Error al crear el procedimiento almacenado:', error);
      } else {
        console.log('Procedimiento almacenado creado para beca Transporte exitosamente');
      }
    });
  }
});

app.get('/api/becas/10', async function(req, res) {
  connection.query('CALL GetBecaTrans(10)', function(error, results, fields) {
    if (error) {
      console.error('Error al obtener las becas de Transporte:', error);
      res.status(500).json({ error: 'Error al obtener las becas de Transporte' });
    } else {
      res.json(results[0][0]);
    }
  });
});

app.get('/api/columns', async function(req, res) {
  connection.query(`
    SELECT s.idsolicitud, s.nombre, b.beca as beca, c.carrera as carrera, a.area as area, g.grado as grado, gen.genero as genero
    FROM solicitud s
    LEFT JOIN beca b ON s.idbeca = b.idbeca
    LEFT JOIN carrera c ON s.idcarrera = c.idcarrera
    LEFT JOIN area a ON s.idarea = a.idarea
    LEFT JOIN grado g ON s.idgrado = g.idgrado
    LEFT JOIN genero gen ON s.idgenero = gen.idgenero;
  `, function(error, results, fields) {   
    if (error) {
      console.error('Error al obtener los datos:', error);
      res.status(500).json({ error: 'Error al obtener los datos' });
    } else {
      console.log('Se obtuvieron las columnas de las solicitudes correctamente');
      res.json(results);
    }
  });
});

app.get('/api/columns/proceso', async function(req, res) {
  connection.query(`
    SELECT s.idsolicitud, s.nombre, b.beca as beca, c.carrera as carrera, a.area as area, g.grado as grado, gen.genero as genero
    FROM solicitud s
    LEFT JOIN beca b ON s.idbeca = b.idbeca
    LEFT JOIN carrera c ON s.idcarrera = c.idcarrera
    LEFT JOIN area a ON s.idarea = a.idarea
    LEFT JOIN grado g ON s.idgrado = g.idgrado
    LEFT JOIN genero gen ON s.idgenero = gen.idgenero
    WHERE s.idestado = 2;  -- Add this WHERE clause to filter records by idestado = 2
  `, function(error, results, fields) {   
    if (error) {
      console.error('Error al obtener los datos:', error);
      res.status(500).json({ error: 'Error al obtener los datos' });
    } else {
      console.log('Se obtuvieron las columnas de las solicitudes correctamente');
      res.json(results);
    }
  });
});

app.get('/api/columns/rechazada', async function(req, res) {
  connection.query(`
    SELECT s.idsolicitud, s.nombre, b.beca as beca, c.carrera as carrera, a.area as area, g.grado as grado, gen.genero as genero
    FROM solicitud s
    LEFT JOIN beca b ON s.idbeca = b.idbeca
    LEFT JOIN carrera c ON s.idcarrera = c.idcarrera
    LEFT JOIN area a ON s.idarea = a.idarea
    LEFT JOIN grado g ON s.idgrado = g.idgrado
    LEFT JOIN genero gen ON s.idgenero = gen.idgenero
    WHERE s.idestado = 3;  
  `, function(error, results, fields) {   
    if (error) {
      console.error('Error al obtener los datos:', error);
      res.status(500).json({ error: 'Error al obtener los datos' });
    } else {
      console.log('Se obtuvieron las columnas de las solicitudes correctamente');
      res.json(results);
    }
  });
});

app.get('/api/columns/aprovadas', async function(req, res) {
  connection.query(`
    SELECT s.idsolicitud, s.nombre, b.beca as beca, c.carrera as carrera, a.area as area, g.grado as grado, gen.genero as genero
    FROM solicitud s
    LEFT JOIN beca b ON s.idbeca = b.idbeca
    LEFT JOIN carrera c ON s.idcarrera = c.idcarrera
    LEFT JOIN area a ON s.idarea = a.idarea
    LEFT JOIN grado g ON s.idgrado = g.idgrado
    LEFT JOIN genero gen ON s.idgenero = gen.idgenero
    WHERE s.idestado = 4;  
  `, function(error, results, fields) {   
    if (error) {
      console.error('Error al obtener los datos:', error);
      res.status(500).json({ error: 'Error al obtener los datos' });
    } else {
      console.log('Se obtuvieron las columnas de las solicitudes correctamente');
      res.json(results);
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
app.get('/api/estado', async function(req, res) {
  connection.query('SELECT * FROM estado', function(error, results, fields) {
    if (error) {
      console.error('Error al obtener el estado:', error);
      res.status(500).json({ error: 'Error al obtener el estado' });
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
    res.send('Por favor ingresa bien la carta de solicitud!');
  }
});

app.post('/api/form/socio', async function(req, res) {
  let nombre = req.body.nombre;
  let nacimiento = req.body.nacimiento;
  let domicilio = req.body.domicilio;
  let conquienvive = req.body.conquienvive;
  let telefono = req.body.telefono;
  let celular = req.body.celular;
  let transporte = req.body.transporte;
  let ingreso = req.body.ingreso;
  let padre = req.body.padre;
  let madre = req.body.madre;
  let hermanos = req.body.hermanos;
  let total = req.body.total;
  let alimentacion = req.body.alimentacion;
  let telefonia = req.body.telefonia;
  let credito = req.body.credito;
  let renta = req.body.renta;
  let servicios = req.body.servicios;
  let abonos = req.body.abonos;
  let importe = req.body.importe;
  let totale = req.body.totale;
  let vivienda = req.body.vivienda;
  let paredes = req.body.paredes;
  let techos = req.body.techos;
  let pisos = req.body.pisos;
  let mobiliario = req.body.mobiliario;
  let servmedico = req.body.servmedico;
  let asistencia = req.body.asistencia;
  let cronicas = req.body.cronicas;
  let tipo = req.body.tipo;
  let consumo = req.body.consumo;
  let finde = req.body.finde;
  let actividades = req.body.actividades;
  let traslado = req.body.traslado;
  let mediotra = req.body.mediotra;
  

  if (nombre && nacimiento && domicilio && conquienvive && telefono && celular && transporte && ingreso && padre && madre && hermanos && total && alimentacion && telefonia && credito && renta && servicios && abonos && importe && totale
	&& vivienda && paredes && techos && pisos && mobiliario && servmedico && asistencia && cronicas && tipo && consumo && finde && actividades && traslado && mediotra) {
    connection.query(
      'INSERT INTO socioeconomicos (nombre, nacimiento, conquienvive, domicilio, telefono, celular, transporte, ingreso, padre, madre, hermanos, total, alimentacion, telefonia, credito, renta, servicios, abonos, importe, totale, vivienda, paredes, techos, pisos, mobiliario, servmedico, asistencia, cronicas, tipo, consumo, finde, actividades, traslado, mediotra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, nacimiento, conquienvive, domicilio, telefono, celular, transporte, ingreso, padre, madre, hermanos, total, alimentacion, telefonia, credito, renta, servicios, abonos, importe, totale, vivienda, paredes, techos, pisos, mobiliario, servmedico, asistencia, cronicas, tipo, consumo, finde, actividades, traslado, mediotra],
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
    res.send('Por favor ingresa bien los datos de los socioeconomicos!');
  }
});

app.listen(3000);

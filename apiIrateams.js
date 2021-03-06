const express   = require("express");
const app       = express();
const cors      = require('cors');
const mysql     = require('mysql2');
const crypto    = require('crypto');
const jwt       = require('jsonwebtoken');
const mailer    = require('./mailer')
let port        = process.env.PORT || 3000;


const connection = mysql.createConnection(
    {
        host : "irateams.cjzbqozgh304.eu-west-3.rds.amazonaws.com",
        user : "admin",
        password : "Irateams2021",
        database : "IRATEAMS"
    });

connection.connect(function(error){
    if (error){
        console.log(error);
    }
    else {
        console.log('Conexión correcta');
    }
});

app.use(cors());
app.use(express.urlencoded({extended : false}));
app.use(express.json());

// ENDPOINTS LOGIN

const KEY       = 'secret.-.password-.-';
const Encrypt   =  (pwd) => crypto.createHmac('sha256', KEY).update(pwd).digest('hex');
const TOKEN_KEY = 'c38bdf8c-5682-11ec-bf63-0242ac130002';
app.post('/login', (req, res) => {
    const user              = req.body.user;
    const password          = req.body.password;
    const encryptpassword   = Encrypt(password);
    console.log(encryptpassword)

    const params            = [user,user,encryptpassword]
    const query             = `SELECT id_usuario from usuario WHERE (username = ? OR mail = ?) and (password = ?)`;
    let response;
    connection.query(query,params,(err, results) =>{
        if(err){
            console.error(err);
            response = {
                error:true,
                msg:"Error al conectar con la base de datos", 
                resultado:err
            };
            res.status(500).send(response);
            return;
        }
        if (results.length > 0) { 
            const token = generateAccessToken(results[0].id_evento);
            response    = {
                error:false,
                msg:"Inicio de sesión completado", 
                resultado:results,
                token:token
            }
            res.status(200).send(response);
        } else {
            response = {
                error:false,
                msg:"El usuario o la contraseña no son correctos", 
                resultado:results
            }
            res.status(200).send(response);
        }
          
    });
  });

// app.get('/login/check',authenticateToken,(req,res)=>{
//     res.status(200).send({
//         error:false,
//         msg:"Token correcto", 
//     })
// });


  function generateAccessToken (userID) {
    return jwt.sign({userID}, TOKEN_KEY, {expiresIn: '7d'});
  }
  
  function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader;
    if (token == null) {
      return res.sendStatus(401)
    }
    jwt.verify(token, TOKEN_KEY, (err, data) => {
      if (err) {
        return res.sendStatus(403)
      }
      req.userId = data.userId;
      next();
    });
  }




// ENDPOINTS USUARIO
app.get("/usuarios", function(request, response)
{
    let id = request.query.id;
    let params =[id];
    let sql;
    if(request.query.id == null){
        sql = "SELECT * FROM IRATEAMS.usuario"
    }
    else {
        sql = "SELECT * FROM IRATEAMS.usuario WHERE id_usuario=?" 
    }

    connection.query(sql, params, function(err, result)
    {
        if(err){
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        }
        else{
            if (result.length == 0) {
                respuesta = {error:false,msg:"Error al obtener usuario", resultado:result}
                response.status(200).send(respuesta);
            } else {
                respuesta = {error:false,msg:"Usuario", resultado:result}
                response.status(200).send(respuesta);
            }
        }
    });
});

// Para registrarse
app.post("/usuarios", function(request, response)
{
    let username        = request.body.username;
    let mail            = request.body.mail;
    let password        = request.body.password;
    let encryptpassword = Encrypt(password);

    let params=[username, mail, encryptpassword]

    console.log(request.body);
    let sql= "INSERT INTO IRATEAMS.usuario (username, mail, password) VALUES (?,?,?)"
    console.log(sql);
    connection.query(sql, params, function(err, result)
    {
        if(err){
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        }
        else{
            if (result.length == 0) {
                respuesta = {error:false,msg:"Error al crear el usuario", resultado:result}
                response.status(200).send(respuesta);
            } else {
                respuesta = {error:false,msg:"Usuario creado", resultado:result}
                mailer.welcomeMail(mail, (err, data) => {
                    if (err) {
                      return console.error(err);
                    }
                    console.log(data);
                  });
                response.status(200).send(respuesta);
            }
        }
    });                  
});

// Para modficicar datos del usuario
app.put("/usuarios", function(request, response)
{
    console.log(request.body);
    
    let password            = request.body.password;
    let nombreCompleto      = request.body.nombreCompleto;
    let fechaNacimiento     = request.body.fechaNacimiento;
    let telefono            = request.body.telefono;
    let urlFoto             = request.body.urlFoto;
    let username            = request.body.username;
    let mail                = request.body.mail
    let encryptpassword     = Encrypt(password);
    

    let id = request.body.id_usuario

    let params=[username,mail, encryptpassword, nombreCompleto, fechaNacimiento, telefono, urlFoto, id]

    let sql = "UPDATE IRATEAMS.usuario SET username = ?, mail = ?, password = ?, nombreCompleto = ?, fechaNacimiento = ?,  telefono = ?, urlFoto = ? WHERE id_usuario= ?";
    
    connection.query(sql, params, function(err, result)
    {
        if(err){
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        }
        else{
            if (result.length == 0) {
                respuesta = {error:false,msg:"Error al modificar los datos de usuario", resultado:result}
                response.status(200).send(respuesta);
            } else {
                respuesta = {error:false,msg:"Datos modificados", resultado:result}
                response.status(200).send(respuesta);
            }
        }
    });
});


// Por ahora no hay funcionalidad de eliminar
app.delete("/usuarios", function(request,response)
{
    let id = request.body.id_evento
    let params=[id]
    let sql = "DELETE FROM IRATEAMS.usuario WHERE id_usuario = ?"
    
    connection.query(sql,params,function(err, result)
    {
        if(err){
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        }
        else{
            if (result.length == 0) {
                respuesta = {error:false,msg:"Error al eliminar el usuario", resultado:result}
                response.status(200).send(respuesta);
            } else {
                respuesta = {error:false,msg:"Usuario eliminado", resultado:result}
                response.status(200).send(respuesta);
            }
        }
    });
});

// HISTORIAL DE EVENTOS REALIZADOS
app.get("/historial", function(request, response)
{
    let id = request.query.id;
    let params =[id];

    let sql = "SELECT ev.id_evento, titulo, fecha, direccion, localidad FROM IRATEAMS.evento AS ev JOIN apuntados AS ap ON (ev.id_evento = ap.id_evento) JOIN usuario AS us ON (ap.id_usuario = us.id_usuario) WHERE us.id_usuario = ? AND  fecha < CURDATE() ORDER BY DATE_FORMAT(fecha, '%Y-%m-%d %T') DESC;" 

    connection.query(sql,params,function(err, result)
    {
        if(err){
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        }
        else{
            if (result.length == 0) {
                respuesta = {error:false,msg:"Error al obtener el historial", resultado:result}
                response.status(200).send(respuesta);
            } else {
                respuesta = {error:false,msg:"Historial obtenido", resultado:result}
                response.status(200).send(respuesta);
            }
        }
    });
});


// MIS PRÓXIMOS EVENTOS (CALENDARIO)
app.get("/calendario", function(request, response)
{
    let id = request.query.id;
    let params =[id];

    let sql = "SELECT ev.id_evento, titulo, fecha, direccion, localidad FROM IRATEAMS.evento AS ev JOIN apuntados AS ap ON (ev.id_evento = ap.id_evento) JOIN usuario AS us ON (ap.id_usuario = us.id_usuario) WHERE us.id_usuario = ? AND  fecha >= CURDATE() ORDER BY DATE_FORMAT(fecha, '%Y-%m-%d %T') ASC" 

    connection.query(sql,params,function(err, result)
    {
        if(err){
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        }
        else{
            if (result.length == 0) {
                respuesta = {error:false,msg:"Error al obtener próximos eventos", resultado:result}
                response.status(200).send(respuesta);
            } else {
                respuesta = {error:false,msg:"Próximos eventos", resultado:result}
                response.status(200).send(respuesta);
            }
        }
    });
});

// MIS EVENTOS CREADOS
app.get("/miscreados", function(request, response)
{
    let id = request.query.id;
    let params =[id];

    let sql =  "SELECT * FROM IRATEAMS.evento AS ev JOIN IRATEAMS.usuario AS us ON (ev.id_creador = us.id_usuario) WHERE us.id_usuario = ? ORDER BY DATE_FORMAT(fecha, '%Y-%m-%d %T') ASC"

    connection.query(sql,params,function(err, result)
    {
        if(err){
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        }
        else{
            if (result.length == 0) {
                respuesta = {error:false,msg:"Error al obtener mis eventos creados", resultado:result}
                response.status(200).send(respuesta);
            } else {
                respuesta = {error:false,msg:"Mis eventos creados", resultado:result}
                response.status(200).send(respuesta);
            }
        }
    });
});
app.delete("/miscreados", function(request,response)
{
    console.log(request.body)
    let id = request.body.id_evento
    let params=[id]
    let sql = "DELETE FROM IRATEAMS.evento WHERE id_evento = ?"
    
    connection.query(sql,params,function(err, result)
    {
        if(err){
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        }
        else{
            if (result.length == 0) {
                respuesta = {error:false,msg:"Error al eliminar el evento", resultado:result}
                response.status(200).send(respuesta);
            } else {
                respuesta = {error:false,msg:"Evento eliminado", resultado:result}
                response.status(200).send(respuesta);
            }
        }
    });
});

// EVENTOS GUARDADOS
app.get("/guardados", function(request, response){
    console.log("entrada evento guardado")
    let id_usuario = request.query.id_usuario;
    let params = [id_usuario]
    let sql;
    let respuesta;
        console.log("get eventos guardados");
        sql = "SELECT * FROM IRATEAMS.guardados WHERE id_usuario = ? ORDER BY DATE_FORMAT(fecha, '%Y-%m-%d %T') ASC"
        connection.query(sql,params,function(err, result)
        {
            if(err){
                console.error(err);
                respuesta = {error:true,msg:"Error get guardados", resultado:err};
                response.status(500).send(respuesta);
            }
            else{
                if (result.length == 0) {
                    respuesta = {error:false,msg:"Error al obtener guardados", resultado:result}
                    response.status(200).send(respuesta);
                } else {
                    respuesta = {error:false,msg:"guardados obtenido", resultado:result}
                    response.status(200).send(respuesta);
                }
            }
        });
  })
  app.post("/guardados", function(request, response){
      let id_usuario = request.body.id_usuario;
      let id_evento = request.body.id_evento;
      let params = [id_usuario, id_evento]
      let sql;
      let respuesta;
      console.log("post evento guardado");
      sql = "INSERT INTO IRATEAMS.guardados (id_usuario, id_evento) VALUES (?,?)"
      connection.query(sql,params,function(err, result)
      {
          if(err){
              console.error(err);
              respuesta = {error:true,msg:"Error post guardados", resultado:err};
              response.status(500).send(respuesta);
          }
          else{
              if (result.length == 0) {
                  respuesta = {error:false,msg:"Error al obtener guardados", resultado:result}
                  response.status(200).send(respuesta);
              } else {
                  respuesta = {error:false,msg:"post guardados", resultado:result}
                  response.status(200).send(respuesta);
              }
          }
      });
  })
  app.delete("/guardados", function(request,response)
  {    
      let id_usuario = request.body.id_usuario
      let id_evento = request.body.id_evento
      let params=[id_usuario,id_evento]
      let sql = "DELETE FROM IRATEAMS.guardados WHERE id_usuario=? AND id_evento=? "
      connection.query(sql,params,function(err, result)
      {
          if(err){
              console.error(err);
              respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
              response.status(500).send(respuesta);
          }
          else{
              if (result.length == 0) {
                  respuesta = {error:false,msg:"Error al eliminar evento guardado", resultado:result}
                  response.status(200).send(respuesta);
              } else {
                  respuesta = {error:false,msg:"evento guardado eliminado", resultado:result}
                  response.status(200).send(respuesta);
              }
          }
      });
  });


// ENDPOINTS EVENTOS
app.get("/eventos", function (request, response)
{
    console.log("entrada get")

    let id = request.query.id;

    let sql;
    let respuesta;

    if(id == null)
    {
        console.log("get eventos");
        sql = "SELECT * FROM IRATEAMS.evento WHERE fecha >= CURDATE() ORDER BY DATE_FORMAT(fecha, '%Y-%m-%d %T') ASC"
        
    }else
    {
        console.log("get evento");
        url = "/eventos?id="+request.query.id
        sql = "SELECT * FROM IRATEAMS.evento  WHERE id_evento ="+id
    }

    connection.query(sql, function(err, result)
    {
        if(err)
        {
            console.log("error get evento");
            console.log(err);
        }else
        {
            console.log(result);
            respuesta = {error:true, msg:"Get evento/s", resultado:result};
            response.status(200).send(respuesta)
            // response.send(respuesta);
        }
    })

    console.log("salida get evento");


})

// app.get('/eventos', function(request, response){
//     let query = `SELECT * FROM eventos`;
//     let respuesta;
//     connection.query(query,(err, results) =>{
//         if(err){
//             console.error(err);
//             respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
//             response.status(500).send(respuesta);
//         }
//         else{
//             if (results.length == 0) {
//                 respuesta = {error:false,msg:"No se han encontrado eventos", resultado:results}
//                 response.status(200).send(respuesta);
//             } else {
//                 respuesta = {error:false, msg:"Se han encontrado eventos", resultado:results}
//                 response.status(200).send(respuesta);
//             }
//         }
//     });
// });

app.post("/eventos", function(request, response)
{
    console.log("Entrada post evento")

    let respuesta;
    console.log(request.body)

    // let evento = { deporte: request.body.deporte,
    //                 titulo: request.body.titulo,
    //                 id_creador: request.body.id_creador,
    //                 nPersSolicitadas: request.body.nPersSolicitadas,
    //                 fecha: request.body.fecha,
    //                 direccion: request.body.direccion,
    //                 localidad: request.body.localidad,
    //                 descripcion: request.body.descripcion,
    //                 material: request.body.material,
    //                 pago: request.body.pago,
    //                 urlFotoEvento: request.body.urlFotoEvento

    // }

    // let sql = `INSERT INTO evento(deporte, titulo, id_creador, nPersSolicitadas, fecha, direccion, localidad, descripcion, material, pago, urlFotoEvento) 
    //             VALUES(\"${request.body.deporte}\", \"${request.body.titulo}\", \"${request.body.id_creador}\", \"${request.body.nPersSolicitadas}\", \"${request.body.fecha}\", \"${request.body.direccion}\", \"${request.body.localidad}\", \"${request.body.descripcion}\", \"${request.body.material}\", \"${request.body.pago}\", \"${request.body.urlFotoEvento}\")`

    let deporte= request.body.deporte;
    let titulo= request.body.titulo;
    let id_creador= request.body.id_creador;
    let nPersSolicitadas= request.body.nPersSolicitadas;
    let fecha= request.body.fecha;
    let direccion= request.body.direccion;
    let localidad= request.body.localidad;
    let descripcion= request.body.descripcion;
    let material= request.body.material;
    let pago= request.body.pago;
    let urlFotoEvento= request.body.urlFotoEvent;

    let params = [
        deporte,
        titulo, 
        id_creador,
        nPersSolicitadas,
        fecha,
        direccion,
        localidad,
        descripcion,
        material,
        pago,
        urlFotoEvento
    ]

    let sql = `INSERT INTO evento(deporte, titulo, id_creador, nPersSolicitadas, fecha, direccion, localidad, descripcion, material, pago, urlFotoEvento) 
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    
    connection.query(sql, params, function(err,result)
    {
        if(err)
        {
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        }
        else{
            console.log(result)
            respuesta = {error:false, msg:"Evento creado", resultado:result}
            response.status(200).send(respuesta);
            
        }
    })
    console.log("salida post evento")

    
})

app.put("/eventos", function(request, response)
{
    console.log("Entra put evento");

    let respuesta;

    
    // let id = request.body.id
    let deporte = request.body.deporte
    let titulo = request.body.titulo
    let id_creador = request.body.id_creador
    let nPersSolicitadas = request.body.nPersSolicitadas
    let fecha = request.body.fecha
    let direccion = request.body.direccion
    let localidad = request.body.localidad
    let descripcion = request.body.descripcion
    let material = request.body.material
    let pago = request.body.pago
    let urlFotoEvento = request.body.urlFotoEvento
    let id_evento = request.body.id_evento

    let params = [  deporte,
                    titulo,
                    id_creador,
                    nPersSolicitadas,
                    fecha,
                    direccion,
                    localidad,
                    descripcion,
                    material,
                    pago,
                    urlFotoEvento
                    ]
    
    
    let sql = "UPDATE evento SET deporte = COALESCE(?,evento.deporte), titulo = COALESCE(?,evento.titulo), id_creador = COALESCE(?, id_creador), nPersSolicitadas = COALESCE(?, evento.nPersSolicitadas), fecha = COALESCE(?, evento.fecha), direccion = COALESCE(?, evento.direccion), localidad = COALESCE(?, evento.localidad), descripcion = COALESCE(?, evento.descripcion), material = COALESCE(?, evento.material), pago = COALESCE(?, evento.pago), urlFotoEvento = COALESCE(?, evento.urlFotoEvento) WHERE id_evento="+id_evento
          
    
    
    connection.query(sql, params, function(err,result){

        if(err)
        {
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        }
        else{
                
            console.log(result)
            respuesta = {error:false, msg:"Evento modificado", resultado:result}
            response.status(200).send(respuesta);
        
        }
    })
    console.log("salida put evento")


})

app.delete("/eventos", function(request, response)
{
    

    let id = request.body.id_evento
    console.log(id)

    let respuesta;

    let sql2 = "DELETE FROM evento WHERE id_evento="+id

    connection.query(sql2, function(err,result){

        if(err){
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        }
        else{
            console.log("Evento eliminado")
            console.log(result)
            respuesta = {error:false, msg:"Evento eliminado", resultado:evento}
            response.status(500).send(respuesta);
               
        }
    })
    console.log("funcionando")


})

app.get("/filtroHome", function(request, response)
{  
    let where = "WHERE fecha >= CURDATE()"
    let orderBy =`ORDER BY DATE_FORMAT(fecha, '%Y-%m-%d %T') ASC`
    let filtro = request.query.filtro1
    // let filtro2 = request.query.filtro2
    // let filtro3 = request.query.filtro3
    let params = [filtro, filtro]
    
    if (filtro != "" && filtro != null){
            where +=  'AND (deporte = ? OR localidad = ?) '
            // params.push(filtro1);        
    }
    // if (filtro2 != "" && filtro2 != null){
    //     where += " AND fecha = ?"
    //     params.push(filtro2)
    // }
    // if (filtro3 != "" && filtro3 != null){
    //         where += " AND localidad = ?"
    //     params.push(filtro3)
    // }
    let sql = "SELECT * FROM IRATEAMS.evento " + where + orderBy

    connection.query(sql, params, function(err, result)
    {
        if(err){
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        }
        else{
            if (result.length === 0) {
                respuesta = {error:false,msg:"Error al obtener datos del filtro", resultado:result}
                response.status(200).send(respuesta);
            } else {
                respuesta = {error:false,msg:"filtro realizado", resultado:result}
                response.status(200).send(respuesta);
            }
        }
    });
    
})

// HOME
app.get("/home", function(request, response){
    let id_usuario = request.query.id_usuario;
    let params = [id_usuario]
    let sql = "SELECT * FROM IRATEAMS.evento WHERE fecha >= CURDATE() ORDER BY DATE_FORMAT(fecha, '%Y-%m-%d %T') ASC"
    connection.query(sql,params,function(err, result1)
        {
            if(err){
                console.error(err);
                respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
                response.status(500).send(respuesta);
            }
            else{
                if (result1.length == 0) {
                    respuesta = {error:false,msg:"No hay eventos", resultado1:result1}
                    response.status(200).send(respuesta);
                } else {
                    let sql2 = "SELECT * FROM IRATEAMS.guardados WHERE id_usuario = ?"
                    connection.query(sql2,params,function(err, result2)
                    {
                        if(err){
                            console.error(err);
                            respuesta = {error:true,msg:"Error get guardados", resultado:err};
                            response.status(500).send(respuesta);
                        }
                        else{
                            if (result2.length == 0) {
                                respuesta = {error:false,msg:"No hay eventos guardados", resultado:result1}
                                response.status(200).send(respuesta);
                            } else {
                                result1.forEach((element1) =>
                                {
                                    element1.guardado = result2.some((element2) => element1.id_evento == element2.id_evento )
                                })
                                respuesta = {error:false,msg:"guardados obtenido", resultado:result1}
                                response.status(200).send(respuesta);
                            }
                        }
                    });
                }
            }
        });
  })


// POST APUNTARSE A EVENTO 


app.post("/apuntarme", function(request, response){

    // post apuntado, get nPersSolicitadas Evento, Put Evento (nPErsSOlicitadas -1)
    console.log("Entra al post")

    let respuesta;
    console.log(request.body)

    let id_usuario= request.body.id_usuario;
    let id_evento= request.body.id_evento;

    let params = [id_usuario, id_evento]

    let sql = `INSERT INTO IRATEAMS.apuntados(id_usuario, id_evento) VALUES(?, ?)`
    // let sql = `SELECT nPersSolicitadas, id_evento FROM IRATEAMS.evento WHERE fecha >= CURDATE() ORDER BY DATE_FORMAT(fecha, '%d-%m-%Y %T') ASC`

    connection.query(sql, params, function(err, result1)
    {
        if(err)
        {
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        }
        else{
            // if (result.length == 0) {
            //     respuesta = {error:false,msg:"Error al obtener apuntados", resultado:result}
            //     response.status(200).send(respuesta);
            // } else {
            //     respuesta = {error:false,msg:" get Apuntado/s", resultado:result}
            //     response.status(200).send(respuesta);
            // }
            // console.log(result1)
            respuesta = {error:false, msg:"get npersSolicitatdas New apuntado", resultado:result1}
            response.status(200).send(respuesta);

            console.log("get PersSolicitadas Evento");
            let id2 = id_usuario;
           
            sql2 = "SELECT nPersSolicitadas, id_creador FROM IRATEAMS.evento  WHERE id_evento ="+id2

            connection.query(sql2, function(err, result2)
            {
                if(err)
                {
                    console.error(err);
                    respuesta = {error:true,msg:"Error get nPersSolicitadas Evento", resultado:err};
                    response.status(500).send(respuesta);
                }
                else{
                    console.log(result1)
                    respuesta = {error:false, msg:"Get nPersSolicitadas evento", resultado:result2}
                    response.status(200).send(respuesta);

                    console.log("Entra put nPersSolicitadas (n-1) evento");
                    console.log(result2);
                    
            //         let nPersSolicitadas = result2.nPersSolicitadas-1
                    
            //         let params = [ nPersSolicitadas ]
                    
            //         let sql3 = "UPDATE evento SET  nPersSolicitadas = ? WHERE id_evento="+id_evento
                          
            //         connection.query(sql3, params, function(err,result3){
                
            //             if(err)
            //             {
            //                 console.error(err);
            //                 respuesta = {error:true,msg:"Error en put nPersSolicitadas Evento -1", resultado:err};
            //                 response.status(500).send(respuesta);
            //             }
            //             else{
                                
            //                 console.log(result)
            //                 respuesta = {error:false, msg:"Evento modificado", resultado:result3}
            //                 response.status(200).send(respuesta);
                            
        //                     console.log("entra a POST crear chat usuario-creador evento")

                            
        //                     sql4 = `SELECT * FROM IRATEAMS.chat WHERE (id_user1 = ${id_usuario} AND id_user2 = ${result2.id_creador}) OR (id_user2 = ${result2.id_creador} AND id_user1 = ${id_usuario})`;
        
        //                     connection.query(sql4, function (err, result4) {
        //                         if (err) {

        //                             console.log(err);
        //                             respuesta = { err: true, msg: "Error al Post crear chat usuario-creador", resultado: err }
        //                             response.status(500).send(respuesta);

        //                         } else {
        //                             if (result4 == "") {
        //                                 sql5 = `INSERT INTO IRATEAMS.chat (id_user1, id_user2)
        //                                         VALUES ('${id_usuario}', '${result2.id_creador}')`;

        //                                 connection.query(sql5, function (err, result5) {
        //                                     if (err) {
        //                                         console.log(err);
        //                                         respuesta = { err: true, msg: "Error get chat usuario - creador evento", resultado: err }
        //                                         response.status(500).send(respuesta);
        //                                     } else {
        //                                         respuesta = {error:false, msg:"Chat usuario - creador Evento creado correctamente", resultado:result5}
        //                                         let id_chat = result5.id_chat
        //                                         response.status(200).send(respuesta);
        //                                     }
        //                                 })
        //                             } else if (result4 != "") {
        //                                 respuesta = {error:false, msg:"El chat  usuario - creador Evento ya está creado", resultado:result4}
        //                                 let id_chat = result4[0].id_chat
        //                                 response.status(200).send(respuesta);
        //                             }
                                    
        //                             let mensaje = "Se ha añadido a tu evento"
        //                             let fecha = Date.now()

        //                             // let params = [
        //                             //     id_chat,
        //                             //     id_usuario,
        //                             //     mensaje,
        //                             //     fecha
        //                             // ]
                                    

        //                             sql6 = `INSERT INTO mensajes (id_chat, id_emisor, mensaje, fecha)
        //                             VALUES ('${id_chat}', '${id_usuario}', '${mensaje}', '${fecha}')`;
                                
        //                                 connection.query(sql6, function (err, result6) {
        //                                     if (err) {
        //                                         console.log(err);
        //                                         respuesta = { err: true, msg: "Error al mandar mensaje/notificacion de unirse", resultado: err }
        //                                         response.status(500).send(respuesta);
        //                                     } else {
        //                                         respuesta = { error: false, msg: "Mensaje confirmacion apuntado a tu evento creado", resultado: result }
        //                                         response.status(200).send(respuesta);
        //                                     }
        //                                 })




        //                         }
        //                     })

                        
    //                     }
    //                 })
    //                 console.log("salida put evento")
                
                }
            })
        }
    })
    console.log("salida post apuntados")


    // let id_usuario = request.query.id_usuario;
    // let params = [id_usuario]
    // let sql = "SELECT * FROM IRATEAMS.evento WHERE fecha >= CURDATE() ORDER BY DATE_FORMAT(fecha, '%d-%m-%Y %T') ASC"
    // connection.query(sql,params,function(err, result1)
    //     {
    //         if(err){
    //             console.error(err);
    //             respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
    //             response.status(500).send(respuesta);
    //         }
    //         else{
    //             if (result1.length == 0) {
    //                 respuesta = {error:false,msg:"No hay eventos", resultado1:result1}
    //                 response.status(404).send(respuesta);
    //             } else {
    //                 let sql2 = "SELECT * FROM IRATEAMS.guardados WHERE id_usuario = ?"
    //                 connection.query(sql2,params,function(err, result2)
    //                 {
    //                     if(err){
    //                         console.error(err);
    //                         respuesta = {error:true,msg:"Error get guardados", resultado:err};
    //                         response.status(500).send(respuesta);
    //                     }
    //                     else{
    //                         if (result2.length == 0) {
    //                             respuesta = {error:false,msg:"No hay eventos guardados", resultado:result1}
    //                             response.status(404).send(respuesta);
    //                         } else {
    //                             result1.forEach((element1) =>
    //                             {
    //                                 let value = result2.some((element2) => element1.id_evento == element2.id_evento )
    //                                 if (value)
    //                                     element1.guardado = value
    //                             })
    //                             respuesta = {error:false,msg:"guardados obtenido", resultado:result1}
    //                             response.status(200).send(respuesta);
    //                         }
    //                     }
    //                 });
    //             }
    //         }
    //     });
  })


// ENDPOINTS APUNTADOS

// GET apuntados
// app.get("/apuntados", function(request, response)
// {
//     let id = request.query.id_evento;
//     let params =[id];
//     let sql;
//     if(request.query.id == null){
//         sql = "SELECT * FROM IRATEAMS.apuntados"
//     }
//     else {
//         sql = "SELECT * FROM IRATEAMS.apuntados WHERE id_evento=?" 
//     }

//     connection.query(sql, params, function(err, result)
//     {
//         if(err){
//             console.error(err);
//             respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
//             response.status(500).send(respuesta);
//         }
//         else{
//             if (result.length == 0) {
//                 respuesta = {error:false,msg:"Error al obtener apuntados", resultado:result}
//                 response.status(204).send(respuesta);
//             } else {
//                 respuesta = {error:false,msg:" get Apuntado/s", resultado:result}
//                 response.status(200).send(respuesta);
//             }
//         }
//     });
// });

// GET Apuntados 

app.get("/apuntados", function(request, response)
{
    let id_evento = request.query.id_evento;
    let arrayApuntados = []
    
    let sql;
    if(request.query.id_evento == null){
        sql = "SELECT * FROM IRATEAMS.apuntados"
    }
    else {
        url = "/apuntados?id="+request.query.id_evento
        sql = "SELECT * FROM IRATEAMS.apuntados WHERE id_evento="+id_evento
    }

    connection.query(sql, function(err, result)
    {
        if(err){
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        }
        else{

            console.log(result)
            for(let i = 0; i < result.length; i++)
            {
                arrayApuntados.push(result[i].id_usuario)
            }
            console.log(arrayApuntados)
            respuesta = {error:false,msg:" get Apuntado/s", resultado:arrayApuntados}
            response.status(200).send(respuesta);

            // if (result.length == 0) {
            //     respuesta = {error:false,msg:"Error al obtener apuntados", resultado:result}
            //     response.status(200).send(respuesta);
            // } else {
            //     console.log(result)
            //     respuesta = {error:false,msg:" get Apuntado/s", resultado:result}
            //     response.status(200).send(respuesta);
            // }
            
        }
    });
});



// POST apuntados

app.post("/apuntados", function(request, response)
{
    console.log("Entra al post")

    let respuesta;
    console.log(request.body)

    let evento = { id_usuario: request.body.id_usuario,
                    id_evento: request.body.id_evento,
    }


    let sql = `INSERT INTO IRATEAMS.apuntados(id_usuario, id_evento) 
                VALUES(${request.body.id_usuario}, ${request.body.id_evento})`


    // let sql = `INSERT INTO evento( localidad, descripcion, material, pago ) 
    // VALUES(\"${request.body.deporte}\", \"${request.body.titulo}\")`

    connection.query(sql, function(err,result)
    {
        if(err)
        {
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        }
        else{
            console.log(result)
            respuesta = {error:false, msg:"apuntados creado", resultado:result}
            response.status(200).send(respuesta);
            
        }
    })
    console.log("salida post apuntados")

    
})

// DELETE apuntados
app.delete("/apuntados", function(request, response)
{
    

    // let id_evento = request.body.id_evento;
    // let id_evento = request.body.id_evento;

    let respuesta;

    let sql2 = `DELETE FROM IRATEAMS.apuntados WHERE id_evento= ${request.body.id_evento} AND id_usuario =  ${request.body.id_usuario}`

    connection.query(sql2, function(err,result){

        if(err){
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        }
        else{
                console.log("Apuntado eliminado")
                console.log(result)
                respuesta = {error:false, msg:"Apuntado eliminado", resultado:result}
                response.status(500).send(respuesta);
               
                
        }
    })
    console.log("funcionando")


})



///////   CHAT GENERAL   ///////

app.get("/chats",
    function (request, response) {
        url = "/chats?id=" + request.query.id;
        sql = `SELECT id_chat, username, nombreCompleto, urlFoto
        FROM chat INNER JOIN usuario ON chat.id_user1 = usuario.id_usuario OR chat.id_user2 =usuario.id_usuario
        WHERE id_usuario NOT LIKE ${request.query.id} 
        AND (id_user1 = ${request.query.id} OR id_user2 = ${request.query.id})`;
        

        connection.query(sql, function (err, result) {
            if (err) {
                console.log(err);
                respuesta = { err: true, msg: "Error al conectar con la base de datos", resultado: err }
                response.status(500).send(respuesta);
            } else {
                respuesta = { error: false, msg: "Se han encontrado los chats", resultado: result }
                response.status(200).send(respuesta);
            }
        })
    })

app.post("/chats",
    function (request, response) {
        

        sql = `SELECT * FROM IRATEAMS.chat WHERE (id_user1 = ${request.body.id_user1} AND id_user2 = ${request.body.id_user2}) OR (id_user2 = ${request.body.id_user2} AND id_user1 = ${request.body.id_user1})`;
        
        connection.query(sql, function (err, result) {
            if (err) {
                console.log(err);
                respuesta = { err: true, msg: "Error al conectar con la base de datos", resultado: err }
                response.status(500).send(respuesta);
            } else {
                if (result == "") {
                    
                    sql = `INSERT INTO IRATEAMS.chat (id_user1, id_user2)
                VALUES ('${request.body.id_user1}', '${request.body.id_user2}')`;

                    connection.query(sql, function (err, result) {
                        if (err) {
                            console.log(err);
                            respuesta = { err: true, msg: "Error al conectar con la base de datos", resultado: err }
                            response.status(500).send(respuesta);
                        } else {
                            respuesta = {error:false, msg:"Chat creado correctamente", resultado:result}
                            response.status(200).send(respuesta);
                        }
                    })
                } else if (result != "") {
                    respuesta = {error:false, msg:"El chat ya está creado", resultado:result}
                    response.status(200).send(respuesta);
                }
            }
        })
    })

app.delete("/chats",
    function (request, response) {
        sql = `DELETE FROM chat WHERE id_chat=${request.body.id}`
        connection.query(sql, function (err, result) {
            if (err) {
                console.log(err);
                respuesta = { err: true, msg: "Error al conectar con la base de datos", resultado: err }
                response.status(500).send(respuesta);
            } else {
                respuesta = {error:false, msg:"Chat eliminado correctamente", resultado:result}
                response.status(200).send(respuesta);
            }
        })
    })

///////   CHAT INDIVIDUAL   ///////

app.get("/mensajes",
    function (request, response) {
        url = "/mensajes?id=" + request.query.id;
        sql = `SELECT * FROM mensajes WHERE id_chat = ${request.query.id}`;
           connection.query(sql, function (err, result) {
            if (err) {
                console.log(err);
                respuesta = { err: true, msg: "Error al conectar con la base de datos", resultado: err }
                response.status(500).send(respuesta);
            } else {
                respuesta = { error: false, msg: "Se han encontrado los mensajes", resultado: result }
                response.status(200).send(respuesta);
            }
        })
    })

app.post("/mensajes",
    function (request, response) {

        sql = `INSERT INTO mensajes (id_chat, id_emisor, mensaje, fecha)
    VALUES ('${request.body.id_chat}', '${request.body.id_emisor}', '${request.body.mensaje}', '${request.body.fecha}')`;

        connection.query(sql, function (err, result) {
            if (err) {
                console.log(err);
                respuesta = { err: true, msg: "Error al conectar con la base de datos", resultado: err }
                response.status(500).send(respuesta);
            } else {
                respuesta = { error: false, msg: "Mensaje creado mensajes", resultado: result }
                response.status(200).send(respuesta);
            }
        })
    })

// app.delete("/mensajes/:id",
// function(request, response)
// {
//     sql = `DELETE FROM IRATEAMS.mensajes WHERE id_mensaje=${request.params.id}`;

//     connection.query(sql, function(err, result)
//     {
//         if(err){
//             console.log(err);
//         } else {
//             response.send(result);
//         }
//     })
// })

function sendNewPassword(mail){
    const tempPassword  = 'irateams'+ Math.round(Math.random() * (9999 - 1000) + 1000);
    const tempPWD       = Encrypt(tempPassword);
    const paramsUpdate  = [tempPWD,mail];
    const sqlUpdate     = 'UPDATE usuario SET password = ?  where mail = ?';
    let respuesta;

    connection.query(sqlUpdate,paramsUpdate,(err,updateRes)=>{
        if (err){
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        } else {
            mailer.forgotPasswordMail(mail, tempPassword, (err, data) => {
                if (err) {
                  return console.error(err);
                }
                console.log(data)  
              });
        }
    });
}

app.post("/recPass", function(request, response)
{
    const mail    = request.body.mail;
    const params  = [mail];
    let respuesta;

    const sql= "SELECT * FROM usuario WHERE mail = ?"
    connection.query(sql, params, function(err, result)    {
        if(err){
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        }
        else{
            if (result.length == 0) {
                respuesta = {error:false,msg:"El correo introducido no se encuentra en nuestro sistema", resultado:result}
                response.status(200).send(respuesta);
            } else {
                sendNewPassword(mail);
                respuesta = {error:false,msg:"Se ha enviado un correo con la contraseña"}
                response.status(200).send(respuesta)
            }
        }
    });                  
});

app.post('/soporte', function(request,response) {
    const mail = request.body.mail;
    const question = request.body.question;

    mailer.supportTicket(mail,question, (err,data)=>{
        if (err){
            response.status(200).send({error:true,msg:'Error al crear la solicitud de soporte'})
        } else {
            response.status(200).send({error:false,msg:'Se ha creado una solicitud de soporte'})
        }
    }); 
});
app.listen(port)

const express = require("express");
const app = express();
const cors = require('cors');
const mysql = require('mysql2');
const crypto     = require('crypto');
const jwt        = require('jsonwebtoken');

let port = process.env.PORT || 3000;


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
    const encryptpassword   = Encrypt(req.body.password);
    const password          = req.body.password;
    const params            = [user,user,password,encryptpassword]
    const query             = `SELECT id_usuario from usuario WHERE (username = ? || mail = ?) and (password = ? or password = ?)`;
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
            const token = generateAccessToken(results[0].id_usuario);
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
            res.status(404).send(response);
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
                response.status(404).send(respuesta);
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
    let username =request.body.username;
    let mail =request.body.mail;
    let password= request.body.password;

    let params=[username, mail, password]

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
                response.status(404).send(respuesta);
            } else {
                respuesta = {error:false,msg:"Usuario creado", resultado:result}
                response.status(200).send(respuesta);
            }
        }
    });                  
});

// Para modficicar datos del usuario
app.put("/usuarios", function(request, response)
{
    console.log(request.body);
    
    let password= request.body.password;
    let nombreCompleto= request.body.nombreCompleto;
    let fechaNacimiento= request.body.fechaNacimiento;
    let telefono= request.body.telefono;
    let urlFoto= request.body.urlFoto;
    let username = request.body.username;
    let mail = request.body.mail

    let id = request.body.id_usuario

    let params=[username,mail, password, nombreCompleto, fechaNacimiento, telefono, urlFoto, id]

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
                response.status(404).send(respuesta);
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
    let id = request.body.id_usuario
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
                response.status(404).send(respuesta);
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

    let sql = "SELECT ev.id_evento, titulo, fecha, direccion, localidad FROM IRATEAMS.evento AS ev JOIN apuntados AS ap ON (ev.id_evento = ap.id_evento) JOIN usuario AS us ON (ap.id_usuario = us.id_usuario) WHERE us.id_usuario = ? AND  fecha < CURDATE();" 

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
                response.status(404).send(respuesta);
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

    let sql = "SELECT ev.id_evento, titulo, fecha, direccion, localidad FROM IRATEAMS.evento AS ev JOIN apuntados AS ap ON (ev.id_evento = ap.id_evento) JOIN usuario AS us ON (ap.id_usuario = us.id_usuario) WHERE us.id_usuario = ? AND  fecha >= CURDATE();" 

    connection.query(sql,params,function(err, result)
    {
        if(err){
            console.error(err);
            respuesta = {error:true,msg:"Error al conectar con la base de datos", resultado:err};
            response.status(500).send(respuesta);
        }
        else{
            if (result.length == 0) {
                respuesta = {error:false,msg:"Error al obtener p´roximos eventos", resultado:result}
                response.status(404).send(respuesta);
            } else {
                respuesta = {error:false,msg:"Próximos eventos", resultado:result}
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
        sql = "SELECT * FROM IRATEAMS.evento JOIN IRATEAMS.usuario ON (evento.id_creador = usuario.id_usuario) ORDER BY DATE_FORMAT(fecha, '%d-%m-%Y %T') ASC;"
        
    }else
    {
        console.log("get evento");
        url = "/eventos?id="+request.query.id
        sql = "SELECT * FROM IRATEAMS.evento JOIN IRATEAMS.usuario ON (evento.id_creador = usuario.id_usuario) WHERE id_evento ="+id
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
//                 response.status(404).send(respuesta);
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

    let evento = { deporte: request.body.deporte,
                    titulo: request.body.titulo,
                    id_creador: request.body.id_creador,
                    nPersSolicitadas: request.body.nPersSolicitadas,
                    fecha: request.body.fecha,
                    direccion: request.body.direccion,
                    localidad: request.body.localidad,
                    descripcion: request.body.descripcion,
                    material: request.body.material,
                    pago: request.body.pago,
                    urlFotoEvento: request.body.urlFotoEvento

    }




    let sql = `INSERT INTO evento(deporte, titulo, id_creador, nPersSolicitadas, fecha, direccion, localidad, descripcion, material, pago, urlFotoEvento) 
                VALUES(\"${request.body.deporte}\", \"${request.body.titulo}\", \"${request.body.id_creador}\", \"${request.body.nPersSolicitadas}\", \"${request.body.fecha}\", \"${request.body.direccion}\", \"${request.body.localidad}\", \"${request.body.descripcion}\", \"${request.body.material}\", \"${request.body.pago}\", \"${request.body.urlFotoEvento}\")`

    connection.query(sql, function(err,result)
    {
        if(err)
        {
            console.log("error post evento");
            console.log(err)
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
            console.log("Error put evento");
            console.log(err)
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
                console.log(err)
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
    let where = ""
    let filtro1 = request.query.filtro1
    let filtro2 = request.query.filtro2
    let filtro3 = request.query.filtro3
    let params = []
    
    
    if (filtro1 != ""&& filtro1 != null){
        if(where === ""){
            where = " WHERE deporte =  ?"
        } else{
            where = ""
        }
            // console.log(filtro1)
        params.push(filtro1);
    }
    if (filtro2 != "" && filtro2 != null){
        if (where === ""){
            where = " WHERE fecha = ?"
        } else {
            where += " AND fecha = ?"
        }
        params.push(filtro2)
    }
    if (filtro3 != "" && filtro3 != null){
        if (where === ""){
            where = " WHERE localidad = ?"
        } else {
            where += " AND localidad = ?"
        }
        params.push(filtro3)
    }
    let sql = "SELECT * FROM IRATEAMS.evento" + where 

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
                response.status(404).send(respuesta);
            } else {
                respuesta = {error:false,msg:"filtro realizado", resultado:result}
                response.status(200).send(respuesta);
            }
        }
    });
    
})




// ENDPOINTS APUNTADOS

// GET apuntados
app.get("/apuntados", function(request, response)
{
    let id = request.query.id;
    let params =[id];
    let sql;
    if(request.query.id == null){
        sql = "SELECT * FROM IRATEAMS.apuntados"
    }
    else {
        sql = "SELECT * FROM IRATEAMS.apuntados WHERE id_evento=?" 
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
                respuesta = {error:false,msg:"Error al obtener apuntados", resultado:result}
                response.status(404).send(respuesta);
            } else {
                respuesta = {error:false,msg:" get Apuntado/s", resultado:result}
                response.status(200).send(respuesta);
            }
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
            console.log("error post apuntados");
            console.log(err)
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
    

    // let id_usuario = request.body.id_usuario;
    // let id_evento = request.body.id_evento;

    let respuesta;

    let sql2 = `DELETE FROM IRATEAMS.apuntados WHERE id_evento= ${request.body.id_evento} AND id_usuario=  ${request.body.id_usuario}`

    connection.query(sql2, function(err,result){

        if(err){
                console.log(err)
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

app.post("/chat",
    function (request, response) {
        sql = `SELECT * FROM IRATEAMS.chat WHERE (id_user1 = ${request.body.id1} AND id_user2 = ${request.body.id2}) OR (id_user2 = ${request.body.id2} AND id_user1 = ${request.body.id1})`;
        
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

app.delete("/chat",
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




app.listen(port)

const nodemailer = require('nodemailer');
const welcomeTemplate = require('./welcomeTemplate.js');
const forgotPasswordTemplate = require('./forgotPasswordTemplate.js')


const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth   : {
    user: 'irateams.app@gmail.com',
    pass: 'Irateams2021'
  }
});

function welcomeMail (email, callback) {
  const text = welcomeTemplate();
  mailTransporter.sendMail({
    from   : 'irateams.app@gmail.com',
    to     : email,
    subject: 'Bienvenido a IRATEAMS',
    html   : text
  }, callback);
}

function forgotPasswordMail (email, newPassword, callback) {
  const text = forgotPasswordTemplate(newPassword);
  mailTransporter.sendMail({
    from   : 'irateams.app@gmail.com',
    to     : email,
    subject: 'Nueva clave de acceso a IRATEAMS',
    html   : text
  }, callback);
}

function supportTicket (email, question, callback){
  const text = `
    <div>
      <h1>Solicitud de ticket de soporte de ${email}</h1>
      <h2>Comentario:</h2>
      <p>${question}</p>
    </div>
  `;
  mailTransporter.sendMail({
    from : 'irateams.app@gmail.com',
    to: 'irateams.app@gmail.com',
    subject : 'Nuevo ticket de consulta' + Math.round(Math.random(1,99999)+1),
    html: text
  }, callback);
}
module.exports = {
  supportTicket,
  forgotPasswordMail,
  welcomeMail
}
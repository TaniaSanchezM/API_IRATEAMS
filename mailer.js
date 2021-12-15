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

module.exports = {
  forgotPasswordMail,
  welcomeMail
}
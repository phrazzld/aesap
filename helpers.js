// helpers.js

var config = require('./config')
var twilioClient = require('twilio')(
  config.twilioSid, config.twilioAuthToken
)

// Twilio integration
function sendSMS (message, number) {
  if (Array.isArray(number)) {
    for (var i = 0; i < number.length; i++) {
      console.log("yoyoyo");
      twilioClient.messages.create({
        body: message,
        to: '+1' + number[i],
        from: '+1' + config.twilioPhone
      })
    }
  } else {
    twilioClient.messages.create({
      body: message,
      to: '+1' + number,
      from: '+1' + config.twilioPhone
    })
  }
}

module.exports = {
  sendSMS: sendSMS
}

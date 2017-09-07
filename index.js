// modules
var express = require('express')
var app = express()
var sanitizer = require('express-sanitizer')
var bodyParser = require('body-parser')
var config = require('./config')
var request = require('request')
var twilio = require('twilio')
var twilioClient = new twilio(config.twilioSid, config.twilioAuthToken)
var asap = require('./asap')
var slack = require('./slack')
var jira = require('./jira')

// middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(sanitizer())

// router
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials')
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
})

// Twilio integration
function sendSMS (message, number) {
  if (Array.isArray(number)) {
    for (var i = 0; i < number.length; i++) {
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

// Define response object for API.AI webhook
function defineResponse (intent, speech, params) {
  var response
  return new Promise(function (resolve, reject) {
    if (intent === 'Gif') {
      console.log('We got a gif!')
      sendGif('doh!', 'Homer Simpson')
        .then(function (gifBlob) {
          response = gifBlob
          resolve(response)
        })
        .catch(function (reason) {
          console.log('Promise rejected in sendGif call in defineResponse')
          console.error(reason)
          reject(reason)
        })
    } else if (intent === 'org info') {
      console.log('Fetching org info')
      // Fetch org info from ASAP API using orgId parameter
      var orgId = params['orgId']
      asap.fetchOrgInfo(orgId)
        .then(function (result) {
          console.log('Successfully fetched org info from ASAP API')
          response = result
          resolve(response)
        })
        .catch(function (reason) {
          console.log('Promise rejected in asapFetchOrgInfo')
          console.error(reason)
          reject(reason)
        })
    } else {
      response = {
        speech: speech
      }
      resolve(response)
    }
  })
}

// ==========================================================
// Webhooks
// ==========================================================
app.post('/handler', function (req, res) {
  console.log('Hitting API.AI webhook')
  var intent = req.body.result.metadata.intentName
  var speech = req.body.result.fulfillment.speech
  var params = req.body.result.parameters
  defineResponse(intent, speech, params)
    .then(function (result) {
      console.log('Successfully defined response')
      console.log(JSON.stringify(result, null, 2))
      res.send(result)
    })
    .catch(function (reason) {
      console.log('Promise rejected in defineResponse')
      console.error(reason)
    })
})

app.post('/jira', function (req, res) {
  console.log('Hitting JIRA webhook')
  var blob = jira.chunkRequest(req.body)
  jira.handleBlocker(blob)
  jira.handleDeploy(blob)
  res.send('Success')
})

app.listen(config.port, function (req, res) {
  console.log('Port ' + config.port + ': "Whirrr..."')
})

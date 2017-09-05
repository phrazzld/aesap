// modules
var express = require('express')
var app = express()
var sanitizer = require('express-sanitizer')
var bodyParser = require('body-parser')
var config = require('./config')
var request = require('request')
var WebClient = require('@slack/client').WebClient
var twilio = require("twilio")
var twilioClient = new twilio(config.twilioSid, config.twilioAuthToken)

// middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(sanitizer())

// testing
// botlab = C6B8SQWT0
// group-blockers = C4J7N1MEC

var token = config.slackOAuth || ''
var web = new WebClient(token)

// functions
var colors = ['#EB4D5C', '#007AB8', '#000', '#4D394B', '#FAD529', '#298FC3']

var sendGif = function (pretext, imageUrl, text) {
  pretext = pretext || ''
  text = text || ''
  var color = colors[Math.floor(Math.random() * colors.length)]
  return {
    data: {
      slack: {
        attachments: [
          {
            fallback: 'gif gif gif',
            color: color,
            pretext: pretext,
            imageUrl: imageUrl,
            text: text
          }
        ]
      }
    }
  }
}

function findChannel(channelName){
  var apiUrl='http://slack.com/api/channels.list?token='+token
  console.log("finding channel names... ")
  request(apiUrl,function(err,res,body){
    console.log("Error:", err)
    console.log("Response:", res && res.statusCode)
    return filterChannels(channelName, body)
  })
}

function filterChannels(channelName, body){
  body=JSON.parse(body)
  for(var i=0;i < body.channels.length;i++){
    if(body.channels[i].name===channelName){
      return body.channels[i].id
    }
  }
}

console.log(findChannel("botlab"))

// Twilio integration
function sendSMS(message, number){
  twilioClient.messages.create({
    body: message,
    to: "+1"+number,
    from: "+14152149232"
  })
  .then((message)=>
    console.log(message.sid)
  )
}

// router
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials')
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
})

app.post('/jira', function (req, res) {
  var priority = req.body.issue.fields.priority.name || ''
  console.log('Hitting JIRA webhook')
  console.log('req.body')
  console.log(JSON.stringify(req.body, null, 2))
  console.log('\n Priority: ')
  console.log(priority)
  console.log('\n Info: ')
  console.log(req.body.issue.key)
  console.log(req.body.user.displayName)
  findChannel("yo")

  if (priority === 'Blocker') {
    var event_type = req.body.issue_event_type_name
    if (event_type === 'issue_created') {
      // if the blocker is new, post it to the group-blockers channel
      web.chat.postMessage('C6B8SQWT0', 'Blocker Found (https://asapconnected.atlassian.net/browse/' + req.body.issue.key + ') ')
      setTimeout(function () { web.chat.postMessage('C6B8SQWT0', "'" + req.body.issue.fields.summary + "' - " + req.body.user.displayName) }, 2500)
    } else if (event_type === 'issue_updated') {
      // if an event was updated, check whether or not it was updated to a blocker status
      var items = req.body.changelog.items
      for(i=0;i<items.length;i++){
        if(items[i].toString === "Blocker"){
          web.chat.postMessage('C6B8SQWT0', 'Blocker Found (https://asapconnected.atlassian.net/browse/' + req.body.issue.key + ') ')
          setTimeout(function () { web.chat.postMessage('C6B8SQWT0', "'" + req.body.issue.fields.summary + "' - " + req.body.user.displayName) }, 2500)
        }
      }
    }
  }
  
  res.send('Success')
})

app.post('/handler', function (req, res) {
  console.log('Hitting API.AI webhook')
  // console.log("req.body")
  // console.log(req.body)

  var original = req.body.originalRequest

  console.log('stringified original slack request')
  console.log(JSON.stringify(original))

  var intent = req.body.result.metadata.intentName
  var response

  if (original.data.event.attachments) {
    if (original.data.event.attachments[0].fields[0].value === 'Blocker') {
      console.log('blocker found')
      response = {
        data: {
          slack: {
            text: '*Blocker Found*',
            attachments: original.data.event.attachments
          }
        }
      }
    } else {
      response = {speech: 'Attachment Found'}
    }
  } else {
    if (intent === 'Gif') {
      console.log('issa jif?')
      response = sendGif(
        'doh!',
        'http://media3.giphy.com/media/kEKcOWl8RMLde/giphy.gif'
      )
    } else {
      response = { speech: req.body.result.fulfillment.speech }
    }
  }

  res.send(response)
})

app.listen(config.port, function (req, res) {
  console.log('Port ' + config.port + ': "Whirrr..."')
})

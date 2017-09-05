// modules
var express = require('express')
var app = express()
var sanitizer = require('express-sanitizer')
var bodyParser = require('body-parser')
var config = require('./config')
var request = require('request')
var WebClient = require('@slack/client').WebClient
var twilio = require('twilio')
var twilioClient = new twilio(config.twilioSid, config.twilioAuthToken)

// middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(sanitizer())

var token = config.slackOAuth || ''
var web = new WebClient(token)

// functions
var colors = ['#EB4D5C', '#007AB8', '#000', '#4D394B', '#FAD529', '#298FC3']

// Get a random gif by tag
function fetchGif (tag) {
  return new Promise(function (resolve, reject) {
    var giphyUrl = 'https://api.giphy.com/v1/gifs/random?api_key='
    giphyUrl += config.giphyApiKey
    giphyUrl += '&tag=' + tag
    giphyUrl += '&rating=g'
    request(giphyUrl, function (err, res, body) {
      if (err) {
        console.log('Promise rejected finding a random gif')
        console.error(err)
        reject(err)
      } else {
        console.log('Successfully found gif')
        console.log(JSON.stringify(body, null, 2))
        resolve(body.url)
      }
    })
  })
}

// Testing
fetchGif('burrito')

function sendGif (pretext, imageUrl, text, tag) {
  pretext = pretext || ''
  text = text || ''
  var color = colors[Math.floor(Math.random() * colors.length)]
  return new Promise(function (resolve, reject) {
    fetchGif(tag)
      .then(function (gifUrl) {
        var response = {
          data: {
            slack: {
              attachments: [
                {
                  fallback: 'gif gif gif',
                  color: color,
                  pretext: pretext,
                  image_url: imageUrl,
                  text: text
                }
              ]
            }
          }
        }
        console.log(JSON.stringify(response, null, 2))
        resolve(response)
      })
      .catch(function (reason) {
        console.log('Promise rejected fetching gif with tag ' + tag)
        console.error(reason)
        reject(reason)
      })
  })
}

function findChannel (channelName) {
  var apiUrl = 'http://slack.com/api/channels.list?token=' + token
  console.log('finding channel names... ')
  return new Promise(function (resolve, reject) {
    request(apiUrl, function (err, res, body) {
      if (err) {
        console.log('Promise rejected finding channel names')
        console.error(err)
        reject(err)
      } else {
        var channelId = filterChannels(channelName, body)
        console.log('Found channelId: ' + channelId)
        resolve(channelId)
      }
    })
  })
}

function filterChannels (channelName, body) {
  console.log('-- filterChannels --')
  console.log('channelName: ' + channelName)
  body = JSON.parse(body)
  for (var i = 0; i < body.channels.length; i++) {
    if (body.channels[i].name === channelName) {
      return body.channels[i].id
    }
  }
}

// Twilio integration
function sendSMS(message, number){
  console.log(Array.isArray(number));
  if(Array.isArray(number) === true){
    for(var i =0; i < number.length; i++){
      twilioClient.messages.create({
        body: message,
        to: "+1"+number[i],
        from: "+14152149232"
      })
    }
  } else{
    twilioClient.messages.create({
      body: message,
      to: "+1"+number,
      from: "+14152149232"
    })
  }
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
  console.log('Hitting JIRA webhook')
  console.log(JSON.stringify(req.body, null, 2))
  var blob = chunkJiraRequest(req.body)
  handleBlockerIssue(blob)
  handleDeploys(blob)
  res.send('Success')
})

// Make JIRA request body more manageable
function chunkJiraRequest (body) {
  var blob = {
    priority: body.issue.fields.priority.name || 'No priority',
    changes: body.changelog || { 'items': [] },
    user: body.user.displayName || 'No user',
    summary: body.issue.fields.summary || 'No summary',
    key: body.issue.key || 'No issue key',
    eventType: body.issue_event_type_name || 'No event type'
  }
  return blob
}

// Check for blockers
function handleBlockerIssue (blob) {
  if (blob.priority === 'Blocker') {
    if (blob.eventType === 'issue_created') {
      postBlockerIssue(blob.user, blob.key, blob.summary)
    } else if (blob.eventType === 'issue_updated') {
      for (var i = 0; i < blob.changes.items.length; i++) {
        if (blob.changes.items[i].toString === 'Blocker') {
          postBlockerIssue(blob.user, blob.key, blob.summary)
          break
        }
      }
    }
  } else {
    console.log(blob.priority + ' is not a blocker')
  }
}

// Check for issues going live
function handleDeploys (blob) {
  for (var i = 0; i < blob.changes.items.length; i++) {
    if (blob.changes.items[i].field === 'status' &&
      blob.changes.items[i].toString === 'Live') {
      postDeployedIssue(blob.key, blob.summary)
    }
  }
}

// Post issues to #deployments as they go live
function postDeployedIssue (issueKey, summary) {
  findChannel('deployments')
    .then(function (channelId) {
      console.log('Found deployments channel, id: ' + channelId)
      web.chat.postMessage(channelId,
        '*' + issueKey + ' deployed*' + '\n' +
        summary
      )
    })
    .catch(function (reason) {
      console.log('Promise rejected finding channel deployments')
      console.error(reason)
    })
}

// Post blocker issue to #group-blockers
function postBlockerIssue (user, issueKey, summary) {
  findChannel('group-blockers')
    .then(function (channelId) {
      console.log('Found group-blockers channel, id: ' + channelId)
      // Found the channel, let's post to it
      web.chat.postMessage(channelId,
        '*' + user + ' found a blocker!*\n' +
        'https://asapconnected.atlassian.net/browse/' + issueKey + '\n' +
        '*Issue:* ' + summary + ' (' + issueKey + ')'
      )
    })
    .catch(function (reason) {
      console.log('Promise rejected finding channel group-blockers')
      console.error(reason)
    })
}

app.post('/handler', function (req, res) {
  console.log('Hitting API.AI webhook')
  var intent = req.body.result.metadata.intentName
  var response
  if (intent === 'Gif') {
    console.log('issa jif?')
    sendGif(
      'doh!',
      'http://media3.giphy.com/media/kEKcOWl8RMLde/giphy.gif',
      'Homer Simpson random gif, from Giphy',
      'homer simpson'
    )
      .then(function (gifBlob) {
        response = gifBlob
        res.send(response)
      })
      .catch(function (reason) {
        console.log('Promise rejected in /handler sendGif call')
        console.error(reason)
        res.send('Failure!')
      })
  } else {
    response = {
      speech: req.body.result.fulfillment.speech
    }
    res.send(response)
  }
})

app.listen(config.port, function (req, res) {
  console.log('Port ' + config.port + ': "Whirrr..."')
})

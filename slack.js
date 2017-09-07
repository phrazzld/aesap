// slack.js
// Working with the Slack API: posting to channels, etc.

var config = require('./config')
var request = require('request')
var WebClient = require('@slack/client').WebClient
var slackToken = config.slackOAuth
var slackClient = new WebClient(slackToken)

function findChannel (channelName) {
  var apiUrl = 'https://slack.com/api/channels.list?token=' + slackToken
  return new Promise(function (resolve, reject) {
    request(apiUrl, function (err, res, body) {
      if (err) {
        console.log('Error requesting channel names from Slack')
        console.error(err)
        reject(err)
      } else {
        var channelId = filterChannels(channelName, body)
        console.log(channelName + '\'s channelId: ' + channelId)
        resolve(channelId)
      }
    })
  })
}

function filterChannels (channelName, body) {
  body = JSON.parse(body)
  for (var i = 0; i < body.channels.length; i++) {
    if (body.channels[i].name === channelName) {
      return body.channels[i].id
    }
  }
}

module.exports = {
  client: slackClient,
  findChannel: findChannel,
  filterChannels: filterChannels
}

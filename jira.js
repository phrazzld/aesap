// jira.js
// Interacting with JIRA API, and plumbing it into Slack

var config = require('./config')
var slack = require('./slack')
var helpers = require('./helpers')
var jiraBaseUrl = 'https://asapconnected.atlassian.net/browse/'

function handleBlocker (blob) {
  if (blob.priority === 'Blocker') {
    if (blob.eventType === 'issue_created') {
      postBlockerIssue(blob.user, blob.key, blob.summary)
      console.log("Blocker Issue Found")
      helpers.sendSMS("yoyoyo","4154056035")
    } else if (blob.eventType === 'issue_updated') {
      for (var i = 0; i < blob.changes.items.length; i++) {
        // * Don't run standard cleanup on this! *
        // it removes the toString attribute
        if (blob.changes.items[i].toString === 'Blocker' && blob.changes.items[i].field === "priority") {
          postBlockerIssue(blob.user, blob.key, blob.summary)
          console.log("Issue Changed to Blocker")
          helpers.sendSMS("yoyoyo","4154056035")
          break
        }
      }
    }
  } else {
    console.log(blob.priority + ' is not a blocker');
  }
}

function handleDeploy (blob) {
  for (var i = 0; i < blob.changes.items.length; i++) {
    if (blob.changes.items[i].field === 'status' &&
      blob.changes.items[i].toString === 'Live') {
      postDeployedIssue(blob.key, blob.summary)
    }
  }
}

function postDeployedIssue (issueKey, summary) {
  slack.findChannel('deployments')
    .then(function (channelId) {
      slack.client.chat.postMessage(channelId,
        issueKey + " deployed \n" +
        '*' + summary + ' *\n' +
        jiraBaseUrl + issueKey + "\n"
      )
    })
    .catch(function (reason) {
      console.log('Promise rejected finding channel #deployments')
      console.error(reason)
    })
}

function postBlockerIssue (user, issueKey, summary) {
  slack.findChannel('group-blockers')
    .then(function (channelId) {
      slack.client.chat.postMessage(channelId,
        '*' + user + ' found a blocker!*\n' +
        jiraBaseUrl + issueKey + '\n' +
        '*Issue:* ' + summary + ' (' + issueKey + ')'
      )
    })
    .catch(function (reason) {
      console.log('Promise rejected finding channel #group-blockers')
      console.error(reason)
    })
  helpers.sendSMS('yo, blocker issue made (' + issueKey + '): "' + summary + '" \n https://asapconnected.atlassian.net/browse/' + issueKey)
}

function chunkRequest (body) {
  var backupIssue = {
    fields: {
      summary: null,
      priority: { name: null }
    }
  }
  var backupUser = {
    displayName: null
  }
  body.issue = body.issue || backupIssue
  body.user = body.user || backupUser
  var blob = {
    priority: body.issue.fields.priority.name,
    changes: body.changelog || { items: [] },
    user: body.user.displayName,
    summary: body.issue.fields.summary,
    key: body.issue.key,
    eventType: body.issue_event_type_name
  }
  return blob
}

module.exports = {
  handleBlocker: handleBlocker,
  handleDeploy: handleDeploy,
  postDeployedIssue: postDeployedIssue,
  postBlockerIssue: postBlockerIssue,
  chunkRequest: chunkRequest
}

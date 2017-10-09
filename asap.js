// asap.js
// Working with the ASAP API

var request = require('request')
var config = require('./config')

function fetchOrgInfo (orgId) {
  var url = config.asapUrl + 'Test?orgId=' + orgId
  var opts = {
    url: url,
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'appname': config.asapApiAppName,
      'asap_accesstoken': config.asapApiToken
    }
  }
  return new Promise(function (resolve, reject) {
    request.post(opts, function (err, response, body) {
      if (err) {
        console.log('Error!')
        console.error(err)
        reject(err)
      } else {
        console.log('Successfully posted to AsapSuperController Test method')
        var blob = JSON.parse(body)
        resolve(blob)
      }
    })
  })
}

module.exports = {
  fetchOrgInfo: fetchOrgInfo
}

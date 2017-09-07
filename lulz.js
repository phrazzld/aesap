// lulz.js
// Fun stuff

var request = require('request')
var config = require('./config')

var giphyUrl = 'https://api.giphy.com/v1/gifs/random?api_key=' + config.giphyApiKey
var colors = ['#EB4D5C', '#007AB8', '#000', '#4D394B', '#FAD529', '#298FC3']

// Fetch random gif by tag and rating
function fetchGif (tag, rating) {
  if (!rating) { rating = 'g' }
  var url = giphyUrl + '&tag=' + tag + '&rating=' + rating
  return new Promise(function (resolve, reject) {
    request(giphyUrl, function (err, res, body) {
      if (err) {
        console.log('Request to giphyUrl ' + giphyUrl + ' failed')
        console.error(err)
        reject(err)
      } else {
        console.log('Successfully found random gif')
        // Blob's returned as a string, parse into JSON, then resolve image_url
        resolve(JSON.parse(body).data.image_url)
      }
    })
  })
}

function sendGif (pretext, tag, rating, text) {
  var color = colors[Math.floor(Math.random() * colors.length)]
  return new Promise(function (resolve, reject) {
    fetchGif(tag, rating)
      .then(function (gifUrl) {
        var response = {
          data: {
            slack: {
              attachments: [
                {
                  fallback: 'gif gif gif',
                  color: color,
                  pretext: pretext,
                  text: text,
                  image_url: gifUrl
                }
              ]
            }
          }
        }
        resolve(response)
      })
      .catch(function (reason) {
        console.log('Promise rejected fetching gif with tag ' + tag)
        console.error(reason)
        reject(reason)
      })
  })
}


module.exports = {
  fetchGif: fetchGif,
  sendGif: sendGif
}

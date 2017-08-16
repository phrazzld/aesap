// modules
var express = require("express")
var app = express()
var sanitizer = require("express-sanitizer")
var bodyParser = require("body-parser")
var config = require("./config")
var request = require("request")

// middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(sanitizer())


// functions
var colors = ["#EB4D5C","#007AB8","#000","#4D394B","#FAD529","#298FC3"];

var sendGif = function (pretext, image_url, text) {
  pretext = pretext || "";
  text = text || "";
  var color = colors[Math.floor(Math.random()*colors.length)];
  return {
    data: {
      slack: {
        attachments: [
          {
            fallback: "gif gif gif",
            color: color,
            pretext: pretext,
            image_url: image_url,
            text: text
          }
        ]
      }
    }
  }
}

// router
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials")
  res.header("Access-Control-Allow-Credentials", "true")
  next()
})

app.post("/handler", function (req, res) {
  console.log("Hitting API.AI webhook")
  // console.log("req.body")
  // console.log(req.body)

  var original=req.body.originalRequest

  console.log("stringified original slack request")
  console.log(JSON.stringify(original))

  // TO DO : fields returns undefined
  // The type of the ticket is stored here
  console.log(original.data.event.attachments.fields)

  var slackBlob = original.data
  var slackToken = slackBlob.token
  var channelId = slackBlob.event.channel
  var slackUrl = "https://slack.com/api/channels.info?"
  slackUrl += "token=" + slackToken
  slackUrl += "&channel=" + channelId

  // Ping Slack API for channel info
  request.get(slackUrl, function (error, response, body) {
    console.log("Error: ")
    console.log(error)
    console.log("Response: ")
    console.log(response)
    console.log("Body: ")
    console.log(body)
  })

  var intent = req.body.result.metadata.intentName
  var response

  if (intent === "Gif") {
    console.log("issa jif?");
    response = sendGif(
      "doh!",
      "http://media3.giphy.com/media/kEKcOWl8RMLde/giphy.gif"
    )
  } else {
    response = { speech: req.body.result.fulfillment.speech }
  }

  if(original.data.event.attachments){
    // if(original.data.event.attachments.fields[0].value="Blocker"){
    //   response="*Blocker Found*"
    // }
    // else{
      response="Attachment Found"
    // }
  }

  res.send(response)
})

app.listen(config.port, function (req, res) {
  console.log("Port " + config.port + ": \"Whirrr...\"")
})

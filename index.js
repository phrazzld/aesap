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
  console.log("req.body")
  console.log(req.body)

  var intent = req.body.result.metadata.intentName;
  var response;

  // Authenticate with ASAP API
  var authenticationUrl = config.apiUrl + "/login?user=" + config.apiUser + "&organizationId=" + config.apiOrgId + "&password=" + config.apiPw + "&apiKey=" + config.apiKey
  request.get(url, function (error, response, body) {
    if (error) { console.log("Authentication error: " + error) }
    var accessToken = response.headers.asap_accesstoken
    console.log("Access Token: " + accessToken)
    var opts = {
      url: config.apiUrl + "/invoices(2354651)",
      method: "GET",
      headers: {
        Authorization: {
          "user": config.apiUser,
          "organizationId": config.apiOrgId,
          "password": config.apiPw,
          "apiKey": config.apiKey
        },
        "Content-Type": "application/json"
      }
    }
    request.get(opts, function (e, r, b) {
      console.log("e": e)
      console.log("r")
      console.log(r)
      console.log("b")
      console.log(b)
    })
  })

  if (intent === "Gif") {
    console.log("issa jif?");
    response = sendGif("doh!", "http://media3.giphy.com/media/kEKcOWl8RMLde/giphy.gif");
  } else {
    response = { speech: "yo!" }
  }
  res.send(response);
})

app.listen(config.port, function (req, res) {
  console.log("Port " + config.port + ": \"Whirrr...\"")
})

var express = require("express")
var app = express()
var sanitizer = require("express-sanitizer")
var bodyParser = require("body-parser")
var config = require("./config")

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(sanitizer())

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

  if(intent === "Gif"){
    console.log("issa jif?");
    response={
      data:{
        slack:{
          attachments:[
            {
              fallback:"gif gif gif",
              color:"#007AB8",
              pretext:"doh!",
              image_url:"http://media3.giphy.com/media/kEKcOWl8RMLde/giphy.gif"
            }
          ]
        }
      }
      // speech:"testing"
      // data:{
      //   slack:{
      //     attachments:{
      //       fallback:"gif gif gif",
      //       color:"#007AB8",
      //       pretext:"doh!",
      //       image_url:"http://media3.giphy.com/media/kEKcOWl8RMLde/giphy.gif"
      //     }
      //   }
      // }
    }
  }
  else{
    response={speech:"yo!"}
  }
  res.send(response);
})

app.listen(config.port, function (req, res) {
  console.log("Port " + config.port + ": \"Whirrr...\"")
})

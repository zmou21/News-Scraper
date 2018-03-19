  const express = require("express");
  const bodyParser = require("body-parser");
  const logger = require("morgan");
  const mongoose = require("mongoose");
  const request = require("request");


  // Our scraping tools
  // Axios is a promised-based http library, similar to jQuery's Ajax method
  // It works on the client and on the server
  const cheerio = require("cheerio");

  // Require all models
  const db = require("./models");

  const port = process.env.PORT || 3000;

  // Initialize Express
  const app = express();

  //mongoose setup for heroku
  // If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
  var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newsscraper";

  // Set mongoose to leverage built in JavaScript ES6 Promises
  // Connect to the Mongo DB
  mongoose.Promise = Promise;
  mongoose.connect(MONGODB_URI, {
    useMongoClient: true
  });

  // Configure middleware

  // Use morgan logger for logging requests
  app.use(logger("dev"));
  // Use body-parser for handling form submissions
  app.use(bodyParser.urlencoded({ extended: false }));
  // Use express.static to serve the public folder as a static directory
  app.use(express.static("public"));

  // Routes

  // A GET route for scraping the echojs website
  app.get("/scrape", function(req, res) {

    request("https://www.marketwatch.com/markets", function(error, response, html) {

      var $ = cheerio.load(html);

      console.log($);

      $("div.newsitem").each(function(i, element) {

        let title = $(element).children().find("a").text();

        let link = $(element).children().find("a").attr("href");

        let summary = $(element).children().find("p").text();

        let image = $(element).find("img").attr("src");

        let saved = false;

        if(image === undefined) {
          console.log("not printing");
        }
        else{

          //console.log(`Title: ${title} \n Link: ${link} \n Summary: ${summary} \n Image: ${image}`);

            db.Article.create({
              title: title,
              link: link,
              image: image,
              summary: summary,
              saved: saved
            })
            .then(function(dbArticle) {
              console.log(dbArticle);
            })
            .catch(function(err) {
              // If an error occurred, send it to the client
              return res.json(err);
            });
          }
      });

      res.send("Scrape Complete");
    });

  });



  // Route for getting all Articles from the db
  app.get("/articles", function(req, res) {
    db.Article.find({})
    .then(function(data) {
      res.json(data)
    })
    .catch(function(err) {
      res.json(err)
    })
  });

  //Route to save articles to save page
  app.put("/articles", function(req, res) {
    // console.log("--------------------");
    //console.log(req.body._id);
    db.Article.findOneAndUpdate({_id: req.body._id }, { $set: { saved: req.body.saved } })
    .then(function(save) {
      res.json(save);
    })
    .catch(function(error) {
      res.json(error);
    })
  });


  //Route to get saved articles for save page
  app.get("/saved", function(req, res) {
    db.Article.find({ saved: true })
    .then(function(data) {
      res.json(data)
    })
    .catch(function(err) {
      res.json(err)
    })
  });


  // Route for grabbing a specific Article by id, populate it with it's note
  app.get("/notes/:id", function(req, res) {
    db.Article.findOne({_id: req.body.id})
    .populate("comment")
    .then(function(data) {
      res.json(data)
    })
    .catch(function(err) {
      res.json(err)
    })
  });

  //deleting functionality
  app.put("/delete", function(req, res) {
    console.log(req.body);
    db.Article.findOneAndUpdate({_id: req.body._id }, { $set: { saved: req.body.saved } })
    .then(function(data) {
      res.json(data)
      console.log("complete");
    })
    .catch(function(err) {
      res.json(err)
    })
  })


  app.post("/notes", function(req, res) {
    console.log(req.body);
    db.Comment.create(req.body)
    .then(function(dataComment) {
      return db.Article.findOneAndUpdate({}, { $push: { notes: dataComment._id } }, { new: true });
    })
    .then(function(data) {
      res.json(data)
    })
    .catch(function(err) {
      res.json(err)
    })
  });

  app.get("/notes/:id", function(req, res) {
    db.Article.findOne({_id: req.body.id})
    .populate("comment")
    .then(function(data) {
      res.json(data)
      console.log("complete");
    })
    .catch(function(err) {
      res.json(err)
    })
  });

  // Start the server
  app.listen(port, function() {
    console.log("App running on port " + port + "!");
  });

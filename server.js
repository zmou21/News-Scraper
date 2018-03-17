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

  const PORT = 3000;

  // Initialize Express
  const app = express();

  // Configure middleware

  // Use morgan logger for logging requests
  app.use(logger("dev"));
  // Use body-parser for handling form submissions
  app.use(bodyParser.urlencoded({ extended: false }));
  // Use express.static to serve the public folder as a static directory
  app.use(express.static("public"));

  // By default mongoose uses callbacks for async queries, we're setting it to use promises (.then syntax) instead
  // Connect to the Mongo DB
  mongoose.Promise = Promise;
  mongoose.connect("mongodb://localhost/newsscraper", {
    useMongoClient: true
  });

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

  app.post("/notes", function(req, res) {
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

  app.delete("/notes/:id", function(req, res) {
  //delete
  })

  //
  // // Route for saving/updating an Article's associated Note
  // app.post("/articles/:id", function(req, res) {
  //   // TODO
  //   // ====
  //   // save the new note that gets posted to the Notes collection
  //   // then find an article from the req.params.id
  //   // and update it's "note" property with the _id of the new note
  //   db.Note.create(req.body)
  //   .then(function(dataNote) {
  //
  //     return db.Article.findOneAndUpdate({_id: req.params.id}, { $push: { notes: dataNote._id } }, { new: true });
  //   })
  //   .then(function(data) {
  //     res.json(data)
  //   })
  //   .catch(function(err) {
  //     res.json(err)
  //   })
  // });

  // Start the server
  app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });

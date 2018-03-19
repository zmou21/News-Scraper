
  $(document).ready(function() {
    var articleContainer = $(".article-container");
    $(document).on("click", ".btn.save", handleArticleSave);
    $(document).on("click", ".scrape-new", handleArticleScrape);

    initPage();

    function initPage() {
      articleContainer.empty();
      $.get("/articles").then(function(data) {
        if (data && data.length) {
          renderArticles(data);
        }
        else {
          renderEmpty();
        }
      });
    }

    function renderArticles(articles) {
      var articlePanels = [];
      for (var i = 0; i < articles.length; i++) {
        articlePanels.push(createPanel(articles[i]));
      }

      articleContainer.prepend(articlePanels);
    }

    function createPanel(article) {
      var panel = $(
        [
          "<div class='panel panel-default'>",
          "<div class='panel-heading'>",
          "<h3>",
          "<a class='article-link' target='_blank' href='https://www.marketwatch.com/" + article.link + "'>",
          article.title,
          "</a>",
          "<a class='btn btn-success save'>",
          "Save Article",
          "</a>",
          "</h3>",
          "</div>",
          "<div class='panel-body'>",
          "<img class='image' src='"+ article.image +"'>",
          article.summary,
          "</div>",
          "</div>"
        ].join("")
      );
      panel.data("_id", article._id);

      return panel;
    }

    function renderEmpty() {

      var emptyAlert = $(
        [
          "<div class='alert alert-warning text-center'>",
          "<h4>Uh Oh. Looks like we don't have any new articles.</h4>",
          "</div>",
          "<div class='panel panel-default'>",
          "<div class='panel-heading text-center'>",
          "<h3>What Would You Like To Do?</h3>",
          "</div>",
          "<div class='panel-body text-center'>",
          "<h4><a class='scrape-new'>Try Scraping New Articles</a></h4>",
          "<h4><a href='/saved'>Go to Saved Articles</a></h4>",
          "</div>",
          "</div>"
        ].join("")
      );
      // Appending this data to the page
      articleContainer.append(emptyAlert);
    }

    function handleArticleSave() {
      var articleToSave = $(this).parents(".panel").data();
      // console.log("--------------------"); JSON.stringify(articleToSave)
      // console.log(articleToSave);
      articleToSave.saved = true;
      $.ajax({
        method: "PUT",
        url: "/articles",
        data: articleToSave
      }).then(function(data) {
        if (data.ok) {
          initPage();
        }
      });
    }

    function handleArticleScrape() {
      $.get("/scrape").then(function(data) {
        initPage();
        bootbox.alert("<h3 class='text-center m-top-80'>" + data.message + "<h3>");
      });
    }
  });

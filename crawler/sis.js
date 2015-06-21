//sis亚洲无码
[
  {
    "name": "login",
    "url": "http://www.sexinsex.net/bbs/logging.php?action=login",
    "method": "POST",
    "data": {
      "loginfield": "username",
      "username": "comcaptain",
      "password": "sgq7613269",
      "loginsubmit": "true"
    },
    "successCheck": {
      "contains": "欢迎您回来，comcaptain。现在将转入登录前页面。",
      "exitIfFailed": true
    }
  },
  {
    "name": "list page",
    "url": function() {
      var a = [];
      for (var i = 1; i < 10; i++) {
        a.push("http://www.sexinsex.net/bbs/forum-143-" + i + ".html");
      }
      return a;
    },
    "method": "GET",
    "resources": [
      {
        "cssSelector": "th.new a[href^=thread-]",
        "attribute": "href",
        "variable": "articleUrlList",
        "isUrl": true
      }
    ]
  },
  {
    "name": "article page",
    "urlVariable": "articleUrlList",
    "method": "GET",
    "resources": [
      {
        "cssSelector": "img[src$=torrent\\.gif] + a[href^=attachment]",
        "attribute": "href",
        "type": "attachment",
        "isUrl": true
      },
      {
        "cssSelector": ".postmessage h2 + div img[src$=jpg]",
        "attribute": "src",
        "type": "image",
        "isUrl": true
      },
      {
        "cssSelector": ".postmessage h2",
        "attribute": "text",
        "type": "title"
      }
    ]
  }
]
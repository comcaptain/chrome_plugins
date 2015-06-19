[
  {
    "name": "bar page",
    "url": "http://tieba.baidu.com/f?kw=%E9%82%A3%E5%B9%B4%E9%82%A3%E5%85%94%E9%82%A3%E4%BA%9B%E4%BA%8B%E5%84%BF&ie=utf-8",
    "method": "GET",
    "paging": {
      "key": "pn",
      "values": function() {
        return ["", "50"];
      }
    },
    "resources": [
      {
        "cssSelector": ".threadlist_title > a",
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
    "onlyLz": ["see_lz", "1"],
    "paging": {
      "key": "pn",
      "values": function(maxPage) {
        var a = [];
        for (var i = 1; i <= maxPage; i++) {
          a.push(i);
        }
        return a;
      },
      "maxPage": {
        "cssSelector": "#jumpPage4",
        "attribute": "max-page"
      }
    },
    "resources": [
      {
        "cssSelector": ".d_post_content",
        "attribute": "text",
        "type": "text"
      },
      {
        "cssSelector": ".d_post_content img.BDE_Image",
        "attribute": "src",
        "type": "image",
        "isUrl": true
      },
      {
        "cssSelector": ".core_title_txt",
        "attribute": "text",
        "type": "title"
      }
    ]
  }
]
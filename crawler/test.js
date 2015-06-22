var url = "http://tieba.baidu.com/f?kw=%E9%82%A3%E5%B9%B4%E9%82%A3%E5%85%94%E9%82%A3%E4%BA%9B%E4%BA%8B%E5%84%BF&ie=utf-8";
var xhr = new XMLHttpRequest();
xhr.open("GET", url);
xhr.onload = function() {
	var doc = xhr.responseText;
	doc = (new DOMParser()).parseFromString(doc);
	postMessage(doc.querySelector(".threadlist_title > a").textContent);
	self.close();
}
xhr.send();
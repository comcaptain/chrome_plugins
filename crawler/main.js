var jsonEditor;
window.addEventListener("DOMContentLoaded", function() {
	jsonEditor = ace.edit("dataEditor");
	jsonEditor.setTheme("ace/theme/monokai");
	jsonEditor.getSession().setMode("ace/mode/json");
	document.querySelector("#start").addEventListener("click", startCrawler);
	document.querySelector("#login").addEventListener("click", function() {
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "https://pygmalion.click/ajax/secretLogin");
		xhr.reponseType = "json";
		xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
		xhr.onload = function() {
			console.log(xhr.response);
		};
		xhr.send("userName=base&password=sgq7613269");
	})
	document.querySelector("#send").addEventListener("click", function() {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "https://pygmalion.click/article?id=83");
		xhr.onload = function() {
			document.querySelector("#result").textContent = xhr.responseText;
		};
		xhr.send();
	})
});
function startCrawler() {
	var configure = JSON.parse(jsonEditor.getValue());
	var promise = Promise.resolve();
	var zip = new JSZip();
	configure.forEach(function(pageConfigure) {
		promise = promise.then(function() {
			return crawlPage(pageConfigure, zip);
		});
	});
	promise.then(function() {
		var content = zip.generate({type:"blob"});
		saveAs("content", "result.zip");
	});
}
function log(text) {
	var date = new Date();
	var timestamp = "[" + date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate() + " " + 
			date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "]";
	var ele = document.createElement("li");
	ele.textContent = timestamp + text;
	document.getElementById("logList").appendChild(ele);
}
function exitCheck(pageConfigure, doc) {
	if (pageConfigure.successCheck !== undefined) {
		if (doc.body.textContent.indexOf(pageConfigure.successCheck.contains) < 0) {
			log("[" + pageConfigure.name + "] 失败");
			if (pageConfigure.successCheck.exitIfFailed) {
				log("因为设置了exitIfFailed为true，退出");
				return false;
			}
		}
	}
	return true;
}
function extractData(pageConfigure, doc) {
	var
	try {
		if (pageConfigure.resources !== undefined) {
			for (var i = 0; i < pageConfigure.resources.length; i++) {
				var resource = pageConfigure.resources[i];
				var elements = document.querySelectorAll(resource.cssSelector);
				if (elements.length === 0) {
					log("[" + pageConfigure.name + "][" + resource.cssSelector + "] 失败");
					continue;
				}
			}
		}
	}
	catch(e) {

	}
}
function crawlPage(pageConfigure, zip) {
	return new Promise(function(resolve, reject) {
		log(pageConfigure.name + ":[" + pageConfigure.url + "] started");
		var xhr = new XMLHttpRequest();
		xhr.open(pageConfigure.method, pageConfigure.url);
		xhr.reponseType = "document";
		xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
		xhr.onload = function() {
			var doc = xhr.response;
			if (!exitCheck(pageConfigure, doc)) {
				reject(); return;
			}
			var extractedData = extractData(pageConfigure, doc);
		};
		xhr.send(generateParamsUrl(pageConfigure.data));
	});
}
function generateParamsUrl(jsonParams) {
	if (jsonParams === undefined) return;
	var paramsUrl = "";
	for (var key in jsonParams) {
		paramsUrl += key + "=" + jsonParams[key] + "&";
	}
	if (paramsUrl !== "") {
		paramsUrl = paramsUrl.substring(0, paramsUrl.length - 1);
	}
	return paramsUrl;
}
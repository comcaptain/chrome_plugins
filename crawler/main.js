var jsonEditor;
var crawler;
window.addEventListener("DOMContentLoaded", function() {
	jsonEditor = ace.edit("dataEditor");
	jsonEditor.setTheme("ace/theme/monokai");
	jsonEditor.getSession().setMode("ace/mode/json");
	crawler = new Crawler({
		log: function(text) {
			var ele = document.createElement("li");
			ele.textContent = text;
			document.getElementById("logList").appendChild(ele);
		}
	});
	document.querySelector("#start").addEventListener("click", function() {
		crawler.crawl(JSON.parse(jsonEditor.getValue()));
	});
});
// {
// 	log: function(text) {}//not required, will use console to output log if not specified
// }
function Crawler(config) {
	this.config = config;
	this.zip = new JSZip();
}
Crawler.prototype = {
	generateParamsUrl: function(jsonParams) {
		if (jsonParams === undefined) return;
		var paramsUrl = "";
		for (var key in jsonParams) {
			paramsUrl += key + "=" + jsonParams[key] + "&";
		}
		if (paramsUrl !== "") {
			paramsUrl = paramsUrl.substring(0, paramsUrl.length - 1);
		}
		return paramsUrl;
	},
	generateTimeStamp: function(date) {
		if (date === undefined) date = new Date();
		return date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate() + " " + 
				date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds();
	},
	generateTimeStampTail: function(date) {
		if (date === undefined) date = new Date();
		return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "_" + 
				date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds();
	},
	shrinkText: function(text) {
		var shrunkText = "";
		var lines = text.split(/\n/);
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i].trim();
			if (line === "") continue;
			shrunkText += line + "\n";
		}
		return shrunkText;
	},
	log: function(text) {
		var date = new Date();
		var text = "[" + this.generateTimeStamp() + "]" + text;
		if (this.config.log === undefined) {
			console.log(text);
		}
		else {
			this.config.log(text);
		}
	},
	//分成两类：
	//文字类：一个attribute一个txt文件
	//下载类（目前只有图片）：单独分到一个文件夹
	crawl: function(crawlConfigure) {
		var self = this;
		this.data = {};
		this.downloadingCount = 0;
		this.pendingPromises = [];
		this.zip = new JSZip();
		var promise = Promise.resolve();
		crawlConfigure.forEach(function(pageConfigure) {
			promise = promise.then(function() {
				return self.crawlPage(pageConfigure);
			});
		});
		promise.then(function() {
			for (var name in self.data) {
				self.zip.file(name + ".txt", self.data[name]);
			}
		});
		this.pendingPromises.push(promise);
		Promise.all(this.pendingPromises).then(function() {
			var content = self.zip.generate({type:"blob"});
			saveAs(content, "result.zip");
		});

	},
	crawlPage: function(pageConfigure) {
		var self = this;
		return new Promise(function(resolve, reject) {
			self.log(pageConfigure.name + ":[" + pageConfigure.url + "] started");
			var xhr = new XMLHttpRequest();
			xhr.open(pageConfigure.method, pageConfigure.url);
			if (pageConfigure.responseType !== undefined) xhr.reponseType = pageConfigure.responseType;
			else xhr.responseType = "document";
			xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
			xhr.onload = function() {
				self.log(pageConfigure.url + " accessed");
				var doc = xhr.response;
				if (!self.existCheck(pageConfigure, xhr.response)) {
					reject(); return;
				}
				self.extractPageData(pageConfigure, doc);
				resolve();
			};
			xhr.onerror = function() {
				self.log(pageConfigure.url + " failed");
				resolve();
			}
			xhr.send(self.generateParamsUrl(pageConfigure.data));
		});
	},
	extractPageData: function(pageConfigure, doc) {
		if (pageConfigure.resources === undefined) return;
		var self = this;
		for (var i = 0; i < pageConfigure.resources.length; i++) {
			var resource = pageConfigure.resources[i];
			var elements = doc.querySelectorAll(resource.cssSelector);
			if (elements.length === 0) {
				this.log("[" + pageConfigure.name + "][" + resource.cssSelector + "] 失败");
				continue;
			}
			self.extractElementsData(elements, resource.attributes);
		}
	},
	downloadFile: function(url) {
		var matches = url.match(/^data:[^;/]+\/([^;/]+);base64,(.*)$/);
		if (matches) {
			this.zip.file("download/" + this.generateTimeStampTail() + "." + matches[1], matches[2], {base64: true});
			return;
		}
		var promise = new Promise(function(resolve, reject) {
			var self = this;
			matches = url.match(/([^/]*)\.([^/.]*)$/);
			var fileName = "", fileExtension = "";
			if (matches !== null) {
				fileName = matches[1];
				fileExtension = matches[2];
			}
			else {
				fileName = url.match(/([^/]*)$/)[1];
			}
			if (fileName === "") fileName = self.generateTimeStampTail();
			if (fileExtension === "") fileExtension = "unknown";
			var xhr = new XMLHttpRequest();
			xhr.open("GET", url);
			xhr.reponseType = "arraybuffer";
			xhr.onload = function() {
				var data = xhr.response;
				var name = fileName + "." + fileExtension;
				self.file("download/" + name, data);
				self.log(url + " has been downlaoded as " + name);
				self.downloadingCount--;
				self.log(downloading + " files remain downloading");
				resolve();
			};
			xhr.onerror = function() {
				self.log("Failed to download " + url);
				self.downloadingCount--;
				self.log(downloading + " files remain downloading");
				resolve();
			}
			self.downloadingCount++;
			self.log("Start to download " + url);
			xhr.send(self.generateParamsUrl(pageConfigure.data));
		}.bind(this));
		self.pendingPromises.push(promise);
	},
	extractElementsData: function(elements, attributes) {
		var self = this;
		Array.prototype.forEach.call(elements, function(element) {
			attributes.forEach(function(attribute) {
				if (typeof attribute === "string") {
					attribute = {name: attribute};
				}
				if (attribute.download) {
					var url = element.getAttribute(attribute.name);
					self.downloadFile(url);
				}
				else {
					if (self.data[attribute.name] === undefined) self.data[attribute.name] = "";
					var text = "";
					if (attribute.name === "text") text = element.textContent;
					else text = element.getAttribute(attribute.name);
					text = self.shrinkText(text);
					self.data[attribute.name] += text;
				}
			});
		});
	},
	existCheck: function(pageConfigure, doc) {
		var text;
		if (typeof doc === "string") text = doc;
		else text = doc.body.textContent;
		if (pageConfigure.successCheck !== undefined) {
			if (text.indexOf(pageConfigure.successCheck.contains) < 0) {
				log("[" + pageConfigure.name + "] 失败");
				if (pageConfigure.successCheck.exitIfFailed) {
					log("因为设置了exitIfFailed为true，退出");
					return false;
				}
			}
		}
		return true;
	}

}
Crawler.prototype.constructor = Crawler;
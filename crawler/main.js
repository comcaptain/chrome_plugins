var jsonEditor;
var crawler;
window.addEventListener("DOMContentLoaded", function() {
	jsonEditor = ace.edit("dataEditor");
	jsonEditor.setTheme("ace/theme/monokai");
	jsonEditor.getSession().setMode("ace/mode/javascript");
	crawler = new Crawler({
		log: function(text) {
			var ele = document.createElement("li");
			ele.textContent = text;
			document.getElementById("logList").appendChild(ele);
			var scrollElement = document.getElementById("log");
			scrollElement.scrollTop = scrollElement.scrollHeight;
		},
		onProgressChange: function(loadedCount, toBeLoadedCount) {
			var percentage = 0;
			if (toBeLoadedCount > 0) percentage = loadedCount / toBeLoadedCount;
			percentage = Math.round(percentage * 100);
			var ele = document.getElementById("downloadProgress");
			ele.textContent = loadedCount + "/" + toBeLoadedCount;
			ele.style.width = percentage + "%";
		}
	});
	document.querySelector("#start").addEventListener("click", function() {
		eval("var configure = " + jsonEditor.getValue());
		crawler.crawl(configure);
	});
});
// {
// 	log: function(text) {}, //not required, will use console to output log if not specified
// 	checkBadLink: false,
// 	onProgressChange: function(percentage) {}
// }
function Crawler(config) {
	this.config = config;
	this.zip = new JSZip();
}
Crawler.prototype = {
	//http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-clone-an-object
	clone: function(obj) {
	    if(obj === null || typeof(obj) !== 'object' || 'isActiveClone' in obj)
	        return obj;
	    var temp = obj.constructor(); // changed
	    for(var key in obj) {
	        if(Object.prototype.hasOwnProperty.call(obj, key)) {
	            obj['isActiveClone'] = null;
	            temp[key] = this.clone(obj[key]);
	            delete obj['isActiveClone'];
	        }
	    }    
	    return temp;
	},
	generateParamsUrl: function(jsonParams) {
		if (jsonParams === undefined) return "";
		var paramsUrl = "";
		for (var key in jsonParams) {
			paramsUrl += key + "=" + jsonParams[key] + "&";
		}
		if (paramsUrl !== "") {
			paramsUrl = paramsUrl.substring(0, paramsUrl.length - 1);
		}
		return paramsUrl;
	},
	leftPad: function(str, target, fillChar) {
		str = str + "";
		if (fillChar === undefined) fillChar = "0";
		var fillCharCount = target - str.length;
		for (var i = 0; i < fillCharCount; i++) {
			str = fillChar + str;
		}
		return str;
	},
	generateTimeStamp: function(date) {
		if (date === undefined) date = new Date();
		return date.getFullYear() + "/" + this.leftPad(date.getMonth() + 1, 2) + "/" + this.leftPad(date.getDate(), 2) + " " + 
				this.leftPad(date.getHours(), 2) + ":" + this.leftPad(date.getMinutes(), 2) + ":" + this.leftPad(date.getSeconds(), 2) + 
				"." + this.leftPad(date.getMilliseconds(), 3);
	},
	generateTimeStampTail: function(date) {
		if (date === undefined) date = new Date();
		return date.getFullYear() + "_" + this.leftPad(date.getMonth() + 1, 2) + "_" + this.leftPad(date.getDate(), 2) + "_" + 
				this.leftPad(date.getHours(), 2) + ":" + this.leftPad(date.getMinutes(), 2) + ":" + this.leftPad(date.getSeconds(), 2) + 
				"." + this.leftPad(date.getMilliseconds(), 3);
	},
	shrinkText: function(text) {
		var shrunkText = "";
		var lines = text.split(/\n/);
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i].trim();
			if (line === "") continue;
			shrunkText += line + "\n";
		}
		if (shrunkText !== "") return shrunkText.substring(0, shrunkText.length - 1);
		return shrunkText;
	},
	getAttributeValue: function(element, attribute, isUrl, doc) {
		if (!element) {
			console.log(doc.URL);
		}
		var value;
		if (attribute === "text") value = element.textContent;
		else value = element.getAttribute(attribute);
		if (isUrl && value.indexOf("http") != 0) {
			var parts = doc.URL.match(/^(https?:\/\/)(.*)$/);
			var schema = parts[1];
			var url = parts[2];
			if (value.charAt(0) === "/") {
				var domain = url;
				var index = domain.indexOf("/");
				if (index >= 0) {
					domain = domain.substring(0, index);
				}
				value = domain + value;
			}
			else {
				var lastIndex = url.lastIndexOf("/");
				if (lastIndex === -1)
					value = url + "/" + value;
				else
					value = url.substring(0, url.lastIndexOf("/") + 1) + value;
			}
			value = schema + value;
		}
		return value;
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
		this.data = [];
		this.variables = {};
		this.toBeLoadedCount = 0;
		this.loadedCount = 0;
		this.zip = new JSZip();
		this.viewer = window.open("viewer.html");
		var promise = Promise.resolve();
		crawlConfigure.forEach(function(pageConfigure) {
			promise = promise.then(function() {
				return self.crawlPage(pageConfigure);
			});
		});
		promise.then(function() {
			console.log(this.data);
		}.bind(this));

	},
	crawlPage: function(pageConfigure) {
		pageConfigure = this.clone(pageConfigure);		
		var self = this;
		var urls = [];
		if (pageConfigure.urlVariable !== undefined) {
			urls = self.variables[pageConfigure.urlVariable]
		}
		else if (typeof pageConfigure.url === "string"){
			urls.push(pageConfigure.url);
		}
		else if (typeof pageConfigure.url === "object"){
			urls = urls.concat(pageConfigure.url);
		}
		else if (typeof pageConfigure.url === "function"){
			urls = urls.concat(pageConfigure.url());
		}
		var crawlPromises = [];
		urls.forEach(function(url) {
			var tempPageConfigure = self.clone(pageConfigure);
			tempPageConfigure.url = url;
			if (tempPageConfigure.onlyLz !== undefined) {
				if (tempPageConfigure.onlyLz.cssSelector !== undefined) {
					tempPageConfigure
				}
				this.addParameter(tempPageConfigure, tempPageConfigure.onlyLz);
			}
			var pageData = {
				url: tempPageConfigure.url
			};
			var urlLoadPromise = null;
			if (tempPageConfigure.paging === undefined) urlLoadPromise = this.crawlUrl(tempPageConfigure, pageData);
			else {
				urlLoadPromise = self.loadPagingInfo(tempPageConfigure).then(function(pageConfigures) {
					var ps = [];
					var dataMap = {};
					var pageCount = pageConfigures;
					pageConfigures.forEach(function(pageConfigure, index) {
						var pageDataFragment = {};
						ps.push(self.crawlUrl(pageConfigure, pageDataFragment).then(function() {
							dataMap[index] = pageDataFragment;
						}));
					});
					return Promise.all(ps).then(function() {
						for (var i = 0; i < pageCount.length; i++) {
							var pageDataFragment = dataMap[i];
							if (pageDataFragment.images) {
								if (pageData.images === undefined) pageData.images = pageDataFragment.images;
								else pageData.images = pageData.images.concat(pageDataFragment.images);
							}
							if (pageDataFragment.attachments) {
								if (pageData.attachments === undefined) pageData.attachments = pageDataFragment.attachments;
								else pageData.attachments = pageData.attachments.concat(pageDataFragment.attachments);
							}
							if (pageDataFragment.text) {
								if (pageData.text === undefined) pageData.text = pageDataFragment.text;
								else pageData.text += "\n" + (pageDataFragment.text);
							}
							if (pageDataFragment.title && pageData.title === undefined) {
								pageData.title = pageDataFragment.title;
							}
						}
					});
				});
			}
			urlLoadPromise.then(function() {
				if (Object.keys(pageData).length > 1) {
					self.onOnePageLoaded(pageData);
					self.data.push(pageData);
				}
			});
			crawlPromises.push(urlLoadPromise);

		}.bind(this));
		return Promise.all(crawlPromises);
	},
	loadPagingInfo: function(pageConfigure) {
		var self = this;
		return new Promise(function(resolve, reject) {
			var values = pageConfigure.paging.values;
			if (typeof values === "function") {
				if (pageConfigure.paging.maxPage !== undefined) {
					var maxPageConfigure = pageConfigure.paging.maxPage;
					self.loadUrl(pageConfigure, function(xhr, resolve, reject) {
						var element = xhr.response.querySelector(maxPageConfigure.cssSelector);
						var maxPage;
						if (!element) maxPage = 1;
						else maxPage = parseInt(self.getAttributeValue(element, maxPageConfigure.attribute));
						resolve(pageConfigure.paging.values(maxPage));
					}, function(xhr, resolve, reject) {
						resolve(pageConfigure.paging.values(1));
					}).then(resolve);
				}
				else {
					resolve(pageConfigure.paging.values());
				}
			}
			else {
				resolve(values);
			}
		}.bind(this)).then(function(values) {
			var pageConfigures = [];
			var key = pageConfigure.paging.key;
			for (var i = 0; i < values.length; i++) {
				var p = this.clone(pageConfigure);
				this.addParameter(p, [key, values[i]]);
				pageConfigures.push(p);
			}
			return pageConfigures;
		}.bind(this));
	},
	addParameter: function(pageConfigure, extraParameter) {
		if (extraParameter === undefined) return;
		if (pageConfigure.method.toLowerCase() === "get") {
			if (pageConfigure.url.indexOf("?") < 0) pageConfigure.url += "?";
			else pageConfigure.url += "&";
			pageConfigure.url += extraParameter[0] + "=" + extraParameter[1];
		}
		else {
			pageConfigure[extraParameter[0]] = extraParameter[1];
		}
	},
	crawlUrl: function(pageConfigure, pageData) {
		var self = this;
		return this.loadUrl(pageConfigure, function(xhr, resolve, reject) {
			var doc = xhr.response;
			if (!self.existCheck(pageConfigure, xhr.response)) {
				reject(); return;
			}
			self.extractPageData(pageConfigure, doc, pageData);
			resolve();
		}, function(xhr, resolve, reject) {
			if (pageConfigure.successCheck && pageConfigure.successCheck.exitIfFailed) reject();
			else resolve();
		});
	},
	loadUrl: function(pageConfigure, onload, onerror) {
		var self = this;
		return new Promise(function(resolve, reject) {
			self.log(pageConfigure.name + ":[" + pageConfigure.url + "] started");
			var xhr = new XMLHttpRequest();
			var url = pageConfigure.url;
			xhr.open(pageConfigure.method, url);
			if (pageConfigure.responseType !== undefined) xhr.reponseType = pageConfigure.responseType;
			else xhr.responseType = "document";
			xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
			xhr.onload = function() {
				self.log(pageConfigure.url + " loaded");
				self.onFinishRequest();
				onload.call(self, xhr, resolve, reject);
			};
			xhr.onerror = function() {
				self.log(pageConfigure.url + " failed");
				self.onFinishRequest();
				onerror.call(self, xhr, resolve, reject);
			}
			var parameterUrl = self.generateParamsUrl(pageConfigure.data);
			xhr.send(parameterUrl);
			self.onStartRequest();
		});
	},
	onStartRequest: function() {
		this.toBeLoadedCount++;
		this.refreshProgress();
	},
	onFinishRequest: function() {
		this.loadedCount++;
		this.refreshProgress();
	},
	refreshProgress: function() {
		if (this.config.onProgressChange) this.config.onProgressChange(this.loadedCount, this.toBeLoadedCount);
	},
	extractPageData: function(pageConfigure, doc, pageData) {
		if (pageConfigure.resources === undefined) return;
		var self = this;
		for (var i = 0; i < pageConfigure.resources.length; i++) {
			var resource = pageConfigure.resources[i];
			var elements = doc.querySelectorAll(resource.cssSelector);
			if (elements.length === 0) {
				// this.log("[" + pageConfigure.name + "][" + resource.cssSelector + "] 失败");
				continue;
			}
			self.extractElementsData(doc, elements, resource, pageData);
		}
	},
	extractElementsData: function(doc, elements, resource, pageData) {
		var self = this;
		Array.prototype.forEach.call(elements, function(element) {
			var　value = self.getAttributeValue(element, resource.attribute, resource.isUrl, doc);
			switch(resource.type) {
				case "title": 
					pageData.title = value;
					break;
				case "text":
					value = self.shrinkText(value);
					if (pageData.text === undefined) pageData.text = value;
					else pageData.text += value + "\n";
					break;
				case "image":
					if (pageData.images === undefined) pageData.images = [value];
					else pageData.images.push(value);
					break;
				case "attachment":
					if (pageData.attachments === undefined) pageData.attachments = [value];
					else pageData.attachments.push(value);
					break;
			}
			if (resource.variable !== undefined) {
				//test command
				if(self.variables[resource.variable] === undefined) self.variables[resource.variable] = [value];
				else if (self.variables[resource.variable].length < 10000) self.variables[resource.variable].push(value);
			}
		});
	},
	onOnePageLoaded: function(pageData) {
		if (!this.config.checkBadLink) {
			this.renderPageData(pageData);
			return;
		}
		var legalImages = [];
		var legalAttachements = [];
		var promises = [];
		var self = this;
		if (pageData.images) {
			pageData.images.forEach(function(url) {
				var promise = self.checkBadLink(url);
				promise.then(function(legal) {
					if (legal) legalImages.push(url);
				});
				promises.push(promise);
			});
		}
		if (pageData.attachments) {
			pageData.attachments.forEach(function(url) {
				var promise = self.checkBadLink(url);
				promise.then(function(legal) {
					if (legal) legalAttachements.push(url);
				});
				promises.push(promise);
			});
		}
		Promise.all(promises).then(function() {
			pageData.images = legalImages;
			pageData.attachments = legalAttachements;
			self.renderPageData(pageData);
		});
	},
	renderPageData: function(pageData) {
		var s = pageData.url + "\n" + pageData.title + "\n" + (pageData.images != undefined ? pageData.images.join("\n") + "\n" : "") + pageData.text;
		var blob = new Blob([s], {type: "text/plain;charset=utf-8"});
		saveAs(blob, pageData.title + this.generateTimeStampTail() + ".txt");
	},
	checkBadLink: function(url) {
		return new Promise(function(resolve, reject) {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", url);
			xhr.onload = function() {
				resolve(true);
			}
			xhr.onerror = function() {
				resolve(false);
			}
			xhr.send();
		});
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
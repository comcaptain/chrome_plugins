function getHost() {
	var url = window.location.href;
	if (window.tab && window.tab.url) {
		url = tab.url;
	}
	return url.match(/[^\/]+\/\/[^\/]+/)[0];
}
function getInjectDataFromStorage() {
	var currentUrl = getHost();
	return new Promise(function(resolve, reject) {
		chrome.storage.sync.get(currentUrl, function(data) {
			data = data[currentUrl];
			if (data == undefined) {
				resolve();
				return;
			}
			var injectData = {};
			if (data.jsInjection != undefined) injectData["jsInjection"] = data.jsInjection;
			if (data.cssInjection != undefined) injectData["cssInjection"] = data.cssInjection;
			if (data.externalCssInjection != undefined) injectData["externalCssInjection"] = data.externalCssInjection;
			resolve(injectData);
		});
	});
}
function saveInjectDataToStorage(jsInjection, cssInjection, externalCssInjection) {
	var currentUrl = getHost();
	var data = {};
	data[currentUrl] = {
		cssInjection: cssInjection,
		jsInjection: jsInjection,
		externalCssInjection: externalCssInjection 
	};
	chrome.storage.sync.set(data);
}
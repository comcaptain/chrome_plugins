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
			resolve(injectData);
		});
	});
}
function saveInjectDataToStorage(jsInjection, cssInjection) {
	var currentUrl = getHost();
	var data = {};
	data[currentUrl] = {
		cssInjection: cssEditor.getValue(),
		jsInjection: jsEditor.getValue()
	};
	chrome.storage.sync.set(data);
}
function test() {
	var table = document.createElement("table");
	table.id = "test";
	table.style = "display: none";
	table.innerHTML = "<tr><td>test</td></tr>";
	document.body.appendChild(table);
}
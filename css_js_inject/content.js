function updateCss(css) {
	if (css) css = css.trim();
	if (css === "") return;
	var style = document.querySelector("style#sgqInjectCss");
	if (style === null) {
		style = document.createElement("style");
		style.type = "text/css";
		style.id = "sgqInjectCss";
		document.head.appendChild(style);
	}
	style.innerHTML = css;
}
var urlAlias = {
	"bootstrap": "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css"
}
function loadExternalCss(urls) {
	if (!urls) return;
	urls.forEach(function(url) {
		if (urlAlias[url] != undefined) url = urlAlias[url];
		var link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = url;
		document.head.appendChild(link);
	});
}
getInjectDataFromStorage().then(function(injectionData) {
	if (injectionData == undefined) return;
	updateCss(injectionData.cssInjection);
	loadExternalCss(injectionData.externalCssInjection);
	eval(injectionData.jsInjection);
});



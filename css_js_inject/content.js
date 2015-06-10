function updateCss(css) {
	if (css) css = css.trim();
	var style = document.querySelector("style#sgqInjectCss");
	if (style === null) {
		if (css === "") return;
		style = document.createElement("style");
		style.type = "text/css";
		style.id = "sgqInjectCss";
		style.classList.add("sgqInjectMark");
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
		link.classList.add("sgqInjectMark");
		document.head.appendChild(link);
	});
}
getInjectDataFromStorage().then(function(injectionData) {
	if (injectionData == undefined) return;
	updateCss(injectionData.cssInjection);
	loadExternalCss(injectionData.externalCssInjection);
	eval(injectionData.jsInjection);
	document.addEventListener("DOMContentLoaded", function() {
		Array.prototype.forEach.call(document.querySelectorAll(".sgqInjectMark"), function(ele) {
			document.head.removeChild(ele);
			document.head.appendChild(ele);
		});
	});
});



function loadLib() {
	return new Promise(function(resolve, reject) {
		if (window.jQuery)
		resolve();
	});
}
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
getInjectDataFromStorage().then(function(injectionData) {
	if (injectionData == undefined) return;
	updateCss(injectionData.cssInjection);
	eval(injectionData.jsInjection);
});



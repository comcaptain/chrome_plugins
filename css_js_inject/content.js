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
function updateJs(js) {
	if (js) js = js.trim();
	if (js === "") return;
	var script = document.querySelector("script#sgqInjectJs");
	if (script === null) {
		script = document.createElement("script");
		script.type = "text/javascript";
		script.id = "sgqInjectJs";
		document.head.appendChild(script);
	}
	script.innerHTML = js;
}
getInjectDataFromStorage().then(function(injectionData) {
	if (injectionData == undefined) return;
	updateCss(injectionData.cssInjection);
	updateJs(injectionData.jsInjection);
});



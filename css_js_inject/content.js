function updateCss(css) {
	var $style = $("style#sgqInjectCss");
	if ($style.length == 0) {
		var styleEle = document.createElement("style");
		styleEle.type = "text/css";
		styleEle.id = "sgqInjectCss";
		$style = $(styleEle);
		$("head").append($style);
	}
	$style[0].innerHTML = css;
}
function updateJs(js) {
	var $script = $("script#sgqInjectJs");
	if ($script.length == 0) {
		var scriptEle = document.createElement("script");
		scriptEle.type = "text/javascript";
		scriptEle.id = "sgqInjectJs";
		$script = $(scriptEle);
		$("body").append($script);
	}
	$script[0].innerHTML = js;
}
getInjectDataFromStorage().then(function(injectionData) {
	updateCss(injectionData.cssInjection);
	updateJs(injectionData.jsInjection);
});
var tab;
var currentUrl = getHost();
// chrome.tabs.getCurrent(function(t) {
// 	tab = t;
// });
var jsEditor, cssEditor;
var storage = chrome.storage.sync;
$(document).ready(function() {
	jsEditor = ace.edit("jsEditor");
	jsEditor.setTheme("ace/theme/monokai");
	jsEditor.getSession().setMode("ace/mode/javascript");
	cssEditor = ace.edit("cssEditor");
	cssEditor.setTheme("ace/theme/monokai");
	cssEditor.getSession().setMode("ace/mode/css");
	bindListeners();
	chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
		window.tab = tabs[0];
		chrome.tabs.executeScript({
			file: "content.js"
		});
		loadEditorContent().then(injectJsAndCss);
	})
});
function loadEditorContent() {
	return getInjectDataFromStorage().then(function(injectionData) {
		if (injectionData == undefined) return;
		jsEditor.setValue(injectionData.jsInjection);
		cssEditor.setValue(injectionData.cssInjection);
	});
}
function saveEditorContent() {
	saveInjectDataToStorage(jsEditor.getValue(), cssEditor.getValue());
}
function injectJsAndCss() {
	chrome.tabs.executeScript({
		code: "updateCss('" + escapeCode(cssEditor.getValue()) + "'); updateJs('" + escapeCode(jsEditor.getValue()) + "')",
	});
}
function escapeCode(code) {
	return code.replace(/'/g, "\'").replace(/\r?\n/g, "\\n");
}
function bindListeners() {
	$("ul.tabs").on("click", ".tab", function() {
		$(this).siblings(".tab").removeClass("selected");
		$(this).addClass("selected");
		$(".tabContent").hide();
		$("#" + this.getAttribute("tab-content-id")).show();
	});
	cssEditor.on("change", function() {
		injectJsAndCss();
		saveEditorContent();
	});
	jsEditor.on("change", function() {
		injectJsAndCss();
		saveEditorContent();
	});
}
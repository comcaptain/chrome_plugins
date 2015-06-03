var tab;
var jsEditor, cssEditor;
var storage = chrome.storage.sync;
function redrawEditor(editor) {
	editor.resize();
	editor.renderer.updateFull();
}
function bindListeners() {
	document.querySelector("ul.tabs").addEventListener("click", function(event) {
		if (!event.target.classList.contains("tab")) return;
		var selectedTabEle = event.target;
		Array.prototype.forEach.call(this.querySelectorAll(".tab"), function(tabEle) {
			var targetEle = document.getElementById(tabEle.getAttribute("tab-content-id"));
			if (tabEle === selectedTabEle) {
				tabEle.classList.add("selected");
				targetEle.style.display = "block";
			}
			else {
				tabEle.classList.remove("selected");
				targetEle.style.display = "none";
			}
		});
		if (selectedTabEle.id === "cssTab") {
			redrawEditor(cssEditor);
		}
		else {
			redrawEditor(jsEditor);
		}
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
document.addEventListener("DOMContentLoaded", function() {
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
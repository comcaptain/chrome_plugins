var tab;
var jsEditor, cssEditor, externalCssEditor;
var storage = chrome.storage.sync;
function redrawEditor(editor) {
	editor.resize();
	editor.renderer.updateFull();
	editor.focus();
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
		else if (selectedTabEle.id === "jsTab"){
			redrawEditor(jsEditor);
		}
		else {
			redrawEditor(externalCssEditor);
		}
	});
	cssEditor.on("change", function() {
		injectCss();
		saveEditorContent();
	});
	jsEditor.on("change", function() {
		saveEditorContent();
	});
	externalCssEditor.on("change", function() {
		saveEditorContent();
	});
}
document.addEventListener("DOMContentLoaded", function() {
	externalCssEditor = ace.edit("externalCssEditor");
	externalCssEditor.setTheme("ace/theme/monokai");
	jsEditor = ace.edit("jsEditor");
	jsEditor.setTheme("ace/theme/monokai");
	jsEditor.getSession().setMode("ace/mode/javascript");
	cssEditor = ace.edit("cssEditor");
	cssEditor.setTheme("ace/theme/monokai");
	cssEditor.getSession().setMode("ace/mode/css");
	chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
		window.tab = tabs[0];
		loadEditorContent().then(bindListeners);
	})
});
function loadEditorContent() {
	return getInjectDataFromStorage().then(function(injectionData) {
		if (injectionData == undefined) return;
		jsEditor.setValue(injectionData.jsInjection);
		cssEditor.setValue(injectionData.cssInjection);
		externalCssEditor.setValue(injectionData.externalCssInjection.join("\n"));
	});
}
function saveEditorContent() {
	saveInjectDataToStorage(jsEditor.getValue(), cssEditor.getValue(), externalCssEditor.getValue().split(/\s*\n\s*/));
}
function injectCss() {
	var value = escapeCode(cssEditor.getValue());
	chrome.tabs.executeScript({
		code: "updateCss('" + value + "');",
	});
}
function escapeCode(code) {
	return code.replace(/'/g, "\'").replace(/\r?\n/g, "\\n");
}
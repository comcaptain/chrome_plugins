window.addEventListener("DOMContentLoaded", function() {
	document.querySelector("#login").addEventListener("click", function() {
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "https://pygmalion.click/ajax/secretLogin");
		xhr.reponseType = "json";
		xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
		xhr.onload = function() {
			console.log(xhr.response);
		};
		xhr.send("userName=base&password=sgq7613269");
	})
	document.querySelector("#send").addEventListener("click", function() {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "https://pygmalion.click/article?id=83");
		xhr.onload = function() {
			document.querySelector("#result").textContent = xhr.responseText;
		};
		xhr.send();
	})
});
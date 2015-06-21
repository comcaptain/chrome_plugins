var currentIndex = 0;
var firstLoaded = false;
function renderData() {
	var data = window.opener.crawler.data[currentIndex];
	var titleElement = document.querySelector("#title");
	titleElement.textContent = data.title;
	titleElement.href = data.url;
	var attachmentsElement = document.querySelector("#attachments");
	if (data.attachments) {
		var html = "";
		data.attachments.forEach(function(url, index) {
			html += '<a class="attachment" href="' + url + '" download="true">附件' + (index + 1) + '</a>';
		});
		attachmentsElement.innerHTML = html;
	}
	else {
		attachmentsElement.innerHTML = "";
	}
	var hasContent = false;
	var imagesElement = document.querySelector("#images");
	var statusElement = document.querySelector("#imageLoadStatus");
	statusElement.textContent = "";
	if (data.images && document.querySelector("#imageFilter").checked) {
		imagesElement.innerHTML = "";
		var total = data.images.length;
		var loaded = 0;
		statusElement.textContent = loaded + "/" + total;
		data.images.forEach(function(url, index) {
			var imageElement = document.createElement("img");
			imageElement.addEventListener("load", function() {
				loaded++;
				statusElement.textContent = loaded + "/" + total;
			});
			imageElement.src = url;
			imagesElement.appendChild(imageElement);
			hasContent = true;
		});
	}
	else {
		imagesElement.innerHTML = "";
	}
	if (data.text && document.querySelector("#textFilter").checked) {
		document.querySelector("#text").innerHTML = data.text;
			hasContent = true;
	}
	else {
		document.querySelector("#text").innerHTML = "";
	}
	document.querySelector("#images").focus();
	document.querySelector("#content").scrollTop = 0
	if (!hasContent && currentIndex !== 0) nextPage();
}
function refresh() {
	var length = window.opener.crawler.data.length;
	document.querySelector("title").textContent = (length === 0 ? 0 : currentIndex + 1) + "/" + length;
	if (window.opener.crawler.data.length > 0 && !firstLoaded) {
		renderData();
		firstLoaded = true;
	}
}
function prevPage() {
	if (currentIndex === 0) return;
	currentIndex--;
	renderData();
}
function nextPage() {
	if ((currentIndex + 2) > window.opener.crawler.data.length) return;
	currentIndex++;
	renderData();
}
window.addEventListener("DOMContentLoaded", function() {
	document.getElementById("prevPage").addEventListener("click", prevPage);
	document.getElementById("nextPage").addEventListener("click", nextPage);
	setInterval(refresh, 500);
	window.addEventListener("keydown", function(event) {
		if (event.keyCode == 37) {
			event.preventDefault();
			prevPage();
		}
		else if (event.keyCode == 39)　{
			event.preventDefault();
			nextPage();
		}
	});
});
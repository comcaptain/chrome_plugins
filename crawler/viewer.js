var currentIndex = 0;
var firstLoaded = false;
var loaded = 0;
var total = 0;
function imageOnlaod() {
	loaded++;
	updateImagesLoadStatus();
}
function updateImagesLoadStatus() {
	var statusElement = document.querySelector("#imageLoadStatus");
	statusElement.textContent = (total === 0) ? "" : loaded + "/" + total;
}
function clearImages() {
	var imagesElement = document.querySelector("#images");
	Array.prototype.forEach.call(imagesElement.querySelectorAll("img"), function(img) {
		img.removeEventListener("load", imageOnlaod);
	});
	imagesElement.innerHTML = "";
	loaded = 0;
	total = 0;
	updateImagesLoadStatus();
}
function addImages(urls) {
	total = urls.length;
	updateImagesLoadStatus();
	var imagesElement = document.querySelector("#images");
	urls.forEach(function(url) {
		var imageElement = document.createElement("img");
		imageElement.src = url;
		imageElement.addEventListener("load", imageOnlaod);
		imagesElement.appendChild(imageElement);
	});
}
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
	clearImages();
	if (data.images && document.querySelector("#imageFilter").checked) {
		addImages(data.images);
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
	setInterval(refresh, 1000);
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
var worker = new Worker("test.js");
worker.addEventListener("message", function(event) {
	alert(event.data);
});
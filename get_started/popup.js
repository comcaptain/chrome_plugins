const changeColor = document.getElementById("changeColor");
chrome.storage.sync.get('color', data =>
{
	changeColor.style.backgroundColor = data.color;
	changeColor.setAttribute("value", data.color);
})
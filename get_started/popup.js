const changeColor = document.getElementById("changeColor");
chrome.storage.sync.get('color', data =>
{
	changeColor.style.backgroundColor = data.color;
	changeColor.setAttribute("value", data.color);
})

changeColor.addEventListener("click", e =>
{
	const color = e.target.value;
	chrome.tabs.query({ active: true, currentWindow: true }, tabs =>
	{
		const tab = tabs[0];
		chrome.tabs.executeScript(tab.id, { code: `document.body.style.background = "${color}";` });
	})
})
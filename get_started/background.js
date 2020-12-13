// onInstalled is fired when the extension is first installed
chrome.runtime.onInstalled.addListener(function ()
{
	chrome.storage.sync.set({ color: '#3aa757' }, function ()
	{
		console.log("The color is green.");
	});
	// Only enable the plugin for specific urls (you can also enable plugin only if a css selector has matched element)
	// removeRules(undefined, callback) is the standard way to set rules
	// this requires `declarativeContent` permission
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function ()
	{
		const urlRule = {
			conditions: [new chrome.declarativeContent.PageStateMatcher({
				pageUrl: { hostEquals: 'developer.chrome.com' }
			})],
			actions: [new chrome.declarativeContent.ShowPageAction()]
		}
		chrome.declarativeContent.onPageChanged.addRules([urlRule]);
	})
});
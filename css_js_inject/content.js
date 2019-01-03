(function()
{
	const URL_ALIASES =
	{
		"bootstrap": "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css"
	}
	let injectedDataStorage = new InjectedDataStorage(new DataStorage());

	function injectCSS(cssCode)
	{
		if (cssCode) cssCode = cssCode.trim();
		var style = document.querySelector("style#sgq-injected-css");
		if (style === null)
		{
			if (cssCode === "") return;
			style = document.createElement("style");
			style.type = "text/css";
			style.id = "sgq-injected-css";
			style.classList.add("sgq-injected-css");
			document.head.appendChild(style);
		}
		style.innerHTML = cssCode;
	}

	function injectExternalStyleSheets(urls)
	{
		if (!urls) return;
		urls.forEach(function(url)
		{
			if (URL_ALIASES[url] != undefined) url = URL_ALIASES[url];
			var link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = url;
			link.classList.add("sgq-injected-css");
			document.head.appendChild(link);
		});
	}

	injectedDataStorage.load().then(injectionData =>
	{
		if (!injectionData) return;

		// Do injection
		injectCSS(injectionData.cssCode);
		injectExternalStyleSheets(injectionData.cssURLs);
		eval(injectionData.jsCode);

		// re-append injected css to guarantee that it comes after page's existing css code
		document.addEventListener("DOMContentLoaded", function()
		{
			Array.prototype.forEach.call(document.querySelectorAll(".sgq-injected-css"), function(ele)
			{
				document.head.removeChild(ele);
				document.head.appendChild(ele);
			});
		});
	})

	window.injectCSS = injectCSS;
})()

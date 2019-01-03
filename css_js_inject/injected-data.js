(function()
{
	class InjectedData
	{
		constructor(domain, cssCode, jsCode, cssURLs)
		{
			this.domain = domain;
			this.cssCode = cssCode ? cssCode : "";
			this.jsCode = jsCode ? jsCode : "";
			this.cssURLs = cssURLs ? cssURLs : [];	
		}

		serialize()
		{
			return {
				cssInjection: this.cssCode,
				jsInjection: this.jsCode,
				externalCssInjection: this.cssURLs,
				domain: this.domain
			}
		}

		static deserialize(key, serializedData)
		{
			return new InjectedData(
				key,
				serializedData.cssInjection, serializedData.jsInjection, serializedData.externalCssInjection);
		}
	}

	window.InjectedData = InjectedData;
})()

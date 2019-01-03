(function()
{
	class InjectedData
	{
		constructor(cssCode, jsCode, cssURLs)
		{
			this.cssCode = cssCode;
			this.jsCode = jsCode;
			this.cssURLs = cssURLs;			
		}

		serialize()
		{
			return {
				cssInjection: this.cssCode,
				jsInjection: this.jsCode,
				externalCssInjection: this.cssURLs 
			}
		}

		static deserialize(serializedData)
		{
			return new InjectedData(serializedData.cssInjection, serializedData.jsInjection, serializedData.externalCssInjection);
		}
	}

	window.InjectedData = InjectedData;
})()

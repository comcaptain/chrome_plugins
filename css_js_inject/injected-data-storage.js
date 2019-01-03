(function()
{
// This is stolen from https://www.rlvision.com/blog/using-wildcard-matching-in-any-programming-language/
function wildcardMatch(find, source)
{
	find = find.replace(/[\-\[\]\/\{\}\(\)\+\.\\\^\$\|]/g, "\\$&");
	find = find.replace(/\*/g, ".*");
	find = find.replace(/\?/g, ".");
	var regEx = new RegExp(find, "i");
	return regEx.test(source);
}

class InjectedDataStorage
{
	constructor(dataStorage)
	{
		this.dataStorage = dataStorage;
	}

	load()
	{
		let hostName = InjectedDataStorage.getCurrentDomain();
		return this.dataStorage.loadAllKeys().then(allKeys =>
		{
			for (let key of allKeys)
			{
				if (!wildcardMatch(key, hostName)) continue;
				return this.dataStorage.load(key).then(value => InjectedData.deserialize(key, value));
			}
			return new InjectedData(hostName);
		})
	}

	remove(key)
	{
		this.dataStorage.remove(key);
	}

	save(injectedData)
	{
		this.dataStorage.save(injectedData.domain, injectedData.serialize())
	}

	static getCurrentDomain()
	{
		var url = window.location.href;
		if (window.tab && window.tab.url) url = tab.url;
		return url.match(/[^\/]+\/\/[^\/]+/)[0];
	}
}

window.InjectedDataStorage = InjectedDataStorage;

})()

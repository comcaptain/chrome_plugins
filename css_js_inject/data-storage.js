(function()
{
	class DataStorage
	{
		load(key)
		{
			return new Promise(function(resolve, reject)
			{
				chrome.storage.sync.get(key, data => resolve(data[key]));
			});
		}

		loadAllKeys()
		{
			return new Promise(resolve => chrome.storage.sync.get(null, allItems => resolve(Object.keys(allItems))));
		}

		save(key, value)
		{
			let data = {};
			data[key] = value;
			chrome.storage.sync.set(data);
		}
	}

	window.DataStorage = DataStorage;
})()

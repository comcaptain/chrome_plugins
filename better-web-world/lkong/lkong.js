/**
 * @param targetTime String format of target time. Should be compatible with Date constructor
 * @param forumID ID of the forum, you can get it from forum's URL
 * 
 * @returns Thread list and next page's time stamp. e.g. {threads: [{title: "abc", url: "https://xxxxx", id: "856697"}], next: "2012-06-12 22:00", forumID: "20"}
 */
async function getPageData(targetTime, forumID)
{
	const url = `http://lkong.cn/forum/${forumID}/index.php?mod=data&sars=forum/${forumID}/thread_dateline&nexttime=${new Date(targetTime).getTime() / 1000}&_=1591495974215`;
	const xhr = new XMLHttpRequest();
	const responsePromise = new Promise(resolve => xhr.addEventListener("load", () => resolve(xhr.response)));
	xhr.responseType = "json";
	xhr.open("GET", url);
	xhr.send();
	const response = await responsePromise;
	const dataList = response.data;
	const threads = dataList.map(d =>
	{
		const title = d.subject.replace(/.*>(.*)<.*/, "$1");
		const url = `http://lkong.cn/thread/${d.id.replace("thread_", "")}`;
		const id = d.id.replace("thread_", "");
		return { title, url, id };
	});
	const result = { time: targetTime, threads, forumID };
	if (dataList.length > 0)
	{
		result.next = dataList[0].dateline;
	}
	return result;
}

/**
 * Send ajax to get one thread's data
 * 
 * @param {String} threadID ID of the thread. e.g. For ajax response data in `getPageData`, there is one field for each thread: id, one example of id value is: thread_856697, then 856697 is the id
 * 
 * @returns [{author: "大圣欢喜天", time: "2013-10-09 21:13:21", content: "<p>  \t咦，发现小唐唐了……来（逗猫棒）<img src=\"http://img.lkong.cn/bq/em51.gif\" em=\"51\">  </p> "}]
 */
async function getThreadData(threadID)
{
	const url = `http://lkong.cn/index.php?mod=data&sars=thread/${threadID}&_=1614081864714`;
	const response = await fetch(url);
	const jsonData = await response.json();
	return jsonData.data.map(t => ({
		author: t.author,
		time: t.dateline,
		content: t.message
	}));
}

const defaultMonth = "07";
const defaultDayOfMonth = "12";
const defaultHour = "19";
const defaultMinute = "00";
const defaultSecond = "00";
const defaultTime = defaultHour + ":" + defaultMinute + ":" + defaultSecond;
function convertInputTime(input)
{
	if (!input) return "";

	let datePart = input.substr(0, 6);
	if (datePart.length === 1)
	{
		datePart = "201" + datePart + "-" + defaultMonth + "-" + defaultDayOfMonth;
	}
	else if (datePart.length === 2)
	{
		datePart = "20" + datePart + "-" + defaultMonth + "-" + defaultDayOfMonth;
	}
	else if (datePart.length === 3)
	{
		datePart = "20" + datePart.substr(0, 2) + "-0" + datePart.substr(2) + "-" + defaultDayOfMonth;
	}
	else if (datePart.length === 4)
	{
		datePart = "20" + datePart.substr(0, 2) + "-" + datePart.substr(2) + "-" + defaultDayOfMonth;
	}
	else if (datePart.length === 5)
	{
		datePart = "20" + datePart.substr(0, 2) + "-" + datePart.substr(2, 2) + "-0" + datePart.substr(4);
	}
	else
	{
		datePart = "20" + datePart.substr(0, 2) + "-" + datePart.substr(2, 2) + "-" + datePart.substr(4);
	}
	if (!datePart.match(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|30|31)$/))
	{
		throw `${input} -> ${datePart}日期部分错误. 正确示例: 131212表示2013-12-12`
	}
	let timePart = input.substr(7);
	if (timePart)
	{
		if (timePart.length === 1)
		{
			timePart = "0" + timePart + ":" + defaultMinute + ":" + defaultSecond;
		}
		else if (timePart.length === 2)
		{
			timePart = timePart + ":" + defaultMinute + ":" + defaultSecond;
		}
		else if (timePart.length === 3)
		{
			timePart = timePart.substr(0, 2) + ":0" + timePart.substr(2) + ":" + defaultSecond;
		}
		else if (timePart.length === 4)
		{
			timePart = timePart.substr(0, 2) + ":" + timePart.substr(2) + ":" + defaultSecond;
		}
		else if (timePart.length === 5)
		{
			timePart = timePart.substr(0, 2) + ":" + timePart.substr(2, 2) + ":0" + timePart.substr(4);
		}
		else
		{
			timePart = timePart.substr(0, 2) + ":" + timePart.substr(2, 2) + ":" + timePart.substr(4);
		}
		if (!timePart.match(/^(?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d)$/))
		{
			throw `${input} -> ${timePart}时间部分错误. 正确示例: 22表示22:00:00`
		}
	}
	else
	{
		timePart = defaultTime;
	}
	return datePart + " " + timePart;
}

function testConvertInputTime()
{
	assertEquals("2011-07-12 19:00:00", convertInputTime("1"));
	assertEquals("2012-07-12 19:00:00", convertInputTime("12"));
	assertEquals("120 -> 2012-00-12日期部分错误. 正确示例: 131212表示2013-12-12", convertInputTime("120"));
	assertEquals("2012-01-12 19:00:00", convertInputTime("121"));
	assertEquals("2012-03-12 19:00:00", convertInputTime("1203"));
	assertEquals("2012-03-01 19:00:00", convertInputTime("12031"));
	assertEquals("2012-03-11 19:00:00", convertInputTime("120311"));
	assertEquals("2012-03-11 02:00:00", convertInputTime("120311 2"));
	assertEquals("2012-03-11 12:00:00", convertInputTime("120311 12"));
	assertEquals("2012-03-11 12:03:00", convertInputTime("120311 123"));
	assertEquals("2012-03-11 12:34:00", convertInputTime("120311 1234"));
	assertEquals("2012-03-11 12:34:05", convertInputTime("120311 12345"));
	assertEquals("2012-03-11 12:34:56", convertInputTime("120311 123456"));
}

function assertEquals(expected, acutal)
{
	if (expected === acutal) return;
	throw `Expected: ${expected}, actual: ${acutal}`;
}

function bindListeners(container)
{
	container.querySelector("#jump-to-next-page").addEventListener("click", async function ()
	{
		timeTravel(this.getAttribute("time"), this.getAttribute("forum-id"));
	});
	const previewNode = container.querySelector("#time-travel-target-previewer");
	const timeInputNode = container.querySelector("#time-travel-target");
	const timeTravelNode = container.querySelector("#time-travel");
	timeTravelNode.addEventListener("click", function ()
	{
		timeInputNode.classList.remove("hidden");
		previewNode.classList.remove("hidden");
		this.classList.add("hidden");
		timeInputNode.value = "";
		timeInputNode.focus();
	});
	timeInputNode.addEventListener("keydown", async function (event)
	{
		if (event.key != "Enter") return;
		if (previewNode.classList.contains("error")) return;
		timeTravel(previewNode.textContent);
		this.classList.add("hidden");
		previewNode.classList.add("hidden");
		timeTravelNode.classList.remove("hidden");
	});
	timeInputNode.addEventListener("input", function ()
	{
		try
		{
			previewNode.textContent = convertInputTime(this.value);
			previewNode.classList.remove("error");
		}
		catch (error)
		{
			previewNode.textContent = error;
			previewNode.classList.add("error");
		}
	});
	container.querySelector("#random-time-travel").addEventListener("click", e => randomTimeTravel());
	container.addEventListener("click", async function (event)
	{
		if (!event.target.classList.contains("thread-link")) return;
		if (event.ctrlKey) return;
		event.preventDefault();
		console.info(await getThreadData(event.target.getAttribute("thread-id")));
	})
}

/**
 * @param {String} forumID Optional parameter
 */
function randomTimeTravel(forumID)
{
	const startTimeInMillis = new Date("2012-01-01").getTime();
	const yearsBeforeNow = 3;
	const endTimeInMillis = new Date().getTime() - yearsBeforeNow * 365 * 24 * 3600 * 1000;
	const targetTime = new Date(startTimeInMillis + parseInt((endTimeInMillis - startTimeInMillis) * Math.random()));
	timeTravel(formatDate(targetTime), forumID);
}

/**
 * @param date A js Date object
 */
function formatDate(date)
{
	return date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2) + " " +
		("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":" + ("0" + date.getSeconds()).slice(-2);
}

function renderThreads(pageData)
{
	let container = document.querySelector("#time-machine");
	if (!container)
	{
		container = document.createElement("div");
		container.id = "time-machine";
		document.body.appendChild(container);
		container.innerHTML = `
			<div id="time-machine-side-bar">
				<span class="side-bar-item start-time"></span>
				<span class="side-bar-item count"></span>
				<button class="side-bar-item" id="jump-to-next-page">下一页</button>
				<button class="side-bar-item" id="time-travel">切换时间</button>
				<input type="text" placeholder="130712 22" id="time-travel-target" class="hidden side-bar-item" />
				<button class="side-bar-item" id="random-time-travel" title="穿越到2012到3年之前的任意时间点">随机穿越</button>
				<span id="time-travel-target-previewer" class="hidden" />
			</div>
			<ul id="historical-threads">
			</ul>`;
		bindListeners(container);
	}
	const threadsContainer = container.querySelector("#historical-threads");
	threadsContainer.innerHTML = pageData.threads.map(t => `<li><a href="${t.url}" target="_blank" class="thread-link" thread-id="${t.id}">${t.title}</a></li>`).join("\n");
	const nextButton = container.querySelector("#jump-to-next-page");
	if (pageData.next)
	{
		nextButton.setAttribute("time", pageData.next);
		nextButton.setAttribute("forum-id", pageData.forumID);
		nextButton.style.display = null;
	}
	else
	{
		nextButton.style.display = "none";
	}
	container.querySelector("#time-machine-side-bar .start-time").textContent = pageData.time;
	container.querySelector("#time-machine-side-bar .count").textContent = pageData.threads.length + "个帖子";
}

/**
 * @param {*} targetTime A string whose format is 2013-07-12 19:00:00
 */
async function timeTravel(targetTime, forumID)
{
	if (!forumID) forumID = window.forumID;
	window.forumID = forumID;
	const pageData = await getPageData(targetTime, forumID);
	renderThreads(pageData);
}

randomTimeTravel("60");

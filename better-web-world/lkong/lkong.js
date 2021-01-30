/**
 * @param targetTime String format of target time. Should be compatible with Date constructor
 * @param forumID ID of the forum, you can get it from forum's URL
 * 
 * @returns Thread list and next page's time stamp. e.g. {threads: [{title: "abc", url: "https://xxxxx"}], next: "2012-06-12 22:00", forumID: "20"}
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
		return { title, url };
	});
	const result = { time: targetTime, threads, forumID };
	if (dataList.length > 0)
	{
		result.next = dataList[0].dateline;
	}
	return result;
}

function bindListeners(container)
{
	container.querySelector("#jump-to-next-page").addEventListener("click", async function ()
	{
		timeTravel(this.getAttribute("time"), this.getAttribute("forum-id"));
	});
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
			<div id="time-machine-status">
				<span class="start-time"></span>
				<span class="count"></span>
			</div>
			<ul id="historical-threads">
			</ul><button id="jump-to-next-page">下一页</button>`;
		bindListeners(container);
	}
	const threadsContainer = container.querySelector("#historical-threads");
	threadsContainer.innerHTML = pageData.threads.map(t => `<li><a href="${t.url}" target="_blank">${t.title}</a></li>`).join("\n");
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
	container.querySelector("#time-machine-status .start-time").textContent = pageData.time;
	container.querySelector("#time-machine-status .count").textContent = pageData.threads.length + "个帖子";
}

async function timeTravel(targetTime, forumID)
{
	const pageData = await getPageData(targetTime, forumID);
	renderThreads(pageData);
}

timeTravel("2013-07-12 19:00:00", "60");

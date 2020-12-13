// list page selectors
const THREAD_LINK_SELECTOR = "tbody[id^=normalthread] span[id^=thread] > a[href^=thread-]";

// detail page selectors
const COMMENT_BOX_SELECTOR = ".mainbox.viewthread"; // 第一个就是作者发布的主题
const MAIN_SUBJECT_IMAGES_SELECTOR = "div[id^=postmessage] img"; // 子选择器，跟上一个配合使用
const TORRENT_DOWNLOAD_LINK_SELECTOR = "a[href^=attachment]";

function getThreadLinks()
{
	return [].slice.apply(document.querySelectorAll(THREAD_LINK_SELECTOR));
}

class ThreadDetail
{
	constructor(title, torrentURL, images)
	{
		this.title = title;
		this.torrentURL = torrentURL;
		this.images = images;
	}
}

function renderThreadDetail(threadDetail)
{
	const div = document.createElement("div");
	div.classList.add("sgq-thread");
	div.innerHTML = `<span class="title">${threadDetail.title}</span><a href="${threadDetail.torrentURL}">种子</a>${threadDetail.images.map(image => `<img src="${image}" />`).join("\n")}`;
	return div;
}

async function crawlThreadDetail(link)
{
	const data = await fetch(link.getAttribute("href"));
	const html = await data.text();
	const doc = new DOMParser().parseFromString(html, "text/html");
	const subjectDOM = doc.querySelector(COMMENT_BOX_SELECTOR);
	return new ThreadDetail(
		link.textContent,
		doc.querySelector(TORRENT_DOWNLOAD_LINK_SELECTOR).getAttribute("href"),
		[].slice.apply(subjectDOM.querySelectorAll(MAIN_SUBJECT_IMAGES_SELECTOR)).map(i => i.getAttribute("src"))
	);
}

async function beautify()
{
	const links = getThreadLinks();
	const detail = await crawlThreadDetail(links[0]);
	document.body.prepend(renderThreadDetail(detail));
}

beautify();

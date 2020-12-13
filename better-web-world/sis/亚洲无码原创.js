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
	constructor(title, torrentURL, images, index)
	{
		this.title = title;
		this.torrentURL = torrentURL;
		this.images = images;
		this.index = index;
	}
}

function refreshThreadDetail(threadDetail, threadCount, imageIndex)
{
	let container = document.getElementById("sgq-thread");
	if (container == null)
	{
		container = document.createElement("div");
		document.body.prepend(container);
		container.id = "sgq-thread";
	}
	container.innerHTML = `
		<div id="header">
			<div id="meta-data">
				<span class="thread-metadata" id="page-number">第1页</span>
				<span class="thread-metadata" id="thread-index">帖子: ${threadDetail.index + 1}/${threadCount}</span>
				<span class="thread-metadata" id="image-index">图片: ${imageIndex + 1}/${threadDetail.images.length}</span>
			</div>
			<span class="title">${threadDetail.title}</span>
		</div>
		<img src="${threadDetail.images[imageIndex]}">`
}

async function crawlThreadDetail(links, linkIndex)
{
	const link = links[linkIndex];
	const data = await fetch(link.getAttribute("href"));
	const html = await data.text();
	const doc = new DOMParser().parseFromString(html, "text/html");
	const subjectDOM = doc.querySelector(COMMENT_BOX_SELECTOR);
	return new ThreadDetail(
		link.textContent,
		doc.querySelector(TORRENT_DOWNLOAD_LINK_SELECTOR).getAttribute("href"),
		[].slice.apply(subjectDOM.querySelectorAll(MAIN_SUBJECT_IMAGES_SELECTOR)).map(i => i.getAttribute("src")),
		linkIndex
	);
}

async function beautify()
{
	const links = getThreadLinks();
	const detail = await crawlThreadDetail(links, 0);
	refreshThreadDetail(detail, links.length, 0);
}

beautify();

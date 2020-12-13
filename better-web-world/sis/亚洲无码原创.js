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

let links = [];
let threadIndex = 0;
let imageIndex = 0;
let threadDetail = null;

async function refreshThreadDetail()
{
	if (!threadDetail)
	{
		threadDetail = await crawlThreadDetail();
	}
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
				<span class="thread-metadata" id="thread-index">帖子: ${threadIndex + 1}/${links.length}</span>
				<span class="thread-metadata" id="image-index">图片: ${imageIndex + 1}/${threadDetail.images.length}</span>
			</div>
			<span class="title">${threadDetail.title}</span>
		</div>
		<img src="${threadDetail.images[imageIndex]}">`
}

function isBrokenImage(imageURL)
{
	return new Promise(resolve =>
	{
		const img = document.createElement("img");
		img.setAttribute("src", imageURL);
		img.addEventListener("error", e =>
		{
			resolve(null);
		});
		img.addEventListener("load", e =>
		{
			resolve(imageURL);
		});
		img.style.display = "none";
		document.body.appendChild(img);
		document.body.removeChild(img);
	})
}


async function nextImage()
{
	if (imageIndex < threadDetail.images.length - 1)
	{
		imageIndex++;
	}
	else if (threadIndex < links.length - 1)
	{
		threadIndex++;
		imageIndex = 0;
	}
	else
	{
		return;
	}
	threadDetail = null;
	refreshThreadDetail();
}

async function prevImage()
{
	if (imageIndex > 0)
	{
		imageIndex--;
	}
	else if (threadIndex > 0)
	{
		threadIndex--;
		imageIndex = 0;
	}
	else
	{
		return;
	}
	threadDetail = null;
	refreshThreadDetail();
}

function bindListeners()
{
	document.body.addEventListener("keyup", async e =>
	{
		// This is to disable the listener on screen
		e.stopPropagation();
		if (e.key === 'ArrowRight')
		{
			nextImage();
		}
		else if (e.key === 'ArrowLeft')
		{
			prevImage();
		}
		else if (e.key === 'ArrowLeft')
		{
			prevImage();
		}
		else if (e.key === 'd')
		{
			window.location.href = threadDetail.torrentURL;
		}
		else if (e.key === 'g')
		{
			window.open(links[threadIndex])
		}
	});
}

async function crawlThreadDetail()
{
	const link = links[threadIndex];
	const data = await fetch(link.getAttribute("href"));
	const html = await data.text();
	const doc = new DOMParser().parseFromString(html, "text/html");
	const subjectDOM = doc.querySelector(COMMENT_BOX_SELECTOR);
	const images = [].slice.apply(subjectDOM.querySelectorAll(MAIN_SUBJECT_IMAGES_SELECTOR)).map(i => i.getAttribute("src"));
	const verifiedImages = await Promise.all(images.map(image => isBrokenImage(image)));
	return new ThreadDetail(
		link.textContent,
		doc.querySelector(TORRENT_DOWNLOAD_LINK_SELECTOR).getAttribute("href"),
		verifiedImages.filter(image => image)
	);
}

async function beautify()
{
	links = getThreadLinks();
	refreshThreadDetail();
	bindListeners();
}

beautify();

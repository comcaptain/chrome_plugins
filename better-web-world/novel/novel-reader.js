class WebsiteConfigure
{
	constructor(chapterListCssSelector, chapterContentCssSelector, encoding = "utf-8")
	{
		this.chapterListCssSelector = chapterListCssSelector;
		this.chapterContentCssSelector = chapterContentCssSelector;
		this.encoding = encoding;
	}
}

const BIQUGE_CONFIGURE = new WebsiteConfigure("#list > dl > dd > a", "#content");
const BIQUGE_CONFIGURE_GBK = new WebsiteConfigure("#list > dl > dd > a", "#content", "GBK");
const BIQUGE_CONFIGURE2 = new WebsiteConfigure("#list > dl > dd > a", ".content");
const BIQUGER_CONFIGURE = new WebsiteConfigure("#list > dl > dd > a", "#booktext");
const MAIN_CONFIGURE = new WebsiteConfigure("div.listmain > dl > dd > a", "#content", "GBK")
const DINGDIAN_CONFIGURE = new WebsiteConfigure("div.listmain > dl > dd > a", "#content")
const CV148_CONFIGURE = new WebsiteConfigure("div.chapters > ul > li:not(.listover) > mip-link.mip-element > a", "div.content")
const SIX_NINE_SHU_CONFIGURE = new WebsiteConfigure("#catalog > ul > li > a", ".txtnav", "GBK");
const QU_LA_CONFIGURE = new WebsiteConfigure("#list > div.book-chapter-list > ul > li > a", "#txt", "GBK");
const PIAOTIA_CONFIGURE = new WebsiteConfigure('.mainbody > .centent > ul > li > a', "#txtmid,#content", "GBK")
const FIVE_U_8_CONFIGURE = new WebsiteConfigure('.ml_content > .zb > .ml_list > ul > li > a', "#articlecontent", "GBK")
const CONFIGURES = {
	"www.ibswtan.com": BIQUGE_CONFIGURE,
	"www.vbiquge.com": BIQUGE_CONFIGURE,
	"www.biquger.com": BIQUGER_CONFIGURE,
	"www.xbiqugu.info": BIQUGE_CONFIGURE,
	"www.dingdiann.net": BIQUGE_CONFIGURE,
	"www.xbiquge.la": BIQUGE_CONFIGURE,
	"www.20xs.cc": BIQUGE_CONFIGURE,
	"www.vipxs.la": BIQUGE_CONFIGURE,
	"www.69xinshu.com": SIX_NINE_SHU_CONFIGURE,
	"www.mayiwxw.com": BIQUGE_CONFIGURE,
	"www.shudai.org": BIQUGE_CONFIGURE,
	"wujixsw.com": BIQUGE_CONFIGURE,
	"www.biqugesk.org": BIQUGE_CONFIGURE2,
	"mip.cv148.com": CV148_CONFIGURE,
	"www.qu-la.com": QU_LA_CONFIGURE,
	"www.ibiquges.org": BIQUGE_CONFIGURE,
	"www.liewenn.com": BIQUGE_CONFIGURE_GBK,
	"www.piaotia.com": PIAOTIA_CONFIGURE,
	"www.26ks.org": BIQUGER_CONFIGURE,
	"www.xxbiqudu.com": BIQUGE_CONFIGURE_GBK,
	"www.aishangba4.com": BIQUGE_CONFIGURE,
	"www.5you8.net": FIVE_U_8_CONFIGURE,
}

class Chapter
{
	/**
	 * @param {String} title of the chapter
	 * @param {String} url of the chapter detail screen
	 */
	constructor(title, url, isTxt = false)
	{
		this.title = title;
		this.url = url;
		this.isTxt = isTxt;
		this.content = null;
		// Height of chapter node in pixel
		this.height = null;
		// Y coordinate value of chapter node's bottom border when scrollTop == 0. Unit is pixel
		this.bottom = null;
	}
}

function debounce(callback, wait)
{
	let timeout;
	return (...args) =>
	{
		const context = this;
		clearTimeout(timeout);
		timeout = setTimeout(() => callback.apply(context, args), wait);
	};
}

function createTxtNovelChapter(chapterTitle, chapterContent)
{
	chapterContent = chapterContent.trim().split("\n").filter(line => line.trim()).map(line => `　　${line.trim()}`).join("\n");
	const chapter = new Chapter(chapterTitle, "", true);
	chapter.content = chapterContent;
	return chapter;
}

class TxtNovelAccessor
{
	constructor()
	{
		const txtContent = document.querySelector("pre").innerHTML;
		const chapterTitleRegex = /第[一二三四五六七八九十百千零0-9]+章[^\n]*/g;
		const chapters = [];
		const matches = [...txtContent.matchAll(chapterTitleRegex)];
		// Loop through the matches and slice the content based on the index of matches
		matches.forEach((match, index) =>
		{
			const start = match.index + match[0].length;
			let end = txtContent.length;
			if (index + 1 < matches.length)
			{
				end = matches[index + 1].index;
			}
			const chapterTitle = match[0];
			const chapterContent = txtContent.slice(start, end);
			chapters.push(createTxtNovelChapter(chapterTitle, chapterContent));
		});
		if (matches.length === 0)
		{
			chapters.push(createTxtNovelChapter(document.title.replace(".txt", ""), txtContent));
		}
		this.chapters = chapters;
	}

	crawlChapterLinks()
	{
		return this.chapters;
	}

	crawlChapterContent()
	{
		// do nothing
	}
}

class Crawler
{
	/**
	 * @param {WebsiteConfigure} websiteConfig 
	 */
	constructor(websiteConfig)
	{
		this.config = websiteConfig;
	}

	crawlChapterLinks()
	{
		return [].slice.apply(document.querySelectorAll(this.config.chapterListCssSelector))
			.map(aNode => new Chapter(aNode.textContent.trim(), aNode.href));
	}

	/**
	 * @param {Chapter} chapter 
	 */
	async crawlChapterContent(chapter)
	{
		if (chapter.content) return;
		console.info("Crawling chapter", chapter.title, chapter.url);
		const response = await fetch(chapter.url);
		const arrayBuffer = await response.arrayBuffer();
		const htmlText = new TextDecoder(this.config.encoding).decode(new DataView(arrayBuffer));
		const doc = new DOMParser().parseFromString(htmlText, "text/html");
		const contentNode = doc.querySelector(this.config.chapterContentCssSelector);
		if (!contentNode)
		{
			console.error(htmlText)
			throw new Error(`No content for ${chapter.url}`);
		}
		chapter.content = preprocessChapterContentHTML(contentNode);
		console.info("Crawled chapter", chapter.title, chapter.url);
	}
}

/**
 * @param {HTMLElement} novelContentNode
 */
function preprocessChapterContentHTML(novelContentNode)
{
	// [].slice.apply(novelContentNode.children).filter(node => node.tagName !== 'BR' && node.tagName != 'P').forEach(node => node.remove());
	// let novelContent = [].slice.apply(novelContentNode.children).filter(node => node.tagName === 'P').map(node =>
	// {
	// 	node.remove();
	// 	let innerText = node.innerText.trim();
	// 	if (innerText === "") return null;
	// 	return `  ${innerText}`;
	// }).filter(text => text).join("\n");
	[].slice.apply(novelContentNode.querySelectorAll("center, #center_tip, #content_tip, p, a, div, h1")).forEach(node => node.remove());
	return novelContentNode.innerHTML
		// Check https://stackoverflow.com/a/61151122/2334320 for detail about this regex
		.replace(/(\n|^)\s*[^\p{Script=Han}]*永[^\p{Script=Han}]*久[^\p{Script=Han}]*免[^\p{Script=Han}]*费[^\p{Script=Han}]*看[^\p{Script=Han}]*小[^\p{Script=Han}]*说[^\p{Script=Han}]*\s*(\n|$)/gu, '\n')
		.replace(/(\n|^)\s*[^\p{Script=Han}]*正[^\p{Script=Han}]*版[^\p{Script=Han}]*首[^\p{Script=Han}]*发[^\p{Script=Han}]*\s*(\n|$)/gu, '\n')
		.replace(/(\n|^)\s*[^\p{Script=Han}]*唯[^\p{Script=Han}]*一[^\p{Script=Han}]*正[^\p{Script=Han}]*版[^\p{Script=Han}]*其[^\p{Script=Han}]*他[^\p{Script=Han}]*都[^\p{Script=Han}]*是[^\p{Script=Han}]*盗[^\p{Script=Han}]*版[^\p{Script=Han}]*\s*(\n|$)/gu, '\n')
		.replace(/(\n|^)\s*[^\p{Script=Han}]*最[^\p{Script=Han}]*新[^\p{Script=Han}]*章[^\p{Script=Han}]*节[^\p{Script=Han}]*上[^\p{Script=Han}]*\s*(\n|$)/gu, '\n')
		.replace(/(\n|^)\s*[^\p{Script=Han}]*更[^\p{Script=Han}]*新[^\p{Script=Han}]*最[^\p{Script=Han}]*快[^\p{Script=Han}]*上[^\p{Script=Han}]*\s*(\n|$)/gu, '\n')
		.replace(/(\n|^)\s*[^\p{Script=Han}]*看[^\p{Script=Han}]*正[^\p{Script=Han}]*版[^\p{Script=Han}]*章[^\p{Script=Han}]*节[^\p{Script=Han}]*上[^\p{Script=Han}]*\s*(\n|$)/gu, '\n')
		.replace(/(\n|^)\s*[^\p{Script=Han}]*首[^\p{Script=Han}]*发[^\p{Script=Han}]*\s*(\n|$)/gu, '\n')
		.replace(/<br>\s*<br>/g, '<br>')
		.replace(/^\s*<br>/, '');
}

class NovelReader
{
	constructor(crawler)
	{
		this.crawler = crawler;
		this.saveCurrentLocation = debounce.call(this, this.saveCurrentLocation, 100);
	}

	async render()
	{
		this.chapters = this.crawler.crawlChapterLinks();
		await this.initHTMLNodes();
		const savedLocation = await this.loadSavedLocation();
		if (savedLocation)
		{
			console.info("Loaded saved location", savedLocation);
			await this.jumpToChapter(savedLocation.chapterIndex);
			document.documentElement.scrollTop = savedLocation.scrollTop;
		}
		else
		{
			console.info("There is no saved location, jump to the 1st chapter")
			await this.jumpToChapter(0);
		}
	}

	async downloadFromCurrentChapter()
	{
		const currentChapterIndex = this.getCurrentLocation().index;
		const downloadChapters = this.chapters.filter((_, index) => index >= currentChapterIndex);
		for (const chapter of downloadChapters)
		{
			while (true)
			{
				try
				{
					await this.crawler.crawlChapterContent(chapter);
					await new Promise(resolve => setTimeout(resolve, 500));
					break;
				}
				catch (e)
				{
					console.info(`Failed to crawl ${chapter.title}, sleep for 1 second and try again`)
					await new Promise(resolve => setTimeout(resolve, 1000));
					console.info("Sleep finished")
				}
			}
		}
		// await Promise.all(downloadChapters.map(chapter => this.crawler.crawlChapterContent(chapter)));
		const novelContent = downloadChapters.map(chapter => `${chapter.title}\n\n${chapter.content}`).join("\n");
		const novelName = window.prompt("下载完成，请输入小说名称");
		const a = document.createElement('a');
		a.href = window.URL.createObjectURL(new Blob([novelContent], { type: 'text/plain' }));
		a.setAttribute('download', `${novelName}.txt`);
		a.style.display = 'none';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	async initHTMLNodes()
	{
		let container = document.querySelector("#novel-reader");
		if (container) return;

		const chapters = this.chapters;
		const firstChapter = chapters[0];
		await this.crawler.crawlChapterContent(firstChapter);
		container = document.createElement("div");
		container.id = "novel-reader";
		document.body.appendChild(container);
		container.innerHTML = `
		<div id="chapters"></div>
		<div id="side-menu">
			<button class="side-button" id="menu-button" style="background-image: url(${chrome.runtime.getURL("novel/background.png")});">目录</button>
			<button class="side-button" id="download-novel" style="background-image: url(${chrome.runtime.getURL("novel/download.svg")});"></button>
		</div>
		<div id="category-dialog">
			<ul id="category-items">
			${chapters.map((chapter, index) => `<li class="chapter-name" index="${index}" anchor="a${index}">${chapter.title}</li>`).join("\n")}
			</ul>
		</div>`;
		this.bindListeners();
	}

	renderChapterNode(chapter)
	{
		const chapterNode = document.createElement("div");
		chapterNode.classList.add("chapter");
		chapterNode.innerHTML = `
			<div class="chapter-header">
				<h3 class="chapter-title">${chapter.title}</h3>
			</div>
			<div class="chapter-body${chapter.isTxt ? " is-txt" : ""}">${chapter.content}</div>`;
		return chapterNode;
	}

	async jumpToChapter(targetChapterIndex)
	{
		if (this.loading)
		{
			alert("Loading new chapter, please retry again later");
			return;
		}
		this.firstChapterIndex = targetChapterIndex;
		this.lastChapterIndex = targetChapterIndex - 1;
		document.querySelector("#chapters").innerHTML = "";
		this.stopLocationRecorder = true;
		document.documentElement.scrollTop = 0;
		this.stopLocationRecorder = false;
		for (let i = 0; i < 2; i++) await this.addNewChapter();
	}

	async addNewChapter()
	{
		if (this.loading || this.lastChapterIndex === this.chapters.length - 1) return false;

		const newChapter = this.chapters[this.lastChapterIndex + 1];
		this.loading = true;
		await this.crawler.crawlChapterContent(newChapter);
		this.loading = false;

		const chapterNode = this.renderChapterNode(newChapter);
		document.querySelector("#chapters").appendChild(chapterNode);
		const rect = chapterNode.getBoundingClientRect();
		newChapter.height = rect.height;
		newChapter.bottom = rect.bottom + document.documentElement.scrollTop;
		this.lastChapterIndex++;
		this.saveCurrentLocation();
	}

	async loadSavedLocation()
	{
		const key = location.href;
		const savedLocation = await new Promise(resolve => chrome.storage.sync.get(key, obj => resolve(obj[key])));
		if (!savedLocation) return null;
		for (let i = 0; i < this.chapters.length; i++)
		{
			if (savedLocation.chapterName === this.chapters[i].title)
			{
				savedLocation.chapterIndex = i;
				return savedLocation;
			}
		}
		return null;
	}

	saveCurrentLocation()
	{
		if (this.stopLocationRecorder) return;
		const obj = { [location.href]: this.getCurrentLocation() };
		chrome.storage.sync.set(obj, function ()
		{
			console.log('Saved current location', obj);
		});
	}

	getCurrentLocation()
	{
		const scrollTop = document.documentElement.scrollTop;
		let currentChapter, currentIndex;
		for (let i = this.firstChapterIndex; i <= this.lastChapterIndex; i++)
		{
			const chapter = this.chapters[i];
			if (chapter.bottom >= scrollTop || i === this.lastChapterIndex)
			{
				currentChapter = chapter;
				currentIndex = i;
				break;
			}
		}
		const firstChapter = this.chapters[this.firstChapterIndex];
		const topOfFirstChapter = firstChapter.bottom - firstChapter.height;
		let relativeScrollTop = scrollTop - (currentChapter.bottom - currentChapter.height - topOfFirstChapter);
		return {
			chapterName: currentChapter.title,
			scrollTop: relativeScrollTop,
			index: currentIndex
		}
	}

	openMenu()
	{
		document.querySelector("#menu-button").classList.add("active");
		document.querySelector("#category-dialog").classList.add("active");
		document.querySelectorAll(".chapter-name.active").forEach(e => e.classList.remove("active"));
		const currentChapterNameNode = document.querySelector(`.chapter-name[anchor=a${this.getCurrentLocation().index}]`);
		currentChapterNameNode.classList.add("active");
		currentChapterNameNode.scrollIntoView();
	}

	closeMenu()
	{
		document.querySelector("#menu-button").classList.remove("active");
		document.querySelector("#category-dialog").classList.remove("active");
	}

	bindListeners()
	{
		document.addEventListener("keydown", event =>
		{
			if (event.ctrlKey && event.key === "d")
			{
				event.preventDefault();
				this.downloadFromCurrentChapter();
			}
		});
		document.querySelector("#download-novel").addEventListener("click", event =>
		{
			this.downloadFromCurrentChapter();
		});
		document.querySelector("#menu-button").addEventListener("click", event =>
		{
			this.openMenu();
			event.stopPropagation();
		});
		document.addEventListener("click", event =>
		{
			const target = event.target;
			const categoryContainer = document.getElementById("category-dialog");
			if (categoryContainer.contains(target) || categoryContainer === target)
			{
				return;
			}
			this.closeMenu();
		})
		document.querySelector("#category-items").addEventListener("click", event =>
		{
			let itemNode = event.target;
			if (!itemNode.classList.contains("chapter-name")) itemNode = itemNode.parentNode;
			if (!itemNode.classList.contains("chapter-name")) return;
			this.closeMenu();
			this.jumpToChapter(parseInt(itemNode.getAttribute("index")));
		});
		const chaptersNode = document.querySelector("#chapters");
		document.addEventListener("scroll", () =>
		{
			this.saveCurrentLocation();
			const scrollContainer = document.documentElement;
			if (chaptersNode.scrollHeight - scrollContainer.scrollTop - window.innerHeight < 1000) this.addNewChapter();
		})
	}
}

const config = CONFIGURES[location.host];
if (location.href.endsWith(".txt"))
{
	new NovelReader(new TxtNovelAccessor()).render();
}
else if (config)
{
	new NovelReader(new Crawler(config)).render();
}
else
{
	alert(`Current domain ${location.host} hasn't been set up yet`)
}


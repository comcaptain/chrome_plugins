class WebsiteConfigure
{
	constructor(chapterListCssSelector, chapterContentCssSelector)
	{
		this.chapterListCssSelector = chapterListCssSelector;
		this.chapterContentCssSelector = chapterContentCssSelector;
	}
}

const BIQUGE_CONFIGURE = new WebsiteConfigure("#list > dl > dd > a", "#content");
const CONFIGURES = {
	"www.bswtan.com": BIQUGE_CONFIGURE
}

class Chapter
{
	/**
	 * @param {String} title of the chapter
	 * @param {String} url of the chapter detail screen
	 */
	constructor(title, url)
	{
		this.title = title;
		this.url = url;
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
		const htmlText = await response.text();
		const doc = new DOMParser().parseFromString(htmlText, "text/html");
		chapter.content = doc.querySelector(this.config.chapterContentCssSelector).innerHTML.replace(/<br><br>/g, "<br>");
		console.info("Crawled chapter", chapter.title, chapter.url);
	}
}

class NovelReader
{
	constructor(websiteConfig)
	{
		this.crawler = new Crawler(websiteConfig);
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
		<div id="category">
			<button class="side-button" id="menuButton" style="background-image: url(${chrome.extension.getURL("novel/background.png")});">目录</button>
			<div id="category-dialog">
				<ul id="category-items">
				${chapters.map((chapter, index) => `<li class="chapter-name" index="${index}" anchor="a${index}">${chapter.title}</li>`).join("\n")}
				</ul>
			</div>
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
			<div class="chapter-body">${chapter.content}</div>`;
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
		document.querySelector("#category").classList.add("active");
		document.querySelectorAll(".chapter-name.active").forEach(e => e.classList.remove("active"));
		const currentChapterNameNode = document.querySelector(`.chapter-name[anchor=a${this.getCurrentLocation().index}]`);
		currentChapterNameNode.classList.add("active");
		currentChapterNameNode.scrollIntoView();
	}

	closeMenu()
	{
		document.querySelector("#category").classList.remove("active");
	}

	bindListeners()
	{
		document.querySelector("#menuButton").addEventListener("click", () =>
		{
			this.openMenu();
		});
		document.addEventListener("click", event =>
		{
			const target = event.target;
			const categoryContainer = document.getElementById("category");
			if (categoryContainer.contains(target) || categoryContainer === target)
			{
				return;
			}
			this.closeMenu();
		})
		document.querySelector("#category-items").addEventListener("click", event =>
		{
			if (!event.target.classList.contains("chapter-name")) return;
			this.closeMenu();
			this.jumpToChapter(parseInt(event.target.getAttribute("index")));
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

const config = CONFIGURES[document.domain];
if (config)
{
	new NovelReader(config).render();
}
else
{
	alert(`Current domain ${document.domain} hasn't been set up yet`)
}


class WebsiteConfigure
{
	constructor(chapterListCssSelector, chapterContentCssSelector)
	{
		this.chapterListCssSelector = chapterListCssSelector;
		this.chapterContentCssSelector = chapterContentCssSelector;
	}
}

const BIQUGE_CONFIGURE = new WebsiteConfigure("#list > dl > dd > a", "#content");

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
	}

	async render()
	{
		this.chapters = this.crawler.crawlChapterLinks();
		await this.initHTMLNodes();
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
		<div id="chapters">${this.renderChapterHTML(firstChapter)}</div>
		<div id="category">
			<button class="side-button" id="menuButton" style="background-image: url(${chrome.extension.getURL("novel/background.png")});">目录</button>
			<div id="category-dialog">
				<ul id="category-items">
				${chapters.map((chapter, index) => `<li class="chapter-name" index="${index}">${chapter.title}</li>`).join("\n")}
				</ul>
			</div>
		</div>`;
		this.bindListeners();
	}

	renderChapterHTML(chapter)
	{
		return `<div class="chapter">
			<div class="chapter-header">
				<h3 class="chapter-title">${chapter.title}</h3>
			</div>
			<div class="chapter-body">${chapter.content}</div>
		</div>`;
	}

	async jumpToPage(chapterIndex)
	{
		const chapter = this.chapters[chapterIndex];
		await this.crawler.crawlChapterContent(chapter);
		document.querySelector("#chapters").innerHTML = this.renderChapterHTML(chapter);
	}

	closeMenu()
	{
		document.getElementById("category").classList.remove("active");
	}

	bindListeners()
	{
		document.querySelector("#menuButton").addEventListener("click", function ()
		{
			const category = document.getElementById("category");
			category.classList.toggle("active");
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
			this.jumpToPage(parseInt(event.target.getAttribute("index")));
		});
	}
}

new NovelReader(BIQUGE_CONFIGURE).render();

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
		const chapters = this.crawler.crawlChapterLinks();
		await this.initHTMLNodes(chapters);
	}

	async initHTMLNodes(chapters)
	{
		let container = document.querySelector("#novel-reader");
		if (container) return;

		const firstChapter = chapters[0];
		await this.crawler.crawlChapterContent(firstChapter);
		container = document.createElement("div");
		container.id = "novel-reader";
		document.body.appendChild(container);
		container.innerHTML = `
		<div class="chapter">
			<div class="chapter-header">
				<h3 class="chapter-title">${firstChapter.title}</h3>
			</div>
			<div class="chapter-body">${firstChapter.content}</div>
		</div>
		<div id="category">
			<button class="side-button" id="menuButton" style="background-image: url(${chrome.extension.getURL("novel/background.png")});">目录</button>
			<div id="category-dialog">
				<ul id="category-items">
				${chapters.map(chapter => `<li class="chapter-name">${chapter.title}</li>`).join("\n")}
				</ul>
			</div>
		</div>`;
		this.bindListeners();
	}

	bindListeners()
	{
		document.querySelector("#menuButton").addEventListener("click", function ()
		{
			const category = document.getElementById("category");
			category.classList.toggle("active");
		});
		document.addEventListener("click", function (event)
		{
			var target = event.target;
			var categoryContainer = document.getElementById("category");
			if (categoryContainer.contains(target) || categoryContainer === target)
			{
				return;
			}
			document.getElementById("category").classList.remove("active");
		})
	}
}

new NovelReader(BIQUGE_CONFIGURE).render();

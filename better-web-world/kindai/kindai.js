async function waitUntilFrameLoaded(frameName)
{
	const frame = document.querySelector(`frame[name=${frameName}]`);
	await new Promise(resolve =>
	{
		const loadedCallback = function ()
		{
			frame.removeEventListener("load", loadedCallback);
			resolve();
		}
		frame.addEventListener("load", loadedCallback);
	});
	return frame;
}

function autoFillForm()
{
	const doc = document.querySelector("[name=WM_FUNC]").contentDocument;
	const trs = [].slice.call(doc.querySelectorAll("#KnmTbl tr.dtTR"));
	trs.forEach(tr =>
	{
		const type = tr.querySelector("select[name=sltKnmKt]").value;
		// 出勤 or 振出
		const shouldFillTime = type === "1 1 100420 102139" || type === "1 1 100420 102158";
		const startInputBox = tr.querySelector("input[name=txtSTm]");
		const endInputBox = tr.querySelector("input[name=txtETm]");
		if (shouldFillTime)
		{
			startInputBox.value = "900";
			endInputBox.value = "1830";
		}
		else
		{
			startInputBox.value = "";
			endInputBox.value = "";
		}
	})
}

function createAutoFillButton()
{
	const autoUpdateButton = document.createElement("input");
	autoUpdateButton.setAttribute("type", "button");
	autoUpdateButton.setAttribute("id", "auto-fill-button");
	autoUpdateButton.setAttribute("title", "周末出勤换有休是振出。使用“换来的有休”是振休。")
	autoUpdateButton.value = "自动填写";
	autoUpdateButton.style.fontFamily = "微软雅黑";
	autoUpdateButton.style.cursor = "pointer";
	autoUpdateButton.style.paddingTop = "0";
	autoUpdateButton.style.paddingBottom = "0";
	return autoUpdateButton;
}

async function kindaiOnClick()
{
	console.info("Clicked button 勤務時間")
	const formFrame = await waitUntilFrameLoaded("WM_FUNC");
	console.info("Loaded 勤務時間 frame", formFrame);
	const updateButton = formFrame.contentDocument.querySelector("input.Button");
	const autoUpdateButton = createAutoFillButton();
	updateButton.parentNode.appendChild(autoUpdateButton);
	autoUpdateButton.addEventListener("click", autoFillForm);
}

async function init()
{
	console.info("Page loaded");
	const menuFrame = await waitUntilFrameLoaded("WM_MENU");
	console.info("Loaded menu frame", menuFrame);
	const kindaiButton = menuFrame.contentDocument.querySelector("input[type=button]");
	kindaiButton.addEventListener("click", kindaiOnClick);
}

init();

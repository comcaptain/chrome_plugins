const THREAD_LINK_SELECTOR = "tbody[id^=normalthread] span[id^=thread] > a[href^=thread-]";
const infoPre = document.createElement("pre");
infoPre.textContent = [].slice.apply(document.querySelectorAll(THREAD_LINK_SELECTOR)).map(a => a.textContent).join("\n");
document.body.prepend(infoPre);

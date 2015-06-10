# chrome_plugins

- css/javascript inject, [Chrome Web Store link](https://chrome.google.com/webstore/detail/css-and-javascript-inject/ckddknfdmcemedlmmebildepcmneakaa)

### version 1.0.5 update log ###

- fix ace editor redraw bug
- now js will only be executed when page is loaded
- add external css resource tab
  - urls are seperated by line
  - you can use alias for url, now there's only one alias(`bootstrap -> https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css`). Contact me if you have other need for alias(master@pygmalion.click)
- now js will be executed before the page is fully rendered to avoid FOUC
- now you can inject jquery code in pages without jquery(jquery-2.1.4)

### version 1.0.6 update log ###

- guarantee injected css/js appear after original page's css/js references in head tag
- fix updateCss execution timeline
- fix bug: do not update css after css text is cleared
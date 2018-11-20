/* global document, window */

let scrollTitles = [];

function updateScrollTitles() {
  scrollTitles = document.getElementsByClassName('js-hashtitle');
}

function setHashFromScroll() {
  const scrollTop = document.querySelector('.sdldocs-components').scrollTop;
  let minTitleCloseness = Infinity;
  let closestTitle = null;
  for (var i = 0; i < scrollTitles.length; i++) {
    var title = scrollTitles[i];
    var titleCloseness = Math.abs(scrollTop - title.offsetTop);
    if (titleCloseness < minTitleCloseness) {
      minTitleCloseness = titleCloseness;
      closestTitle = title;
    }

    if (closestTitle !== null && titleCloseness > minTitleCloseness) {
      // We're not finding closer titles now
      break;
    }
  }
  if (closestTitle) {
    const anchor = closestTitle.getAttribute('href').slice(1);
    selectNavItem(anchor);
  }
}


}

window.ignoreScroll = false;

// Set the hash while scrolling
var lastTime = 0;
var scrollTimeDelay = 100;
var hashTimeout;
document
  .querySelector('.sdldocs-components')
  .addEventListener('scroll', function() {
    clearTimeout(hashTimeout);
    if (window.ignoreScroll) {
      return;
    }
    var time = Date.now();
    if (time - lastTime > scrollTimeDelay) {
      setHashFromScroll();
      lastTime = time;
    }
    else {
      hashTimeout = setTimeout(setHashFromScroll, scrollTimeDelay);
    }
  });

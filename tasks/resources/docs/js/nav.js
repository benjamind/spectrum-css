/* global document, window, fetch */

///////////////////////////////////////////////////////////////////////////////
// Utility functions
///////////////////////////////////////////////////////////////////////////////

function parseQuery(queryString) {
  var query = {};
  var pairs = (queryString[0] === '?'
    ? queryString.substr(1)
    : queryString
  ).split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
}

///////////////////////////////////////////////////////////////////////////////
// Color stop handling
///////////////////////////////////////////////////////////////////////////////

/**
 * Applies the color stop to the state
 * @param {string} colorStop
 */
function changeCSS(colorStop) {
  const newState = Object.assign({}, navState, {
    color: colorStop,
  });
  newState.url = generateUrl(newState);
  render(newState, navState);
}

/**
 * Renders the color stop by applying stylesheets
 * @param {string} colorStop
 */
function renderColorStop(colorStop) {
  // update the dom to use the new CSS style
  Array.prototype.forEach.call(
    document.getElementsByClassName('spectrum'),
    function(el) {
      el.classList.remove('spectrum--lightest');
      el.classList.remove('spectrum--light');
      el.classList.remove('spectrum--dark');
      el.classList.remove('spectrum--darkest');
      el.classList.add('spectrum--' + colorStop);
    }
  );

  const rainbowStyleLink = document.querySelector('link[data-rainbow]');
  let cssUrl = 'css/vendor/blackboard.css';
  if (colorStop === 'light' || colorStop === 'lightest') {
    cssUrl = 'css/vendor/github.css';
  }
  rainbowStyleLink.setAttribute('href', cssUrl);

  // update dropdowns with current state
  const colorstopDropdown = document.querySelector('#colorstop');
  colorstopDropdown.value = colorStop; // will NOOP if change was driven by dropdown
}

///////////////////////////////////////////////////////////////////////////////
// Scale handling
///////////////////////////////////////////////////////////////////////////////

/**
 * Applies the scale and method state changes
 * @param {string} scale
 * @param {string} method
 */
function changeScale(scale, method) {
  const newState = Object.assign({}, navState, {
    scale: scale,
    method: method,
  });
  newState.url = generateUrl(newState);
  render(newState, navState);
}

// constant for lookup
const scaleAbbreviations = {
  medium: 'md',
  large: 'lg',
};

/**
 * Renders the scale changes by applying stylesheets
 * @param {string} scale
 * @param {string} method
 */
function renderScale(scale, method, page, anchor) {
  let linkCore = document.querySelector('link[data-spectrum-core]');
  let linkDiff = document.querySelector('link[data-spectrum-core-diff]');
  if (linkCore) {
    linkCore.remove();
  }
  if (linkDiff) {
    linkDiff.remove();
  }

  linkCore = document.createElement('link');
  linkCore.setAttribute('rel', 'stylesheet');

  linkDiff = document.createElement('link');
  linkDiff.setAttribute('rel', 'stylesheet');

  if (method === 'diff') {
    linkCore.setAttribute('href', '../spectrum-core.css');
    linkDiff.setAttribute('href', '../spectrum-core-diff.css');
  }
  else if (method === 'standalone') {
    if (scale !== 'medium') {
      linkCore.setAttribute(
        'href',
        '../spectrum-core-' + scaleAbbreviations[scale] + '.css'
      );
    }
    else {
      linkCore.setAttribute('href', '../spectrum-core.css');
    }
    linkDiff.setAttribute('href', '');
  }
  // add load listeners
  const updateOnScaleChange = function() {
    const anchorEl = document.querySelector('#' + anchor);
    if (anchorEl) {
      anchorEl.scrollIntoView();
    }
    updateNavSelection(page, anchor);
  };
  linkCore.addEventListener('load', updateOnScaleChange);
  linkDiff.addEventListener('load', updateOnScaleChange);

  // append the new stylesheets
  document.body.appendChild(linkCore);
  document.body.appendChild(linkDiff);

  Object.keys(scaleAbbreviations).forEach(function(otherScale) {
    document.documentElement.classList.remove('spectrum--' + otherScale);
  });
  document.documentElement.classList.add('spectrum--' + scale);

  // Swap out icons
  // var uiIcons = scale === 'medium' ? mediumIcons : largeIcons;
  // var oldUIIcons = scale != 'medium' ? mediumIcons : largeIcons;
  // document.head.insertBefore(uiIcons, null);
  // if (oldUIIcons.parentElement) {
  //   oldUIIcons.parentElement.removeChild(oldUIIcons);
  // }

  // update dropdowns with current state
  const scaleDropdown = document.querySelector('#scale');
  scaleDropdown.value = scale + ',' + method; // will NOOP if change was driven by dropdown
}

///////////////////////////////////////////////////////////////////////////////
// Scroll handling
///////////////////////////////////////////////////////////////////////////////

function updateNavSelection(page, anchor, noScroll) {
  const href = '?page=' + page + '#' + anchor;
  const navLink = document.querySelector('.sdldocs-nav [href="' + href + '"]');
  const selectedNavItem = document.querySelector('.sdldocs-nav .is-selected');
  if (navLink) {
    const navItem = navLink.parentElement;

    if (navItem != selectedNavItem) {
      if (selectedNavItem) {
        selectedNavItem.classList.remove('is-selected');
      }
    }
    navItem.classList.add('is-selected');
    if (!noScroll) {
      navItem.scrollIntoView();
    }
  }
}
///////////////////////////////////////////////////////////////////////////////

// the state of the page
let navState = {};

/**
 * Generates the URL for the page given the state
 * @param {object} params
 */
function generateUrl(params) {
  let url =
    '?page=' +
    params.page +
    '&scale=' +
    params.scale +
    '&color=' +
    params.color +
    '&method=' +
    params.method;
  if (params.anchor) {
    url += '#' + params.anchor;
  }
  return url;
}

/**
 * Creates a state, given parameters, and applying defaults
 * @param {object} params
 */
function createState(params) {
  params = params || {};
  const page = params.page || 'accordion';
  const state = {
    file: page + '.html',
    page: page,
    anchor: params.anchor || '',
    method: params.method || 'standalone',
    color: params.color || 'light',
    scale: params.scale || 'medium',
    url: '',
  };
  state.url = generateUrl(state);
  return state;
}

/**
 * Updates the state to navigate to a specific page and anchor
 * @param {string} page
 * @param {string} anchor
 */
function navigate(page, anchor) {
  const newState = Object.assign({}, navState, {
    file: page + '.html',
    page: page,
    anchor: anchor,
  });
  newState.url = generateUrl(newState);
  render(newState, navState);
}

/**
 * Renders the state, applying changes as necessary based on diffing the states
 * @param {object} newState
 * @param {object} oldState
 * @param {boolean} recordState
 */
function render(newState, oldState, recordState) {
  // no state change
  if (newState === oldState) {
    return;
  }
  // did the file we want to display change?
  if (newState.file !== oldState.file) {
    // load the relevant snippet
    // TODO: handle cancelling previous request
    fetch(newState.file)
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        document.querySelector('#components').innerHTML = html;
        Promise.resolve().then(() => {
          if (!newState.anchor) {
            return;
          }
          const anchorEl = document.querySelector('#' + newState.anchor);
          if (anchorEl) {
            anchorEl.scrollIntoView();
          }
        });
      });
  }
  // did the color selection change?
  if (newState.color !== oldState.color) {
    renderColorStop(newState.color);
  }
  if (
    newState.scale !== oldState.scale ||
    newState.method !== oldState.method
  ) {
    renderScale(
      newState.scale,
      newState.method,
      newState.page,
      newState.anchor
    );
  }
  // apply anchor nav after scale so that we take into account resize
  if (newState.anchor !== oldState.anchor) {
    const anchorEl = document.querySelector('#' + newState.anchor);
    if (anchorEl) {
      anchorEl.scrollIntoView();
    }
    // update the nav bar when anchors change
    updateNavSelection(newState.page, newState.anchor, true);
  }
  // store state, update history
  navState = newState;
  if (!recordState) {
    window.history.pushState(navState, null, navState.url);
  }
}

/**
 * Handles navigation click events
 * @param {ClickEvent} ev
 */
function handleNavClick(ev) {
  /* mutate navState */
  if (!ev.target || !ev.target.href) {
    return;
  }
  ev.preventDefault();
  const href = ev.target.href;
  // get the query parameters
  const params = parseQuery(
    href.slice(href.lastIndexOf('?') + 1, href.lastIndexOf('#'))
  );
  const anchor = href.slice(href.lastIndexOf('#') + 1);
  navigate(params.page, anchor);
}

/**
 * Handles forward/backward history changes
 * @param {HistoryEvent} event
 */
window.onpopstate = function(event) {
  if (event.state) {
    const newState = Object.assign({}, event.state);
    render(newState, navState, true); // pass true to prevent recording this state
    navState = newState;
  }
};

window.addEventListener('DOMContentLoaded', function() {
  // add event listener for side bar navigations
  // TODO: extend to capture clicks from anywhere in the DOM
  const sideNav = document.querySelector('.spectrum-SideNav');
  sideNav.addEventListener('click', handleNavClick);
  // add color stop selector
  const colorStop = document.querySelector('#colorstop');
  colorStop.addEventListener('change', function() {
    const newStop = this[this.selectedIndex].value;
    changeCSS(newStop);
  });
  // add scale listener
  const scale = document.querySelector('#scale');
  scale.addEventListener('change', function() {
    const scaleParams = this[this.selectedIndex].value.split(','); // extract scale, method
    changeScale(scaleParams[0], scaleParams[1]);
  });
  // parse query parameters
  const params = parseQuery(window.location.search);
  params.anchor = window.location.hash.slice(1);
  // generate the new state
  const newState = createState(params);

  // render the view
  render(newState, navState);
  // update the nav bar when anchors change
  updateNavSelection(newState.page, newState.anchor);
});

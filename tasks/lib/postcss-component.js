const postcss = require('postcss');

function processClassRule(rule, componentName, parentNode) {
  // find and replace class selectors with componentName prefix
  const regexp = new RegExp(/(:?^|(\s+))\./, 'g');
  // rewrite the selector
  if (regexp.test(rule.selector)) {
    console.log('rewriting class selector :' + rule.selector);
    const expandedSelector = rule.selector.replace(
      regexp,
      `$1.spectrum-${componentName}-`
    );
    rule.selector = expandedSelector;
    parentNode.append(rule);
  }
}

function processIdRule(rule, componentName, parentNode) {
  // find and replace class selectors with componentName prefix
  const regexp = new RegExp(/(:?^|(\s+))#(.*?)[\s:$]/, 'g');
  // rewrite the selector
  if (regexp.test(rule.selector)) {
    console.log('rewriting id selector :' + rule.selector);
    const expandedSelector = rule.selector.replace(
      regexp,
      `.spectrum-${componentName}-$1`
    );
    rule.selector = expandedSelector;
    parentNode.append(rule);
  }
}
function expandComponentForCSS(rule, params, parentNode) {
  const componentName = params[0];
  // walk all nodes in this rule
  rule.each((childNode) => {
    // if the node is itself a rule
    if (childNode.type === 'rule') {
      const childRule = childNode;
      // if its the host selector, rewrite to use component name
      if (childRule.selector === ':host') {
        childRule.selector = `.spectrum-${componentName}`;
        parentNode.append(childRule);
      }
 else {
        // process all other rules to rewrite their selectors
        processClassRule(childRule, componentName, parentNode);
        // processIdRule(childRule, componentName, parentNode);
      }
    }
 else {
      // otherwise just move the node
      parentNode.append(childNode);
    }
  });
  rule.remove();
}
function expandComponentForWC(rule, params, parentNode) {
  // walk all nodes in this rule
  rule.each((childNode) => {
    // just move the nodes up
    parentNode.append(childNode);
  });
  rule.remove();
}
function rewriteContentSelector(selector, content, parentComponentName) {
  const regexp = new RegExp(/content\(\s*(.*?)\s*\)/);
  const match = regexp.exec(content);
  if (!match) {
    throw new Error('content function used without parameters!');
  }
  const contentName = match[1];
  const contentSelector = `.spectrum-${parentComponentName}-${contentName}`;
  return selector.replace(content, contentSelector);
}

function rewriteComponentSelector(selector, component) {
  const regexp = new RegExp(/component\(\s*(.*?)\s*\)/);
  const match = regexp.exec(component);
  if (!match) {
    throw new Error('component function used without parameters!');
  }
  const componentName = match[1];
  const componentSelector = `.spectrum-${componentName}`;
  return selector.replace(component, componentSelector);
}

function rewriteAttributeSelector(selector, attribute, parentComponentName) {
  const regexp = new RegExp(/attribute\(\s*(.*?)\s*\)/);
  const match = regexp.exec(attribute);
  if (!match) {
    throw new Error('attribute function used without parameters!');
  }
  const attributeName = match[1];
  const attributeSelector = `.spectrum-${parentComponentName}-${attributeName}`;
  return selector.replace(attribute, attributeSelector);
}
function rewriteVariantSelector(selector, variant, parentComponentName) {
  const regexp = new RegExp(/variant\(\s*(.*?)\s*\)/);
  const match = regexp.exec(variant);
  if (!match) {
    throw new Error('variant function used without parameters!');
  }
  const variantName = match[1];
  const variantSelector = `.spectrum-${parentComponentName}--${variantName}`;
  return selector.replace(variant, variantSelector);
}
function rewriteStateSelector(selector, state) {
  const regexp = new RegExp(/state\(\s*(.*?)\s*\)/);
  const match = regexp.exec(state);
  if (!match) {
    throw new Error('state function used without parameters!');
  }
  let stateName = match[1];
  if (!stateName.startsWith(':')) {
    stateName = `.is-${stateName}`;
  }
  const stateSelector = `&${stateName}`;
  return selector.replace(state, stateSelector);
}
module.exports = postcss.plugin('component', function component(options) {
  return function(css) {
    options = options || {};
    let componentName;
    css.walkAtRules(function(node) {
      if (node.name !== 'component') {
        return;
      }
      // split the params from the at-rule
      const params = node.params.split(/\s/);
      if (params.length === 0) {
        node.warn('@component rule without component name!');
        node.remove();
        return; // nothing to do, no arguments
      }
      componentName = params[0];
      expandComponentForCSS(node, params, css);
      //expandComponentForWC(node, params, css);
    });
    if (!componentName) {
      return;
    }
    css.walk(function(node) {
      if (node.type === 'rule') {
        // regex match for supported functions
        const regexp = new RegExp(
          /content\(.*?\)|component\(.*?\)|attribute\(.*?\)|variant\(.*?\)|state\(.*?\)/
        );
        if (regexp.test(node.selector)) {
          // something matched, iterate over each selector in the node and reapply the match
          // then process the expansion for that selector
          console.log('rule: ' + node.selector);
          const rewrittenSelectors = [];
          node.selectors.forEach((selector) => {
            console.log('  selector: ' + selector);
            let rewrittenSelector = selector;
            let matches;
            const regexp2 = new RegExp(
              /(content\(.*?\))|(component\(.*?\))|(attribute\(.*?\))|(variant\(.*?\))|(state\(.*?\))/g
            );
            while ((matches = regexp2.exec(selector)) !== null) {
              if (matches[1]) {
                rewrittenSelector = rewriteContentSelector(
                  rewrittenSelector,
                  matches[1],
                  componentName
                );
              }
              if (matches[2]) {
                rewrittenSelector = rewriteComponentSelector(
                  rewrittenSelector,
                  matches[2],
                  componentName
                );
              }
              if (matches[3]) {
                rewrittenSelector = rewriteAttributeSelector(
                  rewrittenSelector,
                  matches[3],
                  componentName
                );
              }
              if (matches[4]) {
                rewrittenSelector = rewriteVariantSelector(
                  rewrittenSelector,
                  matches[4],
                  componentName
                );
              }
              if (matches[5]) {
                rewrittenSelector = rewriteStateSelector(
                  rewrittenSelector,
                  matches[5],
                  componentName
                );
              }
            }
            rewrittenSelectors.push(rewrittenSelector);
          });
          node.selector = rewrittenSelectors.join(',\n');
        }
      }
    });
  };
});

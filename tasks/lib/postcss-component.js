const postcss = require("postcss");

function prefixClassNames(node, componentName) {
  // find and replace class selectors with componentName prefix
  const regexp = new RegExp(/(?:^|(\s+))\./, "g");
  // rewrite the selector
  if (regexp.test(node.selector)) {
    const expandedSelector = node.selector.replace(
      regexp,
      `$1.spectrum-${componentName}-`
    );
    node.selector = expandedSelector;
  }
}
function rewriteIdSelector(node, componentName) {
  // find and replace class selectors with componentName prefix
  const regexp = new RegExp(/#(.*?)(?:\s|:|$)/, "g");
  // rewrite the selector
  if (regexp.test(node.selector)) {
    console.log("rewriting id selector :" + node.selector);
    const expandedSelector = node.selector.replace(
      regexp,
      `.spectrum-${componentName}-$1`
    );
    node.selector = expandedSelector;
  }
}
function rewriteHostSelector(node, componentName) {
  // find and replace class selectors with componentName prefix
  const regexp = new RegExp(/:host/);
  // rewrite the selector
  if (regexp.test(node.selector)) {
    console.log("rewriting id selector :" + node.selector);
    const expandedSelector = node.selector.replace(
      regexp,
      `.spectrum-${componentName}`
    );
    node.selector = expandedSelector;
  }
}
function applyFunction(
  node,
  selector,
  functionName,
  params,
  parentComponentName,
  matchedSelector
) {
  switch (functionName) {
    case "content":
      const contentSelector = `.spectrum-${parentComponentName}-${params}`;
      return selector.replace(matchedSelector, contentSelector);
    case "component":
      const componentSelector = `.spectrum-${params}`;
      return selector.replace(matchedSelector, componentSelector);
    case "attribute":
      const attributeSelector = `.spectrum-${parentComponentName}-${params}`;
      return selector.replace(matchedSelector, attributeSelector);
    case "variant":
      const variantSelector = `.spectrum-${parentComponentName}--${params}`;
      return selector.replace(matchedSelector, variantSelector);
    case "state":
      if (!params.startsWith(":")) {
        params = `.is-${params}`;
      }
      const stateSelector = `&${params}`;
      return selector.replace(matchedSelector, stateSelector);
    default:
      return selector;
  }
}
function applyFunctions(node, componentName) {
  // regex match for supported functions
  const functionNames = [
    "content",
    "component",
    "attribute",
    "variant",
    "state"
  ];
  const functionRegexp = new RegExp(`(${functionNames.join("|")})\\(.*?\\)`);
  if (functionRegexp.test(node.selector)) {
    // we are using at least one function in this selector
    //console.log("rule: " + node.selector);
    const rewrittenSelectors = [];
    // iterate over each selector
    node.selectors.forEach(selector => {
      //console.log("  selector: " + selector);
      let rewrittenSelector = selector;
      let matches;
      // construct a new regexp instance to test this selector
      const extractRegexp = new RegExp(
        `(${functionNames.join("|")})\\((.*?)\\)`,
        "g" // use global flag since we want to iteratively apply this match
      );
      // repeatedly apply the regexp until we have no more expansions to process
      while ((matches = extractRegexp.exec(selector)) !== null) {
        // apply the function
        const matchedSelector = matches[0];
        const functionName = matches[1];
        const params = matches[2];
        rewrittenSelector = applyFunction(
          node,
          rewrittenSelector,
          functionName,
          params,
          componentName,
          matchedSelector
        );
      }
      // build a new list of selectors
      rewrittenSelectors.push(rewrittenSelector);
    });
    // replace the existing selector string with our new set
    node.selector = rewrittenSelectors.join(",\n");
  }
}
module.exports = postcss.plugin("component", function component(options) {
  return function(css) {
    options = options || {};
    let componentName;

    /*
    # concept of operation
    walk down the at-rule tree until we find a component rule
      rewrite class selector to prefix with component name
      rewrite id selector to class selector
      rewrite host selector to class selector
      apply our special functions to expand to full names
      move all component content up to parent node and delete component rule
    */

    css.walkAtRules(function(atRuleNode) {
      // skip over at rules that are not @component
      if (atRuleNode.name !== "component") {
        return;
      }
      // split the params from the at-rule
      const params = atRuleNode.params.split(/\s/);
      if (params.length === 0) {
        atRuleNode.warn("@component rule without component name!");
        atRuleNode.remove();
        return; // nothing to do, no arguments
      }
      // our component name was found
      componentName = params[0];
      console.log(`processing @component(${componentName})`);

      atRuleNode.walk(function(node) {
        if (node.type === "rule") {
          // first translate class names with component name prefix
          prefixClassNames(node, componentName);
          // now translate ids into component name prefixed classes
          rewriteIdSelector(node, componentName);
          // rewrite :host selectors to component name class selector
          rewriteHostSelector(node, componentName);
          // finally apply our semantic expansion functions
          applyFunctions(node, componentName);
        }
      });
      const parentNode = atRuleNode.parent;
      atRuleNode.each(child => {
        child.cleanRaws();
        parentNode.append(child);
      });
      atRuleNode.remove();
    });
  };
});

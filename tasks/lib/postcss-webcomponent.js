const postcss = require("postcss");

const getComponentName = componentName => {
  let ret = "";
  let prevLowercase = false;

  for (let s of componentName) {
    const isUppercase = s.toUpperCase() === s;
    if (isUppercase && prevLowercase) {
      ret += "-";
    }

    ret += s;
    prevLowercase = !isUppercase;
  }

  return ret.replace(/-+/g, "-").toLowerCase();
};

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
      // content(foo,bar) -> slot[name=foo]::slotted(bar)
      const [slot, slotted = "*"] = params.split(",").map(param => {
        return param.trim();
      });
      const contentSelector = `slot[name="${slot}"]::slotted(${slotted})`;
      return selector.replace(matchedSelector, contentSelector);
    case "component":
      const componentCaseName = getComponentName(params);
      const componentSelector = `spectrum-${componentCaseName}`;
      return selector.replace(matchedSelector, componentSelector);
    case "attribute":
      const attributeSelector = `.spectrum-${parentComponentName}-${params}`;
      return selector.replace(matchedSelector, attributeSelector);
    case "variant":
      const variantSelector = `:host([${params}])`;
      return selector.replace(matchedSelector, variantSelector);
    case "state":
      if (!params.startsWith(":")) {
        params = `[${params}]`;
      }
      if (node.parent.selector.endsWith(":host")) {
        params = `(${params})`;
      }
      const stateSelector = `&${params}`;
      return selector.replace(matchedSelector, stateSelector);
    default:
      return selector;
  }
}
function processSelector(selector, functionNames, node, componentName) {
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
  return rewrittenSelector;
}
function applyFunctions(node, componentName) {
  // regex match for supported functions
  const functionNames = [
    "component",
    "attribute",
    "variant",
    "state",
    "content"
  ];
  const functionRegexp = new RegExp(`(${functionNames.join("|")})\\(.*?\\)`);
  if (functionRegexp.test(node.selector)) {
    // we are using at least one function in this selector
    //console.log("rule: " + node.selector);
    const rewrittenSelectors = [];
    // iterate over each selector
    node.selectors.forEach(selector => {
      //console.log("  selector: " + selector);
      let matches;
      const primaryFunctions = ["component", "attribute", "variant", "state"];
      const secondaryFunctions = ["content"];
      // first apply the primary functions
      let rewrittenSelector = processSelector(
        selector,
        primaryFunctions,
        node,
        componentName
      );
      // then apply secondary functions
      rewrittenSelector = processSelector(
        rewrittenSelector,
        secondaryFunctions,
        node,
        componentName
      );
      // store the updated selector
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

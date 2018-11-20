var markdown = require('markdown').markdown;

const labelColors = {
  Deprecated: 'red',
  'Beta Precursor': 'orange',
  Precursor: 'yellow',
  'CSS Unverified': 'yellow',
  Canon: 'green',
  'CSS Verified': 'green'
};

const dnaStatusTranslation = {
  Released: 'Canon',
  Beta: 'Precursor'
};

const cssStatusTranslation = {
  Beta: 'CSS Unverified',
  Verified: 'CSS Verified'
};

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

function getLabelColor(status) {
  return labelColors[status] || 'grey';
}

function getDNAStatus(dnaComponentId, dnaStatus, cssStatus) {
  if (cssStatus === 'Deprecated') {
    dnaStatus = 'Deprecated';
  }

  if (cssStatus === 'CSS Verified') {
    if (dnaStatus !== 'Released') {
      console.log(
        `${dnaComponentId} is ${cssStatus} in CSS, but ${dnaStatus} in DNA`
      );
      dnaStatus = 'Canon';
    }
  }

  if (!dnaStatus) {
    console.log(`${dnaComponentId} has no DNA status`);
    dnaStatus = 'Beta Precursor';
  }

  return dnaStatusTranslation[dnaStatus] || dnaStatus;
}

function getCSSStatus(dnaComponentId, cssStatus) {
  if (cssStatus === 'Released' || !cssStatus) {
    cssStatus = 'CSS Unverified';
  }
  return cssStatusTranslation[cssStatus] || cssStatus;
}

function applyDefaults(component, dnaVars) {
  var dnaComponentId = component.id || component.filename;
  var dnaComponentTitle = dnaVars['spectrum-' + dnaComponentId + '-name'];

  var dnaDescription = dnaVars['spectrum-' + dnaComponentId + '-description'];

  var cssStatus = getCSSStatus(dnaComponentId, component.status);
  var dnaStatus = getDNAStatus(
    dnaComponentId,
    dnaVars['spectrum-' + dnaComponentId + '-status'] || component.dnaStatus,
    cssStatus
  );

  // Store the info
  component.name = component.name || dnaComponentTitle;
  component.slug = slugify(component.name);
  component.cssStatus = cssStatus;
  component.dnaStatus = dnaStatus;
  component.cssColor = getLabelColor(component.cssStatus);
  component.dnaColor = getLabelColor(component.dnaStatus);

  // Add other data
  component.id = dnaComponentId;
  component.description = component.description || '';

  if (component.components) {
    for (var subComponentId in component.components) {
      var subComponent = {};
      if (typeof component.components[subComponentId] === 'string') {
        // Shorthand
        subComponent.markup = component.components[subComponentId];
        subComponent.id = subComponentId;
      }
 else {
        // Verbose
        subComponent = component.components[subComponentId];
        subComponent.id = subComponent.id || subComponentId;
      }

      // Gather DNA data
      subComponent.description = subComponent.description || '';
      var subComponentDNADescription =
        dnaVars['spectrum-' + subComponent.id + '-description'];
      if (subComponentDNADescription && !subComponent.ignoreDNA) {
        subComponent.description =
          subComponentDNADescription + '\n\n' + subComponent.description;
      }

      subComponent.name =
        subComponent.name || dnaVars['spectrum-' + subComponent.id + '-name'];

      if (subComponent.description) {
        subComponent.description = markdown.toHTML(subComponent.description);
      }

      if (subComponent.details) {
        subComponent.details = markdown.toHTML(subComponent.details);
      }

      subComponent.cssStatus = getCSSStatus(
        subComponent.id,
        subComponent.status
      );
      subComponent.cssColor = getLabelColor(subComponent.cssStatus);
      subComponent.dnaStatus = getDNAStatus(
        subComponent.id,
        dnaVars['spectrum-' + subComponent.id + '-status'] ||
          subComponent.dnaStatus,
        subComponent.cssStatus
      );
      subComponent.dnaColor = getLabelColor(subComponent.dnaStatus);

      // Store the object back
      component.components[subComponentId] = subComponent;
    }
  }
 else if (dnaDescription && !component.ignoreDNA) {
    component.description = dnaDescription + '\n\n' + component.description;
  }

  if (component.description) {
    component.description = markdown.toHTML(component.description);
  }

  if (component.details) {
    component.details = markdown.toHTML(component.details);
  }
  return component;
}

module.exports = {
  applyDefaults,
  slugify
};

var gulp = require('gulp');
var path = require('path');
var fs = require('fs');
var rename = require('gulp-rename');
var data = require('gulp-data');
var pug = require('gulp-pug');
var merge = require('merge-stream');

var getFolders = require('../lib/get-folders');
var applyDefaults = require('../lib/component-defaults').applyDefaults;

gulp.task('generate-docs:render-component', function(done) {
  var docsPath = path.resolve('docs');
  var folders = getFolders(docsPath);

  if (folders.length === 0) return done(); // nothing to do!

  // read dna vars file
  var dnaVars = JSON.parse(
    fs.readFileSync(path.join('.', 'vars', 'spectrum-metadata.json'), 'utf-8')
  );
  var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

  const indexMetadata = JSON.parse(fs.readFileSync('./temp/index.json'));

  var tasks = folders.map(function(folder) {
    return gulp
      .src('./tasks/docs/component-template.pug')
      .pipe(
        rename({
          basename: folder,
          extname: '.html'
        })
      )
      .pipe(
        data(function() {
          const componentMetadata = JSON.parse(
            fs.readFileSync('./temp/components/' + folder + '.json')
          );
          const components = Object.keys(componentMetadata).map(
            componentName => {
              return applyDefaults(componentMetadata[componentName], dnaVars);
            }
          );
          return {
            document: {
              components
            },
            index: indexMetadata,
            dnaVars,
            pkg
          };
        })
      )
      .pipe(
        pug({
          pretty: true
        })
      )
      .pipe(gulp.dest('dist/gendocs'));
  });
  return merge(tasks);
});

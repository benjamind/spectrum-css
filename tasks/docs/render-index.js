var gulp = require('gulp');
var path = require('path');
var fs = require('fs');
var rename = require('gulp-rename');
var data = require('gulp-data');
var pug = require('gulp-pug');

var getFolders = require('../lib/get-folders');

gulp.task('generate-docs:render-index', function(done) {
  var docsPath = path.resolve('docs');
  var folders = getFolders(docsPath);

  if (folders.length === 0) return done(); // nothing to do!

  // read dna vars file
  var dnaVars = JSON.parse(
    fs.readFileSync(path.join('.', 'vars', 'spectrum-metadata.json'), 'utf-8')
  );
  var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

  const indexMetadata = JSON.parse(fs.readFileSync('./temp/index.json'));

  return gulp
    .src('./tasks/docs/index-template.pug')
    .pipe(
      rename({
        basename: 'index',
        extname: '.html'
      })
    )
    .pipe(
      data(function() {
        return {
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

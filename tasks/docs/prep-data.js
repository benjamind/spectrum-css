var gulp = require('gulp');
var path = require('path');
var yaml = require('gulp-yaml');
var mergeJson = require('gulp-merge-json');
var merge = require('merge-stream');

var getFolders = require('../lib/get-folders');

gulp.task('generate-docs:prep-data', function(done) {
  var docsPath = path.resolve('docs');
  var folders = getFolders(docsPath);

  if (folders.length === 0) return done(); // nothing to do!

  var tasks = folders.map(function(folder) {
    return gulp
      .src(path.join(docsPath, folder, '/**/*.yml'))
      .pipe(yaml({ schema: 'DEFAULT_SAFE_SCHEMA' }))
      .pipe(
        mergeJson({
          fileName: folder + '.json',
          edit: (json, file) => {
            // Extract the filename and strip the extension
            var filename = path.basename(file.path),
              primaryKey = filename.replace(path.extname(filename), '');

            // Set the filename as the primary key for our JSON data
            var data = {};
            data[primaryKey] = json;

            return data;
          }
        })
      )
      .pipe(gulp.dest('./temp/components'));
  });
  return merge(tasks);
});

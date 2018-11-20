var gulp = require('gulp');
var path = require('path');
var mergeJson = require('gulp-merge-json');
var slugify = require('../lib/component-defaults').slugify;

gulp.task('generate-doc:create-index', function() {
  return gulp
    .src('./temp/components/*.json')
    .pipe(
      mergeJson({
        concatArrays: true,
        startObj: {
          components: []
        },
        fileName: 'index.json',
        edit: (json, file) => {
          const keys = Object.keys(json);
          const data = {
            components: []
          };
          keys.forEach(key => {
            const name = json[key].name;
            console.log('slugify(' + name + ') = ' + slugify(name));
            data.components.push({
              slug: path.basename(file.basename, path.extname(file.basename)),
              demo: slugify(name),
              name: name
            });
          });

          return data;
        }
      })
    )
    .pipe(gulp.dest('./temp'));
});

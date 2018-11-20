var gulp = require('gulp');
var replace = require('gulp-replace');
var rename = require('gulp-rename');

// import the other tasks
require('./create-index');
require('./prep-data');
require('./render-component');
require('./render-index');

gulp.task('generate-docs:copy-site-resources', function() {
  return gulp
    .src(['tasks/resources/docs/**', '!gh-pages.html'])
    .pipe(gulp.dest('dist/gendocs'));
});

gulp.task('generate-docs:copy-polyfill', function() {
  return gulp
    .src([require.resolve('@adobe/focus-ring-polyfill')])
    .pipe(rename('focus-ring-polyfill.js'))
    .pipe(gulp.dest('dist/gendocs/js/vendor/'));
});

gulp.task('generate-docs:copy-spectrum-icons', function() {
  return gulp
    .src([
      'node_modules/@spectrum/spectrum-icons/dist/svg/**',
      'node_modules/@spectrum/spectrum-icons/dist/lib/**'
    ])
    .pipe(gulp.dest('dist/icons/'));
});

gulp.task('generate-docs:rewrite-spectrum-icons', function() {
  return (
    gulp
      .src(['dist/icons/*.html'])
      // Use the local copy of spectrum-css
      .pipe(replace('../lib/', ''))
      .pipe(replace('../spectrum-css/', '../'))
      .pipe(gulp.dest('dist/icons/'))
  );
});

gulp.task(
  'generate-docs',
  gulp.series(
    'generate-docs:prep-data',
    'generate-doc:create-index',
    'generate-docs:render-index',
    'generate-docs:render-component',
    gulp.parallel(
      'generate-docs:copy-site-resources',
      'generate-docs:copy-polyfill',
      'generate-docs:copy-spectrum-icons'
    ),
    'generate-docs:rewrite-spectrum-icons'
  )
);

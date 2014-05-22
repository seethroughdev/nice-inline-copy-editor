'use strict';

var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

// set paths
var path = {
  src: {
    root: './src/',
    js: './src/js/'
  },
  dist: {
    root: './dist/',
    js: './dist/js/'
  }
};

var bundle = browserify(path.src.js + 'index.js').bundle();

/*==========  TASKS  ==========*/

gulp.task('browserify', function() {
  return bundle
    .pipe(source('bundle.js'))
    .pipe(gulp.dest(path.dist.js));
});

/*==========  RUN  ==========*/

gulp.task('watch', [ 'browserify' ], function() {
  gulp.watch(path.src.js + '**/*.js', [ 'browserify' ]);
});

gulp.task('default', [ 'watch' ]);

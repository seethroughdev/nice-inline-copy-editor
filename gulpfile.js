'use strict';

var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var livereload = require('gulp-livereload');


/*==========  CONFIG  ==========*/

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


/*==========  TASKS  ==========*/

gulp.task('js', function() {
  return browserify(path.src.js + 'index.js').bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest(path.dist.js))
    .pipe(livereload());
});


gulp.task('watch', [ 'js' ], function() {
  gulp.watch(path.src.js + '*.js', [ 'js' ]);
});


/*==========  RUN  ==========*/


gulp.task('default', [ 'watch' ]);

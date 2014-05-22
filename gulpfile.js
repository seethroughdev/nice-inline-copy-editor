'use strict';

var gulp = require('gulp')
,   browserify = require('browserify')
,   source = require('vinyl-source-stream')
,   livereload = require('gulp-livereload');


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
  return browserify(path.src.js + 'index.js').bundle({ debug:true })
    .pipe(source('bundle.js'))
    .pipe(gulp.dest(path.dist.js))
    .pipe(livereload());
});


gulp.task('watch', [ 'js' ], function() {
  gulp.watch(path.src.js + '*.js', [ 'js' ]);
});


/*==========  RUN  ==========*/


gulp.task('default', [ 'watch' ]);

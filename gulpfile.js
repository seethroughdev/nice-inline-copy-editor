'use strict';

var gulp = require('gulp')
,   browserify = require('browserify')
,   source = require('vinyl-source-stream')
,   uglify = require('gulp-uglify')
,   streamify = require('gulp-streamify')
,   gzip = require('gulp-gzip')
,   livereload = require('gulp-livereload')
,   sass = require('gulp-sass')
,   csso = require('gulp-csso');


/*==========  CONFIG  ==========*/

var path = {
  src: {
    root: './src/',
    js: './src/js/',
    css: './src/scss/'
  },
  dist: {
    root: './dist/'
  }
};


/*==========  TASKS  ==========*/

gulp.task('js', function() {
  return browserify(path.src.js + 'index.js').bundle({ debug:true })
    .pipe(source('bundle.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest(path.dist.root))
    .pipe(livereload());
});

gulp.task('css', function() {
  return gulp.src(path.src.css + '*.scss')
    .pipe(sass())
    .pipe(csso())
    .pipe(gulp.dest(path.dist.root))
    .pipe(livereload());
});


gulp.task('watch', [ 'js', 'css' ], function() {
  gulp.watch(path.src.js + '**', [ 'js' ]);
  gulp.watch(path.src.css + '**', [ 'css' ]);
});


/*==========  RUN  ==========*/


gulp.task('default', [ 'watch' ]);

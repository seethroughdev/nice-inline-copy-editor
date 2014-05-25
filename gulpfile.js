'use strict';

var gulp       = require('gulp')
,   browserify = require('browserify')
,   clean      = require('gulp-clean')
,   source     = require('vinyl-source-stream')
,   uglify     = require('gulp-uglify')
,   streamify  = require('gulp-streamify')
,   livereload = require('gulp-livereload')
,   sass       = require('gulp-sass')
,   prefix     = require('gulp-autoprefixer')
,   csso       = require('gulp-csso')
,   svgo       = require('gulp-svgo')
,   base64     = require('gulp-base64')
,   iconfont    = require('gulp-iconfont');


/*==========  CONFIG  ==========*/

var path = {
  src: {
    root: './src/',
    js: './src/js/',
    css: './src/scss/',
    svg: './src/svg/',
    images: './src/images/',
    font: './src/font/'
  },
  dist: {
    root: './dist/'
  }
};


/*==========  TASKS  ==========*/

gulp.task('js', function() {
  return browserify(path.src.js + 'index.js').bundle({ debug:true })
    .pipe(source('bundle.js'))
    // .pipe(streamify(uglify()))
    .pipe(gulp.dest(path.dist.root))
    .pipe(livereload());
});

gulp.task('css', function() {
  return gulp.src(path.src.css + '*.scss')
    .pipe(sass())
    .pipe(prefix('last 2 version', '> 1%'))
    .pipe(base64({
      debug: true
    }))
    // .pipe(csso())
    .pipe(gulp.dest(path.dist.root))
    .pipe(livereload());
});

gulp.task('svg', function() {
  return gulp.src(path.src.svg + '*.svg')
    .pipe(iconfont({
      fontName: 'myfont'
    }))
    .pipe(gulp.dest(path.src.font));
});

gulp.task('watch', [ 'js', 'svg', 'css' ], function() {
  gulp.watch(path.src.js + '**', [ 'js' ]);
  gulp.watch(path.src.images + '**', [ 'svg' ]);
  gulp.watch(path.src.css + '**', [ 'css' ]);
});


/*==========  RUN  ==========*/


gulp.task('default', [ 'watch' ]);

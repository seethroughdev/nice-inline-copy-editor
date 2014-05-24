'use strict';

var gulp       = require('gulp')
,   browserify = require('browserify')
,   source     = require('vinyl-source-stream')
,   uglify     = require('gulp-uglify')
,   streamify  = require('gulp-streamify')
,   gzip       = require('gulp-gzip')
,   livereload = require('gulp-livereload')
,   sass       = require('gulp-sass')
,   prefix     = require('gulp-autoprefixer')
,   csso       = require('gulp-csso')
,   svgo       = require('gulp-svgo')
,   base64     = require('gulp-base64');


/*==========  CONFIG  ==========*/

var path = {
  src: {
    root: './src/',
    js: './src/js/',
    css: './src/scss/',
    svg: './src/svg/',
    images: './src/images/'
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
      extensions: [ 'svg', 'png' ],
      debug: true
    }))
    .pipe(csso())
    .pipe(gulp.dest(path.dist.root))
    .pipe(livereload());
});

gulp.task('svg', function() {
  return gulp.src(path.src.images + '*.svg')
    .pipe(svgo())
    .pipe(gulp.dest(path.src.svg));
});


gulp.task('watch', [ 'js', 'css', 'svg' ], function() {
  gulp.watch(path.src.js + '**', [ 'js' ]);
  gulp.watch(path.src.css + '**', [ 'css' ]);
  gulp.watch(path.src.images + '**', [ 'svg' ]);
});


/*==========  RUN  ==========*/


gulp.task('default', [ 'watch' ]);

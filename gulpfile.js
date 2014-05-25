'use strict';

var gulp       = require('gulp')
,   browserify = require('browserify')
,   source     = require('vinyl-source-stream')
,   deploy     = require('gulp-gh-pages')
,   changed    = require('gulp-changed')
,   uglify     = require('gulp-uglify')
,   streamify  = require('gulp-streamify')
,   livereload = require('gulp-livereload')
,   sass       = require('gulp-sass')
,   prefix     = require('gulp-autoprefixer')
,   csso       = require('gulp-csso')
,   svgo       = require('gulp-svgo')
,   base64     = require('gulp-base64')
,   iconfont   = require('gulp-iconfont');


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
  },
  gh: {
    root: 'git@github.com:seethroughtrees/inline-copy-editor.git'
  }
};


/*==========  TASKS  ==========*/

gulp.task('js', function() {
  return browserify(path.src.js + 'index.js').bundle({ debug:true })
    .pipe(source('bundle.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest(path.dist.root));
});

gulp.task('css', function() {
  return gulp.src(path.src.css + '*.scss')
    .pipe(changed('path.dist.root', { extension: '.css' }))
    .pipe(sass())
    .pipe(prefix('last 2 version', '> 1%'))
    .pipe(base64())
    .pipe(csso())
    .pipe(gulp.dest(path.dist.root));
});

gulp.task('svg', function() {
  return gulp.src(path.src.svg + '*.svg')
    .pipe(iconfont({
      fontName: 'myfont'
    }))
    .pipe(gulp.dest(path.src.font));
});

gulp.task('watch', [ 'js', 'svg', 'css' ], function() {
  var server = livereload();

  gulp.watch(path.src.js + '**', [ 'js' ]);
  gulp.watch(path.src.images + '**', [ 'svg' ]);
  gulp.watch(path.src.css + '**', [ 'css' ]);

  gulp.watch(path.dist.root + '**').on('change', function(file) {
    server.changed(file.path);
  });

});

gulp.task('deploy', [ 'build' ], function() {
  gulp.src(path.dist.root + '**/*')
    .pipe(deploy(path.gh.root));
});


/*==========  RUN  ==========*/


gulp.task('default', [ 'watch' ]);

gulp.task('build', [ 'js', 'svg', 'css' ]);

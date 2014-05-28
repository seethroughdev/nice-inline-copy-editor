'use strict';

var gulp       = require('gulp')
,   browserify = require('browserify')
,   source     = require('vinyl-source-stream')
,   deploy     = require('gulp-gh-pages')
,   karma      = require('gulp-karma')
,   changed    = require('gulp-changed')
,   uglify     = require('gulp-uglify')
,   streamify  = require('gulp-streamify')
,   livereload = require('gulp-livereload')
,   gulpif     = require('gulp-if')
,   sass       = require('gulp-sass')
,   prefix     = require('gulp-autoprefixer')
,   csso       = require('gulp-csso')
,   htmlpretty = require('gulp-html-prettify')
,   imagemin   = require('gulp-imagemin')
,   svgo       = require('gulp-svgo')
,   base64     = require('gulp-base64')
,   iconfont   = require('gulp-iconfont');


/*==========  CONFIG  ==========*/

var env = process.env.NODE_ENV || 'development';

var path = {
  src: {
    root: './src/',
    js: './src/js/',
    css: './src/scss/',
    svg: './src/svg/',
    images: './src/images/',
    font: './src/font/',
    html: './src/html/'
  },
  dist: {
    root: './dist/'
  },
  gh: {
    root: 'git@github.com:seethroughtrees/nice-inline-copy-editor.git'
  }
};


/*==========  TASKS  ==========*/

gulp.task('js', function() {
  return browserify(path.src.js + 'index.js')
    .bundle({ debug:true })
    .pipe(source('bundle.js'))
    .pipe(gulpif(env === 'production', streamify(uglify())))
    .pipe(gulp.dest(path.dist.root));
});

gulp.task('css', function() {
  return gulp.src(path.src.css + '*.scss')
    .pipe(changed(path.dist.root, { extension: '.css' }))
    .pipe(sass())
    .pipe(prefix('last 2 version', '> 1%'))
    .pipe(base64())
    .pipe(gulpif(env === 'production', csso()))
    .pipe(gulp.dest(path.dist.root));
});

gulp.task('vendor', function() {
  return gulp.src(path.src.css + 'vendor/*.css')
    .pipe(changed(path.dist.root))
    .pipe(gulp.dest(path.dist.root));
});

gulp.task('svg', function() {
  return gulp.src(path.src.svg + '*.svg')
    .pipe(iconfont({
      fontName: 'myfont'
    }))
    .pipe(gulp.dest(path.src.font));
});

gulp.task('images', function() {
  return gulp.src(path.src.images + '*.png')
    .pipe(changed(path.dist.root + 'images/'))
    .pipe(imagemin())
    .pipe(gulp.dest(path.dist.root + 'images/'));
});

gulp.task('html', function() {
  return gulp.src(path.src.html + '*.html')
    .pipe(changed(path.dist.root))
    .pipe(htmlpretty())
    .pipe(gulp.dest(path.dist.root));
});


gulp.task('test', function() {
  return gulp.src('noop')
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'watch'
    }))
    .on('error', function(err) {
      throw err;
    });
});

gulp.task('build:test', function() {
  return gulp.src('noop')
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'run'
    }));
});


gulp.task('watch', [
  'js',
  'css',
  'vendor',
  'html',
  'images'
  ], function() {
  var server = livereload();

  gulp.watch(path.src.js + '**', [ 'js' ]);
  gulp.watch(path.src.images + '**', [ 'svg', 'images' ]);
  gulp.watch(path.src.css + '**', [ 'css' ]);
  gulp.watch(path.src.html + '**', [ 'html' ]);

  gulp.watch(path.dist.root + '**').on('change', function(file) {
    server.changed(file.path);
  });

});

gulp.task('deploy', [ 'build' ], function() {
  gulp.src(path.dist.root + '**/*')
    .pipe(deploy(path.gh.root));
});


/*==========  RUN  ==========*/


gulp.task('default', [ 'watch', 'test' ]);

gulp.task('build', [ 'js', 'css', 'vendor', 'html', 'images', 'build:test' ]);

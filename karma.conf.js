// Karma configuration
// Generated on Tue May 27 2014 22:36:54 GMT-0700 (PDT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [ 'mocha', 'jquery-1.11.0', 'chai', 'chai-jquery', 'browserify' ],


    // list of files / patterns to load in the browser
    files: [
      'src/js/**/*.js',
      'test/**/*.js'
    ],


    // list of files to exclude
    exclude: [
      'src/js/index.js'
    ],

    // Browserify config (all optional)
    browserify: {
      // extensions: ['.coffee'],
      // ignore: [],
      // transform: ['coffeeify'],
      debug: true,
      // noParse: ['jquery'],
      watch: true
    },


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        'src/js/**/*.js': ['browserify', 'coverage'],
        'test/**/*.js' : ['browserify']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    // reporters: ['progress'],
    reporters: ['progress', 'coverage'],

    // disabled coverage for now



    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // optionally, configure the reporter
    coverageReporter: {
      type : 'html',
      dir : '.coverage/'
    }

  });
};

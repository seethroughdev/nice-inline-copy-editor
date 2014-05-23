'use strict';

var $       = window.jQuery || require('domtastic')
,   nav     = require('./nav')
,   content = require('./content');

var events = function() {

  $('#nice-off').on('click', function(e) {
    e.preventDefault();
    content.removeNice();
  });

  $('#nice-diff').on('click', function(e) {
    e.preventDefault();
  });

  $('#nice-toggle').on('click', function(e) {
    e.preventDefault();
    content.toggleHTML();
    // window.console.log(content.originalHTML);
  });

};

module.exports = events;

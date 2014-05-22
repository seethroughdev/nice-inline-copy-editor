'use strict';

var $    = window.jQuery || require('domtastic')
,   nav  = require('./nav')
,   html = require('./html');

var events = function() {

  $('#ice-off').on('click', function(e) {
    e.preventDefault();
    nav.disable();
  });

  $('#ice-diff').on('click', function(e) {
    e.preventDefault();
  });

  $('#ice-toggle').on('click', function(e) {
    e.preventDefault();
    window.console.log(html.getHTML());
  });

};

module.exports = events;

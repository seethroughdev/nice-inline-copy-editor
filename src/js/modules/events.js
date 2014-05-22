'use strict';

var $ = window.jQuery || require('domtastic')
,   nav = require('./nav');

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
  });

};

module.exports = events;

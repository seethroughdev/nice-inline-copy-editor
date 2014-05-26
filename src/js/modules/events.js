'use strict';

var $       = require('domtastic/bundle/full/domtastic')
,   diff    = require('./diff')
,   content = require('./content');

var events = function() {

  $('#nice-min').on('click', function(e) {
    e.preventDefault();
    $('#nice-obj').toggleClass('is-min');
  });

  $('#nice-off').on('click', function(e) {
    e.preventDefault();
    content.removeNice();
  });

  $('#nice-diff').on('click', function(e) {
    e.preventDefault();
    $('#nice-pre').toggleClass('is-active');
    diff.init();
  });

  $('#nice-toggle').on('click', function(e) {
    e.preventDefault();
    content.toggleHTML();
  });

  $('#nice-pre').on('click', function(e) {
    e.preventDefault();
    content.getSelection();
  });

  $('#nice-nav li')
    .on('mouseover', function(e) {
      var $title = $('#nice-title');
      $title.text($(e.srcElement).attr('data-text'));
    }).on('mouseleave', function() {
      var $title = $('#nice-title');
      $title.text($title.attr('data-text'));
    });

};

module.exports = events;

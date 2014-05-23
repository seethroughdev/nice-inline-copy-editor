'use strict';

var $ = window.jQuery || require('domtastic');

var $body = $('body');

var content = {

  init: function() {
    return this.wrapContent();
  },

  wrapContent: function() {
    $body.html('<div id="ice-content">' + $body.html() + '</div>');
    return this.makeEditable($body);
  },

  makeEditable: function(el) {
    return el.attr('contenteditable', true);
  },

  removeIce: function() {
    $body
      .html($('#ice-content').html())
      .removeAttr('contenteditable');
  },

  getHTML: function() {
    return $('#ice-content').html();
  }

};

module.exports = content;

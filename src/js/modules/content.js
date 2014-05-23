'use strict';

var $ = window.jQuery || require('domtastic');

var $body = $('body');

var content = {

  wrapContent: function() {
    $body.html('<div id="ice-content">' + $body.html() + '</div>');
    return this.makeEditable($body);
  },

  makeEditable: function(el) {
    return el.attr('contenteditable', true);
  },

  removeIce: function() {
    $body.html($('#ice-content').html());
    $body.removeAttr('contenteditable');
  },

  getContent: function() {
    return $('#ice-content').html();
  },

  init: function() {
    this.wrapContent();
  }

};

module.exports = content;

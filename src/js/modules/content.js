'use strict';

var $ = require('domtastic');

var $body = $('body');

var content = {

  init: function() {
    return this.wrapContent();
  },

  wrapContent: function() {
    $body.html('<div id="nice-content">' + $body.html() + '</div>');
    return this.makeEditable($body);
  },

  makeEditable: function(el) {
    return el.attr('contenteditable', true);
  },

  removeNice: function() {
    $body
      .html($('#nice-content').html())
      .removeAttr('contenteditable');
  },

  getHTML: function() {
    return $('#nice-content').html();
  }

};

module.exports = content;

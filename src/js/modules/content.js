'use strict';

var $ = window.jQuery || require('domtastic');

var $body      = $('body'),
    isOriginal = true;

var content = {

  init: function() {
    return this.wrapContent();
  },

  wrapContent: function() {
    $body.html('<div id="nice-content">' + $body.html() + '</div>');
    this.originalHTML = this.currentHTML = this.getHTML();
    return this.makeEditable($('#nice-content'));
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
    var html = $('#nice-content').html();
    return html.trim();
  },

  stripHTML: function(str) {
    str = str.replace(/>\s+</g, '><')
            .replace(/></g, '>\n\n<')
            .replace(/<iframe.+\/iframe>/g, '')
            .replace(/<object.+\/object>/g, '')
            .replace(/<noscript.+\/noscript>/g, '')
            .replace(/<script.+\/script>/g, '')
            .replace(/&amp;amp;lt;.+&amp;amp;gt;/g, '')
            .replace(/&amp;lt;.+&amp;gt;/g, '');
    return str;
  },

  setHTML: function(html) {
    return $('#nice-content').html(html);
  },

  toggleHTML: function() {

    isOriginal = this.getHTML() === this.originalHTML ? true : false;

    if (!isOriginal) {
      this.currentHTML = this.getHTML();
    }

    var html = isOriginal ? this.currentHTML : this.originalHTML;

    this.setHTML(html);

  },

  getSelection: function() {
    var range;
    if (document.selection) {
      range = document.body.createTextRange();
      range.moveToElementText(document.getElementById('nice-pre'));
      range.select();
    } else if (window.getSelection) {
      range = document.createRange();
      range.selectNode(document.getElementById('nice-pre'));
      window.getSelection().addRange(range);
    }

  },

  originalHTML: '',

  currentHTML: ''

};

module.exports = content;

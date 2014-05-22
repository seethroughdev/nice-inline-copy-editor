'use strict';

var $ = window.jQuery || require('domtastic');

// set navTemplate
var navTemplate =  '<li id="ice-off">Off</li>';
    navTemplate += '<li id="ice-diff">Diff</li>';
    navTemplate += '<li id="ice-toggle">Original</li>';

var html = {

  navTemplate: navTemplate,

  cssLocation: '<link rel="stylesheet" href="index.css" type="text/css" />',

  getHTML: function() {
    return $('body').html();
  }

};

module.exports = html;

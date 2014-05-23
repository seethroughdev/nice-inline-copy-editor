'use strict';

var $ = window.jQuery || require('domtastic');

// set navTemplate
var navTemplate =  '<li id="nice-off">Off</li>';
    navTemplate += '<li id="nice-diff">Diff</li>';
    navTemplate += '<li id="nice-toggle">Original</li>';

var html = {

  navTemplate: navTemplate,

  cssLocation: '<link rel="stylesheet" href="index.css" type="text/css" />'

};

module.exports = html;

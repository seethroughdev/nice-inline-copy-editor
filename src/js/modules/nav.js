'use strict';

var $ = window.jQuery || require('domtastic');

var body = document.getElementsByTagName('body')[ 0 ];


// set template
var template =  '<li id="ice-off">Off</li>';
    template += '<li id="ice-diff">Diff</li>';
    template += '<li id="ice-toggle">Original</li>';

var cssLocation = '<link rel="stylesheet" href="index.css" type="text/css" />';

var nav = {

  create: function() {
    var el = document.createElement('ul');
    el.innerHTML = template;
    el.setAttribute('id','ice-nav');
    el.setAttribute('contenteditable', false);
    this.style(el);
  },

  style: function(el) {
    $('head').append(cssLocation);
    this.append(el);
  },

  append: function(el) {
    body.appendChild(el);
  },

  disable: function() {
    var el = document.getElementById('ice-nav');
    body.removeChild(el);
  },

  init: function() {
    this.create();
  }

};

module.exports = nav;

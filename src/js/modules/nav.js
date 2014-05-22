'use strict';

var $    = window.jQuery || require('domtastic')
,   html = require('./html');

var cssLocation = html.cssLocation;
var body = document.getElementsByTagName('body')[ 0 ];

var nav = {

  create: function() {
    var el = document.createElement('ul');
    el.innerHTML = html.navTemplate;
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

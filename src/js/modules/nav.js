'use strict';

var $    = window.jQuery || require('domtastic')
,   html = require('./html');

var body = document.getElementsByTagName('body')[ 0 ];

var nav = {

  init: function() {
    this.create();
  },

  create: function() {
    var el = document.createElement('ul');
    el.innerHTML = html.navTemplate;
    el.setAttribute('id','nice-nav');
    el.setAttribute('contenteditable', false);
    this.style(el);
  },

  style: function(el) {
    $('head').append(html.cssLocation);
    this.addPre(el);
  },

  addPre: function(el) {
    var pre = document.createElement('pre');
    pre.setAttribute('id', 'nice-pre');
    el.appendChild(pre);
    this.append(el);
  },

  append: function(el) {
    body.appendChild(el);
  }

};

module.exports = nav;

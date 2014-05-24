'use strict';

var objTemplate = require('./template');

var body = document.getElementsByTagName('body')[ 0 ];
var head = document.getElementsByTagName('head')[ 0 ];

var nav = {

  init: function() {
    this.createObj();
    this.style();
  },

  createObj: function() {
    var div = document.createElement('div');
    div.setAttribute('id', 'nice-obj');
    div.setAttribute('contenteditable', false);
    div.innerHTML = objTemplate;
    this.append(div);
  },

  style: function() {
    var link = document.createElement('link');
    link.setAttribute('rel','stylesheet');
    link.setAttribute('href','index.css');
    link.setAttribute('type','text/css');
    head.appendChild(link);
  },

  append: function(div) {
    body.appendChild(div);
  }

};

module.exports = nav;

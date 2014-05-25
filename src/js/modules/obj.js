'use strict';

var objTemplate = require('./template');

var body = document.getElementsByTagName('body')[ 0 ];
var head = document.getElementsByTagName('head')[ 0 ];

var nav = {

  init: function() {
    this.createObj();
  },

  createObj: function() {
    var div = document.createElement('div');
    div.setAttribute('id', 'nice-obj');
    div.setAttribute('contenteditable', false);
    div.setAttribute('class', 'is-min');
    div.innerHTML = objTemplate;
    this.style(div);
  },

  style: function(div) {
    var link = document.createElement('link');
    link.setAttribute('rel','stylesheet');
    link.setAttribute('href','http://0.0.0.0:8080/index.css');
    link.setAttribute('type','text/css');
    head.appendChild(link);
    this.append(div);
  },

  append: function(div) {
    body.appendChild(div);
  }

};

module.exports = nav;

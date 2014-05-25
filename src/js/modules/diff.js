'use strict';

var $ = window.jQuey || require('domtastic')
,   jsdiff = require('diff')
,   content = require('./content');

var diffObj = {

  init: function() {
    var diff = jsdiff.diffLines(content.originalHTML, content.getHTML());
    this.populateDiff(diff);
  },

  populateDiff: function(diff) {
    var $pre = $('#nice-pre').html('')
    ,   color
    ,   klass
    ,   span;


    diff.forEach(function(part) {
      if (part.added || part.removed) {
        color = part.added ? 'green' : part.removed ? 'red' : 'grey';
        klass = part.added ? 'is-added' : part.removed ? 'is-removed' : '';
        span = document.createElement('span');
        span.style.color = color;
        span.setAttribute('class', klass);
        span.appendChild(document.createTextNode(part.value));
        $pre.append(span);
      }
    });
  }
};


module.exports = diffObj;

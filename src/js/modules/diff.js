var $ = window.jQuey || require('domtastic')
,   jsdiff = require('diff')
,   content = require('./content');

// var display = document.getElementsByTagName('pre')[0];

// function createDiff(part) {
//   console.log(part);
//   var color = part.added ? 'green' : part.removed ? 'red' : 'grey';
//   var span = document.createElement('span');
//   span.style.color = color;
//   span.appendChild(document.createTextNode(part.value));
//   display.appendChild(span);
// }

var diffObj = {

  init: function() {
    var diff = jsdiff.diffWords(content.originalHTML, content.getHTML());
    this.setupDiff(diff);
  },

  setupDiff: function(diff) {
    diff.forEach(function(part) {
      window.console.log(part);
      var color = part.added ? 'green' : part.removed ? 'red' : 'grey';
      var span = document.createElement('span');
      span.style.color = color;
      span.appendChild(document.createTextNode(part.value));
      $('pre').append(span);
    });
  }



}


module.exports = diffObj;

var $ = window.jQuery || require('domtastic')
,   nav = require('./modules/nav');

var $body = $('body'),
    initHTML = $body.html(),
    postHTML = '';

// Make page editable
$body.attr('contenteditable', true);

nav.append();


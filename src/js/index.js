var $ = window.jQuery || require('domtastic')
,   nav = require('./modules/nav');

var $body = $('body');

// Make page editable
$body.attr('contenteditable', true);

nav.init();


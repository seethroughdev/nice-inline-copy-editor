var $      = window.jQuery || require('domtastic')
,   nav    = require('./modules/nav')
,   events = require('./modules/events');

var $body = $('body');

// Make page editable
$body.attr('contenteditable', true);

nav.init();

events();


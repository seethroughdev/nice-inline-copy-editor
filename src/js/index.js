var $       = window.jQuery || require('domtastic')
,   nav     = require('./modules/nav')
,   events  = require('./modules/events')
,   content = require('./modules/content');

content.init();
nav.init();
events();


'use strict';

// set objTemplate
var objTemplate = '<ul id="nice-nav">';
    objTemplate += '<li id="nice-title" title="Go To Homepage">NICE</li>';
    objTemplate += '<li id="nice-min" title="Minimize NICE"></li>';
    objTemplate += '<li id="nice-off" title="Turn off NICE">OFF</li>';
    objTemplate += '<li id="nice-diff" title="See Diff">DIFF</li>';
    objTemplate += '<li id="nice-toggle" title="Toggle Original">TOGGLE</li>';
    objTemplate += '</ul>';
    objTemplate += '<pre id="nice-pre"></pre>';

module.exports = objTemplate;

'use strict';

// set objTemplate
var objTemplate = '<ul id="nice-nav">';
    objTemplate += '<li id="nice-title" data-text="NICE" title="Go To Homepage">NICE</li>';
    objTemplate += '<li id="nice-min" data-text="HIDE" title="Minimize NICE"><span>\uE001</span></li>';
    objTemplate += '<li id="nice-toggle" data-text="TOGGLE" title="Toggle Original">\uE004</li>';
    objTemplate += '<li id="nice-diff" data-text="DIFF" title="See Diff">\uE002</li>';
    objTemplate += '<li id="nice-off" data-text="OFF" title="Turn off NICE">\uE003</li>';
    objTemplate += '</ul>';
    objTemplate += '<pre id="nice-pre"></pre>';

module.exports = objTemplate;

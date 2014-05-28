'use strict';

var chai = require('chai');
var expect = require('chai').expect;
var $ = require('domtastic');
var content = require('../../src/js/modules/content');
var obj = require('../../src/js/modules/obj');


describe('Content', function () {

  var $body, $content;

  beforeEach(function () {
    $body = $('body');
  });

  it('should not contain nice-content yet', function () {
    expect($('#nice-content').length).to.equal(0);
  });

  it('should contain a nice-content div', function () {
    obj.init();
    content.init();
    expect($('#nice-content').length).to.equal(1);
  });
});

describe('stripHTML', function () {
  var str;

  beforeEach(function () {
    str = '<p>Inside the paragraph is <a href="#">a link</a>.';
  });

  it('should strip a link', function () {
    str = content.stripHTML(str);
    expect(str).to.equal('Inside the paragraph is a link.');
  });


});

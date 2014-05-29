'use strict';

var chai = require('chai');
var expect = require('chai').expect;
var $ = require('jquery');
var content = require('../../src/js/modules/content');
var obj = require('../../src/js/modules/obj');


describe('Content', function () {

  it('should not contain nice-content yet', function () {
    expect($('#nice-content').length).to.equal(0);
  });

  describe('after init', function () {


    beforeEach(function () {
      obj.init();
      content.init();
    });

    it('should contain a nice-content div', function () {
      expect($('#nice-content').length).to.exist;
    });

    it('should contain a nice-nav', function () {
      expect($('#nice-nav').length).to.equal(1);
    });

    xit('should not allow you to edit nice-obj', function () {
      expect($('#nice-obj')).to.have.attr('contenteditable');
    });

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

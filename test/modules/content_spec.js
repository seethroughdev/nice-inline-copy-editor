var expect = require('chai').expect;

var content = require('../../src/js/modules/content');

describe('something simple', function () {
  it('should load a test', function () {
    expect(true).to.be.true;
  });

  it('should also fail a test', function () {
    // expect(false).to.be.true;
  });
});

describe('stripHTML', function () {
  var str;

  beforeEach(function () {
    str = '<a href="#">A Link is here</a>';
  });

  it('should strip a link', function () {
    str = content.stripHTML(str);
    expect(str).to.equal('A Link is here');
  });


});

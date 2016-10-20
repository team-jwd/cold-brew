const expect = require('chai').expect;
const coldBrew = require('../cold-brew-test');

const { ColdBrewError } = coldBrew;

require('./../example/chat/server.js');

const ADDRESS = 'http://localhost:3000';

describe('coldBrew', function() {
  describe('findElementByAttributes', function() {
    let client;

    before(function() {
      client = coldBrew.createClient();
    });

    it('should be able to locate an element by its attribute', function(done) {
      client.get(ADDRESS);
      client.findElementByAttributes('input', {
        placeholder: 'Type a message...'
      }).then((located) => { if (located) done(); });
    });

    it('should not be able to locate an element that doesn\'t exist', function (done) {
      client.get(ADDRESS);
      client.findElementByAttributes('span', {
        placeholder: 'This does not exist...',
      }).catch((err) => {
        expect(err.constructor).to.equal(TypeError);
        done();
      });
    });

    after(function (done) {
      client.quit().then(() => done());
    });
  });

  describe('do', function () {
    let client;

    before(function () {
      client = coldBrew.createClient();
    });

    it('should be able to perform multiple navigation events', function (done) {
      client.get(ADDRESS);
      client.do([
        ['sendKeys', 'input', { placeholder: 'Type a message...' }, 'hello'],
        ['click', 'button', {}]
      ]);
      client.findElementByAttributes('p.message', { innerText: 'hello' })
        .then((located) => { if (located) done(); });
    });

    it('should throw an error if any of the navigation events have an invalid action', function () {
      client.get(ADDRESS);
      try {
        client.do([
          ['sendKeys', 'input', { placeholder: 'Type a message...' }, 'hello'],
          ['click', 'button', {}],
          ['blahblah', 'button', {}]
        ]);
      } catch (error) {
        expect(error.constructor).to.equal(TypeError);
      }
      
    });

    it('should reject with TypeError if the element cannot be located', function (done) {
      this.timeout(10000);
      
      client.get(ADDRESS);
      client.do([
        ['sendKeys', 'input', { placeholder: 'blahblah' }, 'hello']
      ]).catch((err) => {
        expect(err.constructor).to.equal(TypeError);
        done();
      });
    });

    it('should reject with TypeError if any of the elements cannot be located', function (done) {
      client.get(ADDRESS);
      client.do([
        ['sendKeys', 'input', { placeholder: 'Type a message...' }, 'hello'],
        ['click', 'button', {}],
        ['sendKeys', 'input', { placeholder: 'blahblah' }, 'hello']
      ]).catch((err) => {
        expect(err.constructor).to.equal(TypeError);
        done();
      });
    });

    after(function (done) {
      client.quit().then(() => done());
    });
  });
});
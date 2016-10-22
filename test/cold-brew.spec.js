const expect = require('chai').expect;
const ngrok = require('ngrok');
const coldBrew = require('../cold-brew-test');

const { ColdBrewError } = coldBrew;

const { resetNumClients } = require('./../example/chat/server.js');

let ADDRESS = 'http://localhost:3000';

describe('coldBrew', function () {
  // before(function (done) {
  //   this.timeout(10000);

  //   ngrok.connect(3000, function (err, url) {
  //     if (err) throw err;

  //     ADDRESS = url;
  //     done();
  //   });
  // });

  beforeEach(function () {
    resetNumClients(0);
  });

  describe('findElementByAttributes', function() {
    let client;

    before(function () {
      this.timeout(5000);
      client = coldBrew.createClient();
    });

    it('should be able to locate an element by its attribute', function(done) {
      this.timeout(10000);
      
      client.get(ADDRESS);
      client.findElementByAttributes('input', {
        placeholder: 'Type a message...'
      }).then((located) => { if (located) done(); });
    });

    it('should not be able to locate an element that doesn\'t exist', function (done) {
      this.timeout(10000);
      
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
      this.timeout(5000);
      client = coldBrew.createClient();
    });

    it('should be able to perform multiple navigation events', function (done) {
      this.timeout(10000);
      
      client.get(ADDRESS);
      client.do([
        ['sendKeys', 'input', { placeholder: 'Type a message...' }, 'hello'],
        ['click', 'button', {}]
      ]);
      client.findElementByAttributes('p.message', { innerText: 'hello' })
        .then((located) => { if (located) done(); });
    });

    it('should throw an error if any of the navigation events have an invalid action', function () {
      this.timeout(10000);
      
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
      this.timeout(5000);
      
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

  describe('waitUntilRTCEvents', function () {
    let client1, client2;

    beforeEach(function () {
      client1 = coldBrew.createClient();
      client2 = coldBrew.createClient();
    });

    it('should detect that certain RTC events have occurred', function (done) {
      this.timeout(10000);
      
      client1.get(ADDRESS);
      client2.get(ADDRESS);

      client1.waitUntilRTCEvents([
        'signalingstatechange',
        'addstream',
        'datachannel'
      ]).then((occurred) => { if (occurred) done() });
    });

    it('should detect that RTC events have occurred in a certain order', function (done) {
      this.timeout(30000);

      client1.get(ADDRESS);
      client2.get(ADDRESS);

      client1.waitUntilRTCEvents([
        'signalingstatechange',
        'addstream'
      ], {
        inOrder: true,
      }).then((occurred) => { if (occurred) done() });
    });

    it('should not be able to detect an event that has not occurred', function (done) {
      this.timeout(10000);

      client1.get(ADDRESS);
      client2.get(ADDRESS);

      client1.waitUntilRTCEvents([
        'thiseventshouldnotexist',
        'orthisone',
      ], {}, 6000)
        .then((occurred) => {
          if (occurred) {
            done(new Error('waitUntilRTCEvents reported that a non-existent event occurred'))
          }
        })
        .catch((err) => { if (err) done() });
      
    })

    afterEach(function (done) {
      client1.quit();
      client2.quit().then(() => done());
    });

  });
});
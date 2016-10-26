/* eslint no-undef: 0 */
/* eslint no-unused-vars: 0 */
/* eslint prefer-arrow-callback: 0 */
/* eslint func-names: 0 */


/*
 * Testing all testing functions we have written on an
 * example application that we wrote.
 * *** Need to write tests for data channel events ***
 */
const expect = require('chai').expect;
const coldBrew = require('../cold-brew-test');

const { ColdBrewError } = coldBrew;

const { resetNumClients } = require('./../example/chat/server.js');

const ADDRESS = 'http://localhost:3000';
describe('coldBrew', function () {
  beforeEach(function () {
    resetNumClients(0);
  });

  describe('findElementByAttributes', function () {
    let client;

    before(function () {
      this.timeout(5000);
      client = coldBrew.createClient();
    });


    it('should be able to locate an element by its attribute', function (done) {
      this.timeout(10000);

      client.get(ADDRESS);
      client.findElementByAttributes('input', {
        placeholder: 'Type a message...',
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
        ['click', 'button', {}],
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
          ['blahblah', 'button', {}],
        ]);
      } catch (error) {
        expect(error.constructor).to.equal(TypeError);
      }
    });

    it('should reject with TypeError if the element cannot be located', function (done) {
      this.timeout(10000);

      client.get(ADDRESS);
      client.do([
        ['sendKeys', 'input', { placeholder: 'blahblah' }, 'hello'],
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
        ['sendKeys', 'input', { placeholder: 'blahblah' }, 'hello'],
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
    let client1;
    let client2;

    beforeEach(function () {
      resetNumClients(0);
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
        'datachannel',
      ]).then((occurred) => { if (occurred) done(); });
    });

    it('should detect that RTC events have occurred in a certain order', function (done) {
      this.timeout(30000);

      client1.get(ADDRESS);
      client2.get(ADDRESS);

      client1.waitUntilRTCEvents([
        'signalingstatechange',
        'addstream',
      ], {
        inOrder: true,
      }).then((occurred) => { if (occurred) done(); });
    });

    it('should not be able to detect an event that has not occurred', function (done) {
      this.timeout(10000);

      client1.get(ADDRESS);
      client2.get(ADDRESS);

      client1.waitUntilRTCEvents([
        'thiseventshouldnotexist',
        'orthisone',
      ], {}, 3000)
        .then((occurred) => {
          if (occurred) {
            done(new Error('waitUntilRTCEvents reported that a non-existent event occurred'));
          }
        })
        .catch((err) => { if (err) done(); });
    });

    it('should be able to detect events for a specific peerConnection', function (done) {
      this.timeout(5000);

      client1.get(ADDRESS);
      client2.get(ADDRESS);

      client1.waitUntilRTCEvents([
        'signalingstatechange',
        'addstream'
      ], {
          inOrder: true,
          label: 'theonlypeerConnection'
      }).then((occurred) => {
        if (occurred) {
          done();
        }
      });
    });

    it('should not be able to detect events for a peerConnection that doesn\'t exist', function (done) {
      this.timeout(10000);

      client1.get(ADDRESS);
      client2.get(ADDRESS);

      client1.waitUntilRTCEvents([
        'signalingstatechange',
        'addstream'
      ], {
          inOrder: true,
          label: 'thisdoesnotexist'
      }, 5000).then((occurred) => {
        if (occurred) {
          done(new Error('an event was detected when none should have been'));
        }
      }).catch((err) => {
        if (err) {
          done();
        }
      });
    })

    afterEach(function (done) {
      client1.quit();
      client2.quit().then(() => done());
    });
  });

  describe('waitUntilSendSignaling', function () {
    beforeEach(function () {
      resetNumClients(0);
      client1 = coldBrew.createClient();
      client2 = coldBrew.createClient();
    });

    it('should be able to detect that signaling events have occurred', function (done) {
      this.timeout(10000);

      client1.get(ADDRESS);
      client2.get(ADDRESS);

      client1.waitUntilSendSignaling([
        'join',
      ]).then((occurred) => { if (occurred) done(); });
    });

    it('should not be able to detect events that have not happened', function (done) {
      this.timeout(10000);

      client1.get(ADDRESS);
      client2.get(ADDRESS);

      client1.waitUntilSendSignaling([
        'thiseventshouldnotexist',
      ], {}, 3000)
        .then((occurred) => {
          if (occurred) {
            done(new Error('waitUntilSendSignaling detected nonexistant event'));
          }
        })
        .catch((err) => {
          if (err) done();
        });
    });

    it('should detect that Socket events emitted in a certain order', function (done) {
      this.timeout(30000);

      client1.get(ADDRESS);
      client2.get(ADDRESS);

      client2.waitUntilSendSignaling([
        'join',
        'send offer',
      ], {
        inOrder: true,
      }).then((occurred) => { if (occurred) done(); });
    });

    afterEach(function (done) {
      client1.quit();
      client2.quit().then(() => done());
    });
  });

  describe('Wait until receive signaling', function () {
    beforeEach(function () {
      resetNumClients(0);
      client1 = coldBrew.createClient();
      client2 = coldBrew.createClient();
    });

    it('should succeed when looking for an event that exists', function (done) {
      this.timeout(10000);
      client1.get(ADDRESS);
      client2.get(ADDRESS);

      client2.waitUntilSendSignaling(['send offer']);

      client1.waitUntilReceiveSignaling(['receive offer', 'receive ice candidate'])
        .then((occured) => {
          if (occured) {
            done();
          }
        });
    });

    it('should reject when looking for an event that does not exist', function (done) {
      this.timeout(10000);
      client1.get(ADDRESS);
      client2.get(ADDRESS);

      client2.waitUntilSendSignaling(['send offer']);

      client1.waitUntilReceiveSignaling(['Im a walrus', 'I have a kitten friend'], {}, 3000)
        .then((occured) => {
          done(new Error('waitUntilRecieveSignaling detected nonexistant event'));
        }).catch((e) => {
          if (e) {
            done();
          }
        });
    });

    it('should detect that Socket events have been recieved in a certain order', function (done) {
      this.timeout(30000);

      client1.get(ADDRESS);
      client2.get(ADDRESS);

      client1.waitUntilReceiveSignaling([
        'receive offer',
        'receive ice candidate',
      ], {
        inOrder: true,
      }).then((occurred) => { if (occurred) done(); });
    });


    afterEach(function (done) {
      client1.quit();
      client2.quit().then(() => done());
    });
  });

  describe('Data Channel Events', function() {
    beforeEach(function () {
      resetNumClients(0);
      client1 = coldBrew.createClient();
      client2 = coldBrew.createClient();
    });

    it('should detect that data channel events have occured', function(done) {
      this.timeout(5000);
      
      client1.get(ADDRESS);
      client2.get(ADDRESS);
      client2.do([['sendKeys', '#text-chat form input', { type: 'text' }, 'Hello World'], ['click', '#sendMessage', {}]]);

      client1.waitUntilDataChannelEvents([
        'open',
        'message',
      ], {}).then((occurred) => { if (occurred) done() });
    });

    afterEach(function (done) {
      client1.quit();
      client2.quit().then(() => done());
    });
  });
});


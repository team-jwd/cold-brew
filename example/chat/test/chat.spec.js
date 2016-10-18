const coldBrew = require('cold-brew');
const { until, By, Key } = require('selenium-webdriver');
require('../server');

const client = coldBrew.createClient();
describe('chat app', function () {
  describe('elements', function () {
    it('should have a chat window and a form', function (done) {
      this.timeout(5000);
      client.get('http://localhost:3000');
      client.wait(until.elementLocated(By.css('#chat-window')));
      client.wait(until.elementLocated(By.css('form')))
        .then((located) => {
          if (located) {
            done();
          }
        });
    });
  });
  it('should post a message to your page (not send!)', function (done) {
    this.timeout(5000);
    client.get('http://localhost:3000');
    client.do([
      ['sendKeys', 'input', {}, `Hello World${Key.ENTER}`],
    ]);
    client.wait(until.elementLocated(By.css('p.message')));
    client.findElementByAttributes(
      'p.message',
      { innerText: 'Hello World' }
    ).then((el) => {
      if (el) {
        done();
      }
    });
  });
  after(function (done) {
    client.quit().then(() => done());
  });
});

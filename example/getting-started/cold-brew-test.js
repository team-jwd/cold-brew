const coldBrew = require('cold-brew');
const { until } = require('selenium-webdriver');

let client;

describe('ColdBrew client', function () {
  it('should be able to navigate to google.com', function (done) {
    client = coldBrew.createClient();

    client.get('https://www.google.com');
    client.wait(until.titleIs('Google')).then(() => done());
  });

  after(function (done) {
    client.quit().then(() => done());
  });
});

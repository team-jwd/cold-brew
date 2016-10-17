const coldBrew = require('cold-brew');
const { until, Key } = require('selenium-webdriver');

const client = coldBrew.createClient();

describe('ColdBrew client', function () {
  it('should be able to navigate to google.com', function (done) {
    this.timeout(10000);

    client.get('https://www.google.com');
    client.wait(until.titleIs('Google')).then(() => done());
  });

  it('should be able to do a Google search', function(done) {
    this.timeout(10000);

    // Navigate to google.com
    client.get('https://www.google.com');
    client.wait(until.titleIs('Google'))

    // Type a search query
    client.do([
      ['sendKeys', 'input#lst-ib', {}, 'cold brew npm' + Key.ENTER]
    ]);

    // Wait for the next page to load
    client.wait(until.titleIs('cold brew npm - Google Search'))
      .then(() => done());
  });

  after(function (done) {
    client.quit().then(() => done());
  });
});

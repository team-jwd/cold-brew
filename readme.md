# ColdBrew

ColdBrew is a Javascript library that enables easy automated testing
of your WebRTC application.

---
## <a name="getting-started"></a>Getting Started: the absolute beginner's guide
This section of the readme is intended for people completely
new to ColdBrew. If you are familiar with it,
you may want to view the 
[API Docs](#docs) instead.

To learn how to use the ColdBrew API, let's run a super-simple
test. In your terminal, make a new directory and initialize it with an npm package:
```bash
mkdir cold-brew-test
cd cold-brew-test
npm init -y
```
For this demo, we will need to install a couple of packages from npm:
```bash
npm install --save cold-brew
npm install --save-dev mocha selenium-webdriver
```
Next, inside the directory you created, make a new file named `cold-brew-test.js`:
```bash
touch cold-brew-test.js
```
In this file, place the following code:
```javascript
const coldBrew = require('cold-brew');
const selenium = require('selenium-webdriver');
const { until } = selenium;

let client;

describe('ColdBrew client', function() {
  it('should be able to navigate to google.com', function(done) {
    this.timeout(10000);

    client = coldBrew.createClient();

    client.get('https://www.google.com');
    client.wait(until.titleIs('Google')).then(() => done());
  });

  after(function(done) {
    client.quit().then(() => done());
  });
});
```
Finally, to run your test, let's put a test script into your
`package.json` file. Find the following in your `package.json` file:
```json
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1"
}
```
...and replace it with this:
```json
"scripts": {
  "test": "mocha ./cold-brew-test.js"
}
```
And then on your terminal:
```bash
npm test
```
If all goes well, you should see a  Chrome browser window open,
navigate to google.com, and then close, and mocha should
report that the test passed in your terminal!

## <a name="docs"></a>API Documentation
We're working hard to get this out to you. The API docs are
coming soon!

## Install

```bash
npm install --save cold-brew
```

---

## Require
In your client-side code, you can include ColdBrew in a
script tag:
```html
<script type="text/javascript" src="./node_modules/cold-brew/rtc.js"></script>
```
Please adjust the "src" attribute accordingly depending on
your own file structure.

If you are bundling your client-side code with webpack or
a similar tool, you can require ColdBrew in as a module as well:
```javascript
const { coldBrewRTC } = require('cold-brew/rtc');
```

---

## Modify

Your normal webRTC Peer Connection should look something like this.

```javascript
const peerConnection = new RTCPeerConnection(
      servers,
      [configuration]
);
```


In order to make our library work you will have to change that RTC peer connection to coldBrewRTC. Everything works the same, but we are putting a wrapper around your peer Connection object in order to monitor the events that occur.

```javascript
const peerConnection = coldBrewRTC(
      servers,
      [configuration]
);
```

Now you're ready to get testing!

---
## Test

## Documentation

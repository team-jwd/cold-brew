# ColdBrew

ColdBrew is a Javascript library that enables easy automated testing
of your WebRTC application.

If you are a ColdBrew user and would like to get in touch with the team to request
features or report bugs, please 
[click here to go to the contact form](https://goo.gl/forms/Gu7aorxSFKJFBvl23).
We love making tools that are useful to you and appreciate your help
in making ColdBrew better!

---
## Contents
* [Getting Started: The absolute beginner's guide](#getting-started)
* [Getting Started part 2: Testing WebRTC with ColdBrew](#getting-started-2)
* [API Documentation](#docs)

---
## <a name="getting-started"></a>Getting Started: the absolute beginner's guide
This section of the readme is intended for people completely
new to ColdBrew. If you are familiar with it already,
you may want to view the 
[API Docs](#docs) instead.

This getting started guide will focus on getting a basic
test up and running in ColdBrew. To learn about the
features of ColdBrew that enable testing WebRTC,
please see the [Getting Started guide, part 2](#getting-started-2).

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

const client = coldBrew.createClient();

describe('ColdBrew client', function() {
  it('should be able to navigate to google.com', function(done) {
    this.timeout(10000);

    client.get('https://www.google.com');
    client.wait(until.titleIs('Google'))
      .then(() => done());
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

Now, let's try automating some navigation in the browser.
Add another test case to your `cold-brew-test.js`
file so that it looks like this:
```javascript
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
```

---
## <a name="getting-started-2"></a> Getting Started part 2: Testing WebRTC
This section is a work in progress; check back soon!

---
## <a name="docs"></a> API Documentation
### Overview
ColdBrew is composed of two modules: the [client-side module](#client-side-module)
and the [testing module](#testing-module), and both must be used
in order to test apps that incorporate WebRTC.

Both modules can be installed simultaneously with a single install
command:
```bash
npm install --save cold-brew
```
Note that ColdBrew should be installed as a dependency (`--save`)
instead of a dev-dependency (`--save-dev`), because the client-side
module will be included in your client-side code.

### <a name="client-side-module"></a> The Client-Side Module
#### Getting Started
The client-side module can be inserted into your html file
as a script tag (please adjust the path on the src attribute accordingly for your own situation):
```html
<script type="text/javascript" src="./node_modules/cold-brew/rtc.js"></script>
```
If you are bundling your client-side code using a tool like
[webpack](https://webpack.github.io/),
you can also require the client-side module into your javascript
file in one of the following ways:
```javascript
// CommonJS syntax
const { coldBrewRTC } = require('cold-brew/rtc');
```
```javascript
// ES2015 Import syntax--use only if you are transpiling
import { coldBrewRTC } from 'cold-brew/rtc';
```
#### API
<a name="cold-brew-rtc"></a>
**coldBrewRTC(configuration, options, coldBrewConfig)**

Factory function that creates and returns an RTCPeerConnection object.

Parameters:
* *configuration*: An object specifying the configuration options for the RTCPeerConnection object. Identical to the first parameter of the [RTCPeerConnection constructor](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection).
* _*options*_: An object specifying other optional properties of the RTCPeerConnection object.
* *coldBrewConfig*: An object containing configuration options for coldBrew. Defaults to an empty object if not provided. The object may contain the following properties:
  * *production*: Boolean value that, if true, disables all ColdBrew functionality to eliminate performance overhead. Defaults to false.
  * *listeners*: Array containing the RTCPeerConnection events that you want to be able to observe from the test script. Defaults to [RTC\_PEER\_CONNECTION_EVENTS](#rtc-peer-connection-events).

Returns: An `RTCPeerConnection` object

Usage example:

```javascript
// Instead of doing this in your code...
const peerConnection = new RTCPeerConnection(
  servers,
  options
);

// ...do this:
const peerConnection = coldBrewRTC(
  servers,
  options
);
```

<a name="rtc-peer-connection-events"></a> **RTC_PEER_CONNECTION_EVENTS**

Array containing the names of all of the events that fire on the [RTCPeerConnection object](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection).

### <a name="testing-module"></a> The Testing Module
#### Getting started

The testing module can be required into your test script as follows:
```javascript
const coldBrew = require('cold-brew');
```

#### API
The testing module exposes the following functions:
* [coldBrew.createClient()](#cold-brew-create-client)
* [coldBrew.addColdBrewMethods(webdriver)](#cold-brew-add-cold-brew-methods)

<a name="cold-brew-create-client"></a>
**coldBrew.createClient()**

Factory function that creates and returns a
[Selenium WebDriver](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_WebDriver.html) object modified to include the
[ColdBrew methods](#cold-brew-methods).

Usage example:
```javascript
const client = coldBrew.createClient();
```

<a name="cold-brew-add-cold-brew-methods"></a>
**coldBrew.addColdBrewMethods(webdriver)**

Function that adds additional methods to an existing
Selenium Webdriver instance.

Parameters:
* *webdriver*: A Selenium Webdriver instance. This instance
  will be mutated by the function to include additional methods

Returns:
* The mutated Selenium Webdriver instance.

Usage example:
```javascript
const client = new selenium.Builder()
  .usingServer()
  .withCapabilities({
    browserName: 'chrome'
  })
  .build();

coldBrew.addColdBrewMethods(client);
```
When a WebDriver instance is passed into the `coldBrew.addColdBrewMethods`
function, the following function are added to it:
  * [client.untilRTCEvents(...events)](#client-until-rtc-events)
  * [client.waitUntilRTCEvents(...events)](#client-wait-until-rtc-events)
  * [client.findElementByAttributes(selector, attributes)](#client-find-element-by-attributes)
  * [client.do(navigationEvents)](#client-do)

<a name="client-until-rtc-events"></a>
**client.untilRTCEvents(...events)**

Returns a promise that will resolve with a truthy value when the specified
events have fired on the RTCPeerConnection object.

Parameters:
* *...events*: Any number of names of events that fire on the RTCPeerConnection
  object in the browser

Returns: A promise that will resolve with a truthy value when the specified
events have fired on the RTCPeerConnection object in the browser. Note: This
method can only observe these events if the RTCPeerConnection object was created
with the [coldBrewRTC factory function](#cold-brew-rtc).

Usage example:
```javascript
// Using this method in a mocha test
describe('RTCPeerConnection', function() {
  it('should signal to the other client and open a data channel', function(done) {
    const client1 = coldBrew.createClient();
    const client2 = coldBrew.createClient();

    client1.get('https://www.example.com');
    client2.get('https://www.example.com');

    client1.wait(client1.untilRTCEvents('signalingstatechange', 'datachannel'))
      .then((occurred) => {if (occurred) done()});
  });
});
```

<a name="client-wait-until-rtc-events"></a>
**client.waitUntilRTCEvents(...events)**

Convenience method, equivalent to invoking `client.wait(client.untilRTCEvents(...events))`

Usage example:
```javascript
// Refactor the previous test to use waitUntilRTCEvents
describe('RTCPeerConnection', function() {
  it('should signal to the other client and open a data channel', function(done) {
    const client1 = coldBrew.createClient();
    const client2 = coldBrew.createClient();

    client1.get('https://www.example.com');
    client2.get('https://www.example.com');

    client1.waituntilRTCEvents('signalingstatechange', 'datachannel')
      .then((occurred) => {if (occurred) done()});
  });
});
```

<a name="client-find-element-by-attributes"></a>
**client.findElementByAttributes(selector, attributes)**

Locates and returns a [WebElement](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebElement.html)
representing the first DOM element on the page that matches the CSS selector
and has the given attributes.

Parameters:
* *selector*: A CSS selector to locate the element
* *attributes*: An object containing attributes to filter the results of the CSS selector

Returns: A WebElement matching the CSS selector and the given attributes

Usage example:
```javascript
// Locate the button inside the navbar that contains the test "Logout"
client.findElementByAttributes('nav button', { innerText: 'Logout' });

// Locate the input element inside the login form with a placeholder of "password"
client.findElementByAttribute('#login-form input', { placeholder: 'password' });
```

<a name="client-do"></a>
**client.do(navigationEvents)**

Convenience method to streamline the process of simulating complex user input
to navigate through the site. Prevents the user from needing to repeatedly
invoke findElement or findElementByAttributes.

Parameters:
* *navigationEvents*: An Array of subarrays. Each subarray represents one user input and has the following form: `[action, selector, attributes, userInput]`.
  * `action`: can be one of the following: `'click', 'sendKeys'`
  * `selector`: a CSS selector that will select the DOM element the simulated input will happen to
  * `attributes`: an object containing additional attributes by which to filter the CSS selector. If no filtering is desired, `{}` should be provided.
  * `userInput`: the data that the simulated user will input, if applicable. Required if `action` is `'sendKeys'`.

Usage example:
```javascript
// In this example, the user will log in on the homepage, then create a chatroom
// on the following view.

// Without client.do:
client.get('https://www.example.com');
client.findElementByAttributes('.login-btn', { innerText: 'Login' })
  .click()
client.findElementByAttributes('.login-form input', { placeholder: 'username' })
  .sendKeys('dking');
client.findElementByAttributes('.login-form input', { placeholder: 'password' })
  .sendKeys('helloworld');
client.findElement(By.css('.login-form button'))
  .click();

client.wait(until.elementLocated({ className: 'landing-view' }));
client.findElementByAttributes('div button', { innerText: 'Create Room' })
  .click();
client.findElementByAttributes('input', { name: 'createRoomName' })
  .sendKeys('my chatroom');
client.findElementByAttributes('input', { name: 'createRoomPassword' })
  .sendKeys('supersecurepassword');
client.findElement(By.css('#create-form button'))
  .click();



// With client.do:
client.get('https://www.example.com');
client.do([
  ['click', '.login-btn', {innerText: 'Login'}],
  ['sendKeys', '.login-form input', { placeholder: 'username' }, 'dking'],
  ['sendKeys', '.login-form input', { placeholder: 'password' }, 'helloworld'],
  ['click', '.login-form button'],
]);

client.wait(until.elementLocated({ className: 'landing-view' }));
client.do([
  ['click', 'div button', { innerText: 'Create Room' }],
  ['sendKeys', 'input', { name: 'createRoomName' }, 'my chatroom'],
  ['sendKeys', 'input', { name: 'createRoomPassword' }, 'supersecurepassword'],
  ['click', '#create-form button'],
]);

```

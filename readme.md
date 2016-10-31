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
* [Getting Started: The absolute beginner's guide](#getting-started-1)
* [Getting Started part 2: Testing WebRTC with ColdBrew](#getting-started-2)
  * [Quick Start](#quick-start)
  * [Our In Depth Step by Step Tutorial on WebRTC and TDD](https://medium.com/@coldbrewtesting/getting-started-with-webrtc-and-test-driven-development-1cc6eb36ffd#.isonuyqhz)
* [Tips & Best Practices](#tips-and-best-practices)
* [API Documentation](#docs)

---
## <a name="getting-started-1"></a> Getting Started: the absolute beginner's guide
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
const { until, Key } = selenium;

const client = coldBrew.createClient();

describe('ColdBrew client', function () {
  it('should be able to navigate to google.com', function (done) {
    this.timeout(10000);

    client.get('https://www.google.com');
    client.wait(until.titleIs('Google'))
      .then(() => done());
  });

  after(function (done) {
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
    client.wait(until.titleIs('Google'))
      .then(() => done());
  });

  it('should be able to do a Google search', function (done) {
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

### <a name="quick-start"></a> Quick start
In order to test WebRTC applications using Cold Brew, there are
four essential steps that must be performed after you have
installed it:
#### Step 1
Import `cold-brew/rtc` into your client-side code. This can be done either
as a script tag in your HTML:
```html
<script type="text/javascript" src="./node_modules/cold-brew/rtc.js"></script>
```
or, if you are bundling your client-side code using a tool like
[webpack](https://webpack.github.io/),
by requiring the `cold-brew/rtc` module into the appropriate file
in one of the following ways:
```javascript
// CommonJS syntax
const { coldBrewRTC, observeSignaling } = require('cold-brew/rtc');
```
```javascript
// ES2015 Import syntax--use only if you are transpiling
import { coldBrewRTC, observeSignaling } from 'cold-brew/rtc';
```
#### Step 2
In your client-side code, replace any calls to the `RTCPeerConnection`
constructor with calls to the `coldBrewRTC` factory function:
```javascript
// Instead of this:
const peerConnection = new RTCPeerConnection(servers, options)

// ...do this:
const peerConnection = coldBrewRTC(servers, options)
```
Notice that the `coldBrewRTC` factory function takes the exact same
arguments as the `RTCPeerConnection` constructor (the `coldBrewRTC`
factory function optionally takes additional arguments for configuration,
see the [documentation](#cold-brew-rtc) for details).

#### Step 3
Cold Brew currently supports the usage of [Socket.io](http://socket.io/) as a signaling
channel.

In your client-side code, call the `observeSignaling` Mixin function
on the socket instance produced by the `io` function:
```javascript
// Instead of this:
const socket = io()

// ...do this:
const socket = observeSignaling(io())
```

#### Step 4
Import `cold-brew` into your test script:
```javascript
const coldBrew = require('cold-brew')

// Require your server file so that your server will run in your tests
const app = require('./server/index.js') // ...or whatever your server file is named

const ADDRESS = 'http://localhost:3000';

// Example tests...replace these with tests appropriate to your situation:
describe('app', function (done) {
  let client1;
  let client2;

  before(function () {
    client1 = coldBrew.createClient();
    client2 = coldBrew.createClient();
  })

  it('client 1 should send an offer to client 2', function (done) {
    client1.get(ADDRESS);
    client2.get(ADDRESS);

    client1.waitUntilSendSignaling(['offer'])
    client2.waitUntilReceiveSignaling(['offer'])
      .then(() => done())
  })

  after(function (done) {
    client1.quit()
    client2.quit().then(() => done())
  })
})
```
Notice that, when using Mocha as a test runner, each test case
must end with an explicit call to `.then(() => done())`. For
a detailed discussion of why this is necessary, see
[Tips and Best Practices: Wrapping up test cases](#wrapping-up-test-cases).

### Detailed guide
[Check out our full tutorial on test driven development with WebRTC](https://medium.com/@coldbrewtesting/getting-started-with-webrtc-and-test-driven-development-1cc6eb36ffd#.dxqf15jd3)

---
## <a name="tips-and-best-practices"></a> Tips & best practices
### Timeouts in test cases

In many popular test runner libraries, a default timeout is set,
and a test case is assumed to have failed if it is not finished
within the timeout. For example, in Mocha, the default timeout
is 2000 ms.

Since ColdBrew runs real browser instances,
the default timeout is sometimes not enough to run an entire test
case. If you find your tests timing out when you think they should
be passing, try making the timeout longer. For example, in Mocha,
you can use `this.timeout` to change the default timeout length:
```javascript
describe('testing something', function() {
  it('should do something', function(done) {
    this.timeout(5000);

    doSomethingAsynchronous().then(() => {
      done()
    });
  });
});
```
Note that the callback functions for `describe` and `it` should
*not* be ES2015 arrow functions (see the
[Mocha docs](https://mochajs.org/#arrow-functions) for more details)

### Development vs. Production
In order to be able to observe the events that are firing on the signaling
sockets, RTCPeerConnections, and RTCDataChannels from within the test
script, ColdBrew is performing a lot of event handling in the background,
which can impact performance. When going into production, all of ColdBrew's
background processes can be disabled by passing the `production: true` flag in
to the [coldBrewRTC](#cold-brew-rtc) function when the RTCPeerConnection object is created:
```javascript
// For development, allows WebRTC events to be observed from within a test script
const peerConnection = coldBrewRTC(
  servers,
  options
);


// For production, disables all extraneous event listening
// to eliminate performance overhead
const peerConnection = coldBrewRTC(
  servers,
  options,
  { production: true }
)
```

The same thing can be done with the [observeSignaling](#observe-signaling)
function:
```javascript
// For development, allows signaling events to be observed from
// within a test script
const socket = observeSignaling(io());


// For production, disables all extraneous event listening to eliminate
// performance overhead
const socket = observeSignaling(io(), { production: true })
```

### <a name="wrapping-up-test-cases"></a> Wrapping up test cases
Cold Brew uses [Selenium Webdriver](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver.html)
behind the scenes in order to
create and automate browser instances. Selenium Webdriver uses
a Promise-based API, but the Selenium API differs in one key
way from most other APIs: When a Selenium function is invoked,
instead of performing the action at that moment, Selenium *schedules*
that task within a queue that it maintains behind the scenes. After
scheduling all of the tasks, Selenium goes through the queue and
executes the tasks one after the other, moving on to the next task
when the previous one is complete.

What this means is that Cold Brew tests can usually be written as if
they are synchronous, even though they are actually asynchronous:
```javascript
const coldBrew = require('cold-brew')

const app = require('./server/index.js')

const ADDRESS = 'http://localhost:3000';

describe('app', function (done) {
  let client1;
  let client2;

  before(function () {
    client1 = coldBrew.createClient();
    client2 = coldBrew.createClient();
  })

  it('client 1 should send an offer to client 2', function (done) {
    client1.get(ADDRESS);
    client2.get(ADDRESS);

    client1.waitUntilSendSignaling(['offer'])
    client2.waitUntilReceiveSignaling(['offer'])
      .then(() => done())
  })

  after(function (done) {
    client1.quit()
    client2.quit().then(() => done())
  })
})
```
Caution: It is tempting to put the `done()` invocation
directly after the last Cold Brew task, which is *incorrect*, as it
will cause the `done` function to be invoked after all of the
tasks have been *scheduled*, not after they have been *completed*:
```javascript
const coldBrew = require('cold-brew')

const app = require('./server/index.js')

const ADDRESS = 'http://localhost:3000';

describe('app', function (done) {
  let client1;
  let client2;

  before(function () {
    client1 = coldBrew.createClient();
    client2 = coldBrew.createClient();
  })

  it('client 1 should send an offer to client 2', function (done) {
    client1.get(ADDRESS);
    client2.get(ADDRESS);

    client1.waitUntilSendSignaling(['offer'])
    client2.waitUntilReceiveSignaling(['offer'])
    done() // WRONG WRONG WRONG WRONG WRONG
  })

  after(function (done) {
    client1.quit()
    client2.quit()
    done() // WRONG WRONG WRONG WRONG WRONG
  })
})
```
This is an especially insidious error, because it will often cause
your tests to pass even if they should fail. To correct this,
we need to use the `then` method to explicitly schedule the
invocation of the `done` function to happen after the final
task has been *completed* in each test case:
```javascript
const coldBrew = require('cold-brew')

const app = require('./server/index.js')

const ADDRESS = 'http://localhost:3000';

describe('app', function (done) {
  let client1;
  let client2;

  before(function () {
    client1 = coldBrew.createClient();
    client2 = coldBrew.createClient();
  })

  it('client 1 should send an offer to client 2', function (done) {
    client1.get(ADDRESS);
    client2.get(ADDRESS);

    client1.waitUntilSendSignaling(['offer'])
    client2.waitUntilReceiveSignaling(['offer'])
      .then(() => done()) // CORRECT
  })

  after(function (done) {
    client1.quit()
    client2.quit().then(() => done()) // CORRECT
  })
})
```

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
The client-side module exposes the following functions and objects:
* [coldBrewRTC(configuration, options, coldBrewConfig)](#cold-brew-rtc)
* [observeSignaling(socket, options)](#observe-signaling)
* [RTC\_PEER\_CONNECTION\_EVENTS](#rtc-peer-connection-events)
* [RTC\_DATA\_CHANNEL\_EVENTS](#rtc-data-channel-events)

<a name="cold-brew-rtc"></a>
**coldBrewRTC(configuration, options, coldBrewConfig, dataChannelConfig)**

A factory function that creates and returns an RTCPeerConnection object. In
order to be able to observe the RTCPeerConnection's events from
within your test script, the RTCPeerConnection needs to be created using this
function rather than the standard RTCPeerConnection constructor
(see the usage example below).

Parameters:
* *configuration*: An object specifying the configuration options for the RTCPeerConnection object. Identical to the first parameter of the [RTCPeerConnection constructor](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection).
* *options*: An object specifying other optional properties of the RTCPeerConnection object.
* *coldBrewConfig*: An object containing configuration options for coldBrew. Defaults to an empty object if not provided. The object may contain the following properties:
  * *production*: Boolean value that, if true, disables all ColdBrew functionality to eliminate performance overhead. Defaults to false.
  * *listeners*: Array containing the RTCPeerConnection events that you want to be able to observe from the test script. Defaults to [RTC\_PEER\_CONNECTION_EVENTS](#rtc-peer-connection-events).
  * *label*: String label for this RTCPeerConnection object. If provided, the events
    that fire on this particular RTCPeerConnection can be observed separately
    from all others in a test script. Defaults to `null`.
* *dataChannelConfig*: An object containing configuration options for any
  RTCDataChannel objects created by the `createDataChannel` method of the
  RTCPeerConnection returned from `coldBrewRTC`. The object may contain the following
  properties:
  * *listeners*: Array containing the RTCDataChannel events that you want to be
    able to observe from the test script. Defaults to
    [RTC\_DATA\_CHANNEL\_EVENTS](#rtc-data-channel-events)

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

<a name="observe-signaling"></a>
**observeSignaling(socket, options)**

Modifies the behavior of a [Socket](http://socket.io/docs/client-api/#io(url:string,-opts:object):socket)
so that the events it emits and receives can be visible to an external
test script.

Parameters:
* *socket*: A [Socket](http://socket.io/docs/client-api/#io(url:string,-opts:object):socket)
  object, as specified by the socket.io client API
* *options*: An object of configuration options for the signaling socket.
  The following properties can be provided:
  * *production*: If `true`, disables all background event listeners on the socket,
    eliminating performance overhead. Defaults to `false`.
    Note: If `production: true` is provided, the test script will not be able to
    observe any signaling events sent through the socket.

Returns: The Socket object that was passed in, modified to allow
the events it emits and receives to be observed by an external test script.

Usage example:
```javascript
// Instead of doing this...
const socket = io();

// ...do this
const socket = observeSignaling(io());
```

<a name="rtc-peer-connection-events"></a>
**RTC\_PEER\_CONNECTION\_EVENTS**

Array containing the names of all of the events that fire on the [RTCPeerConnection object](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection).

<a name="rtc-data-channel-events"></a>
**RTC\_DATA\_CHANNEL\_EVENTS**

Array containing the names of all of the events that fire on the
[RTCDataChannel](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel)
object.

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
// If you want more control over client configuration, you can do this...
const client = new selenium.Builder()
  .usingServer()
  .withCapabilities({
    browserName: 'chrome'
  })
  .build();

coldBrew.addColdBrewMethods(client);

// ... instead of this:
const client = coldBrew.createClient();

```
When a WebDriver instance is create using `coldBrew.createClient()` or passed into the `coldBrew.addColdBrewMethods`
function, the following methods are added to it:
  * [client.untilRTCEvents(events, options)](#client-until-rtc-events)
  * [client.waitUntilRTCEvents(events, options, timeout)](#client-wait-until-rtc-events)
  * [client.untilSendSignaling(events, options)](#client-until-send-signaling)
  * [client.waitUntilSendSignaling(events, options, timeout)](#client-wait-until-send-signaling)
  * [client.untilReceiveSignaling(events, options)](#client-until-receive-signaling)
  * [client.waitUntilReceiveSignaling](#client-wait-until-receive-signaling)
  * [client.findElementByAttributes(selector, attributes)](#client-find-element-by-attributes)
  * [client.do(navigationEvents)](#client-do)

<a name="client-until-rtc-events"></a>
**client.untilRTCEvents(events, options)**

Returns a promise that will resolve with a truthy value when the specified
events have fired on the RTCPeerConnection object.

Parameters:
* *events*: An array of names of events that fire on the RTCPeerConnection
  object in the browser
* *options*: An object of configuration options. The following options are supported:
  * *inOrder*: If true, the returned promise will only resolve if
             the events occurred in the same order as the passed-in array.
             Defaults to `false` if not provided.
  * *label*: String label for an RTCPeerConnection. If provided, the returned
             promise will only resolve if the events given in the
             *events* array fire on the RTCPeerConnection that was given
             the specified label when it was created with the
             [coldBrewRTC](#cold-brew-rtc) factory function. If not,
             the promise will resolve if the provided events fire on
             _any_ RTCPeerConnection object that exists in the browser.
             

Returns: A promise that will resolve with a truthy value when the specified
events have fired on the RTCPeerConnection object in the browser. Note: This
method can only observe these events if the RTCPeerConnection object was created
with the [coldBrewRTC factory function](#cold-brew-rtc).

Usage example:
```javascript
// Using this method in a mocha test
const PORT = '3000'; // Or the port that you are running your server on.
const ADDRESS = `http://localhost:${PORT}`;

describe('RTCPeerConnection', function() {
  it('should signal to the other client and open a data channel', function(done) {
    this.timeout(5000);
    
    const client1 = coldBrew.createClient();
    const client2 = coldBrew.createClient();

    client1.get(ADDRESS);
    client2.get(ADDRESS);

    client1.wait(client1.untilRTCEvents([
      'signalingstatechange',
      'datachannel',
    ], {
      inOrder: true,
    }))
      .then((occurred) => {if (occurred) done()});
  });
});
```

<a name="client-wait-until-rtc-events"></a>
**client.waitUntilRTCEvents(events, options, timeout)**

Convenience method, equivalent to invoking `client.wait(client.untilRTCEvents(events, options), timeout)`

Usage example:
```javascript
// Refactor the previous test to use waitUntilRTCEvents
const PORT = '3000'; // Or the port that you are running your server on.
const ADDRESS = `http://localhost:${PORT}`;

describe('RTCPeerConnection', function() {
  it('should signal to the other client and open a data channel', function(done) {
    this.timeout(5000);
    
    const client1 = coldBrew.createClient();
    const client2 = coldBrew.createClient();

    client1.get(ADDRESS);
    client2.get(ADDRESS);

    client1.waituntilRTCEvents([
      'signalingstatechange', 
      'datachannel'
    ], {
      inOrder: true,
    })
      .then((occurred) => {if (occurred) done()});
  });
});
```

<a name="client-until-send-signaling"></a>
**client.untilSendSignaling(events, options)**

Returns a promise that will resolve with a truthy value when the specified
events have been emitted by the local signaling socket.

Parameters:
* *events*: An array of names of events emitted by the local signaling socket
* *options*: An object of configuration options. The following options are supported:
  * inOrder: If true, the returned promise will only resolve if
             the events occurred in the same order as the passed-in array.
             Defaults to `false` if not provided.

Returns: A promise that will resolve with a truthy value when the specified
events have been emitted from the local signaling socket. Note: This
method can only observe these events if the local signaling socket was modified
by the [observeSignaling](#observe-signaling) function in the client-side code.

Usage example:
```javascript
// Using this method in a mocha test
const PORT = '3000'; // Or the port that you are running your server on.
const ADDRESS = `http://localhost:${PORT}`;

describe('signaling socket', function() {
  it('should emit an offer and ICE candidates to the other client', function(done) {
    this.timeout(5000);

    const client1 = coldBrew.createClient();
    const client2 = coldBrew.createClient();

    client1.get(ADDRESS);
    client2.get(ADDRESS);

    client2.wait(client2.untilSendSignaling([
      'send offer',
      'send ice candidate',
    ], {
      inOrder: true,
    }))
      .then((occurred) => {if (occurred) done()});
  });
});
```

<a name="client-wait-until-send-signaling"></a>
**client.waitUntilSendSignaling(events, options, timeout)**

Convenience method, equivalent to invoking `client.wait(client.untilSendSignaling(events, options), timeout)`

Usage example:
```javascript
// Refactor the previous test to use client.waitUntilSendSignaling
const PORT = '3000'; // Or the port that you are running your server on.
const ADDRESS = `http://localhost:${PORT}`;

describe('signaling socket', function() {
  it('should emit an offer and ICE candidates to the other client', function(done) {
    this.timeout(5000);

    const client1 = coldBrew.createClient();
    const client2 = coldBrew.createClient();

    client1.get(ADDRESS);
    client2.get(ADDRESS);

    client2.waitUntilSendSignaling([
      'send offer',
      'send ice candidate',
    ], {
      inOrder: true,
    })
      .then((occurred) => {if (occurred) done()});
  });
});
```

<a name="client-until-receive-signaling"></a>
**client.untilReceiveSignaling(events, options)**

Returns a promise that will resolve with a truthy value when the specified
events have been received by the local signaling socket.

Parameters:
* *events*: An array of names of events received by the local signaling socket
* *options*: An object of configuration options. The following options are supported:
  * inOrder: If true, the returned promise will only resolve if
             the events occurred in the same order as the passed-in array.
             Defaults to `false` if not provided.

Returns: A promise that will resolve with a truthy value when the specified
events have been received by the local signaling socket. Note: This
method can only observe these events if the local signaling socket was modified
by the [observeSignaling](#observe-signaling) function in the client-side code.

Usage example:
```javascript
// Using this method in a mocha test
const PORT = '3000'; // Or the port that you are running your server on.
const ADDRESS = `http://localhost:${PORT}`;

describe('signaling socket', function() {
  it('should receive an offer and ICE candidates from the other client', function(done) {
    this.timeout(5000);
    
    const client1 = coldBrew.createClient();
    const client2 = coldBrew.createClient();

    client1.get(ADDRESS);
    client2.get(ADDRESS);

    client1.wait(client1.untilReceiveSignaling([
      'receive offer',
      'receive ice candidate',
    ], {
      inOrder: true,
    }))
      .then((occurred) => {if (occurred) done()});
  });
});
```

<a name="client-wait-until-receive-signaling"></a>
**client.waitUntilReceiveSignaling(events, options, timeout)**

Convenience method, equivalent to invoking `client.wait(client.untilReceiveSignaling(events, options), timeout)`

Usage example:
```javascript
// Refactor the previous example to use client.waitUntilReceiveSignaling
const PORT = '3000'; // Or the port that you are running your server on.
const ADDRESS = `http://localhost:${PORT}`;

describe('signaling socket', function() {
  it('should receive an offer and ICE candidates from the other client', function(done) {
    this.timeout(5000);
    
    const client1 = coldBrew.createClient();
    const client2 = coldBrew.createClient();

    client1.get(ADDRESS);
    client2.get(ADDRESS);

    client1.waitUntilReceiveSignaling([
      'receive offer',
      'receive ice candidate',
    ], {
      inOrder: true,
    })
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

Returns: A [WebElementPromise](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_WebElementPromise.html) matching the CSS selector and the given attributes.
Resolves with the WebElement if the element is located or rejects with
TypeError if not.

Usage example:
```javascript
// Locate the button inside the navbar that contains the test "Logout"
client.findElementByAttributes('nav button', { innerText: 'Logout' });

// Locate the input element inside the login form with a placeholder of "password"
client.findElementByAttributes('#login-form input', { placeholder: 'password' });
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

Returns: Promise that resolves when all of the individual navigation events
resolve or rejects with TypeError if one of the navigation events does not
locate a matching element on the page.

Throws TypeError if the `action` entry in any of the elements 
of `navigationEvents` is invalid.

Usage example:
```javascript
// In this example, the user will log in on the homepage, then create a chatroom
// on the following view.

// Without client.do:
client.get(ADDRESS);
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
client.get(ADDRESS);
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

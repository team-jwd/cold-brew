/* eslint no-use-before-define: 0 */
/* eslint no-param-reassign: 0 */
/* eslint no-undef: 0 */
/* eslint no-unused-vars: 0 */
/* eslint prefer-arrow-callback: 0 */
/* eslint func-names: 0 */
/* eslint no-shadow: 0 */

const selenium = require('selenium-webdriver');

const { By } = selenium;

/**
 * createClient - Creates and returns a webdriver object with the coldBrew
 * methods attached, allowing it to listen for RTCPeerConnection events
 * that occur in the browser.
 *
 * @return webdriver  A selenium webdriver object with the coldBrew
 * methods attached
 */
function createClient() {
  let client;
  // const client = new selenium.Builder()
  //   .usingServer()
  //   .withCapabilities({
  //     browserName: 'chrome',
  //     chromeOptions: {
  //       args: [
  //         '--use-fake-ui-for-media-stream',
  //       ],
  //     },
  //   })
  //   .build();
  if (process.env.SAUCE_USERNAME !== undefined) {
    client = new selenium.Builder()
      .usingServer('http://' + process.env.SAUCE_USERNAME + ':' + process.env.SAUCE_ACCESS_KEY + 'ondemand.saucelabs.com:80')
      .withCapabilities({
        'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
        build: process.env.TRAVIS_BUILD_NUMBER,
        username: process.env.SAUCE_USERNAME,
        accessKey: process.env.SAUCE_ACCESS_KEY,
        browserName: 'chrome',
        chromeOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
          ],
        },
      }).build();
  } else {
    client = new selenium.Builder()
    .usingServer()
    .withCapabilities({
      browserName: 'chrome',
      chromeOptions: {
        args: [
          '--use-fake-ui-for-media-stream',
        ],
      },
    })
    .build();
  }

  return addColdBrewMethods(client);
}


/**
 * addColdBrewMethods - Attaches the coldBrew methods to a webdriver instance,
 * which will allow it to listen for RTCPeerCOnnection events to occur in the
 * browser.
 *
 * @param  {type} client description
 * @return {type}        description
 */
function addColdBrewMethods(client) {
  /**
   * untilRTCEvents - allows the webdriver to wait until certain
   * RTCPeerCOnnection events to occur before proceeding
   *
   * @param  ...Strings events A list of the names of the events that
   * the client should wait for before proceeding
   *
   * @return function        A function that returns a promise to execute a
   * script in the browser that checks whether or not the provided RTC events
   * exist in the window.RTCEvents object. This function will be executed
   * repeatedly if it is used within a webdriver.wait() call,
   * e.g. client.wait(client.untilRTCEvents('signalingstatechange', 'iceconnectionstatechange'))
   */
  client.untilRTCEvents = function (events, options = {}) {
    const { inOrder, label } = options;
    if (inOrder && typeof inOrder !== 'boolean') {
      throw new TypeError(
        `Invalid option passed into untilRTCEvents: inOrder: ${inOrder}`
      );
    }

    if (label && typeof label !== 'string') {
      throw new TypeError(
        `Invalid option passed into untilRTCEvents: label: ${label}`
      );
    }

    // Needs to return a plain function instead of a promise so that
    // it will be executed repeatedly within the client.wait() function
    //
    // The plain function should return true if the events we are waiting
    // for exist on the window object, false otherwise.
    return function () {
      return client.executeScript(function (events, options) {
        const { inOrder, label } = options;
        // Check to make sure coldBrewData has been initialized
        if (!(window.coldBrewData && window.coldBrewData.RTCEvents)) {
          return false;
        }

        const loggedEvents = label ?
          window.coldBrewData.peerConnections[label] :
          window.coldBrewData.RTCEvents;

        loggedEventNames = loggedEvents.map(event => event.type);
        // Handle the case where the user doesn't care if the events
        // happened in a certain order


        if (!inOrder) {
          return events.every(eventName => loggedEventNames.includes(eventName));
        } else {
          return sameElementsInSameOrder(events, loggedEventNames);
        }

        function sameElementsInSameOrder(arr1, arr2) {
          let remainingArr2 = arr2;
          return arr1.reduce((truth, element) => {
            if (!truth) return false;

            const index = remainingArr2.indexOf(element);
            if (index === -1) {
              return false;
            }

            remainingArr2 = remainingArr2.slice(index);
            return true;
          }, true);
        }
      }, events, options);
    };
  };


  /**
   * waitUntilRTCEvents - convenience function to simplify the usage
   * of client.untilRTCEvents
   *
   * @param   events description
   * @return {type}           description
   */
  client.waitUntilRTCEvents = function (events, options, timeout) {
    return client.wait(client.untilRTCEvents(events, options), timeout);
  };


  client.untilSendSignaling = function (events, options = {}) {
    // Needs to return a plain function instead of a promise so that
    // it will be executed repeatedly within the client.wait() function
    //
    // The plain function should return true if the events we are waiting
    // for exist on the window object, false otherwise.

    const { inOrder } = options;
    if (inOrder && typeof inOrder !== 'boolean') {
      throw new TypeError(
        `Invalid option passed into untilSendSignaling: inOrder: ${inOrder}`
      );
    }

    return function () {
      return client.executeScript(function (events, inOrder) {
        // Check to make sure coldBrewData has been initialized
        if (!(window.coldBrewData && window.coldBrewData.socketEvents)) {
          return false;
        }

        if (!inOrder) {
          const outgoingSocketEvents = window.coldBrewData.socketEvents.outgoing
            .map(event => event.type);
          return events.every(eventName => outgoingSocketEvents.includes(eventName));
        }

        const socketEvents = window.coldBrewData.socketEvents.outgoing
          .map(event => event.type);

        return sameElementsInSameOrder(events, socketEvents);

        function sameElementsInSameOrder(arr1, arr2) {
          let remainingArr2 = arr2;
          return arr1.reduce((truth, element) => {
            if (!truth) return false;

            const index = remainingArr2.indexOf(element);
            if (index === -1) {
              return false;
            }
            remainingArr2 = remainingArr2.slice(index);
            return true;
          }, true);
        }
      }, events, inOrder);
    };
  };


  client.waitUntilSendSignaling = function (events, options, timeout) {
    return client.wait(client.untilSendSignaling(events, options), timeout);
  };


  client.untilRecieveSignaling = function (events, options = {}) {
    const { inOrder } = options;
    if (inOrder && typeof inOrder !== 'boolean') {
      throw new TypeError(
        `Invalid option passed into untilRecieveSignaling: inOrder: ${inOrder}`
      );
    }
    return function () {
      return client.executeScript(function (events, inOrder) {
        if (!(window.coldBrewData && window.coldBrewData.socketEvents)) {
          return false;
        }
        if (!inOrder) {
          const incomingSocketEvents = window.coldBrewData.socketEvents.incoming
            .map(event => event.type);
          return events.every(eventName => incomingSocketEvents.includes(eventName));
        }
        const socketEvents = window.coldBrewData.socketEvents.incoming
          .map(event => event.type);

        return sameElementsInSameOrder(events, socketEvents);

        function sameElementsInSameOrder(arr1, arr2) {
          let remainingArr2 = arr2;
          return arr1.reduce((truth, element) => {
            if (!truth) return false;

            const index = remainingArr2.indexOf(element);
            if (index === -1) {
              return false;
            }
            remainingArr2 = remainingArr2.slice(index);
            return true;
          }, true);
        }
      }, events, inOrder);
    };
  };


  client.waitUntilReceiveSignaling = function (events, options, timeout) {
    return client.wait(client.untilRecieveSignaling(events, options), timeout);
  };

  client.untilDataChannelEvents = function (events, options = {}) {
    const { inOrder } = options;
    if (inOrder && typeof inOrder !== 'boolean') {
      throw new TypeError(
        `Invalid option passed into untilDataChannelEvents: inOrder: ${inOrder}`
      );
    }
    return function () {
      return client.executeScript(function (events, inOrder) {
        console.log(window.coldBrewData);
        if (!(window.coldBrewData && window.coldBrewData.RTCDataChannelEvents)) {
          return false;
        }
        if (!inOrder) {
          const RTCDataChannelEvents = window.coldBrewData.RTCDataChannelEvents.map(event => event.type);
          return events.every(eventName => RTCDataChannelEvents.includes(eventName));
        }
      }, events, inOrder);
    }
  }

  client.waitUntilDataChannelEvents = function (events, options, timeout) {
    return client.wait(client.untilDataChannelEvents(events, options), timeout);
  };

  /**
   * findElementByAttributes - allows the webdriver to locate elements
   * by a css selector and then filter those elements by other attributes
   * that they possess.
   *
   * @param  String selector   A css selector for the element to find
   *
   * @param  Object attributes An object whose keys are DOM node attribute
   * names and values are the corresponding values of the desired element
   *
   * @return Promise           A promise that resolves with the first element
   * that is located by the given css selector AND possesses the given
   * attributes
   */
  client.findElementByAttributes = function (selector, attributes) {
    return client.findElement(By.js(function (selector, attributes) {
      let elements = Array.from(document.querySelectorAll(selector));

      Object.keys(attributes).forEach(attribute => {
        elements = elements.filter(element =>
          element[attribute] === attributes[attribute]);
      });

      return elements[0];
    }, selector, attributes || {}));
  };


  /**
   * client - Schedules several navigation tasks at once
   *
   * Convenience method to allow the webdriver to more easily
   * navigate throughout the website
   *
   * @param  Array navigationEvents An array of subarrays, each subarray
   * representing one navigation task. The navigation tasks are of the form
   * [action, selector, atributes], e.g.
   * ['click', 'button.login', {innerText: 'Login'}]
   *
   * The allowable actions are 'click', and 'sendKeys'. If 'sendKeys' is given,
   * a fourth element should be included in the array indicating the keys to
   * be sent, e.g.
   * ['sendKeys', 'input', {placeholder: 'username'}, 'dking']
   *
   * @return undefined
   */
  client.do = function (navigationEvents) {
    const validInput = navigationEvents.every(event =>
      validNavigation(event));

    if (!validInput) throw new TypeError('Navigation events');

    const navigationPromises = navigationEvents.reduce((arr, event) => {
      const action = event[0];
      const selector = event[1];
      const attributes = event[2];
      const keys = event[3]; // May be undefined if no 3rd item was given

      const navigationPromise = client.findElementByAttributes(selector, attributes)
        .then((element) => element[action](keys))
        .catch((err) => {
          throw new TypeError(
            `No element found with selector ${selector}
            and attributes ${JSON.stringify(attributes)}`
          );
        });

      arr.push(navigationPromise);

      return arr;
    }, []);

    return selenium.promise.all(navigationPromises);
  };


  function validNavigation(navigationEvent) {
    return Array.isArray(navigationEvent) &&
      ['click', 'sendKeys'].includes(navigationEvent[0]);
  }


  return client;
}

class ColdBrewError extends Error { }


module.exports = { createClient, addColdBrewMethods };

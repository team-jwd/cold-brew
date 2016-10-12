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
  let client = new selenium.Builder()
    .usingServer()
    .withCapabilities({
      browserName: 'chrome'
    })
    .build()

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
  client.untilRTCEvents = function(...events) {
    return function() {
      return client.executeScript(function(evts) {
        return evts.every(windowHasEvent);

        function windowHasEvent(eventName) {
          if (!window.RTCEvents) return false;

          for (let i = 0; i < window.RTCEvents.length; i++) {
            console.log('checking event', eventName);
            if(window.RTCEvents[i].type === eventName) {
              return true;
            }
          }

          return false;
        }
      }, events);
    }
  };


  /**
   * waitUntilRTCEvents - convenience function to simplify the usage
   * of client.untilRTCEvents
   *
   * @param   events description
   * @return {type}           description
   */
  client.waitUntilRTCEvents = function(...events) {
    return client.wait(client.untilRTCEvents(...events));
  }


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
  client.findElementByAttributes = function(selector, attributes) {
    return client.findElement(By.js(function(selector, attributes) {
      let elements = Array.from(document.querySelectorAll(selector));

      Object.keys(attributes).forEach(attribute => {
        elements = elements.filter(element =>
          element[attribute] === attributes[attribute])
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
  client.do = function(navigationEvents) {
    const validInput = navigationEvents.every(event =>
      validNavigation(event));

    if (!validInput) throw new ColdBrewError('Navigation events');

    navigationEvents.forEach(event => {
      const action = event[0];
      const selector = event[1];
      const attributes = event[2];
      const keys = event[3]; // May be undefined if no 3rd item was given

      client.findElementByAttributes(selector, attributes)[action](keys);
    });
  };


  function validNavigation(navigationEvent) {
    return Array.isArray(navigationEvent) &&
           ['click', 'sendKeys'].includes(navigationEvent[0]);
  }


  return client;
}

class ColdBrewError extends Error {}


module.exports = { createClient, addColdBrewMethods };

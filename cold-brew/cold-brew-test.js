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
  client.findElementByAttributes(selector, attributes) {
    return client.findElement(By.js(function(selector, attributes) {
      let elements = Array.from(document.querySelectorAll(selector));

      Object.keys(attributes).forEach(attribute => {
        elements = elements.filter(element =>
          element[attribute] === attributes[attributes])
      });

      return elements[0];
    }, selector, attributes || {}));
  }

  return client;
}

module.exports = { createClient, addColdBrewMethods }

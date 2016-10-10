const selenium = require('selenium-webdriver');

// Need to put in some kind of closed over variable to track
// how many peer connections there are, so that the window can
// capture the events for several peer connections

module.exports = function coldBrewClient() {
  let client = new selenium.Builder()
    .usingServer()
    .withCapabilities({
      browserName: 'chrome'
    })
    .build()

  client.untilRTCEvents = function(events) {
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

  return client;
}

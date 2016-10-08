const selenium = require('selenium-webdriver');

// Need to put in some kind of closed over variable to track
// how many peer connections there are, so that the window can
// capture the events for several peer connections

module.exports = function() {
  let coldBrewClient = new selenium.Builder()
    .usingServer()
    .withCapabilities({
      browserName: 'chrome'
    })
    .build()

  coldBrewClient.untilRTCEvents = function(events) {
    return coldBrewClient.executeScript(function(evts) {
      return evts.map(windowHasEvent).every();

      function windowHasEvent(eventName) {
        for (let i = 0; i < window.RTCEvents.length; i++) {
          if(window.RTCEvents[j].type === eventName) return true;
        }

        return false;
      }
    }, events);
  };

  return coldBrewClient;
}

if (window.RTCEvents) throw new ColdBrewError(
  'Cannot capture RTC events, window.RTCEvents property already exists');

// Attach an RTCEvents array to the window object to keep a record of the
// events that fire on the RTCPeerConnection object
window.RTCEvents = [];

// An array of all of the events that fire on the RTCPeerConnection object
const RTC_PEER_CONNECTION_EVENTS = [
  'addstream',
  'connectionstatechange',
  'datachannel',
  'icecandidate',
  'iceconnectionstatechange',
  'icegatheringstatechange',
  'identityresult',
  'idpassertionerror',
  'idpvalidationerror',
  'negotiationneeded',
  'peeridentity',
  'removestream',
  'signalingstatechange',
  'track',
]


/**
 * coldBrewRTC - Factory function that creates and returns an RTCPeerCOnnection
 * object. The RTCPeerConnection object's behavior is augmented to
 * enable it to push any events that fire on it into an array attached
 * to the window object.
 *
 * @param  {type} servers        description
 * @param  {type} options        description
 * @param  {type} coldBrewConfig description
 * @return {type}                description
 */
function coldBrewRTC(servers, options, coldBrewConfig) {
  coldBrewConfig = coldBrewConfig || {};
  
  const production = coldBrewConfig.production || false;
  const listeners = coldBrewConfig.listeners || RTC_PEER_CONNECTION_EVENTS;

  const valid = listeners.every(listener =>
    RTC_PEER_CONNECTION_EVENTS.includes(listener));

  if (!valid) throw new ColdBrewError(
    'Invalid event names passed in to coldBrewRTC');

  const peerConnection = new RTCPeerConnection(servers, options);

  if (!production) {
    listeners.forEach((listener) => {
      peerConnection.addEventListener(listener, (event) => {
        window.RTCEvents.push(event);
      });
    });
  }

  return peerConnection;
}


class ColdBrewError extends Error {};

module.exports = { coldBrewRTC, RTC_PEER_CONNECTION_EVENTS };

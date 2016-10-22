if (window.coldBrewData) throw new ColdBrewError(
  'Cannot capture RTC events, window.coldBrewData property already exists');

// Attach a coldBrewData object to the window object to keep a record of the
// events that fire on the RTCPeerConnection object
window.coldBrewData = {
  RTCEvents: [],
  socketEvents: {
    outgoing: [],
    incoming: [],
  },
  peerConnections: {},
  sockets: {},
};

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
        window.coldBrewData.RTCEvents.push(event);
      });
    });
  }

  return peerConnection;
}


function observeSignaling(socket) {
  return new Proxy(socket, {
    get: function (target, key, receiver) {
      let type, data, callback;

      switch (key) {
        case 'emit':
          // emit can be called with 1 to 3 arguments:
          // type
          // type, data
          // type, callback
          // type, data, callback
          // Therefore, we need to parse the arguments
          return function (...args) {
            const type = args[0];

            if (args[1]) {
              if (typeof args[1] === 'function') callback = args[1];
              else data = args[1];
            }

            if (args[2]) {
              if (typeof args[2] === 'function') callback = args[2];
            }

            window.coldBrewData.socketEvents.outgoing.push({
              type,
              data,
              callback
            });

            return target.emit(...args)
          }
        
        case 'on':
          // on always takes two arguments: the type of event and the callback
          return function (type, callback) {
            target.on(type, (...data) => {
              window.coldBrewData.socketEvents.incoming.push({
                type,
                data,
                callback
              });

              callback(...data)
            });
          }
        default:
          return target[key];
      }
    }
  });
}


class ColdBrewError extends Error {};

if (typeof module !== 'undefined') {
  module.exports = {
    coldBrewRTC,
    observeSignaling,
    RTC_PEER_CONNECTION_EVENTS,
  };
}


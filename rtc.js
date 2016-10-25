/* eslint no-undef: 0 */
/* eslint no-unused-vars: 0 */
/* eslint prefer-arrow-callback: 0 */
/* eslint func-names: 0 */
/* eslint no-use-before-define: 0 */
/* eslint no-param-reassign: 0 */
/* eslint no-shadow: 0 */

if (window.coldBrewData) {
  throw new ColdBrewError(
    'Cannot capture RTC events, window.coldBrewData property already exists');
}

// Attach a coldBrewData object to the window object to keep a record of the
// events that fire on the RTCPeerConnection object
window.coldBrewData = {
  RTCEvents: [],
  RTCDataChannelEvents: [],
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
];

const RTC_DATA_CHANNEL_EVENTS = [
  'bufferedamountlow',
  'close',
  'error',
  'message',
  'open',
];

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
function coldBrewRTC(servers, options, coldBrewConfig, dataChannelConfig) {
  if (coldBrewConfig && coldBrewConfig.production) {
    return new RTCPeerConnection(servers, options);
  }

  // setup config for RTCPeerConnection
  coldBrewConfig = coldBrewConfig || {};

  const listeners = coldBrewConfig.listeners || RTC_PEER_CONNECTION_EVENTS;
  const label = coldBrewConfig.label || null;
  validateListeners(listeners);

  // setup config for dataChannelConfig
  dataChannelConfig = dataChannelConfig || {};

  const dataListeners = dataChannelConfig.listeners || RTC_DATA_CHANNEL_EVENTS;
  validateDataListeners(dataListeners);

  // Create peer connection
  const peerConnection = new RTCPeerConnection(servers, options);
  addEventLogListeners(peerConnection, listeners, label);
  addDataListenersOnChannelCreation(peerConnection, dataListeners);
  addDataListenersOnDataChannelEvent(peerConnection, dataListeners);

  return peerConnection;


  function validateListeners(listeners) {
    const valid = listeners.every(listener =>
      RTC_PEER_CONNECTION_EVENTS.includes(listener));

    if (!valid) {
      throw new ColdBrewError(
        'Invalid event names passed in to coldBrewRTC');
    }
  }

  function validateDataListeners(dataListeners) {
    const valid = dataListeners.every(listener =>
      RTC_DATA_CHANNEL_EVENTS.includes(listener));

    if (!valid) {
      throw new ColdBrewError(
        'Invalid data channel event names passed in to coldBrewRTC');
    }
  }

  function addEventLogListeners(peerConnection, listeners, label = null) {
    if (label) {
      window.coldBrewData.peerConnections[label] = [];
    }

    listeners.forEach((listener) => {
      peerConnection.addEventListener(listener, (event) => {
        window.coldBrewData.RTCEvents.push(event);
        if (label) {
          window.coldBrewData.peerConnections[label].push(event);
        }
      });
    });
  }

  function addDataListenersOnChannelCreation(peerConnection, dataListeners) {
    const createDataChannel = peerConnection.createDataChannel.bind(peerConnection);

    peerConnection.createDataChannel = function (...args) {
      const newDataChannel = createDataChannel(...args);
      dataListeners.forEach((listener) => {
        newDataChannel.addEventListener(listener, (event) => {
          window.coldBrewData.RTCDataChannelEvents.push(event)
        });
      });

      return newDataChannel;
    }
  }

  function addDataListenersOnDataChannelEvent(peerConnection, dataListeners) {
    Object.defineProperty(peerConnection, 'ondatachannel', {
      set(func) {
        peerConnection.addEventListener('datachannel', function (e) {
          const datachannel = e.channel;
          dataListeners.forEach((listener) => {
            datachannel.addEventListener(listener, (event) => {
              window.coldBrewData.RTCDataChannelEvents.push(event);
            });
          });

          func(e);
        });
      },
    });
  }
}


function observeSignaling(socket, options = {}) {
  if (options.production === true) return socket;

  return new Proxy(socket, {
    get(target, key, receiver) {
      switch (key) {
      case 'emit':
        return emitAndLog(target);

      case 'on':
        return logOnReceipt(target);

      default:
        return target[key];
      }
    },
  });

  function emitAndLog(target) {
    return function (...args) {
      // emit can be called with 1 to 3 arguments:
      // type
      // type, data
      // type, callback
      // type, data, callback
      // Therefore, we need to parse the arguments
      const type = args[0];

      let data;
      let callback;

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
        callback,
      });

      return target.emit(...args);
    }
  }

  function logOnReceipt(target) {
    return function (type, callback) {
      target.on(type, (...data) => {
        window.coldBrewData.socketEvents.incoming.push({
          type,
          data,
          callback,
        });

        callback(...data);
      });
    }
  }
}


class ColdBrewError extends Error {}

if (typeof module !== 'undefined') {
  module.exports = {
    coldBrewRTC,
    observeSignaling,
    RTC_PEER_CONNECTION_EVENTS,
    RTC_DATA_CHANNEL_EVENTS
  };
}


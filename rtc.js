'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/* eslint no-undef: 0 */
/* eslint no-unused-vars: 0 */
/* eslint prefer-arrow-callback: 0 */
/* eslint func-names: 0 */
/* eslint no-use-before-define: 0 */
/* eslint no-param-reassign: 0 */
/* eslint no-shadow: 0 */

if (window.coldBrewData) {
  throw new ColdBrewError('Cannot capture RTC events, window.coldBrewData property already exists');
}

// Attach a coldBrewData object to the window object to keep a record of the
// events that fire on the RTCPeerConnection object
window.coldBrewData = {
  RTCEvents: [],
  RTCDataChannelEvents: [],
  socketEvents: {
    outgoing: [],
    incoming: []
  },
  peerConnections: {},
  sockets: {}
};

// An array of all of the events that fire on the RTCPeerConnection object
var RTC_PEER_CONNECTION_EVENTS = ['addstream', 'connectionstatechange', 'datachannel', 'icecandidate', 'iceconnectionstatechange', 'icegatheringstatechange', 'identityresult', 'idpassertionerror', 'idpvalidationerror', 'negotiationneeded', 'peeridentity', 'removestream', 'signalingstatechange', 'track'];

var RTC_DATA_CHANNEL_EVENTS = ['bufferedamountlow', 'close', 'error', 'message', 'open'];

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

  var listeners = coldBrewConfig.listeners || RTC_PEER_CONNECTION_EVENTS;
  var label = coldBrewConfig.label || null;
  validateListeners(listeners);

  // setup config for dataChannelConfig
  dataChannelConfig = dataChannelConfig || {};

  var dataListeners = dataChannelConfig.listeners || RTC_DATA_CHANNEL_EVENTS;
  validateDataListeners(dataListeners);

  // Create peer connection
  var peerConnection = new RTCPeerConnection(servers, options);
  addEventLogListeners(peerConnection, listeners, label);
  addDataListenersOnChannelCreation(peerConnection, dataListeners);
  addDataListenersOnDataChannelEvent(peerConnection, dataListeners);

  return peerConnection;

  function validateListeners(listeners) {
    var valid = listeners.every(function (listener) {
      return RTC_PEER_CONNECTION_EVENTS.includes(listener);
    });

    if (!valid) {
      throw new ColdBrewError('Invalid event names passed in to coldBrewRTC');
    }
  }

  function validateDataListeners(dataListeners) {
    var valid = dataListeners.every(function (listener) {
      return RTC_DATA_CHANNEL_EVENTS.includes(listener);
    });

    if (!valid) {
      throw new ColdBrewError('Invalid data channel event names passed in to coldBrewRTC');
    }
  }

  function addEventLogListeners(peerConnection, listeners) {
    var label = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    if (label) {
      window.coldBrewData.peerConnections[label] = [];
    }

    listeners.forEach(function (listener) {
      peerConnection.addEventListener(listener, function (event) {
        window.coldBrewData.RTCEvents.push(event);
        if (label) {
          window.coldBrewData.peerConnections[label].push(event);
        }
      });
    });
  }

  function addDataListenersOnChannelCreation(peerConnection, dataListeners) {
    var createDataChannel = peerConnection.createDataChannel.bind(peerConnection);

    peerConnection.createDataChannel = function () {
      var newDataChannel = createDataChannel.apply(undefined, arguments);
      dataListeners.forEach(function (listener) {
        newDataChannel.addEventListener(listener, function (event) {
          window.coldBrewData.RTCDataChannelEvents.push(event);
        });
      });

      return newDataChannel;
    };
  }

  function addDataListenersOnDataChannelEvent(peerConnection, dataListeners) {
    Object.defineProperty(peerConnection, 'ondatachannel', {
      set: function set(func) {
        peerConnection.addEventListener('datachannel', function (e) {
          var datachannel = e.channel;
          dataListeners.forEach(function (listener) {
            datachannel.addEventListener(listener, function (event) {
              window.coldBrewData.RTCDataChannelEvents.push(event);
            });
          });

          func(e);
        });
      }
    });
  }
}

function observeSignaling(socket) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (options.production === true) return socket;

  return new Proxy(socket, {
    get: function get(target, key, receiver) {
      switch (key) {
        case 'emit':
          return emitAndLog(target);

        case 'on':
          return logOnReceipt(target);

        default:
          return target[key];
      }
    }
  });

  function emitAndLog(target) {
    return function () {
      // emit can be called with 1 to 3 arguments:
      // type
      // type, data
      // type, callback
      // type, data, callback
      // Therefore, we need to parse the arguments
      var type = arguments.length <= 0 ? undefined : arguments[0];

      var data = void 0;
      var callback = void 0;

      if (arguments.length <= 1 ? undefined : arguments[1]) {
        if (typeof (arguments.length <= 1 ? undefined : arguments[1]) === 'function') callback = arguments.length <= 1 ? undefined : arguments[1];else data = arguments.length <= 1 ? undefined : arguments[1];
      }

      if (arguments.length <= 2 ? undefined : arguments[2]) {
        if (typeof (arguments.length <= 2 ? undefined : arguments[2]) === 'function') callback = arguments.length <= 2 ? undefined : arguments[2];
      }

      window.coldBrewData.socketEvents.outgoing.push({
        type: type,
        data: data,
        callback: callback
      });

      return target.emit.apply(target, arguments);
    };
  }

  function logOnReceipt(target) {
    return function (type, callback) {
      target.on(type, function () {
        for (var _len = arguments.length, data = Array(_len), _key = 0; _key < _len; _key++) {
          data[_key] = arguments[_key];
        }

        window.coldBrewData.socketEvents.incoming.push({
          type: type,
          data: data,
          callback: callback
        });

        callback.apply(undefined, data);
      });
    };
  }
}

var ColdBrewError = function (_Error) {
  _inherits(ColdBrewError, _Error);

  function ColdBrewError() {
    _classCallCheck(this, ColdBrewError);

    return _possibleConstructorReturn(this, (ColdBrewError.__proto__ || Object.getPrototypeOf(ColdBrewError)).apply(this, arguments));
  }

  return ColdBrewError;
}(Error);

if (typeof module !== 'undefined') {
  module.exports = {
    coldBrewRTC: coldBrewRTC,
    observeSignaling: observeSignaling,
    RTC_PEER_CONNECTION_EVENTS: RTC_PEER_CONNECTION_EVENTS,
    RTC_DATA_CHANNEL_EVENTS: RTC_DATA_CHANNEL_EVENTS
  };
}
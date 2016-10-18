/* eslint no-undef: 0 */
/* eslint no-shadow: 0 */
/* eslint no-use-before-define: 0 */
/* eslint no-param-reassign: 0 */
const SERVERS = {
  iceServers: [
    {
      url: 'stun:stun.l.google.com:19302',
    },
    {
      url: 'turn:numb.viagenie.ca',
      credential: 'muazkh',
      username: 'webrtc@live.com',
    },
    {
      url: 'turn:192.158.29.39:3478?transport=udp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808',
    },
    {
      url: 'turn:192.158.29.39:3478?transport=tcp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808',
    },
  ],
};

let peerConnection = null;
let isInitiator = false;
let socket = null;
let dataChannel = null;

$(document).ready(() => {
  socket = io();
  $('form').on('submit', (e) => {
    e.preventDefault();
  });

  $('button').on('click', function message() {
    const message = $(this).siblings()[0].value;
    handleIncomingMessage(message);

    $(this).siblings()[0].value = '';

    dataChannel.send(message);
  });

  $('input').on('keypress', (e) => {
    if (e.keypress === 13) {
      $('button').trigger('click');
    }
  });

  socket.emit('join', (numClients) => {
    isInitiator = numClients === 2;

    peerConnection = createRTC(socket);

    if (isInitiator) {
      initiateSignaling(socket, peerConnection);
    } else {
      prepareToReceiveOffer(socket, peerConnection);
    }
  });

  $(window).on('unload', () => {
    socket.emit('leave page');
  });
});


function createRTC(socket) {
  const peerConnection = coldBrewRTC(
    SERVERS,
    { optional: [{ RtcDataChannels: true }] }
  );

  peerConnection.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit('send ice candidate', e.candidate);
    }
  };

  socket.on('receive ice candidate', (candidate) => {
    peerConnection.addIceCandidate(candidate);
  });

  return peerConnection;
}


function initiateSignaling(socket, peerConnection) {
  initiateDataChannel(peerConnection);

  peerConnection.createOffer((offer) => {
    peerConnection.setLocalDescription(offer);
    socket.emit('send offer', offer);
  }, (err) => {
    throw err;
  });

  socket.on('receive answer', (answer) => {
    peerConnection.setRemoteDescription(answer);
  });
}


function initiateDataChannel(peerConnection) {
  dataChannel = peerConnection.createDataChannel(
    'messageChannel',
    { reliable: false }
  );

  dataChannel.onopen = () => {
    dataChannel.onmessage = (message) => {
      handleIncomingMessage(message.data);
    };
  };
}


function prepareToReceiveOffer(socket, peerConnection) {
  peerConnection.ondatachannel = (e) => {
    dataChannel = e.channel;
    dataChannel.onmessage = (message) => {
      handleIncomingMessage(message.data);
    };
  };

  socket.on('receive offer', (offer) => {
    peerConnection.setRemoteDescription(offer);
    peerConnection.createAnswer((answer) => {
      peerConnection.setLocalDescription(answer);
      socket.emit('send answer', answer);
    }, (err) => {
      throw err;
    });
  });
}


function handleIncomingMessage(message) {
  const messageElement = $('<p></p>', { class: 'message' });
  messageElement.text(message);
  $('#chat-window').append(messageElement);
}

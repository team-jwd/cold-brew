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
  let getVideo = $('#getVideo');
  getVideo.attr('disabled', true);
  let sendVideo = $('#sendVideo');
  sendVideo.attr('disabled', true);

  socket = observeSignaling(io());
  $('form').on('submit', (e) => {
    e.preventDefault();
  });

  $('#sendMessage').on('click', function message() {
    const message = $(this).siblings()[0].value;
    handleIncomingMessage(message);

    $(this).siblings()[0].value = '';

    const data = JSON.stringify({ type: 'message', message: message });

    dataChannel.send(data);
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
    { optional: [{ RtcDataChannels: true }] },
    { label: 'theonlypeerConnection' }
  );

  peerConnection.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit('send ice candidate', e.candidate);
    }
  };

  socket.on('receive ice candidate', (candidate) => {
    peerConnection.addIceCandidate(candidate);
  });

  peerConnection.onaddstream = function(event) {
    console.log('onaddstream event invoked');
    $('#remoteVideo').attr('src', URL.createObjectURL(event.stream));
  }

  return peerConnection;
}


function initiateSignaling(socket, peerConnection) {
  initiateDataChannel(peerConnection);
  let initiatedVideo = initiateLocalVideo(peerConnection);

  initiatedVideo.then(function() {
    console.log('Video initiated');
    peerConnection.createOffer((offer) => {
      console.log('created offer: ', offer);
      peerConnection.setLocalDescription(offer);
      socket.emit('send offer', offer);
    }, (err) => {
      throw err;
    });
  });

  socket.on('receive answer', (answer) => {
    peerConnection.setRemoteDescription(answer);
  });
}

function initiateLocalVideo(peerConnection) {
  return new Promise(function(resolve, reject) { 
    navigator.getUserMedia({ video: true }, function (localStream) {
      $('#localVideo').attr('src', URL.createObjectURL(localStream));
      peerConnection.addStream(localStream);
      resolve();
    });
  });
}


function initiateDataChannel(peerConnection) {
  dataChannel = peerConnection.createDataChannel(
    'messageChannel',
    { reliable: false }
  );

  dataChannel.onclose = () => {
    console.log('DataChannel Closed');
  }

  dataChannel.onopen = () => {
    console.log('DataChannel Opened');
    $('#getVideo').attr('disabled', false);

    dataChannel.onmessage = (message) => {
      const data = JSON.parse(message.data);
      console.log('onmessage event fire, data: ', data);

      if (data.type === 'offer') {
        handleOffer(data.offer);
      } else if (data.type === 'answer') {
        handleAnswer(data.answer);
      } else {
        handleIncomingMessage(data.message);
      }
    };
  };
}

function handleOffer(offer) {
  peerConnection.setRemoteDescription(offer);
  peerConnection.createAnswer(function(answer) {
    peerConnection.setLocalDescription(answer);
    const data = JSON.stringify({ type: 'answer', answer: answer }); 
    dataChannel.send(data);
  });
}

function handleAnswer(answer) {
  peerConnection.setLocalDescription(answer);
}

function prepareToReceiveOffer(socket, peerConnection) {
  peerConnection.ondatachannel = (e) => {
    dataChannel = e.channel;

    dataChannel.onclose = () => {
      console.log('DataChannel Closed');
    }

    dataChannel.onopen = () => {
      console.log('DataChannel Opened');
      $('#getVideo').attr('disabled', false);
    }

    dataChannel.onmessage = (message) => {
      data = JSON.parse(message.data);
      handleIncomingMessage(data.message);
    };
  };

  socket.on('receive offer', (offer) => {
    peerConnection.setRemoteDescription(offer);

    // before answer, initiateVideo
    let initiatedVideo = initiateLocalVideo(peerConnection);

    initiatedVideo.then(function() {
      peerConnection.createAnswer((answer) => {
        console.log('created answer:', answer);
        peerConnection.setLocalDescription(answer);
        socket.emit('send answer', answer);
      }, (err) => {
        throw err;
      });
    });
  });
}


function handleIncomingMessage(message) {
  const messageElement = $('<p></p>', { class: 'message' });
  messageElement.class = 'message';
  messageElement.text(message);
  $('#chat-window').append(messageElement);
}

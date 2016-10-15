/* eslint no-undef: 0 */
const SERVERS = {
  'iceServers': [
    {
      'url': 'stun:stun.l.google.com:19302',
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

$(document).ready(() => {
  const socket = io();
  $('form').on('submit', (e) => {
    e.preventDefault();
  });

  $('button').on('click', function () {
    const message = $(this).siblings()[0].value;
    const messageElement = $('<p></p>', { class: 'message' });
    messageElement.text(message);
    $('#chat-window').append(messageElement);
    $(this).siblings()[0].value = '';
  });

  $('input').on('keypress', (e) => {
    if (e.keypress === 13) {
      $('button').trigger('click');
    }
  });

  const peerConnection = new RTCPeerConnection(
    SERVERS,
    { optional: [{ RtcDataChannels: true }] }
  );

  peerConnection.addEventListener('icecandidate', (e) => {
    if (event.candidate) {
      // local ice candidate discovered
      socket.emit('remote_candidate', {
        roomName,
        candidate: JSON.stringify(event.candidate),
      });
    }
  });
  // NEED TO PUT remote_candidate on server as well
  socket.on('remote_candidate', (candidate) => {
    // received remote ice candidate
    const candidateObj = JSON.parse(candidate);
    peerConnection.addIceCandidate(candidateObj);
  });

  socket.on('joined', (numClients) => {

  });

  $(window).on('unload', () => {
    socket.emit('left');
  });
});

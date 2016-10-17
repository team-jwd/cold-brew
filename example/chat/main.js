/* eslint no-undef: 0 */
// const SERVERS = {
//   'iceServers': [
//     {
//       'url': 'stun:stun.l.google.com:19302',
//     },
//     {
//       url: 'turn:numb.viagenie.ca',
//       credential: 'muazkh',
//       username: 'webrtc@live.com',
//     },
//     {
//       url: 'turn:192.158.29.39:3478?transport=udp',
//       credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
//       username: '28224511:1379330808',
//     },
//     {
//       url: 'turn:192.158.29.39:3478?transport=tcp',
//       credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
//       username: '28224511:1379330808',
//     },
//   ],
// };
let isInitiator = false;

const messages = [];
let peerConnection = null;
let channel = null;
const roomName = 'test-room';

$(document).ready(() => {
  const socket = io();
  $('form').on('submit', (e) => {
    e.preventDefault();
  });

  peerConnection = coldBrewRTC(
    null,
    { optional: [{ RtcDataChannels: true }] }
  );

  peerConnection.onicecandidate = (e) => {
    console.log('e.candidate, icecandidate: ', e.candidate);
    if (e.candidate) {
      socket.emit('remote candidate', {
        roomName,
        candidate: JSON.stringify(e.candidate),
      });
    }
  };


  socket.emit('join_room', roomName, (res) => {
    if (res === 'full') {
      // room is full
    } else if (res === 2) {
      isInitiator = true;
    }
    if (isInitiator) {
      try {
        console.log('trying!');
        channel = peerConnection.createDataChannel(
          'sendDataChannel',
          { reliable: false }
        );
      } catch (e) {
        throw e;
      }
      console.log('pre peerConnection', peerConnection);
      new Promise((resolve, reject) => {
        peerConnection.createOffer((sessionDescription) => {
          console.log('creating offer', sessionDescription);
          console.log('CREATED OFFER: ', channel);
          peerConnection.setLocalDescription(sessionDescription);
          socket.emit('offer', sessionDescription, roomName);
          resolve(sessionDescription);
        }, (error) => {
          console.log(error);
          reject(error);
        });
      });
      socket.on('answer', (sessionDescription) => {
        console.log('recieved answer: ', sessionDescription);
        peerConnection.setRemoteDescription(sessionDescription);
      });

      channel.onopen = () => {
        console.log('in channel onopen');
        channel.onmessage = (message) => {
          console.log('channel onmessage');
          const msg = JSON.parse(message.data.message);
          messages.push(msg);
        };
      };
    } else {
      console.log('promises');
      socket.on('offer', (sessionDescription) => {
        console.log('recieved offer', sessionDescription);
        peerConnection.setRemoteDescription(sessionDescription);
        new Promise((resolve, reject) => {
          peerConnection.createAnswer((sessionDescriptionn) => {
            console.log('pc.createAnswer: ', sessionDescriptionn);
            peerConnection.setLocalDescription(sessionDescriptionn);
            socket.emit('answer', sessionDescriptionn, roomName);
            resolve(sessionDescriptionn);
          });
        });
      });
      console.log('CHANNEL PRE ondatachannel: ', channel);
      peerConnection.ondatachannel = (event) => {
        console.log('pc.onDataChannel: ', event);
        const dataChannel = event.channel;
        dataChannel.onmessage = (message) => {
          console.log('dc.onmessage: ', message);
          this.handleRTCData(message);
          const msg = JSON.parse(message.data.message);
          messages.push(msg);
        };
      };
    }
  });

  // socket.emit('create_room', roomName, (respond) => {
  //   if (respond !== 'exists') {
  //     console.log('wtf homes');
  //   }
  // });

  $('button').on('click', function () {
    const message = $(this).siblings()[0].value;
    const msgObj = { message };
    const messageElement = $('<p></p>', { class: 'message' });
    messageElement.text(message);
    $('#chat-window').append(messageElement);
    $(this).siblings()[0].value = '';
    channel.send(JSON.stringify(msgObj));
  });

  $('input').on('keypress', (e) => {
    if (e.keypress === 13) {
      $('button').trigger('click');
    }
  });

  socket.on('remote candidate', (candidate) => {
    console.log('remote candidate: ', candidate);
    const candidateObj = JSON.parse(candidate);
    peerConnection.addIceCandidate(candidateObj);
  });
  console.log('before if: ', isInitiator);



  socket.on('joined', (numClients) => {
    console.log(numClients);
  });

  $(window).on('unload', () => {
    socket.emit('left');
  });
});

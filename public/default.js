'use strict';

var socket = io.connect();

var video = document.querySelector('.localVideo');
var remoteVideo = document.querySelector('.remoteVideo');
var clientInfo = document.querySelector('.client.info');
var clientStatus = document.querySelector('.client.status');
var peerInfo = document.querySelector('.peer.info');
var peerStatus = document.querySelector('.peer.status');
var joinButton = document.querySelector('.joinButton');
var callButton = document.querySelector('.callButton');

var servers = {}
var peerConnection = new RTCPeerConnection(servers);
initCamera(false, true);

socket.emit('login', "David");

callButton.addEventListener('click', (e) => {
  peerConnection.createOffer((sessionDescription) => {
    peerConnection.setLocalDescription(sessionDescription);    
    socket.emit('offer', sessionDescription);

  }, (error) => {
    console.log('Create offer error: ' + error);

  });
})

function initCamera(useAudio, useVideo) {
  var constraints = {
    audio: useAudio,
    video: useVideo
  };

  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    window.localStream = stream;
    if (window.URL) {
      video.src = window.URL.createObjectURL(stream);
    } else {
      video.src = stream;
    }

    peerConnection.addStream(stream);

  }, (err) => {
    console.log('navigator.getUserMedia error: ', error);
  })
}

peerConnection.onaddstream = () => {
  console.log('Remote stream added.');
  remoteVideo.src = window.URL.createObjectURL(event.stream);
  window.remoteStream = event.stream;
};

peerConnection.onremovestream = () => {
  console.log('Remote stream removed. Event: ', event);
};

peerConnection.onicecandidate = (e) => {
  console.log('onIceCandidate');

  if (e.candidate) {
    console.log('candidate: ' + e.candidate);

    socket.emit('candidate',
      {
        type: 'candidate',
        label: e.candidate.sdpMLineIndex,
        id: e.candidate.sdpMid,
        candidate: e.candidate.candidate
      });
  }
};

socket.on('connected', (clientId) => {
  console.log('Connected: ' + clientId);

  clientInfo.innerText = clientId;

  clientStatus.classList.add('online');
});

socket.on('new-client', (name, clientId) => {
  console.log('New client: ' + clientId);

  peerInfo.innerText = clientId;
  peerStatus.classList.add('online');
});

socket.on('ready', () => {
  console.log('Ready to go');

  callButton.disabled = false;
});

socket.on('full', () => {
  console.log('Room is full');
});

socket.on('offer', (offer) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  peerConnection.createAnswer().then((sessionDescription) => {
    peerConnection.setLocalDescription(sessionDescription);

    callButton.disabled = true;      
    socket.emit('answer', sessionDescription);
  },
    (error) => {
      console.log('Answer Error:' + error);
    }
  );
})

socket.on('candidate', (candidate) => {
  var iceCandidate = new RTCIceCandidate({
    sdpMLineIndex: candidate.label,
    candidate: candidate.candidate
  });
  peerConnection.addIceCandidate(iceCandidate);
})

socket.on('answer', (answer) => {
  callButton.disabled = true;  
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
})

socket.on('bye', () => {
  peerConnection.setRemoteDescription();
  remoteVideo.src = "";
  peerStatus.classList.remove('online');
  peerInfo.innerText = "";
})



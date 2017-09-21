'use strict';

var socket;
var recognizer;

var video = document.querySelector('.localVideo');
var remoteVideo = document.querySelector('.remoteVideo');
var clientInfo = document.querySelector('.client.info');
var clientStatus = document.querySelector('.client.status');
var peerInfo = document.querySelector('.peer.info');
var peerStatus = document.querySelector('.peer.status');
var joinButton = document.querySelector('.joinButton');
var callButton = document.querySelector('.callButton');
var waitingText = document.querySelector('.waiting');

var loginPage = document.querySelector('.login');
var loginForm = document.querySelector('.loginForm');
var loginUserName = document.querySelector('.usernameInput');
var loginLang = document.querySelector('.langSelect');

var myLang;
var peerLang;
var myId;
var myName;
var peerName;

var recognizer;

var servers = {
  'iceServers': [{
    'urls': 'turn:turnserver3dstreaming.centralus.cloudapp.azure.com:5349',
    'username': 'user',
    'credential': '3Dtoolkit072017',
    'credentialType': 'password'
  }],
  'iceTransportPolicy': 'relay',
  'optional': [
    { 'DtlsSrtpKeyAgreement': true }
  ]
};

var peerConnection = new RTCPeerConnection(servers);

loginForm.addEventListener('submit', e => {
  var username = loginUserName.value;
  var lang = loginLang.value;
  if (username.length > 0) {
    initCamera(false, true);
    myName = username;
    myLang = lang;
    initSocket();

  }
  e.preventDefault();
});

callButton.addEventListener('click', (e) => {
  if (callButton.classList.contains('hangup')) {
    console.log('trying to hang up now!');
    socket.emit('bye');
  }
});

function sendOffer() {
  peerConnection.createOffer((sessionDescription) => {
    peerConnection.setLocalDescription(sessionDescription);
    socket.emit('offer', sessionDescription);

  }, (error) => {
    console.log('Create offer error: ' + error);
  });
}

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

function stopCamera() {
  localStream.getVideoTracks()[0].stop();
  video.src = '';
}

function show(element) {
  element.style.visibility = 'visible';
}

function hide(element) {
  element.style.visibility = 'hidden';
}

//////

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

function initSocket() {

  socket = io.connect();

  socket.emit('login', { name: myName, lang: myLang });

  socket.on('connected', (clientId) => {
    console.log('Connected: ' + clientId);
    hide(loginPage);
    myId = clientId;
    clientInfo.innerText = clientId;

    clientStatus.classList.add('online');
    waitingText.classList.remove('hidden');
  });

  socket.on('new-client', (name, lang, clientId) => {
    console.log('New client: ' + clientId + ' name: ' + name + ' lang: ' + lang);

    peerName = name;
    peerLang = lang;

    peerInfo.innerText = clientId;
    peerStatus.classList.add('online');
  });

  socket.on('ready', (roomId) => {
    console.log('Ready to go');

    //if room id is equal to name id then ready to create offer

    if (roomId.split('Room_')[1] == myId) {
      console.log('sending_offer');
      sendOffer();
    }
    callButton.disabled = false;
    waitingText.classList.add('hidden');
    StartRecognition('f3d216d172e3400abe7866a4c2d4a61c', myLang, (recognizer) => {
      RecognizerStart(recognizer.SDK, recognizer);
      recognizer = recognizer;
    });
  });

  socket.on('offer', (offer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    peerConnection.createAnswer().then((sessionDescription) => {
      peerConnection.setLocalDescription(sessionDescription);


      callButton.classList.add('hangup');
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
  });

  socket.on('answer', (answer) => {
    callButton.classList.add('hangup');
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  });


  socket.on('bye', () => {
    remoteVideo.src = '';
    stopCamera();
    callButton.classList.remove('hangup');
    callButton.disabled = true;
    peerStatus.classList.remove('online');
    peerInfo.innerText = '';
    socket.disconnect();
    socket = null;
    RecognizerStop(recognizer.SDK, recognizer);
    show(loginPage);
  });


}
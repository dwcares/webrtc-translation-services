'use strict';

const localVideo = document.querySelector('.localVideo');
const remoteVideo = document.querySelector('.remoteVideo');
const clientInfo = document.querySelector('.client.info');
const clientStatus = document.querySelector('.client.status');
const peerInfo = document.querySelector('.peer.info');
const peerStatus = document.querySelector('.peer.status');
const joinButton = document.querySelector('.joinButton');
const callButton = document.querySelector('.callButton');
const waitingText = document.querySelector('.waiting');

const loginPage = document.querySelector('.login');
const loginForm = document.querySelector('.loginForm');
const loginUserName = document.querySelector('.usernameInput');
const loginLang = document.querySelector('.langSelect');

const audioPlayer = document.querySelector('.audioPlayer');

const transcriptContainer = document.querySelector('.transcriptContainer')
const transcriptBox = document.querySelector('.transcript');
const measure = document.querySelector('.measure');
const tPadd = window.getComputedStyle(measure, null).getPropertyValue('height');
const tPadding = Number(tPadd.substr(0, tPadd.length - 2));
let cachedTranscriptionHeight;

var socket;
var recognizer;

var myLang;
var peerLang;
var myId;
var myName;
var peerName;

var playbackQueue = [];

var peerConnection = new RTCPeerConnection({
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
});


show(loginForm);
setupTranscription();

callButton.addEventListener('click', (e) => {
  if (callButton.classList.contains('hangup')) {
    socket.emit('bye');
  }
});

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

    localVideo.onplay = (e) => show(localVideo);
    if (window.URL) {
      localVideo.src = window.URL.createObjectURL(stream);
    } else {
      localVideo.src = stream;
    }

    peerConnection.addStream(stream);

  }, (err) => {
    console.log('GetUserMedia error: ', error);
  })
}

function queueForPlayback(text, url) {
  if (audioPlayer.duration && !audioPlayer.paused) {
    playbackQueue.push({ text: text, url: url });
  } else {
    playTranslatedAudio(text, url);
  }
}

function playTranslatedAudio(text, url) {
  audioPlayer.src = decodeURI(url);
}

function stopCamera() {
  hide(localVideo);
  localStream.getVideoTracks()[0].stop();
  localVideo.src = '';
}

function show(element) {
  element.style.visibility = 'visible';
  element.classList.remove('hidden')
}

function hide(element, defer) {
  return new Promise((res, rej) => {
    element.classList.add('hidden')

    setTimeout((e) => {
      element.style.visibility = 'hidden';
      res();
    }, defer);
  })
}

function setupTranscription() {
  transcriptContainer.style.height = tPadding + 'px';
  cachedTranscriptionHeight = transcriptBox.clientHeight;
  
  const observer = new MutationObserver((mutation) => {
    const nextHeight = transcriptBox.clientHeight;
    if (nextHeight > cachedTranscriptionHeight) {
      cachedTranscriptionHeight = nextHeight;
      transcriptBox.style.transform = `translateY(${tPadding - transcriptBox.clientHeight}px)`;
    };
  });
  observer.observe(transcriptBox, { childList: true });
    
  transcriptBox.innerHTML = '';

}

function updateTranscription(text) {

  if (transcriptContainer.classList.contains('hidden')) {
    show(transcriptContainer);
  }

  transcriptBox.innerHTML += `${text}<br/>`;
}

function measureText(element) {
  element.innerHTML = 'MEASURE';  
  
  element.style.height = tPadding + 'px';
  element.innerHTML = '';

  return element.clientHeight;
}

audioPlayer.onended = function () {
  var audioToPlay = playbackQueue.pop();
  if (audioToPlay) playTranslatedAudio(audioToPlay.text, audioToPlay.url)
}

////////////////////////////////////
////// Peer Connection Handlers
////////////////////////////////////

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

function UpdateRecognizedPhrase(json) {
  var data = JSON.parse(json);
  window.translateText(data.DisplayText, myLang, peerLang).then((res) => socket.emit('new-translation', res));
}


////////////////////////////////////
////// Socket.io handlers
////////////////////////////////////

function initSocket() {

  socket = io.connect();

  socket.emit('login', { name: myName, lang: myLang });

  socket.on('connected', (clientId) => {
    console.log('Connected: ' + clientId);
    hide(loginForm, 250).then(() => hide(loginPage, 400));
    myId = clientId;
    clientInfo.innerText = clientId;

    clientStatus.classList.add('online');
    waitingText.classList.remove('hidden');
  });

  socket.on('new-client', (name, lang, clientId) => {
    console.log('New client: ' + clientId + ' name: ' + name + ' lang: ' + lang);

    peerName = name;
    document.getElementById("partnerName").innerHTML = document.getElementById("partnerName").innerHTML + peerName;
    peerLang = lang;

    peerInfo.innerText = clientId;
    peerStatus.classList.add('online');
  });

  socket.on('ready', (roomId) => {
    console.log('Ready to go');

    // First person who joined initiates the call
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

  socket.on('new-translation', (translatedText) => {
    window.create_audio(translatedText, myLang, peerLang).then(function (url) {
      url.replace('http://', 'https://')
      queueForPlayback(translatedText, url);
    });
    console.log(translatedText);

    updateTranscription(translatedText)
  });

  socket.on('bye', () => {
    callButton.classList.remove('hangup');
    callButton.disabled = true;
    peerStatus.classList.remove('online');
    peerInfo.innerText = '';
    socket.disconnect();
    socket = null;
    RecognizerStop(recognizer.SDK, recognizer);
    
    hide(transcriptContainer);    
    hide(localVideo, 500).then(() => {
      stopCamera();
      remoteVideo.src = '';        
      show(loginPage);
      show(loginForm);
    });

  });


}
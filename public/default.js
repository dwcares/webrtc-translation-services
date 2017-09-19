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

var servers = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

var peerConnection = new RTCPeerConnection(servers);
initCamera(false, true);

socket.emit('login', "David");

callButton.addEventListener('click', (e) => {
  if (callButton.classList.contains('hangup')) {
    socket.emit('hangup')
  } else {
    peerConnection.createOffer((sessionDescription) => {
      peerConnection.setLocalDescription(sessionDescription);    
      socket.emit('offer', sessionDescription);
  
    }, (error) => {
      console.log('Create offer error: ' + error);
  
    });
  }
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

function requestTurn() {
  if (location.hostname !== 'localhost') { 
    return;
  }

  var turnUrl = 'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913';
  var turnExists = false;
  for (var i in servers.iceServers) {
    if (servers.iceServers[i].url.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer);
        servers.iceServers.push({
          'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    xhr.send();
  }
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

socket.on('hangup', () => {
  // TBD
  callButton.classList.remove('hangup');    
});

socket.on('bye', () => {
  peerConnection.setRemoteDescription();
  remoteVideo.src = "";
  callButton.classList.remove('hangup'); 
  callButton.disabled = true;    
  peerStatus.classList.remove('online');
  peerInfo.innerText = "";
});




'use strict';

var API_KEY = '889049ca7e924430ba3eaeed06ab20de';

setInterval(timerFire, 30000);

function timerFire() {
    //remoteVideo
    getFrame(function(frameData) {
        getEmotion(frameData);
    });
}

function getFrame(callback) {
    console.log('grabbing frame for emotion detection');
    var canvas = document.querySelector('.screenshotCanvas');

    // Grab a frame from the video -> e.g. for cognitive services   
    var context = canvas.getContext('2d');
    context.drawImage(localVideo, 0, 0, 220, 150);

    canvas.toBlob(callback)
}

function getEmotion(data) {
    return fetch('https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize',
        {   method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': API_KEY,
                'Content-Type': 'application/octet-stream' },
            body: data })
    .then(function(response) {
        return response.json();
    })
    .then(function(json) {
        console.log('Emotion response: ' + JSON.stringify(json[0].scores));
    });
}
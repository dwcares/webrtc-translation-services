// var makeObject = require('xml-to-js').xmlToJs;
var TRANSLATE_ACCESS_KEY = '076bab28b4324d8fa6b3b7d6d24b5f40';
var SPEAK_ACCESS_KEY = '5d2c8e4deea547c58c0f38ecd67641b1';
var from_language = 'en';
var to_language = 'es';

var sample_text = encodeURI('hello my name is Margaret and i am going to the beach.');
var translated_text;
var auth = 'Bearer%20eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzY29wZSI6Imh0dHBzOi8vYXBpLm1pY3Jvc29mdHRyYW5zbGF0b3IuY29tLyIsInN1YnNjcmlwdGlvbi1pZCI6IjZkZmI1M2Q5MGY0ZjQ2ZDVhMTNlNjY5NjQ1YThkODA4IiwicHJvZHVjdC1pZCI6IlRleHRUcmFuc2xhdG9yLkYwIiwiY29nbml0aXZlLXNlcnZpY2VzLWVuZHBvaW50IjoiaHR0cHM6Ly9hcGkuY29nbml0aXZlLm1pY3Jvc29mdC5jb20vaW50ZXJuYWwvdjEuMC8iLCJhenVyZS1yZXNvdXJjZS1pZCI6Ii9zdWJzY3JpcHRpb25zLzhiZGUwZTBjLWJjNDMtNGRhNi05ODRjLTMwNGNiMjFjZTg2ZS9yZXNvdXJjZUdyb3Vwcy9taXJyb3JhYmxlUkcvcHJvdmlkZXJzL01pY3Jvc29mdC5Db2duaXRpdmVTZXJ2aWNlcy9hY2NvdW50cy9jb2dzZXJ2LXRyYW5zbGF0aW9uLXRleHQiLCJpc3MiOiJ1cm46bXMuY29nbml0aXZlc2VydmljZXMiLCJhdWQiOiJ1cm46bXMubWljcm9zb2Z0dHJhbnNsYXRvciIsImV4cCI6MTUwNTk0NDE1Mn0.cSDQ-6Njoltr23iagHd3YUWI0iQfPvUou2AcCVvaGKU';
//TRANSLATE TEXT
var translate_request_string = 'https://api.microsofttranslator.com/V2/Ajax.svc/Translate?appId&contentType=text/plain&text=' + sample_text + '&from=' + from_language + '&to=' + to_language+ '&appid=' + auth;

fetch(translate_request_string)
  .then((response) => response.text())
  .then((response) => {
    console.log(response);
}).catch(function(error){
    console.log(error);
});

//TEXT TO SPEECH
var speak_request_string = 'http://api.microsofttranslator.com/V2/Ajax.svc/Speak?text=' 
+ translated_text + '&language=' + to_language + "&format=audio/mp3" + '&appid=' + auth;

fetch(speak_request_string).then(function(response) { 
    /* handle response */ 
    console.log(response);
    //Send this audio to webrtc..
}).catch(function(error){
    console.log(error);
});

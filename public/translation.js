// var makeObject = require('xml-to-js').xmlToJs;
var TRANSLATE_ACCESS_KEY = '076bab28b4324d8fa6b3b7d6d24b5f40';
var SPEAK_ACCESS_KEY = '5d2c8e4deea547c58c0f38ecd67641b1';
var from_language = 'en';
var to_language = 'es';

var sample_text = encodeURI('hello my name is Margaret and i am going to the beach.');
var translated_text;

//TRANSLATE TEXT
var translate_request_string = 
'http://api.microsofttranslator.com/V2/Http.svc/Translate?contentType=text/plain&appid&text=' 
+ sample_text + '&from=' + from_language + '&to=' + to_language;

var translate_request = new Request(translate_request_string, {
	headers: {
        'Ocp-Apim-Subscription-Key': TRANSLATE_ACCESS_KEY
	}
});

console.log(translate_request);

fetch(translate_request).then(function(response) { 
    //response is in XML. PARSE HERE...
    // makeObject(response, function(object) {
    //   console.log(object);
    //   translated_text = response;
    // })
    console.log(response);
}).catch(function(error){
    console.log(error);
});

//TEXT TO SPEECH
var speak_request_string = 'https://api.microsofttranslator.com/V2/Http.svc/Speak?appid&text=' 
+ translated_text + '&language=' + to_language + "&format=audio/mp3";

var speak_request = new Request(speak_request_string, {
	headers: new Headers({
        'Ocp-Apim-Subscription-Key': SPEAK_ACCESS_KEY
	})
});
fetch(speak_request).then(function(response) { 
    /* handle response */ 
    //Send this audio to webrtc..
}).catch(function(error){
    console.log(error);
});
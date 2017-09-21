(function() {
  var TRANSLATE_ACCESS_KEY = '076bab28b4324d8fa6b3b7d6d24b5f40';
  var SPEAK_ACCESS_KEY = '5d2c8e4deea547c58c0f38ecd67641b1';
  var from_language = 'en';
  var to_language = 'es';
  var sample_text = encodeURI('hello my name is Margaret and i am going to the beach.');
  var auth = '';


  function getAuthToken() {
    return fetch('https://api.cognitive.microsoft.com/sts/v1.0/issueToken', { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': TRANSLATE_ACCESS_KEY }})
      .then(response => response.text());
  };

  getAuthToken().then(response => auth = 'Bearer ' + response);

  //TRANSLATE TEXT
  var translate_request_string = 'https://api.microsofttranslator.com/V2/Ajax.svc/Translate?appId&contentType=text/plain&text=' + sample_text + '&from=' + from_language + '&to=' + to_language+ '&appid=' + auth;

  fetch(translate_request_string)
    .then((response) => response.text())
    .then((response) => {
      console.log(response);
      create_audio(response);
  }).catch(function(error){
      console.log(error);
  });

  //TEXT TO SPEECH
  function create_audio(translated_text){
      var speak_request_string = 'https://api.microsofttranslator.com/V2/Ajax.svc/Speak?text=' 
      + encodeURI(translated_text) + '&language=' + to_language + "&format=audio/mp3" + '&appid=' + auth;
      
      fetch(speak_request_string)
          .then((response) => {
              console.log(response);
      }).catch(function(error){
          console.log(error);
      });
  }
})();

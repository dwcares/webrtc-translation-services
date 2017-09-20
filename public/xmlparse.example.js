function testXmlParse() {
  window.xmlparse.xmlToJs('<parent><string>hello</string></parent>', function(obj) {
    console.log(obj);
  });
};

testXmlParse();

(function() {
  var parseData = function(xml) {
    var values = [],
        index = [],
        level = 0,
        data,
        key,
        stack = [];
    function maker(chunk) {
      if(chunk.length > 0) {
        if(chunk[0] === '<' && chunk[1] !== '/') {
          data = getTag(chunk);
          chunk = data.chunk;
          stack.push(data.key[0]);
          if(chunk[0] !== '<') {
              return maker(chunk);
          }
          if(typeof index[level] === 'undefined') {
            index[level] = [];
          }
          index[level].push({value: data.key[0], parent: stack[stack.length-2]});
          level +=1;
          return maker(chunk);
        }
        else if (chunk[0] === '<' && chunk[1] === '/') {
          data = getClosingTag(chunk);
          chunk = data.chunk;
          level -= 1;
          stack.length -=1;
          return maker(chunk);
        } else {
          key = stack[stack.length-1];
          stack.length-=1;
          data = chunk.match(/[\w&-\.@%$!?\(\):\s]{1,}/);
          values.push({level: level, key: key,parent: stack[stack.length-1], value: data[0]});
          chunk = chunk.substring(data[0].length,chunk.length);
          data = getClosingTag(chunk);
          chunk = data.chunk;
          return maker(chunk);
        }
      } else {
        return;
      }
    }
    maker(xml);
    return {index: index, values: values};
  };

  var makeObject = function(data) {
    var index = data.index,
        root = {},
        spot,
        key;
    forEach(index, function(keys, level) {
      forEach(keys, function(key) {
        if(level === 0) {
          root[key.value] = {};
        } else {
          spot = findNode(root, key.parent, level-1);
          spot[key.value] = {};
        }
      });
    });
    return root;
  };

  function findNode(tree, nodeName, target) {
    var level = 0;
    var result;
    function find(tree) {
      if(level < target) {
        for(var x in tree) {
          level +=1;
          find(tree[x]);
        }
      } else {
        for(var x in tree) {
          if (x === nodeName) {
            result = tree[x];
            return;
          }
        }
      }
    }
    find(tree);
    return result;
  }

  function addValues(object, data) {
    var values = data.values;
    var tree = object,
        spot;
    forEach(values, function (value) {
      spot = findNode(tree, value.parent, value.level-1);
      spot[value.key] = value.value;
    })
    return tree;
  }

  function getTag(chunk) {
    var tag = chunk.match(/\<\d*\w*\>/)[0];
    chunk = chunk.substring(tag.length,chunk.length);
    var key = tag.match(/\w{1,}/);
    return {tag:tag, key:key, chunk: chunk};
  }

  function getClosingTag(chunk) {
    var tag = chunk.match(/\<\/\d*\w*\>/)[0];
    chunk = chunk.substring(tag.length,chunk.length);
    var key = tag.match(/\w{1,}/);
    return {tag:tag, key:key, chunk: chunk};
  }

  function forEach(array, fn) {
    for(var i = 0; i < array.length; i++) {
      fn(array[i], i)
    }
  }

  function objectToArray(object) {
    var results = [];
    for(var x in object) {
      var item = {};
      item[x] = object[x];
      results.push(item);
    }
    return results;
  }

  window.xmlparse = {};

  window.xmlparse.xmlToJs = function(xml, fn) {
    var data = parseData(xml);
    var object = makeObject(data);
    var finished = addValues(object, data);
    return fn(finished);
  }

  window.xmlparse.rawData = function(xml, fn) {
    var data = parseData(xml);
    return fn(data);
  }

  window.xmlparse.emptyObject = function(xml, fn) {
    var data = parseData(xml);
    var object = makeObject(data);
    return fn(object);
  }

  window.xmlparse.xmlToJsArray = function(xml, fn) {
    var data = parseData(xml);
    var object = makeObject(data);
    var finished = addValues(object, data);
    finished = objectToArray(finished);
    return fn(finished);
  }
})();

var tv4 = require('tv4');
var parser = require('json-schema-ref-parser');

var schema = {
  "type": "object",
  "properties": {
    "args": {
      "$ref": __dirname + "/onvif-schema.json#/ptz/AbsoluteMoveArg"
    }
  },
  "required": [
    "args"
  ]
};


parser.dereference(schema, function(err, s) {
  if (err) {
    console.error(err);
  }
  else {
    // `schema` is just a normal JavaScript object that contains your 
    // entire JSON Schema - even if it spans multiple files 
    console.log(s);
    var data1 = {
      "args": {
        "Position": {
          "PanTilt": {
            "x": 1,
            "y": 1,
            "space": "http://www.onvif.org/ver10/tptz/PanTiltSpaces/PositionGenericSpace"
          }
        }
      }
    };

    var data2 = [[], [true, []]];
    console.log("data 1: " + tv4.validate(data1, s)); // true
    console.log("data 2: " + tv4.validate(data2, s)); // false
  }
});



var http        = require('http');
var request     = require('request');
var express     = require('express');
var morgan      = require('morgan');
var url         = require('url');
var ipUtil      = require('ip-util');
var VideoStream = require('./rtsp-stream/videoStream');

var deviceUrl       = null;
var deviceID        = null;
var deviceStreamUrl = null;
var wsStreamUrl     = null;

var app    = express();
var server = http.createServer(app);
var appPort;

app.use(morgan('dev'));

//TODO: do token based auth for both http and ws server
// because this is for ONVIF device which requires token auth
function installHandler(deviceRootUrl) {
  deviceUrl = url.parse(deviceRootUrl);
  //do we need to handle https device root Url?
  if (deviceUrl.protocol !== 'http:') {
    console.error('do not support non-http device url');
    return;
  }
  // TODO: in real production this must be hosted on https
  app.use('/', function(req, res) {
    var parsedUrl = url.parse(req.url);
    var headersCopy = {};
    // create a copy of request headers
    for (attr in req.headers) {
      if (!req.headers.hasOwnProperty(attr)) continue;
      headersCopy[attr] = req.headers[attr];
    }
    deviceUrl.path = req.url;
    var options = {
      uri: deviceUrl,
      method: req.method,
      path: parsedUrl.path,
      headers: headersCopy
    };

    var clientRequest = request(options);
    clientRequest.on('response', function(response) {
      res.statusCode = response.statusCode;
      for (header in response.headers) {
        if (!response.headers.hasOwnProperty(header)) continue;
        res.setHeader(header, response.headers[header]);
      }
      response.pipe(res);
    });
    req.pipe(clientRequest);
  });
}

function startWSStreamServer(streamUrl) {
  var urlObj;
  try {
    urlObj = url.parse(streamUrl);
  } catch(e) {
    console.error('device stream url malformed');
    wsStreamUrl = '';
    process.send({streamUrl: ''});
    return;
  }
  deviceStreamUrl = streamUrl;
  var videoStream = new VideoStream({
    name: 'onvif',
    streamUrl: deviceStreamUrl,
    httpServer: server,
    path: urlObj.path
  });
  wsStreamUrl = 'ws://' + ipUtil.getHostIp() + ':' + appPort + urlObj.path;
  process.send({streamUrl: wsStreamUrl});
}

process.on('message', function(msg) {
  if (msg.deviceRootUrl) {
    installHandler(msg.deviceRootUrl);
  } else if (msg.deviceStreamUrl) {
    startWSStreamServer(msg.deviceStreamUrl);
  } else if (msg.deviceID) {
    deviceID = msg.deviceID;
  }
});

server.listen(0, function() {
  appPort = server.address().port;
  process.send({ port: appPort });
});

// is this available on non Ubuntu system?
process.setgid('nogroup');
process.setuid('nobody');

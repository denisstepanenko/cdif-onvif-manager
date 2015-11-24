var http = require('http');
var request = require('request');
var express = require('express');
var morgan  = require('morgan');
var url = require('url');
var ipUtil = require('ip-util');
var VideoStream = require('./rtsp-stream/videoStream');

var deviceUrl;
var deviceID;
var deviceStreamUrl;

var app = express();
var server = http.createServer(app);
var appPort;

app.use(morgan('dev'));

//TODO: do token based auth for both http and ws server once we have a common secure data store
function installHandler(deviceRootUrl) {
  deviceUrl = url.parse(deviceRootUrl);
  //TODO: support https and handle https device root Url
  // in real production this must be hosted on https
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

process.on('message', function(msg) {
  if (msg.deviceRootUrl) {
    installHandler(msg.deviceRootUrl);
  } else if (msg.deviceStreamUrl) {
    deviceStreamUrl = url.parse(msg.deviceStreamUrl);
    var videoStream = new VideoStream({
      name: 'onvif',
      streamUrl: msg.deviceStreamUrl,
      httpServer: server,
    });
    var wsStreamUrl = 'ws://' + ipUtil.getHostIp() + ':' + appPort;
    process.send({streamUrl: wsStreamUrl});
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

var fs = require('fs');
var util = require('util');
var arp = require('node-arp');
var url = require('url');
var CdifDevice = require('cdif-device');
var ProxyServer = require('cdif-proxy-server');
var spec = JSON.parse(fs.readFileSync(__dirname + '/onvif.json').toString());
var DeviceUrl = JSON.parse(fs.readFileSync(__dirname + '/device-url.json').toString());

function OnvifDevice(cam, info) {
  this.device = cam;
  this.streamUrl = '';
  var spec = JSON.parse(fs.readFileSync(__dirname + '/onvif.json').toString());
  spec.device.friendlyName = info.model;
  spec.device.manufacturer = info.manufacturer;
  spec.device.modelName = info.model;
  spec.device.serialNumber = info.serialNumber;
  CdifDevice.call(this, spec);
  this.setupDeviceCalls();
}

util.inherits(OnvifDevice, CdifDevice);

OnvifDevice.prototype._connect = function(user, pass, callback) {
  this.device.username = user;
  this.device.password = pass;
  var _this = this;

  this.device.connect(function(err) {
    if (err) {
      if(err.message === 'ONVIF SOAP Fault: Sender not Authorized') {
        callback(new Error('auth failed'));
      } else {
        callback(new Error('cannot connect to cam'));
      }
    } else {
      _this.setupProxy(callback);
    }
  });
};

OnvifDevice.prototype._disconnect = function(callback) {
  callback(null);
};

OnvifDevice.prototype._getHWAddress = function(callback) {
  arp.getMAC(this.device.hostname, function(err, mac) {
    if (err) {
      callback(new Error('hw address not found'), null);
    } else {
      callback(null, mac);
    }
  });
};

OnvifDevice.prototype.setupDeviceCalls = function() {
  this.setAction('urn:cdif-net:serviceID:ONVIFMediaService', 'getStreamUri', this.getStreamUri);
  this.setAction('urn:cdif-net:serviceID:ONVIFMediaService', 'getSnapshotUri', this.getSnapshotUri);
  this.setAction('urn:cdif-net:serviceID:ONVIFPTZService','absoluteMove', this.absoluteMove);
  this.setAction('urn:cdif-net:serviceID:ONVIFPTZService','relativeMove', this.relativeMove);
  this.setAction('urn:cdif-net:serviceID:ONVIFPTZService','continuousMove', this.continuousMove);
  this.setAction('urn:cdif-net:serviceID:ONVIFPTZService','getPresets', this.getPresets);
  this.setAction('urn:cdif-net:serviceID:ONVIFPTZService','gotoPreset', this.gotoPreset);
  this.setAction('urn:cdif-net:serviceID:ONVIFPTZService','getNodes', this.getNodes);
  this.setAction('urn:cdif-net:serviceID:ONVIFPTZService','stop', this.stop);
};

OnvifDevice.prototype.setupProxy = function(callback) {
  var manufacturer = this.spec.device.manufacturer.toLowerCase();
  var deviceUrl = DeviceUrl[manufacturer];
  if (!deviceUrl) {
    console.warn('cannot find this device root url, device presentation not available');
    callback(null);
    return;
  }

  deviceUrl.hostname = this.device.hostname;
  this.deviceUrl = url.format(deviceUrl);
  this.proxyServer = new ProxyServer();
  this.proxyServer.once('proxyurl', function(proxyUrl) {
    this.proxyUrl = proxyUrl;
    this.proxyServer.setDeviceRootUrl(this.deviceUrl);
    callback(null);
  }.bind(this));

  this.proxyServer.createServer(__dirname + '/proxy-app.js', function(err) {
    if (err) {
      callback(err);
    }
  });
};

OnvifDevice.prototype.getStreamUri = function(args, callback) {
  if (args.streamType !== 'MPEG' || args.transport !== 'WebSocket') {
    callback(new Error('do not support non MPEG and Websocket stream and transport type'), null);
    return;
  }
  var options = {};
  var output = {};
  // for now we only use default RTP and RTSP stream & transport type
  // if the underlying onvif library has changed default to other value we need to supporr that in proxy server accordingly
  this.device.getStreamUri(options, function(err, data) {
    if (!err) {
      this.getUrlPath(data.uri, function(error, urlObj, path) {
        if (!error) {
          if (this.deviceStreamUrl === data.uri) {
            output.streamUri = this.streamUrl;
            callback(null, output);
            return;
          }
          this.deviceStreamUrl = data.uri;
          if (!urlObj.auth || urlObj.auth === '') {
            urlObj.auth = this.device.username + ':' + this.device.password;
          }
          this.proxyServer.setDeviceStreamUrl(url.format(urlObj));
          this.proxyServer.once('streamurl', function(streamUrl) {
            this.streamUrl = streamUrl;
            output.streamUri = streamUrl;
            callback(null, output);
          }.bind(this));
        } else {
          callback(error, null);
        }
      }.bind(this));
    } else {
      callback(err, null);
    }
  }.bind(this));
};

OnvifDevice.prototype.getSnapshotUri = function(args, callback) {
  var options = {};
  this.device.getSnapshotUri(options, function(err, data) {
    if (!err) {
      this.getUrlPath(data.uri, function(error, urlObj, path) {
        if (!error) {
          if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
            callback(new Error('do not support non-http snapshotUri'), null);
            return;
          }
          var output = {};
          //FIXME: now we took assumption snapshot url shares the same root with deviceUrl
          // this might not be true for non-foscam cameras
          output.snapshotUri = this.proxyUrl + path;
          callback(null, output);
        } else {
          callback(error, null);
        }
      }.bind(this));
    } else {
      callback(err, null);
    }
  }.bind(this));
};

OnvifDevice.prototype._getDeviceRootUrl = function(callback) {
  // ONVIF spec didn't give us the device url, so we read from
  //manufacturer specific config file
  if (!this.proxyUrl) {
    callback(new Error('cannot get device url'), null);
  } else {
    callback(null, this.proxyUrl);
  }
};

OnvifDevice.prototype.getUrlPath = function(value, callback) {
  try {
    var urlObj = url.parse(value);
    var path = urlObj.path;
    callback(null, urlObj, path);
  } catch (e) {
    callback(e, null);
  }
};

// TODO: add speed support after we have a schema for object data type
OnvifDevice.prototype.absoluteMove = function(args, callback) {
  var options = {};
  options.x = args.pan;
  options.y = args.tilt;
  options.zoom = args.zoom;

  this.device.absoluteMove(options, function(err) {
    if (!err) callback(null, null);
    else callback(err, null);
  });
};

OnvifDevice.prototype.relativeMove = function(args, callback) {
  var options = {};
  options.x = args.relPan;
  options.y = args.relTilt;
  options.zoom = args.relZoom;

  this.device.relativeMove(options, function(err) {
    if (!err) callback(null, null);
    else callback(err, null);
  });
};

OnvifDevice.prototype.continuousMove = function(args, callback) {
  var options = {};
  options.x = args.panVelocity;
  options.y = args.tiltVelocity;
  options.zoom = args.zoomVelocity;

  this.device.continuousMove(options, function(err) {
    if (!err) callback(null, null);
    else callback(err, null);
  });
};

OnvifDevice.prototype.getPresets = function(args, callback) {
  var options = {};
  this.device.getPresets(options, function(err, data) {
    if (!err) {
      var output = {};
      output.presets = data;
      callback(null, output);
    } else {
      callback(err, null);
    }
  });
};

// TODO: add speed support
OnvifDevice.prototype.gotoPreset = function(args, callback) {
  var options = {};
  options.preset = args.preset;
  this.device.gotoPreset(options, function(err) {
    if (!err) callback(null, null);
    else callback(err, null);
  });
};

OnvifDevice.prototype.getNodes = function(args, callback) {
  this.device.getNodes(function(err, data) {
    if (!err) {
      var output = {};
      output.nodes = data;
      callback(null, output);
    } else {
      callback(err, null);
    }
  });
};

OnvifDevice.prototype.stop = function(args, callback) {
  var options = {};
  options.panTilt = args.panTilt;
  options.zoom = args.zoom;
  this.device.stop(options, function(err) {
    if (!err) callback(null, null);
    else callback(err, null);
  });
};

module.exports = OnvifDevice;

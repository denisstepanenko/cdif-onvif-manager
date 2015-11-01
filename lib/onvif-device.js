var util = require('util');
var arp = require('node-arp');
var CdifDevice = require('cdif-device');
var spec = require('./onvif.json');

function OnvifDevice(cam) {
  var _this = this;
  this.device = cam;
  var spec = require('./onvif.json');
  cam.getDeviceInformation(function(err, info) {
    if (!err) {
      spec.device.friendlyName = info.model;
      spec.device.manufacturer = info.manufacturer;
      spec.device.modelName = info.model;
      spec.device.serialNumber = info.serialNumber;
    } else {
      console.warn('cannot get cam info');
    }
    CdifDevice.call(_this, spec);
    _this.setupDeviceCalls();
  });
}

util.inherits(OnvifDevice, CdifDevice);

OnvifDevice.prototype._connect = function(user, pass, callback) {
  this.device.username = user;
  this.device.password = pass;

  this.device.connect(function(err) {
    if (err) {
      if(err.message === 'ONVIF SOAP Fault: Sender not Authorized') {
        callback(new Error('auth failed'));
      } else {
        callback(new Error('cannot connect to cam'));
      }
    } else {
      callback(null);
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

OnvifDevice.prototype.getStreamUri = function(args, callback) {
  if (args.streamType === 'MJPEG' && args.transport === 'WebSocket') {
    // TODO: launch rtsp-ffmpeg on getStreamUri call
  }
  var options = {};
  options.stream = args.streamType;
  options.protocol = args.transport;

  this.device.getStreamUri(options, function(err, data) {
    if (!err) {
      var output = {};
      output.streamUri = data.uri;
      callback(null, output);
    } else {
      callback(err, null);
    }
  });
};

OnvifDevice.prototype.getSnapshotUri = function(args, callback) {
  var options = {};
  this.device.getSnapshotUri(options, function(err, data) {
    if (!err) {
      var output = {};
      output.snapshotUri = data.uri;
      callback(null, output);
    } else {
      callback(err, null);
    }
  })
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

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
  this.setAction('urn:cdif-net:serviceID:ONVIFMediaService', 'GetStreamUri', this.getStreamUri);
  this.setAction('urn:cdif-net:serviceID:ONVIFMediaService', 'GetSnapshotUri', this.getSnapshotUri);
  this.setAction('urn:cdif-net:serviceID:ONVIFPTZService','absoluteMove', this.absoluteMove);
  this.setAction('urn:cdif-net:serviceID:ONVIFPTZService','relativeMove', this.relativeMove);
  this.setAction('urn:cdif-net:serviceID:ONVIFPTZService','continuousMove', this.continuousMove);
  this.setAction('urn:cdif-net:serviceID:ONVIFPTZService','getPresets', this.getPresets);
  this.setAction('urn:cdif-net:serviceID:ONVIFPTZService','gotoPreset', this.gotoPreset);
  this.setAction('urn:cdif-net:serviceID:ONVIFPTZService','getNodes', this.getNodes);
  this.setAction('urn:cdif-net:serviceID:ONVIFPTZService','stop', this.stop);
};

OnvifDevice.prototype.getStreamUri = function(args, callback) {
  var streamType = args.streamType;
  var transport = args.transport;
  if (streamType === 'MJPEG' && transport === 'WebSocket') {
    // launch rtsp-ffmpeg on getStreamUri call
  }
  this.device.getStreamUri(function(err, data) {
    if (!err) {
      var output = {};
      //FIXME: may need to annotate user/pass info?
      output.streamUri = data.uri;
      callback(null, output);
    } else {
      callback(err, null);
    }
  });
};

OnvifDevice.prototype.getSnapshotUri = function(args, callback) {

};

OnvifDevice.prototype.absoluteMove = function(args, callback) {

};

OnvifDevice.prototype.relativeMove = function(args, callback) {

};

OnvifDevice.prototype.continuousMove = function(args, callback) {

};

OnvifDevice.prototype.getPresets = function(args, callback) {

};

OnvifDevice.prototype.gotoPreset = function(args, callback) {

};

OnvifDevice.prototype.getNodes = function(args, callback) {

};

OnvifDevice.prototype.stop = function(args, callback) {

};

module.exports = OnvifDevice;

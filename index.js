var util = require('util');
var events = require('events');
var onvif = require('onvif');
var arp = require('node-arp');
var CdifDevice = require('cdif-device');
var spec = require('./onvif.json');



function OnvifManager() {
  this.discoverState = 'stopped';
}

util.inherits(OnvifManager, events.EventEmitter);

OnvifManager.prototype.discoverDevices = function() {
  if (this.discoverState === 'discovering') {
    return;
  }
  onvif.Discovery.on('device', function(cam){
    device = new OnvifDevice(cam);
    device._connect = device._connect.bind(device);
    device._disconnect = device._disconnect.bind(device);
    device._getHWAddress = device._getHWAddress.bind(device);
    this.emit('deviceonline', device, this);
  });
  onvif.Discovery.probe();
  this.discoverState = 'discovering';
};

OnvifManager.prototype.stopDiscoverDevices = function() {
  this.discoverState = 'stopped';
};

function OnvifDevice(cam) {
  this.cam = cam;
  var spec = require('./onvif.json');
  CdifDevice.call(this, spec);

  // add actions
  // launch rtsp-ffmpeg on getStreamUri call

  this._connect = function(user, pass, callback) {
    this.cam.username = user;
    this.cam.password = pass;
    cam.connect(function(cam, err) {
      if (err) {
        //FIXME: how to know auth failed?
        callback(new Error('cannot connect to cam'));
      } else {
        callback(null);
      }
    });
  };

  this._disconnect = function(callback) {
    callback(null);
  };

  this._getHWAddress = function(callback) {
    console.log(this.cam);
    arp.getMAC(this.cam.ipaddress, function(err, mac) {
      if (err) {
        callback(new Error('hw address not found'), null);
      } else {
        callback(null, mac);
      }
    });
  };
}

module.exports = OnvifManager;

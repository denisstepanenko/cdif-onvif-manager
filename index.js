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
  var _this = this;
  if (this.discoverState === 'discovering') {
    return;
  }
  onvif.Discovery.on('device', function(cam){
    device = new OnvifDevice(cam);
    this.emit('deviceonline', device, this);
  }.bind(this));
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

    var _this = this;
    this.cam.connect(function(err) {
      if (err) {
        if(err.message === 'ONVIF SOAP Fault: Sender not Authorized') {
          callback(new Error('auth failed'));
        } else {
          callback(new Error('cannot connect to cam'));
        }
      } else {
        console.log(_this);
        callback(null);
      }
    });
  };

  this._disconnect = function(callback) {
    callback(null);
  };

  this._getHWAddress = function(callback) {
    arp.getMAC(this.cam.hostname, function(err, mac) {
    if (err) {
        callback(new Error('hw address not found'), null);
      } else {
        callback(null, mac);
      }
    });
  };
}

util.inherits(OnvifDevice, CdifDevice);

module.exports = OnvifManager;

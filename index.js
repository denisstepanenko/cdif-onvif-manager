var util = require('util');
var events = require('events');
var onvif = require('onvif');
var OnvifDevice = require('./lib/onvif-device')

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

module.exports = OnvifManager;

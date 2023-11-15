'use strict';

/* Magic Mirror
 * Module: MMM-PIR-Sensor-Lite
 *
 * Magic Mirror By Michael Teeuw https://magicmirror.builders
 * MIT Licensed.
 *
 * Module MMM-PIR-Sensor-Lite By Grena https://github.com/grenagit
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
//const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const Log = require("logger");
const path = require("path");
const {PythonShell} = require("python-shell");

module.exports = NodeHelper.create({

	start: function() {
		this.started = false;
		this.activated = true;
                Log.log(`Starting node helper for: ${this.name}`);
	},

	getDataPIR: function() {
		//exec('pkill -f "python3 -u ' + __dirname + '/pir.py"', { timeout: 500 });
		//const process = spawn('python3', ['-u', __dirname + '/pir.py', this.config.sensorPin]);
		var self = this;
		var py = path.resolve(__dirname, "pir.py");

		var option = {
			mode: "text",
			pythonPath: "/usr/bin/python3",
			pythonOptions: ['-u'],
			args: [this.config.sensorPin],
		}
		this.shell = new PythonShell(py, option)
		this.shell.on("message", (message)=>{
			Log.info(`[PIR] message:` + message)
			if (message === "PIR_START") {
				self.sendSocketNotification("STARTED", true);
				self.started = true;
			}
			if (message === "USER_PRESENCE") {
				self.sendSocketNotification("USER_PRESENCE", true);
				self.resetTimeout();

				if (self.activated == false) {
					self.activateMonitor();
				}
			}
		})
		this.shell.on("error", (message)=>{
			this.shell.end()
			if (!message.traceback.search("KeyboardInterrupt")) {
				Log.log(message)
			} else {
				Log.log("[PIR] Keyboard Interrupted")
			}
			Log.log("[PIR] PIR script is finished.")
		})
		this.shell.on("close", ()=>{
			setTimeout(()=>{
				Log.log("[PIR] Python script is terminated. It will restart soon.")
				this.getDataPIR()
			}, 500)
		})
	},

	activateMonitor: function() {
		this.sendSocketNotification("POWER_ON", true);
		this.activated = true;

		if(!this.config.debugMode) {
			switch(this.config.commandType) {
				case 'vcgencmd':
					exec("/usr/bin/vcgencmd display_power 1", null);
					break;

				case 'xrandr':
					exec("DISPLAY=:0 xrandr --output " + this.config.hdmiPort + " --mode 3840x2160 --rotate " + this.config.rotation + " --auto", null);
					break;

				case 'xset':
					exec("xset dpms force on", null);
					break;
			}
		}
	},

	deactivateMonitor: function() {
		this.sendSocketNotification("POWER_OFF", true);
		this.activated = false;

		if(!this.config.debugMode) {
			switch(this.config.commandType) {
				case 'vcgencmd':
					exec("/usr/bin/vcgencmd display_power 0", null);
					break;

				case 'xrandr':
					exec("DISPLAY=:0 xrandr --output " + this.config.hdmiPort + " --off", null);
					break;

				case 'xset':
					exec("xset dpms force off", null);
					break;
			}
		}
	},

	resetTimeout: function() {
		var self = this;

		clearTimeout(self.timeout);

		self.timeout = setTimeout(function() {
			self.deactivateMonitor();
		}, self.config.deactivateDelay);
	},

	socketNotificationReceived: function(notification, payload) {
		var self = this;
		if(notification === 'CONFIG' && self.started == false) {
			self.config = payload;
			self.activateMonitor();

			self.getDataPIR();
			self.resetTimeout();
		}
	}
});

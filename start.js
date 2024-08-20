module.exports = {
	daemon: false,
	run: [{
	  "method": "shell.run",
	  "params": {
		"path": "app",
		"message": "node peer-check.js",
	  }
	}, {
	  "method": "local.set",
	  "params": {
		"url": "{{input.event[0]}}"
	  }
	}, {
	  "method": "proxy.start",
	  "params": {
		"uri": "{{local.url}}",
		"name": "Local Sharing"
	  }
	}]
  }
  
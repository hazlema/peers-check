const path = require('path')
module.exports = {
	version: "1.2",
	title: "Peer Check",
	description: "",
	icon: "icon.webp",
	menu: async (kernel) => {
		let installed = true
		let running   = false
		return [{
			default: true,
			icon: "fa-solid fa-power-off",
			text: "Start",
			href: "start.js",
		}, {
			icon: "fa-solid fa-plug",
			text: "Update",
			href: "update.js",
		}]
	}
}

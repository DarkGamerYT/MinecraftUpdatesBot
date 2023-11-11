const { Events } = require( "discord.js" );
const ChangelogChecker = require( "../classes/ChangelogChecker.js" );
const Utils = require( "../utils.js" );
module.exports = {
	name: Events.ClientReady,
	once: true,
	execute( client ) {
		Utils.Logger.log("Logged in as: " + client.user.tag);
		new ChangelogChecker( client );
	},
};
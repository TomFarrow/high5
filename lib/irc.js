var ircLib = require("irc");

exports.client = irc = function(config){
	this.client = new ircLib.Client(config.server, config.nick, {
		userName: "high5",
		realName: "high5 IRC client",
		port: config.port,
		debug: true,
		showErrors: true,
		autoRejoin: true,
		autoConnect: true,
		channels: config.channels,
		secure: false,
		thisSigned: false,
		stripColors: true,
		floodProtection: false
	});
}

irc.prototype.connect = function(){
	this.client.connect();
}

irc.prototype.disconnect = function(){
	this.client.disconnect();
}

irc.prototype.getChans = function(){
	var channels = [];
	for(var chan in this.client.chans){
		console.log(chan);
		channels.push(chan);
	}
	return channels;
}

irc.prototype.on = function(callback){
	this.client.addListener("motd", function(motd) {
		var date = new Date();
		callback({
			"type": "motd",
			"date": date,
			"motd": motd
		});
	});
	this.client.addListener("names", function(channel, nicks) {
		var date = new Date();
		callback({
			"type": "names",
			"date": date,
			"chan": channel,
			"nicks": nicks
		});
	});
	this.client.addListener("topic", function(channel, topic, nick) {
		var date = new Date();
		callback({
			"type": "topic",
			"date": date,
			"chan": channel,
			"nick": nick,
			"topic": topic
		});
	});
	this.client.addListener("join", function(channel, nick) {
		var date = new Date();
		callback({
			"type": "join",
			"date": date,
			"chan": channel,
			"nick": nick
		});
	});
	this.client.addListener("part", function(channel, nick, reason) {
		var date = new Date();
		callback({
			"type": "part",
			"date": date,
			"chan": channel,
			"nick": nick,
			"reason": reason
		});
	});
	this.client.addListener("quit", function(nick, reason, channels) {
		var date = new Date();
		callback({
			"type": "quit",
			"date": date,
			"chans": channels,
			"nick": nick,
			"reason": reason
		});
	});
	this.client.addListener("kick", function(channel, nick, by, reason) {
		var date = new Date();
		callback({
			"type": "kick",
			"date": date,
			"chan": channel,
			"nick": nick,
			"by": by,
			"reason": reason
		});
	});
	this.client.addListener("message", function(nick, to, text) {
		var date = new Date();
		if(to.search(/^[\#\&]/) > -1){
			if(text.search(/^\x01ACTION/) > -1){
				callback({
					"type": "action",
					"date": date,
					"chan": to,
					"nick": nick,
					"action": text.replace("\x01ACTION ", "").replace("\x01", "")
				});
			} else {
				callback({
					"type": "msg",
					"date": date,
					"chan": to,
					"nick": nick,
					"msg": text
				});
			}
		} else {
			var pm = "";
			if(to == this.client.nick){
				pm = nick;
			} else {
				pm = to;
			}
			if(text.search(/^\x01ACTION/) > -1){
				callback({
					"type": "pm-action",
					"date": date,
					"to": to,
					"nick": nick,
					"pm": pm,
					"action": text.replace("\x01ACTION ", "").replace("\x01", "")
				});
			} else {
				callback({
					"type": "pm",
					"date": date,
					"to": to,
					"nick": nick,
					"pm": pm,
					"msg": text
				});
			}
		}
	});
	this.client.addListener("notice", function(nick, to, text) {
		var date = new Date();
		callback({
			"type": "notice",
			"date": date,
			"nick": nick,
			"to": to,
			"notice": text
		});
	});
	this.client.addListener("nick", function(oldnick, newnick, channels) {
		var date = new Date();
		callback({
			"type": "nick",
			"date": date,
			"chans": channels,
			"oldnick": oldnick,
			"newnick": newnick
		});
	});
	this.client.addListener("invite", function(channel, from) {
		var date = new Date();
		callback({
			"type": "invite",
			"date": date,
			"chan": channel,
			"from": from
		});
	});
	this.client.addListener("whois", function(info) {
		var date = new Date();
		callback({
			"type": "whois",
			"date": date,
			"info": info
		});
	});
}

irc.prototype.send = function(data){
	if(data.type == "msg"){
		this.client.emit("message", this.client.nick, data.chan, data.msg);
		this.client.say(data.chan, data.msg);
	} else if(data.type == "action"){
		this.client.emit("message", this.client.nick, data.chan, data.action.replace(/^/, "\x01ACTION ").replace(/$/, "\x01"));
		this.client.action(data.chan, data.action);
	} else if(data.type == "join"){
		//this.client.emit("join", data.chan, this.client.nick);
		this.client.join(data.chan);
	} else if(data.type == "part"){
		//this.client.emit("part", data.chan, this.client.nick, data.reason);
		this.client.part(data.chan);
	} else if(data.type == "quit"){
		this.client.emit("quit", this.client.nick, data.reason, data.chans);
		this.client.disconnect(data.reason);
	}
}
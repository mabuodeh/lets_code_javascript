// Copyright (c) 2015 Titanium I.T. LLC. All rights reserved. For license, see "README" or "LICENSE" file.
/* global io:false */

(function() {
	"use strict";

	var assert = require("../../shared/_assert.js");

	describe("NET: Real Time Network", function() {

		it("connects to Socket.IO server", function(done) {
			var origin = window.location.protocol + "//" + window.location.hostname + ":" + 5030;
			var socket = io(origin);

			socket.on("connect", function() {
				socket.disconnect();
				done();
			});
		});

	});

}());
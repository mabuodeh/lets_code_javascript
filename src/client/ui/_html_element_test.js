// Copyright (c) 2013-2016 Titanium I.T. LLC. All rights reserved. See LICENSE.txt for details.

(function() {
	"use strict";

	var HtmlElement = require("./html_element.js");
	var HtmlCoordinate = require("./html_coordinate.js");
	var browser = require("./browser.js");
	var assert = require("../../shared/_assert.js");

	describe("UI: HtmlElement", function() {
		var windowElement;
		var bodyElement;
		var htmlElement;

		beforeEach(function() {
			windowElement = new HtmlElement(window);
			bodyElement = new HtmlElement(document.body);
			htmlElement = HtmlElement.fromHtml("<div></div>");
		});

		afterEach(function() {
			windowElement.removeAllEventHandlers();
			bodyElement.removeAllEventHandlers();
			htmlElement.removeAllEventHandlers();
		});

		describe("event handling", function() {

			beforeEach(function() {
				htmlElement.appendSelfToBody();
			});

			afterEach(function() {
				htmlElement.remove();
			});

			it("clears all event handlers (useful for testing)", function() {
				htmlElement.onMouseDown(function() {
					throw new Error("event handler should have been removed");
				});

				htmlElement.removeAllEventHandlers();
				htmlElement.triggerMouseDown(0, 0);
			});

			describe("default prevention", function() {
				it("allows drag-related browser defaults to be prevented", function() {
					htmlElement.preventBrowserDragDefaults();

					assertEventPrevented("selectstart", htmlElement.triggerSelectStart);   // required for IE 8 text dragging
					assertEventPrevented("mousedown", htmlElement.triggerMouseDown);
					if (browser.supportsTouchEvents()) {
						assertEventPrevented("touchstart", htmlElement.triggerSingleTouchStart);
						assertEventPrevented("touchstart", htmlElement.triggerMultiTouchStart);
					}

					function assertEventPrevented(event, eventTriggerFn) {
						var monitor = monitorEvent(event);
						htmlElement._element.trigger(event);
						assert.equal(monitor.defaultPrevented, true);
					}
				});

				it("reports whether drag-related defaults have been prevented", function() {
					assert.equal(htmlElement.isBrowserDragDefaultsPrevented(), false);
					htmlElement.preventBrowserDragDefaults();
					assert.equal(htmlElement.isBrowserDragDefaultsPrevented(), true);
				});
			});

			describe("mouse events", function() {
				it("can be triggered with coordinates relative to the element", function() {
					checkEventTrigger(htmlElement.triggerMouseClick, "click");
					checkEventTrigger(htmlElement.triggerMouseDown, "mousedown");
					checkEventTrigger(htmlElement.triggerMouseMove, "mousemove");
					checkEventTrigger(htmlElement.triggerMouseLeave, "mouseleave");
					checkEventTrigger(htmlElement.triggerMouseUp, "mouseup");

					function checkEventTrigger(eventTriggerFn, event) {
						var monitor = monitorEvent(event);
						eventTriggerFn.call(htmlElement, 4, 7);

						var expectedPageCoordinates = htmlElement.pageOffset({ x: 4, y: 7 });
						assert.deepEqual(monitor.pageCoordinates, [ expectedPageCoordinates.x, expectedPageCoordinates.y ]);
					}
				});

				it("can be triggered without coordinates", function() {
					checkEventTrigger(htmlElement.triggerMouseClick, "click");
					checkEventTrigger(htmlElement.triggerMouseDown, "mousedown");
					checkEventTrigger(htmlElement.triggerMouseMove, "mousemove");
					checkEventTrigger(htmlElement.triggerMouseLeave, "mouseleave");
					checkEventTrigger(htmlElement.triggerMouseUp, "mouseup");

					function checkEventTrigger(eventTriggerFn, event) {
						var monitor = monitorEvent(event);
						eventTriggerFn.call(htmlElement);
						assert.deepEqual(monitor.pageCoordinates, [ 0, 0 ]);
					}
				});

				it("handlers receive a HtmlCoordinate object", function() {
					checkEventHandler(htmlElement.onMouseClick2, htmlElement.triggerMouseClick);
					checkEventHandler(htmlElement.onMouseDown2, htmlElement.triggerMouseDown);
					checkEventHandler(htmlElement.onMouseMove2, htmlElement.triggerMouseMove);
					checkEventHandler(htmlElement.onMouseLeave2, htmlElement.triggerMouseLeave);
					checkEventHandler(htmlElement.onMouseUp2, htmlElement.triggerMouseUp);

					function checkEventHandler(eventHandlerFn, eventTriggerFn) {
						var monitor = monitorEventHandler(htmlElement, eventHandlerFn);
						eventTriggerFn.call(htmlElement, 60, 40);

						var expectedPageCoordinates = htmlElement.pageOffset({ x: 60, y: 40 });
						assert.objEqual(monitor.eventTriggeredAt, HtmlCoordinate.fromPageOffset(expectedPageCoordinates.x, expectedPageCoordinates.y));
					}
				});

			});

			describe("touch events", function() {
				if (!browser.supportsTouchEvents()) return;

				it("sends zero touches when emulating the end of a touch", function() {
					checkEventTrigger("touchend", htmlElement.triggerTouchEnd);
					checkEventTrigger("touchcancel", htmlElement.triggerTouchCancel);

					function checkEventTrigger(event, eventTriggerFn) {
						var monitor = monitorEvent(event);
						eventTriggerFn.call(htmlElement);
						assert.deepEqual(monitor.touches, []);
					}
				});

				it("sends single-touch events relative to triggering element", function() {
					checkEventTrigger(htmlElement.triggerSingleTouchStart, "touchstart");
					checkEventTrigger(htmlElement.triggerSingleTouchMove, "touchmove");

					function checkEventTrigger(eventTriggerFn, event) {
						var monitor = monitorEvent(event);
						eventTriggerFn.call(htmlElement, 4, 7);

						var expectedPageCoordinates = htmlElement.pageOffset({ x: 4, y: 7 });
						assert.deepEqual(monitor.touches, [[ expectedPageCoordinates.x, expectedPageCoordinates.y ]]);
					}
				});

				it("can send single-touch events without coordinates", function() {
					checkEventTrigger(htmlElement.triggerSingleTouchStart, "touchstart");
					checkEventTrigger(htmlElement.triggerSingleTouchMove, "touchmove");

					function checkEventTrigger(eventTriggerFn, event) {
						var monitor = monitorEvent(event);
						eventTriggerFn.call(htmlElement);
						assert.deepEqual(monitor.touches, [[ 0, 0 ]]);
					}
				});

				it("sends multi-touch events relative to triggering element", function() {
					checkEventTrigger(htmlElement.triggerMultiTouchStart, "touchstart");

					function checkEventTrigger(eventTriggerFn, event) {
						var monitor = monitorEvent(event);
						eventTriggerFn.call(htmlElement, 10, 20, 30, 40);

						var expectedFirstTouch = htmlElement.pageOffset({ x: 10, y: 20 });
						var expectedSecondTouch = htmlElement.pageOffset({ x: 30, y: 40 });
						assert.deepEqual(monitor.touches, [
							[ expectedFirstTouch.x, expectedFirstTouch.y ],
							[ expectedSecondTouch.x, expectedSecondTouch.y ]
						]);
					}
				});

				it("handles zero-touch events", function() {
					checkEventHandler(htmlElement.onTouchEnd, htmlElement.triggerTouchEnd);
					checkEventHandler(htmlElement.onTouchCancel, htmlElement.triggerTouchCancel);

					function checkEventHandler(eventHandlerFn, eventTriggerFn) {
						var monitor = monitorEventHandler(htmlElement, eventHandlerFn);
						eventTriggerFn.call(htmlElement);
						assert.equal(monitor.eventTriggered, true);
						assert.equal(monitor.eventTriggeredAt, undefined);
					}
				});

				it("handles single-touch events", function() {
					checkEventHandler(htmlElement.onSingleTouchStart2, htmlElement.triggerSingleTouchStart);
					checkEventHandler(htmlElement.onSingleTouchMove2, htmlElement.triggerSingleTouchMove);

					function checkEventHandler(eventHandlerFn, eventTriggerFn) {
						var monitor = monitorEventHandler(htmlElement, eventHandlerFn);
						eventTriggerFn.call(htmlElement, 60, 40);

						var pageOffset = htmlElement.pageOffset({ x: 60, y: 40 });
						assert.objEqual(monitor.eventTriggeredAt, HtmlCoordinate.fromPageOffset(pageOffset.x, pageOffset.y));
					}
				});

				it("handles multi-touch events (but doesn't provide coordinates)", function() {
					checkEventHandler(htmlElement.onMultiTouchStart, htmlElement.triggerMultiTouchStart);

					function checkEventHandler(eventHandlerFn, eventTriggerFn) {
						var monitor = monitorEventHandler(htmlElement, eventHandlerFn);
						eventTriggerFn.call(htmlElement, 1, 2, 3, 4);

						assert.equal(monitor.eventTriggered, true);
						assert.equal(monitor.eventTriggeredAt, undefined);
					}
				});
			});

			function monitorEvent(event) {
				var monitor = {
					eventTriggered: false,
					touches: null,
					pageCoordinates: null,
					defaultPrevented: false
				};

				htmlElement._element.on(event, function(event) {
					monitor.eventTriggered = true;
					monitor.pageCoordinates = [ event.pageX, event.pageY ];
					monitor.defaultPrevented = event.isDefaultPrevented();

					if (event.originalEvent) {
						var eventTouches = event.originalEvent.touches;
						monitor.touches = [];
						for (var i = 0; i < eventTouches.length; i++) {
							monitor.touches.push([ eventTouches[i].pageX, eventTouches[i].pageY ]);
						}
					}
				});

				return monitor;
			}

			function monitorEventHandler(htmlElement, eventFunction) {
				var monitor = {
					eventTriggered: false
				};

				eventFunction.call(htmlElement, function(pageOffset) {
					monitor.eventTriggered = true;
					monitor.eventTriggeredAt = pageOffset;
				});
				return monitor;
			}
		});

		describe("sizing", function() {
			it("provides its dimensions", function() {
				var element = HtmlElement.fromHtml("<div style='width: 120px; height: 80px;'></div>");
				assert.deepEqual(element.getDimensions(), {
					width: 120,
					height: 80
				});
			});

			it("dimensions are not affected by padding, border, or margin", function() {
				var element = HtmlElement.fromHtml("<div style='" +
					"width: 120px; " +
					"height: 80px; " +
					"padding: 13px; " +
					"border: 7px; " +
					"margin: 19px; " +
					"'></div>");
				assert.deepEqual(element.getDimensions(), {
					width: 120,
					height: 80
				});
			});
		});

		describe("coordinate conversion", function() {

			var COLLAPSING_BODY_MARGIN = 8;

			beforeEach(function() {
				htmlElement.appendSelfToBody();
			});

			afterEach(function() {
				htmlElement.remove();
			});

			it("converts page coordinates into relative element coordinates", function() {
				var offset = htmlElement.relativeOffset({x: 100, y: 150});
				assertRelativeOffsetEquals(offset, 92, 142);
			});

			it("converts relative coordinates into page coordinates", function() {
				var offset = htmlElement.relativeOffset({x: 100, y: 150});
				assertPageOffsetEquals(offset, 92, 142);
			});

			it("page coordinate conversion accounts for margin", function() {
				checkRelativeStyle("margin-top: 13px;", 0, 13 - COLLAPSING_BODY_MARGIN);
				checkRelativeStyle("margin-left: 13px;", 13, 0);
				checkRelativeStyle("margin: 13px;", 13, 13 - COLLAPSING_BODY_MARGIN);
				checkRelativeStyle("margin: 1em; font-size: 16px", 16, 16 - COLLAPSING_BODY_MARGIN);
			});

			it("relative coordinate conversion accounts for margin", function() {
				checkPageStyle("margin-top: 13px;", 0, 13 - COLLAPSING_BODY_MARGIN);
				checkPageStyle("margin-left: 13px;", 13, 0);
				checkPageStyle("margin: 13px;", 13, 13 - COLLAPSING_BODY_MARGIN);
				checkPageStyle("margin: 1em; font-size: 16px", 16, 16 - COLLAPSING_BODY_MARGIN);
			});

			it("page coordinate conversion fails fast if there is any padding", function() {
				expectFailFast("padding-top: 13px;");
				expectFailFast("padding-left: 13px;");
				expectFailFast("padding: 13px;");
				expectFailFast("padding: 1em; font-size: 16px");

				// IE 8 weirdness
				expectFailFast("padding-top: 20%");
				expectFailFast("padding-left: 20%");
			});

			it("page coordinate conversion fails fast if there is any border", function() {
				expectFailFast("border-top: 13px solid;");
				expectFailFast("border-left: 13px solid;");
				expectFailFast("border: 13px solid;");
				expectFailFast("border: 1em solid; font-size: 16px");

				// IE 8 weirdness
				expectFailFast("border: thin solid");
				expectFailFast("border: medium solid");
				expectFailFast("border: thick solid");
				checkRelativeStyle("border: 13px none", 0, 0);
				checkPageStyle("border: 13px none", 0, 0);
			});

			function expectFailFast(elementStyle) {
				var styledElement = HtmlElement.fromHtml("<div style='" + elementStyle + "'></div>");
				try {
					styledElement.appendSelfToBody();
					assert.throws(function() {
						styledElement.relativeOffset({ x: 100, y: 150 });
					});
					assert.throws(function() {
						styledElement.pageOffset({ x: 100, y: 150 });
					});
				}
				finally {
					styledElement.remove();
				}
			}

			function checkRelativeStyle(elementStyle, additionalXOffset, additionalYOffset) {
				var BASE_STYLE = "width: 120px; height: 80px; border: 0px none;";

				var unstyledElement = HtmlElement.fromHtml("<div style='" + BASE_STYLE + "'></div>");
				unstyledElement.appendSelfToBody();
				var unstyledOffset = unstyledElement.relativeOffset({x: 100, y: 150});
				unstyledElement.remove();

				var styledElement = HtmlElement.fromHtml("<div style='" + BASE_STYLE + elementStyle + "'></div>");
				try {
					styledElement.appendSelfToBody();
					var styledOffset = styledElement.relativeOffset({x: 100, y: 150});
					assertRelativeOffsetEquals(
						styledOffset,
						unstyledOffset.x - additionalXOffset,
						unstyledOffset.y - additionalYOffset
					);
				}
				finally {
					styledElement.remove();
				}
			}

			function checkPageStyle(elementStyle, additionalXOffset, additionalYOffset) {
				var BASE_STYLE = "width: 120px; height: 80px; border: 0px none;";

				var unstyledElement = HtmlElement.fromHtml("<div style='" + BASE_STYLE + "'></div>");
				unstyledElement.appendSelfToBody();
				var unstyledOffset = unstyledElement.pageOffset({x: 100, y: 150});
				unstyledElement.remove();

				var styledElement = HtmlElement.fromHtml("<div style='" + BASE_STYLE + elementStyle + "'></div>");
				try {
					styledElement.appendSelfToBody();
					var styledOffset = styledElement.pageOffset({x: 100, y: 150});
					assertRelativeOffsetEquals(
						styledOffset,
						unstyledOffset.x + additionalXOffset,
						unstyledOffset.y + additionalYOffset
					);
				}
				finally {
					styledElement.remove();
				}
			}

			function assertRelativeOffsetEquals(actualOffset, expectedX, expectedY) {
				assert.deepEqual(actualOffset, {x: expectedX, y: expectedY});
			}
		});

		function assertPageOffsetEquals(actualOffset, expectedX, expectedY) {
			assert.deepEqual(actualOffset, {x: expectedX, y: expectedY});
		}


		describe("DOM manipulation", function() {

			it("creates element from raw HTML; also, converts to DOM element", function() {
				var element = HtmlElement.fromHtml("<code>foo</code>");

				var domElement = element.toDomElement();

				assert.equal(domElement.outerHTML.toLowerCase(), "<code>foo</code>");

				// Ensure that fromHtml converts HTML to DOM element, not jQuery element
				assert.equal(element._domElement, domElement);
			});

			it("finds element by ID", function() {
				var expectedElement = HtmlElement.fromHtml("<div id='anElement'></div>");
				expectedElement.appendSelfToBody();

				var actualElement = HtmlElement.fromId("anElement");
				assert.equal(actualElement._domElement, expectedElement._domElement);
			});

			it("finding element by ID fails fast if ID not present", function() {
				assert.throws(function() {
					var element = HtmlElement.fromId("noSuchId");
				});
			});

			it("appends elements", function() {
				htmlElement.append(HtmlElement.fromHtml("<div></div>"));
				assert.equal(htmlElement._element.children().length, 1);
			});

			it("appends to body", function() {
				try {
					var childrenBeforeAppend = bodyElement._element.children().length;

					htmlElement.appendSelfToBody();
					var childrenAfterAppend = bodyElement._element.children().length;
					assert.equal(childrenBeforeAppend + 1, childrenAfterAppend);
				} finally {
					htmlElement.remove();
				}
			});

			it("removes elements", function() {
				var elementToAppend = HtmlElement.fromHtml("<div></div>");
				htmlElement.append(elementToAppend);
				elementToAppend.remove();
				assert.equal(htmlElement._element.children().length, 0);
			});
		});

	});

}());
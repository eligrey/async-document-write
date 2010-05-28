/*
 * Asynchronous document.write
 *
 * 2010-02-01
 *
 * By Eli Grey, http://eligrey.com
 *
 * License: GNU GPL v3 and the X11/MIT license
 *   See COPYING.md
 *
 * Usage:
 *   External scripts:
 *     eval(document.write.START);
 *     document.write(...);
 *     eval(document.write.END);
 *
 *   Inline scripts:
 *     <script id="foo" async="true">
 *       document.write.to = "foo";
 *       document.write(...);
 *       delete document.write.to;
 *     </script>
 */

/*global document */

(function () {
	"use strict";
	
	try {
		0();
	} catch (e) {
		var err = e;
	}
	
	var filename = "fileName",
	stack        = "stack",
	stacktrace   = stack + "trace";
	
	if (filename in err || stacktrace in err || stack in err) {
	
		var doc        = document,
		anchor         = doc.createElement("a"),
		False          = !1,
		notReady       = !False,
		writeQueue     = [],
		nativeDocWrite = doc.write,
		getElemsByTag  = function (doc, tag) {
			return doc.getElementsByTagName(tag);
		},
		head = getElemsByTag(doc, "head")[0],
		write,
		domReady = function () {
			if (notReady) {
				notReady = False;
				var writeTo = write.to;
				while (writeQueue.length) {
					write.to = writeQueue.pop();
					write.call(doc, writeQueue.pop());
					delete write.to;
				}
				write.to = writeTo;
			}
		},
		getErrorLocation = function (error) {
			var loc, replacer = function (stack, matchedLoc) {
				loc = matchedLoc;
			};
		
			if (filename in error) {
				loc = error[filename];
			} else if (stacktrace in error) { // Opera
				error[stacktrace].replace(/Line \d+ of .+ script (.*)/gm, replacer);
			} else if (stack in error) { // WebKit
				error[stack].replace(/at (.*)/gm, replacer);
				loc = loc.replace(/:\d+:\d+$/, ""); // remove line number
			}
			return loc;
		},
		slice = Array.prototype.slice,
		toStr = Object.prototype.toString,
	
		addEvtListener, remEvtListener, listener;
	
		if ((addEvtListener = doc.addEventListener) &&
	        (remEvtListener = doc.removeEventListener))
		{
			listener = function (evt) {
				remEvtListener.call(doc, evt.type, listener, False);
				domReady();
			};
			addEvtListener.call(doc, "DOMContentLoaded", listener, False);
			addEvtListener.call(doc, "load", listener, False);
		
		} else if ((addEvtListener = doc.attachEvent) &&
	        (remEvtListener = doc.detachEvent))
		{
			listener = function () {
				remEvtListener.call(doc, "onload", listener);
			};
			addEvtListener.call(doc, "onload", listener);
		}
		
		write = doc.write = function () {
			var markup = slice.call(arguments).join(""),
			doc        = this,
			body       = getElemsByTag(doc, "body")[0],
			writeTo    = write.to;
			
			if (!body) {
				writeQueue.unshift(markup, writeTo);
				return;
			}
			
			var node = doc.createElement("span");
			node.innerHTML = markup;
			
			if (writeTo) {
				if (toStr.call(writeTo) === "[object String]") {
					// document.write.to is an element ID
					var el = doc.getElementById(writeTo);
					el.parentNode.insertBefore(node, el);
					return;
				}
				anchor.href = getErrorLocation(writeTo);
				var src = anchor.href,
				scripts = getElemsByTag(doc, "script");
				
				anchor.removeAttribute("href");
				
				for (var i = 0, l = scripts.length; i < l; i++) {
					anchor.href = scripts.item(i).src;
					if (anchor.href === src) {
						var scriptNode = scripts.item(i), parent = scriptNode;
						
						while (parent = parent.parentNode) {
							if (parent === head) {
								body.insertBefore(node, body.firstChild);
								return;
							}
						}
						scriptNode.parentNode.insertBefore(node, scriptNode);
						anchor.removeAttribute("href");
						return;
					}
				}
			} else {
				// inline script without document.write.to attempting to write to the body
				// (not the document element) before it exists (requires native magic)
				nativeDocWrite.apply(doc, arguments);
			}
		};
		doc.writeln = function () {
			write.apply(this, slice.call(arguments).concat("\n"));
		};
		write.START = "try{0()}catch(e){document.write.to=e}";
		write.END   = "delete document.write.to";
	}
}());

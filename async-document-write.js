/*
 * Asynchronous document.write
 *
 * 2009-12-13
 *
 * By Elijah Grey, http://eligrey.com
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
	
	if ("fileName" in err || "stacktrace" in err || "stack" in err) {
	
		var doc        = document,
		anchor         = doc.createElement("a"),
		False          = !1,
		notReady       = !False,
		writeQueue     = [],
		nativeDocWrite = doc.write,
		getElemsByTag  = function (tag) {
			return doc.getElementsByTagName(tag);
		},
		head = getElemsByTag("head")[0],
		write,
		domReady = function () {
			if (notReady) {
				notReady = False;
				var i = writeQueue.length,
				writeTo;
				while (i--) {
					writeTo = write.to;
					write.to = writeQueue.pop();
					write(writeQueue.pop());
					write.to = writeTo;
				}
			}
		},
		getLocation = function (error) {
			var loc, replacer = function (stack, matchedLoc) {
				loc = matchedLoc;
			};
		
			if ("fileName" in error) {
				loc = error.fileName;
			} else if ("stacktrace" in error) { // Opera
				error.stacktrace.replace(/Line \d+ of .+ script (.*)/gm, replacer);
			} else if ("stack" in error) { // WebKit
				error.stack.replace(/at (.*)/gm, replacer);
				loc = loc.replace(/:\d+:\d+$/, "");
			}
			return loc;
		},
	
		addEvtListener, remEvtListener;
	
		if ((addEvtListener = doc.addEventListener) &&
	        (remEvtListener = doc.removeEventListener))
		{
			var listener = function (evt) {
				remEvtListener.call(doc, evt.type, arguments.callee, False);
				domReady();
			};
			addEvtListener.call(doc, "DOMContentLoaded", listener, False);
			addEvtListener.call(doc, "load", listener, False);
		}
		
		write = doc.write = function (markup) {
			var body = getElemsByTag("body")[0],
			writeTo  = write.to;
			
			if (!body) {
				writeQueue.push(markup, writeTo);
				return;
			}
			
			var node = doc.createElement("span");
			node.innerHTML = markup;
			
			if (writeTo) {
				if (Object.prototype.toString.call(write.to) === "[object String]") {
					// document.write.to is an element ID
					var el = doc.getElementById(write.to);
					el.parentNode.insertBefore(node, el);
					return;
				}
				anchor.href = getLocation(writeTo);
				var src = anchor.href,
				scripts = getElemsByTag("script");
				
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
			} else { // inline script without document.write.to
				nativeDocWrite.call(doc, markup);
			}
		};
		doc.writeln = function (markup) {
			write(markup + "\n");
		};
		write.START = "try{0()}catch(e){document.write.to=e}";
		write.END   = "delete document.write.to";
	}
}());

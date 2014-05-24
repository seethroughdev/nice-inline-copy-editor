(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* See LICENSE file for terms of use */

/*
 * Text diff implementation.
 *
 * This library supports the following APIS:
 * JsDiff.diffChars: Character by character diff
 * JsDiff.diffWords: Word (as defined by \b regex) diff which ignores whitespace
 * JsDiff.diffLines: Line based diff
 *
 * JsDiff.diffCss: Diff targeted at CSS content
 *
 * These methods are based on the implementation proposed in
 * "An O(ND) Difference Algorithm and its Variations" (Myers, 1986).
 * http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */
var JsDiff = (function() {
  /*jshint maxparams: 5*/
  function clonePath(path) {
    return { newPos: path.newPos, components: path.components.slice(0) };
  }
  function removeEmpty(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  }
  function escapeHTML(s) {
    var n = s;
    n = n.replace(/&/g, '&amp;');
    n = n.replace(/</g, '&lt;');
    n = n.replace(/>/g, '&gt;');
    n = n.replace(/"/g, '&quot;');

    return n;
  }

  var Diff = function(ignoreWhitespace) {
    this.ignoreWhitespace = ignoreWhitespace;
  };
  Diff.prototype = {
      diff: function(oldString, newString) {
        // Handle the identity case (this is due to unrolling editLength == 0
        if (newString === oldString) {
          return [{ value: newString }];
        }
        if (!newString) {
          return [{ value: oldString, removed: true }];
        }
        if (!oldString) {
          return [{ value: newString, added: true }];
        }

        newString = this.tokenize(newString);
        oldString = this.tokenize(oldString);

        var newLen = newString.length, oldLen = oldString.length;
        var maxEditLength = newLen + oldLen;
        var bestPath = [{ newPos: -1, components: [] }];

        // Seed editLength = 0
        var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);
        if (bestPath[0].newPos+1 >= newLen && oldPos+1 >= oldLen) {
          return bestPath[0].components;
        }

        for (var editLength = 1; editLength <= maxEditLength; editLength++) {
          for (var diagonalPath = -1*editLength; diagonalPath <= editLength; diagonalPath+=2) {
            var basePath;
            var addPath = bestPath[diagonalPath-1],
                removePath = bestPath[diagonalPath+1];
            oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
            if (addPath) {
              // No one else is going to attempt to use this value, clear it
              bestPath[diagonalPath-1] = undefined;
            }

            var canAdd = addPath && addPath.newPos+1 < newLen;
            var canRemove = removePath && 0 <= oldPos && oldPos < oldLen;
            if (!canAdd && !canRemove) {
              bestPath[diagonalPath] = undefined;
              continue;
            }

            // Select the diagonal that we want to branch from. We select the prior
            // path whose position in the new string is the farthest from the origin
            // and does not pass the bounds of the diff graph
            if (!canAdd || (canRemove && addPath.newPos < removePath.newPos)) {
              basePath = clonePath(removePath);
              this.pushComponent(basePath.components, oldString[oldPos], undefined, true);
            } else {
              basePath = clonePath(addPath);
              basePath.newPos++;
              this.pushComponent(basePath.components, newString[basePath.newPos], true, undefined);
            }

            var oldPos = this.extractCommon(basePath, newString, oldString, diagonalPath);

            if (basePath.newPos+1 >= newLen && oldPos+1 >= oldLen) {
              return basePath.components;
            } else {
              bestPath[diagonalPath] = basePath;
            }
          }
        }
      },

      pushComponent: function(components, value, added, removed) {
        var last = components[components.length-1];
        if (last && last.added === added && last.removed === removed) {
          // We need to clone here as the component clone operation is just
          // as shallow array clone
          components[components.length-1] =
            {value: this.join(last.value, value), added: added, removed: removed };
        } else {
          components.push({value: value, added: added, removed: removed });
        }
      },
      extractCommon: function(basePath, newString, oldString, diagonalPath) {
        var newLen = newString.length,
            oldLen = oldString.length,
            newPos = basePath.newPos,
            oldPos = newPos - diagonalPath;
        while (newPos+1 < newLen && oldPos+1 < oldLen && this.equals(newString[newPos+1], oldString[oldPos+1])) {
          newPos++;
          oldPos++;

          this.pushComponent(basePath.components, newString[newPos], undefined, undefined);
        }
        basePath.newPos = newPos;
        return oldPos;
      },

      equals: function(left, right) {
        var reWhitespace = /\S/;
        if (this.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right)) {
          return true;
        } else {
          return left === right;
        }
      },
      join: function(left, right) {
        return left + right;
      },
      tokenize: function(value) {
        return value;
      }
  };

  var CharDiff = new Diff();

  var WordDiff = new Diff(true);
  var WordWithSpaceDiff = new Diff();
  WordDiff.tokenize = WordWithSpaceDiff.tokenize = function(value) {
    return removeEmpty(value.split(/(\s+|\b)/));
  };

  var CssDiff = new Diff(true);
  CssDiff.tokenize = function(value) {
    return removeEmpty(value.split(/([{}:;,]|\s+)/));
  };

  var LineDiff = new Diff();
  LineDiff.tokenize = function(value) {
    var retLines = [],
        lines = value.split(/^/m);

    for(var i = 0; i < lines.length; i++) {
      var line = lines[i],
          lastLine = lines[i - 1];

      // Merge lines that may contain windows new lines
      if (line == '\n' && lastLine && lastLine[lastLine.length - 1] === '\r') {
        retLines[retLines.length - 1] += '\n';
      } else if (line) {
        retLines.push(line);
      }
    }

    return retLines;
  };

  return {
    Diff: Diff,

    diffChars: function(oldStr, newStr) { return CharDiff.diff(oldStr, newStr); },
    diffWords: function(oldStr, newStr) { return WordDiff.diff(oldStr, newStr); },
    diffWordsWithSpace: function(oldStr, newStr) { return WordWithSpaceDiff.diff(oldStr, newStr); },
    diffLines: function(oldStr, newStr) { return LineDiff.diff(oldStr, newStr); },

    diffCss: function(oldStr, newStr) { return CssDiff.diff(oldStr, newStr); },

    createPatch: function(fileName, oldStr, newStr, oldHeader, newHeader) {
      var ret = [];

      ret.push('Index: ' + fileName);
      ret.push('===================================================================');
      ret.push('--- ' + fileName + (typeof oldHeader === 'undefined' ? '' : '\t' + oldHeader));
      ret.push('+++ ' + fileName + (typeof newHeader === 'undefined' ? '' : '\t' + newHeader));

      var diff = LineDiff.diff(oldStr, newStr);
      if (!diff[diff.length-1].value) {
        diff.pop();   // Remove trailing newline add
      }
      diff.push({value: '', lines: []});   // Append an empty value to make cleanup easier

      function contextLines(lines) {
        return lines.map(function(entry) { return ' ' + entry; });
      }
      function eofNL(curRange, i, current) {
        var last = diff[diff.length-2],
            isLast = i === diff.length-2,
            isLastOfType = i === diff.length-3 && (current.added !== last.added || current.removed !== last.removed);

        // Figure out if this is the last line for the given file and missing NL
        if (!/\n$/.test(current.value) && (isLast || isLastOfType)) {
          curRange.push('\\ No newline at end of file');
        }
      }

      var oldRangeStart = 0, newRangeStart = 0, curRange = [],
          oldLine = 1, newLine = 1;
      for (var i = 0; i < diff.length; i++) {
        var current = diff[i],
            lines = current.lines || current.value.replace(/\n$/, '').split('\n');
        current.lines = lines;

        if (current.added || current.removed) {
          if (!oldRangeStart) {
            var prev = diff[i-1];
            oldRangeStart = oldLine;
            newRangeStart = newLine;

            if (prev) {
              curRange = contextLines(prev.lines.slice(-4));
              oldRangeStart -= curRange.length;
              newRangeStart -= curRange.length;
            }
          }
          curRange.push.apply(curRange, lines.map(function(entry) { return (current.added?'+':'-') + entry; }));
          eofNL(curRange, i, current);

          if (current.added) {
            newLine += lines.length;
          } else {
            oldLine += lines.length;
          }
        } else {
          if (oldRangeStart) {
            // Close out any changes that have been output (or join overlapping)
            if (lines.length <= 8 && i < diff.length-2) {
              // Overlapping
              curRange.push.apply(curRange, contextLines(lines));
            } else {
              // end the range and output
              var contextSize = Math.min(lines.length, 4);
              ret.push(
                  '@@ -' + oldRangeStart + ',' + (oldLine-oldRangeStart+contextSize)
                  + ' +' + newRangeStart + ',' + (newLine-newRangeStart+contextSize)
                  + ' @@');
              ret.push.apply(ret, curRange);
              ret.push.apply(ret, contextLines(lines.slice(0, contextSize)));
              if (lines.length <= 4) {
                eofNL(ret, i, current);
              }

              oldRangeStart = 0;  newRangeStart = 0; curRange = [];
            }
          }
          oldLine += lines.length;
          newLine += lines.length;
        }
      }

      return ret.join('\n') + '\n';
    },

    applyPatch: function(oldStr, uniDiff) {
      var diffstr = uniDiff.split('\n');
      var diff = [];
      var remEOFNL = false,
          addEOFNL = false;

      for (var i = (diffstr[0][0]==='I'?4:0); i < diffstr.length; i++) {
        if(diffstr[i][0] === '@') {
          var meh = diffstr[i].split(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@/);
          diff.unshift({
            start:meh[3],
            oldlength:meh[2],
            oldlines:[],
            newlength:meh[4],
            newlines:[]
          });
        } else if(diffstr[i][0] === '+') {
          diff[0].newlines.push(diffstr[i].substr(1));
        } else if(diffstr[i][0] === '-') {
          diff[0].oldlines.push(diffstr[i].substr(1));
        } else if(diffstr[i][0] === ' ') {
          diff[0].newlines.push(diffstr[i].substr(1));
          diff[0].oldlines.push(diffstr[i].substr(1));
        } else if(diffstr[i][0] === '\\') {
          if (diffstr[i-1][0] === '+') {
            remEOFNL = true;
          } else if(diffstr[i-1][0] === '-') {
            addEOFNL = true;
          }
        }
      }

      var str = oldStr.split('\n');
      for (var i = diff.length - 1; i >= 0; i--) {
        var d = diff[i];
        for (var j = 0; j < d.oldlength; j++) {
          if(str[d.start-1+j] !== d.oldlines[j]) {
            return false;
          }
        }
        Array.prototype.splice.apply(str,[d.start-1,+d.oldlength].concat(d.newlines));
      }

      if (remEOFNL) {
        while (!str[str.length-1]) {
          str.pop();
        }
      } else if (addEOFNL) {
        str.push('');
      }
      return str.join('\n');
    },

    convertChangesToXML: function(changes){
      var ret = [];
      for ( var i = 0; i < changes.length; i++) {
        var change = changes[i];
        if (change.added) {
          ret.push('<ins>');
        } else if (change.removed) {
          ret.push('<del>');
        }

        ret.push(escapeHTML(change.value));

        if (change.added) {
          ret.push('</ins>');
        } else if (change.removed) {
          ret.push('</del>');
        }
      }
      return ret.join('');
    },

    // See: http://code.google.com/p/google-diff-match-patch/wiki/API
    convertChangesToDMP: function(changes){
      var ret = [], change;
      for ( var i = 0; i < changes.length; i++) {
        change = changes[i];
        ret.push([(change.added ? 1 : change.removed ? -1 : 0), change.value]);
      }
      return ret;
    }
  };
})();

if (typeof module !== 'undefined') {
    module.exports = JsDiff;
}

},{}],2:[function(require,module,exports){
(function (global){
!function(_e){var e=function(){return _e()["default"]};if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.$=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";
var __moduleName = "src/api";
var extend = _dereq_('./util').extend;
var api = {},
    apiNodeList = {},
    $ = {};
var array = _dereq_('./array');
var attr = _dereq_('./attr');
var className = _dereq_('./class');
var dom = _dereq_('./dom');
var event = _dereq_('./event');
var html = _dereq_('./html');
var selector = _dereq_('./selector');
if (selector !== undefined) {
  $ = selector.$;
  $.matches = selector.matches;
  api.find = selector.find;
}
extend($);
var noconflict = _dereq_('./noconflict');
extend($, noconflict);
extend(api, array, attr, className, dom, event, html);
extend(apiNodeList, array);
$.version = '0.7.0';
$.extend = extend;
$.fn = api;
$.fnList = apiNodeList;
var $__default = $;
module.exports = {
  default: $__default,
  __esModule: true
};


},{"./array":2,"./attr":3,"./class":4,"./dom":5,"./event":6,"./html":7,"./noconflict":9,"./selector":10,"./util":11}],2:[function(_dereq_,module,exports){
"use strict";
var __moduleName = "src/array";
var _each = _dereq_('./util').each;
var $__0 = _dereq_('./selector'),
    $ = $__0.$,
    matches = $__0.matches;
var ArrayProto = Array.prototype;
function filter(selector) {
  var callback = typeof selector === 'function' ? selector : function(element) {
    return matches(element, selector);
  };
  return $(ArrayProto.filter.call(this, callback));
}
function each(callback) {
  return _each(this, callback);
}
var forEach = each;
var map = ArrayProto.map;
function reverse() {
  var elements = ArrayProto.slice.call(this);
  return $(ArrayProto.reverse.call(elements));
}
var every = ArrayProto.every;
var some = ArrayProto.some;
var indexOf = ArrayProto.indexOf;
;
module.exports = {
  each: each,
  every: every,
  filter: filter,
  forEach: forEach,
  indexOf: indexOf,
  map: map,
  reverse: reverse,
  some: some,
  __esModule: true
};


},{"./selector":10,"./util":11}],3:[function(_dereq_,module,exports){
"use strict";
var __moduleName = "src/attr";
var each = _dereq_('./util').each;
function attr(key, value) {
  if (typeof key === 'string' && typeof value === 'undefined') {
    var element = this.nodeType ? this : this[0];
    return element ? element.getAttribute(key) : undefined;
  }
  each(this, function(element) {
    if (typeof key === 'object') {
      for (var attr in key) {
        element.setAttribute(attr, key[attr]);
      }
    } else {
      element.setAttribute(key, value);
    }
  });
  return this;
}
function removeAttr(key) {
  each(this, function(element) {
    element.removeAttribute(key);
  });
  return this;
}
;
module.exports = {
  attr: attr,
  removeAttr: removeAttr,
  __esModule: true
};


},{"./util":11}],4:[function(_dereq_,module,exports){
"use strict";
var __moduleName = "src/class";
var $__0 = _dereq_('./util'),
    makeIterable = $__0.makeIterable,
    each = $__0.each;
function addClass(value) {
  each(this, function(element) {
    element.classList.add(value);
  });
  return this;
}
function removeClass(value) {
  each(this, function(element) {
    element.classList.remove(value);
  });
  return this;
}
function toggleClass(value) {
  each(this, function(element) {
    element.classList.toggle(value);
  });
  return this;
}
function hasClass(value) {
  return makeIterable(this).some(function(element) {
    return element.classList.contains(value);
  });
}
;
module.exports = {
  addClass: addClass,
  removeClass: removeClass,
  toggleClass: toggleClass,
  hasClass: hasClass,
  __esModule: true
};


},{"./util":11}],5:[function(_dereq_,module,exports){
"use strict";
var __moduleName = "src/dom";
var toArray = _dereq_('./util').toArray;
function append(element) {
  if (this instanceof Node) {
    if (typeof element === 'string') {
      this.insertAdjacentHTML('beforeend', element);
    } else {
      if (element instanceof Node) {
        this.appendChild(element);
      } else {
        var elements = element instanceof NodeList ? toArray(element) : element;
        elements.forEach(this.appendChild.bind(this));
      }
    }
  } else {
    var l = this.length;
    while (l--) {
      var elm = l === 0 ? element : _clone(element);
      append.call(this[l], elm);
    }
  }
  return this;
}
function prepend(element) {
  if (this instanceof Node) {
    if (typeof element === 'string') {
      this.insertAdjacentHTML('afterbegin', element);
    } else {
      if (element instanceof Node) {
        this.insertBefore(element, this.firstChild);
      } else {
        var elements = element instanceof NodeList ? toArray(element) : element;
        elements.reverse().forEach(prepend.bind(this));
      }
    }
  } else {
    var l = this.length;
    while (l--) {
      var elm = l === 0 ? element : _clone(element);
      prepend.call(this[l], elm);
    }
  }
  return this;
}
function before(element) {
  if (this instanceof Node) {
    if (typeof element === 'string') {
      this.insertAdjacentHTML('beforebegin', element);
    } else {
      if (element instanceof Node) {
        this.parentNode.insertBefore(element, this);
      } else {
        var elements = element instanceof NodeList ? toArray(element) : element;
        elements.forEach(before.bind(this));
      }
    }
  } else {
    var l = this.length;
    while (l--) {
      var elm = l === 0 ? element : _clone(element);
      before.call(this[l], elm);
    }
  }
  return this;
}
function after(element) {
  if (this instanceof Node) {
    if (typeof element === 'string') {
      this.insertAdjacentHTML('afterend', element);
    } else {
      if (element instanceof Node) {
        this.parentNode.insertBefore(element, this.nextSibling);
      } else {
        var elements = element instanceof NodeList ? toArray(element) : element;
        elements.reverse().forEach(after.bind(this));
      }
    }
  } else {
    var l = this.length;
    while (l--) {
      var elm = l === 0 ? element : _clone(element);
      after.call(this[l], elm);
    }
  }
  return this;
}
function clone() {
  return $(_clone(this));
}
function _clone(element) {
  if (typeof element === 'string') {
    return element;
  } else if (element instanceof Node) {
    return element.cloneNode(true);
  } else if ('length' in element) {
    return [].map.call(element, function(el) {
      return el.cloneNode(true);
    });
  }
  return element;
}
;
module.exports = {
  append: append,
  prepend: prepend,
  before: before,
  after: after,
  clone: clone,
  __esModule: true
};


},{"./util":11}],6:[function(_dereq_,module,exports){
"use strict";
var __moduleName = "src/event";
var $__0 = _dereq_('./util'),
    global = $__0.global,
    each = $__0.each;
var matches = _dereq_('./selector').matches;
function on(eventName, selector, handler, useCapture) {
  if (typeof selector === 'function') {
    handler = selector;
    selector = null;
  }
  var parts = eventName.split('.');
  eventName = parts[0] || null;
  var namespace = parts[1] || null;
  var eventListener = proxyHandler(handler);
  each(this, function(element) {
    if (selector) {
      eventListener = delegateHandler.bind(element, selector, handler);
    }
    element.addEventListener(eventName, eventListener, useCapture || false);
    getHandlers(element).push({
      eventName: eventName,
      handler: handler,
      eventListener: eventListener,
      selector: selector,
      namespace: namespace
    });
  });
  return this;
}
function off(eventName, selector, handler, useCapture) {
  if (typeof selector === 'function') {
    handler = selector;
    selector = null;
  }
  if (eventName) {
    var parts = eventName.split('.');
    eventName = parts[0];
    var namespace = parts[1];
  }
  each(this, function(element) {
    var handlers = getHandlers(element);
    if (!eventName && !namespace && !selector && !handler) {
      each(handlers, function(item) {
        element.removeEventListener(item.eventName, item.eventListener, useCapture || false);
      });
      clearHandlers(element);
    } else {
      each(handlers.filter(function(item) {
        return ((!eventName || item.eventName === eventName) && (!namespace || item.namespace === namespace) && (!handler || item.handler === handler) && (!selector || item.selector === selector));
      }), function(item) {
        element.removeEventListener(item.eventName, item.eventListener, useCapture || false);
        handlers.splice(handlers.indexOf(item), 1);
      });
      if (handlers.length === 0) {
        clearHandlers(element);
      }
    }
  });
  return this;
}
function delegate(selector, eventName, handler) {
  return on.call(this, eventName, selector, handler);
}
function undelegate(selector, eventName, handler) {
  return off.call(this, eventName, selector, handler);
}
function trigger(type) {
  var params = arguments[2] !== (void 0) ? arguments[2] : {};
  params.bubbles = typeof params.bubbles === 'boolean' ? params.bubbles : true;
  params.cancelable = typeof params.cancelable === 'boolean' ? params.cancelable : true;
  params.preventDefault = typeof params.preventDefault === 'boolean' ? params.preventDefault : false;
  params.detail = data;
  var event = new CustomEvent(type, params);
  event._preventDefault = params.preventDefault;
  each(this, function(element) {
    if (!params.bubbles || isEventBubblingInDetachedTree || isAttachedToDocument(element)) {
      element.dispatchEvent(event);
    } else {
      triggerForPath(element, type, params);
    }
  });
  return this;
}
function triggerHandler(type) {
  if (this[0]) {
    trigger.call(this[0], type, {
      bubbles: false,
      preventDefault: true
    });
  }
}
function ready(handler) {
  if (/complete|loaded|interactive/.test(document.readyState) && document.body) {
    handler();
  } else {
    document.addEventListener('DOMContentLoaded', handler, false);
  }
  return this;
}
function isAttachedToDocument(element) {
  if (element === window || element === document) {
    return true;
  }
  var container = element.ownerDocument.documentElement;
  if (container.contains) {
    return container.contains(element);
  } else if (container.compareDocumentPosition) {
    return !(container.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_DISCONNECTED);
  }
  return false;
}
function triggerForPath(element, type) {
  var params = arguments[2] !== (void 0) ? arguments[2] : {};
  params.bubbles = false;
  var event = new CustomEvent(type, params);
  event._target = element;
  do {
    element.dispatchEvent(event);
  } while (element = element.parentNode);
}
var eventKeyProp = '__domtastic_event__';
var id = 1;
var handlers = {};
var unusedKeys = [];
function getHandlers(element) {
  if (!element[eventKeyProp]) {
    element[eventKeyProp] = unusedKeys.length === 0 ? ++id : unusedKeys.pop();
  }
  var key = element[eventKeyProp];
  return handlers[key] || (handlers[key] = []);
}
function clearHandlers(element) {
  var key = element[eventKeyProp];
  if (handlers[key]) {
    handlers[key] = null;
    element[key] = null;
    unusedKeys.push(key);
  }
}
function proxyHandler(handler) {
  return function(event) {
    handler(augmentEvent(event), event.detail);
  };
}
var augmentEvent = (function() {
  var eventMethods = {
    preventDefault: 'isDefaultPrevented',
    stopImmediatePropagation: 'isImmediatePropagationStopped',
    stopPropagation: 'isPropagationStopped'
  },
      noop = (function() {}),
      returnTrue = (function() {
        return true;
      }),
      returnFalse = (function() {
        return false;
      });
  return function(event) {
    for (var methodName in eventMethods) {
      (function(methodName, testMethodName, originalMethod) {
        event[methodName] = function() {
          this[testMethodName] = returnTrue;
          return originalMethod.apply(this, arguments);
        };
        event[testMethodName] = returnFalse;
      }(methodName, eventMethods[methodName], event[methodName] || noop));
    }
    if (event._preventDefault) {
      event.preventDefault();
    }
    return event;
  };
})();
function delegateHandler(selector, handler, event) {
  var eventTarget = event._target || event.target;
  if (matches(eventTarget, selector)) {
    if (!event.currentTarget) {
      event.currentTarget = eventTarget;
    }
    handler.call(eventTarget, event);
  }
}
(function() {
  function CustomEvent(event) {
    var params = arguments[1] !== (void 0) ? arguments[1] : {
      bubbles: false,
      cancelable: false,
      detail: undefined
    };
    var customEvent = document.createEvent('CustomEvent');
    customEvent.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return customEvent;
  }
  CustomEvent.prototype = global.CustomEvent && global.CustomEvent.prototype;
  global.CustomEvent = CustomEvent;
})();
var isEventBubblingInDetachedTree = (function() {
  var isBubbling = false,
      doc = global.document;
  if (doc) {
    var parent = doc.createElement('div'),
        child = parent.cloneNode();
    parent.appendChild(child);
    parent.addEventListener('e', function() {
      isBubbling = true;
    });
    child.dispatchEvent(new CustomEvent('e', {bubbles: true}));
  }
  return isBubbling;
})();
var bind = on,
    unbind = off;
;
module.exports = {
  on: on,
  off: off,
  delegate: delegate,
  undelegate: undelegate,
  trigger: trigger,
  triggerHandler: triggerHandler,
  ready: ready,
  bind: bind,
  unbind: unbind,
  __esModule: true
};


},{"./selector":10,"./util":11}],7:[function(_dereq_,module,exports){
"use strict";
var __moduleName = "src/html";
var each = _dereq_('./util').each;
function html(fragment) {
  if (typeof fragment !== 'string') {
    var element = this.nodeType ? this : this[0];
    return element ? element.innerHTML : undefined;
  }
  each(this, function(element) {
    element.innerHTML = fragment;
  });
  return this;
}
;
module.exports = {
  html: html,
  __esModule: true
};


},{"./util":11}],8:[function(_dereq_,module,exports){
"use strict";
var __moduleName = "src/index";
var $ = _dereq_('./api').default;
var $__default = $;
module.exports = {
  default: $__default,
  __esModule: true
};


},{"./api":1}],9:[function(_dereq_,module,exports){
"use strict";
var __moduleName = "src/noconflict";
var global = _dereq_('./util').global;
var previousLib = global.$;
function noConflict() {
  global.$ = previousLib;
  return this;
}
;
module.exports = {
  noConflict: noConflict,
  __esModule: true
};


},{"./util":11}],10:[function(_dereq_,module,exports){
"use strict";
var __moduleName = "src/selector";
var $__0 = _dereq_('./util'),
    global = $__0.global,
    makeIterable = $__0.makeIterable;
var slice = [].slice,
    isPrototypeSet = false,
    reFragment = /^\s*<(\w+|!)[^>]*>/,
    reSingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    reSimpleSelector = /^[\.#]?[\w-]*$/;
function $(selector) {
  var context = arguments[1] !== (void 0) ? arguments[1] : document;
  var collection;
  if (!selector) {
    collection = document.querySelectorAll(null);
  } else if (selector instanceof Wrapper) {
    return selector;
  } else if (typeof selector !== 'string') {
    collection = makeIterable(selector);
  } else if (reFragment.test(selector)) {
    collection = createFragment(selector);
  } else {
    context = typeof context === 'string' ? document.querySelector(context) : context.length ? context[0] : context;
    collection = querySelector(selector, context);
  }
  return $.isNative ? collection : wrap(collection);
}
function find(selector) {
  return $(selector, this);
}
var matches = (function() {
  var context = typeof Element !== 'undefined' ? Element.prototype : global,
      _matches = context.matches || context.matchesSelector || context.mozMatchesSelector || context.webkitMatchesSelector || context.msMatchesSelector || context.oMatchesSelector;
  return function(element, selector) {
    return _matches.call(element, selector);
  };
})();
function querySelector(selector, context) {
  var isSimpleSelector = reSimpleSelector.test(selector);
  if (isSimpleSelector && !$.isNative) {
    if (selector[0] === '#') {
      var element = (context.getElementById ? context : document).getElementById(selector.slice(1));
      return element ? [element] : [];
    }
    if (selector[0] === '.') {
      return context.getElementsByClassName(selector.slice(1));
    }
    return context.getElementsByTagName(selector);
  }
  return context.querySelectorAll(selector);
}
function createFragment(html) {
  if (reSingleTag.test(html)) {
    return [document.createElement(RegExp.$1)];
  }
  var elements = [],
      container = document.createElement('div'),
      children = container.childNodes;
  container.innerHTML = html;
  for (var i = 0,
      l = children.length; i < l; i++) {
    elements.push(children[i]);
  }
  return elements;
}
function wrap(collection) {
  if (!isPrototypeSet) {
    Wrapper.prototype = $.fn;
    Wrapper.prototype.constructor = Wrapper;
    isPrototypeSet = true;
  }
  return new Wrapper(collection);
}
function Wrapper(collection) {
  var i = 0,
      length = collection.length;
  for (; i < length; ) {
    this[i] = collection[i++];
  }
  this.length = length;
}
;
module.exports = {
  $: $,
  find: find,
  matches: matches,
  __esModule: true
};


},{"./util":11}],11:[function(_dereq_,module,exports){
"use strict";
var __moduleName = "src/util";
var global = new Function("return this")(),
    slice = Array.prototype.slice;
var toArray = (function(collection) {
  return slice.call(collection);
});
var makeIterable = (function(element) {
  return element.nodeType || element === window ? [element] : element;
});
function each(collection, callback) {
  var length = collection.length;
  if (length !== undefined && collection.nodeType === undefined) {
    for (var i = 0; i < length; i++) {
      callback(collection[i], i, collection);
    }
  } else {
    callback(collection, 0, collection);
  }
  return collection;
}
function extend(target) {
  for (var sources = [],
      $__0 = 1; $__0 < arguments.length; $__0++)
    sources[$__0 - 1] = arguments[$__0];
  sources.forEach(function(src) {
    if (src) {
      for (var prop in src) {
        target[prop] = src[prop];
      }
    }
  });
  return target;
}
;
module.exports = {
  global: global,
  toArray: toArray,
  makeIterable: makeIterable,
  each: each,
  extend: extend,
  __esModule: true
};


},{}]},{},[8])
(8)
});
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
var obj     = require('./modules/obj')
,   events  = require('./modules/events')
,   content = require('./modules/content');

content.init();
obj.init();
events();


},{"./modules/content":4,"./modules/events":6,"./modules/obj":7}],4:[function(require,module,exports){
'use strict';

var $ = window.jQuery || require('domtastic');

var $body      = $('body'),
    isOriginal = true;

var content = {

  init: function() {
    return this.wrapContent();
  },

  wrapContent: function() {
    $body.html('<div id="nice-content">' + $body.html() + '</div>');
    this.originalHTML = this.currentHTML = this.getHTML();
    return this.makeEditable($body);
  },

  makeEditable: function(el) {
    return el.attr('contenteditable', true);
  },

  removeNice: function() {
    $body
      .html($('#nice-content').html())
      .removeAttr('contenteditable');
  },

  getHTML: function() {
    return $('#nice-content').html();
  },

  setHTML: function(html) {
    return $('#nice-content').html(html);
  },

  toggleHTML: function() {

    isOriginal = this.getHTML() === this.originalHTML ? true : false;

    if (!isOriginal) {
      this.currentHTML = this.getHTML();
    }

    var html = isOriginal ? this.currentHTML : this.originalHTML;

    this.setHTML(html);

  },

  originalHTML: '',

  currentHTML: ''

};

module.exports = content;

},{"domtastic":2}],5:[function(require,module,exports){
'use strict';

var $ = window.jQuey || require('domtastic')
,   jsdiff = require('diff')
,   content = require('./content');

var diffObj = {

  init: function() {
    var diff = jsdiff.diffLines(content.originalHTML, content.getHTML());
    this.populateDiff(diff);
  },

  populateDiff: function(diff) {
    var $pre = $('#nice-pre').html('')
    ,   color
    ,   span;


    diff.forEach(function(part) {
      if (part.added || part.removed) {
        color = part.added ? 'green' : part.removed ? 'red' : 'grey';
        span = document.createElement('span');
        span.style.color = color;
        span.appendChild(document.createTextNode(part.value));
        $pre.append(span);
      }
    });
  }
};


module.exports = diffObj;

},{"./content":4,"diff":1,"domtastic":2}],6:[function(require,module,exports){
'use strict';

var $       = window.jQuery || require('domtastic')
,   diff    = require('./diff')
,   content = require('./content');

var events = function() {

  $(document).on('click', '#nice-nav', function() {
    $(this).toggleClass('is-min');
  });

  $('#nice-off').on('click', function(e) {
    e.preventDefault();
    content.removeNice();
  });

  $('#nice-diff').on('click', function(e) {
    e.preventDefault();
    diff.init();
  });

  $('#nice-toggle').on('click', function(e) {
    e.preventDefault();
    content.toggleHTML();
    // window.console.log(content.originalHTML);
  });

};

module.exports = events;

},{"./content":4,"./diff":5,"domtastic":2}],7:[function(require,module,exports){
'use strict';

var objTemplate = require('./template');

var body = document.getElementsByTagName('body')[ 0 ];
var head = document.getElementsByTagName('head')[ 0 ];

var nav = {

  init: function() {
    this.createObj();
    this.style();
  },

  createObj: function() {
    var div = document.createElement('div');
    div.setAttribute('id', 'nice-obj');
    div.setAttribute('contenteditable', false);
    div.innerHTML = objTemplate;
    this.append(div);
  },

  style: function() {
    var link = document.createElement('link');
    link.setAttribute('rel','stylesheet');
    link.setAttribute('href','index.css');
    link.setAttribute('type','text/css');
    head.appendChild(link);
  },

  append: function(div) {
    body.appendChild(div);
  }

};

module.exports = nav;

},{"./template":8}],8:[function(require,module,exports){
'use strict';

// set objTemplate
var objTemplate = '<ul id="nice-nav">';
    objTemplate += '<li id="nice-title" title="Go To Homepage">NICE</li>';
    objTemplate += '<li id="nice-off" title="Turn off NICE"></li>';
    objTemplate += '<li id="nice-diff" title="See Diff"></li>';
    objTemplate += '<li id="nice-toggle" title="Toggle Original"></li>';
    objTemplate += '</ul>';
    objTemplate += '<pre id="nice-pre"></pre>';

module.exports = objTemplate;

},{}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVm9sdW1lcy9TZXNzaW9ucy93ZWIvZGV2L2NvcHktZWRpdG9yL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVm9sdW1lcy9TZXNzaW9ucy93ZWIvZGV2L2NvcHktZWRpdG9yL25vZGVfbW9kdWxlcy9kaWZmL2RpZmYuanMiLCIvVm9sdW1lcy9TZXNzaW9ucy93ZWIvZGV2L2NvcHktZWRpdG9yL25vZGVfbW9kdWxlcy9kb210YXN0aWMvZG9tdGFzdGljLmpzIiwiL1ZvbHVtZXMvU2Vzc2lvbnMvd2ViL2Rldi9jb3B5LWVkaXRvci9zcmMvanMvaW5kZXguanMiLCIvVm9sdW1lcy9TZXNzaW9ucy93ZWIvZGV2L2NvcHktZWRpdG9yL3NyYy9qcy9tb2R1bGVzL2NvbnRlbnQuanMiLCIvVm9sdW1lcy9TZXNzaW9ucy93ZWIvZGV2L2NvcHktZWRpdG9yL3NyYy9qcy9tb2R1bGVzL2RpZmYuanMiLCIvVm9sdW1lcy9TZXNzaW9ucy93ZWIvZGV2L2NvcHktZWRpdG9yL3NyYy9qcy9tb2R1bGVzL2V2ZW50cy5qcyIsIi9Wb2x1bWVzL1Nlc3Npb25zL3dlYi9kZXYvY29weS1lZGl0b3Ivc3JjL2pzL21vZHVsZXMvb2JqLmpzIiwiL1ZvbHVtZXMvU2Vzc2lvbnMvd2ViL2Rldi9jb3B5LWVkaXRvci9zcmMvanMvbW9kdWxlcy90ZW1wbGF0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeHFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBTZWUgTElDRU5TRSBmaWxlIGZvciB0ZXJtcyBvZiB1c2UgKi9cblxuLypcbiAqIFRleHQgZGlmZiBpbXBsZW1lbnRhdGlvbi5cbiAqXG4gKiBUaGlzIGxpYnJhcnkgc3VwcG9ydHMgdGhlIGZvbGxvd2luZyBBUElTOlxuICogSnNEaWZmLmRpZmZDaGFyczogQ2hhcmFjdGVyIGJ5IGNoYXJhY3RlciBkaWZmXG4gKiBKc0RpZmYuZGlmZldvcmRzOiBXb3JkIChhcyBkZWZpbmVkIGJ5IFxcYiByZWdleCkgZGlmZiB3aGljaCBpZ25vcmVzIHdoaXRlc3BhY2VcbiAqIEpzRGlmZi5kaWZmTGluZXM6IExpbmUgYmFzZWQgZGlmZlxuICpcbiAqIEpzRGlmZi5kaWZmQ3NzOiBEaWZmIHRhcmdldGVkIGF0IENTUyBjb250ZW50XG4gKlxuICogVGhlc2UgbWV0aG9kcyBhcmUgYmFzZWQgb24gdGhlIGltcGxlbWVudGF0aW9uIHByb3Bvc2VkIGluXG4gKiBcIkFuIE8oTkQpIERpZmZlcmVuY2UgQWxnb3JpdGhtIGFuZCBpdHMgVmFyaWF0aW9uc1wiIChNeWVycywgMTk4NikuXG4gKiBodHRwOi8vY2l0ZXNlZXJ4LmlzdC5wc3UuZWR1L3ZpZXdkb2Mvc3VtbWFyeT9kb2k9MTAuMS4xLjQuNjkyN1xuICovXG52YXIgSnNEaWZmID0gKGZ1bmN0aW9uKCkge1xuICAvKmpzaGludCBtYXhwYXJhbXM6IDUqL1xuICBmdW5jdGlvbiBjbG9uZVBhdGgocGF0aCkge1xuICAgIHJldHVybiB7IG5ld1BvczogcGF0aC5uZXdQb3MsIGNvbXBvbmVudHM6IHBhdGguY29tcG9uZW50cy5zbGljZSgwKSB9O1xuICB9XG4gIGZ1bmN0aW9uIHJlbW92ZUVtcHR5KGFycmF5KSB7XG4gICAgdmFyIHJldCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhcnJheVtpXSkge1xuICAgICAgICByZXQucHVzaChhcnJheVtpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cbiAgZnVuY3Rpb24gZXNjYXBlSFRNTChzKSB7XG4gICAgdmFyIG4gPSBzO1xuICAgIG4gPSBuLnJlcGxhY2UoLyYvZywgJyZhbXA7Jyk7XG4gICAgbiA9IG4ucmVwbGFjZSgvPC9nLCAnJmx0OycpO1xuICAgIG4gPSBuLnJlcGxhY2UoLz4vZywgJyZndDsnKTtcbiAgICBuID0gbi5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7Jyk7XG5cbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIHZhciBEaWZmID0gZnVuY3Rpb24oaWdub3JlV2hpdGVzcGFjZSkge1xuICAgIHRoaXMuaWdub3JlV2hpdGVzcGFjZSA9IGlnbm9yZVdoaXRlc3BhY2U7XG4gIH07XG4gIERpZmYucHJvdG90eXBlID0ge1xuICAgICAgZGlmZjogZnVuY3Rpb24ob2xkU3RyaW5nLCBuZXdTdHJpbmcpIHtcbiAgICAgICAgLy8gSGFuZGxlIHRoZSBpZGVudGl0eSBjYXNlICh0aGlzIGlzIGR1ZSB0byB1bnJvbGxpbmcgZWRpdExlbmd0aCA9PSAwXG4gICAgICAgIGlmIChuZXdTdHJpbmcgPT09IG9sZFN0cmluZykge1xuICAgICAgICAgIHJldHVybiBbeyB2YWx1ZTogbmV3U3RyaW5nIH1dO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbmV3U3RyaW5nKSB7XG4gICAgICAgICAgcmV0dXJuIFt7IHZhbHVlOiBvbGRTdHJpbmcsIHJlbW92ZWQ6IHRydWUgfV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFvbGRTdHJpbmcpIHtcbiAgICAgICAgICByZXR1cm4gW3sgdmFsdWU6IG5ld1N0cmluZywgYWRkZWQ6IHRydWUgfV07XG4gICAgICAgIH1cblxuICAgICAgICBuZXdTdHJpbmcgPSB0aGlzLnRva2VuaXplKG5ld1N0cmluZyk7XG4gICAgICAgIG9sZFN0cmluZyA9IHRoaXMudG9rZW5pemUob2xkU3RyaW5nKTtcblxuICAgICAgICB2YXIgbmV3TGVuID0gbmV3U3RyaW5nLmxlbmd0aCwgb2xkTGVuID0gb2xkU3RyaW5nLmxlbmd0aDtcbiAgICAgICAgdmFyIG1heEVkaXRMZW5ndGggPSBuZXdMZW4gKyBvbGRMZW47XG4gICAgICAgIHZhciBiZXN0UGF0aCA9IFt7IG5ld1BvczogLTEsIGNvbXBvbmVudHM6IFtdIH1dO1xuXG4gICAgICAgIC8vIFNlZWQgZWRpdExlbmd0aCA9IDBcbiAgICAgICAgdmFyIG9sZFBvcyA9IHRoaXMuZXh0cmFjdENvbW1vbihiZXN0UGF0aFswXSwgbmV3U3RyaW5nLCBvbGRTdHJpbmcsIDApO1xuICAgICAgICBpZiAoYmVzdFBhdGhbMF0ubmV3UG9zKzEgPj0gbmV3TGVuICYmIG9sZFBvcysxID49IG9sZExlbikge1xuICAgICAgICAgIHJldHVybiBiZXN0UGF0aFswXS5jb21wb25lbnRzO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgZWRpdExlbmd0aCA9IDE7IGVkaXRMZW5ndGggPD0gbWF4RWRpdExlbmd0aDsgZWRpdExlbmd0aCsrKSB7XG4gICAgICAgICAgZm9yICh2YXIgZGlhZ29uYWxQYXRoID0gLTEqZWRpdExlbmd0aDsgZGlhZ29uYWxQYXRoIDw9IGVkaXRMZW5ndGg7IGRpYWdvbmFsUGF0aCs9Mikge1xuICAgICAgICAgICAgdmFyIGJhc2VQYXRoO1xuICAgICAgICAgICAgdmFyIGFkZFBhdGggPSBiZXN0UGF0aFtkaWFnb25hbFBhdGgtMV0sXG4gICAgICAgICAgICAgICAgcmVtb3ZlUGF0aCA9IGJlc3RQYXRoW2RpYWdvbmFsUGF0aCsxXTtcbiAgICAgICAgICAgIG9sZFBvcyA9IChyZW1vdmVQYXRoID8gcmVtb3ZlUGF0aC5uZXdQb3MgOiAwKSAtIGRpYWdvbmFsUGF0aDtcbiAgICAgICAgICAgIGlmIChhZGRQYXRoKSB7XG4gICAgICAgICAgICAgIC8vIE5vIG9uZSBlbHNlIGlzIGdvaW5nIHRvIGF0dGVtcHQgdG8gdXNlIHRoaXMgdmFsdWUsIGNsZWFyIGl0XG4gICAgICAgICAgICAgIGJlc3RQYXRoW2RpYWdvbmFsUGF0aC0xXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGNhbkFkZCA9IGFkZFBhdGggJiYgYWRkUGF0aC5uZXdQb3MrMSA8IG5ld0xlbjtcbiAgICAgICAgICAgIHZhciBjYW5SZW1vdmUgPSByZW1vdmVQYXRoICYmIDAgPD0gb2xkUG9zICYmIG9sZFBvcyA8IG9sZExlbjtcbiAgICAgICAgICAgIGlmICghY2FuQWRkICYmICFjYW5SZW1vdmUpIHtcbiAgICAgICAgICAgICAgYmVzdFBhdGhbZGlhZ29uYWxQYXRoXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNlbGVjdCB0aGUgZGlhZ29uYWwgdGhhdCB3ZSB3YW50IHRvIGJyYW5jaCBmcm9tLiBXZSBzZWxlY3QgdGhlIHByaW9yXG4gICAgICAgICAgICAvLyBwYXRoIHdob3NlIHBvc2l0aW9uIGluIHRoZSBuZXcgc3RyaW5nIGlzIHRoZSBmYXJ0aGVzdCBmcm9tIHRoZSBvcmlnaW5cbiAgICAgICAgICAgIC8vIGFuZCBkb2VzIG5vdCBwYXNzIHRoZSBib3VuZHMgb2YgdGhlIGRpZmYgZ3JhcGhcbiAgICAgICAgICAgIGlmICghY2FuQWRkIHx8IChjYW5SZW1vdmUgJiYgYWRkUGF0aC5uZXdQb3MgPCByZW1vdmVQYXRoLm5ld1BvcykpIHtcbiAgICAgICAgICAgICAgYmFzZVBhdGggPSBjbG9uZVBhdGgocmVtb3ZlUGF0aCk7XG4gICAgICAgICAgICAgIHRoaXMucHVzaENvbXBvbmVudChiYXNlUGF0aC5jb21wb25lbnRzLCBvbGRTdHJpbmdbb2xkUG9zXSwgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGJhc2VQYXRoID0gY2xvbmVQYXRoKGFkZFBhdGgpO1xuICAgICAgICAgICAgICBiYXNlUGF0aC5uZXdQb3MrKztcbiAgICAgICAgICAgICAgdGhpcy5wdXNoQ29tcG9uZW50KGJhc2VQYXRoLmNvbXBvbmVudHMsIG5ld1N0cmluZ1tiYXNlUGF0aC5uZXdQb3NdLCB0cnVlLCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgb2xkUG9zID0gdGhpcy5leHRyYWN0Q29tbW9uKGJhc2VQYXRoLCBuZXdTdHJpbmcsIG9sZFN0cmluZywgZGlhZ29uYWxQYXRoKTtcblxuICAgICAgICAgICAgaWYgKGJhc2VQYXRoLm5ld1BvcysxID49IG5ld0xlbiAmJiBvbGRQb3MrMSA+PSBvbGRMZW4pIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGJhc2VQYXRoLmNvbXBvbmVudHM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBiZXN0UGF0aFtkaWFnb25hbFBhdGhdID0gYmFzZVBhdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBwdXNoQ29tcG9uZW50OiBmdW5jdGlvbihjb21wb25lbnRzLCB2YWx1ZSwgYWRkZWQsIHJlbW92ZWQpIHtcbiAgICAgICAgdmFyIGxhc3QgPSBjb21wb25lbnRzW2NvbXBvbmVudHMubGVuZ3RoLTFdO1xuICAgICAgICBpZiAobGFzdCAmJiBsYXN0LmFkZGVkID09PSBhZGRlZCAmJiBsYXN0LnJlbW92ZWQgPT09IHJlbW92ZWQpIHtcbiAgICAgICAgICAvLyBXZSBuZWVkIHRvIGNsb25lIGhlcmUgYXMgdGhlIGNvbXBvbmVudCBjbG9uZSBvcGVyYXRpb24gaXMganVzdFxuICAgICAgICAgIC8vIGFzIHNoYWxsb3cgYXJyYXkgY2xvbmVcbiAgICAgICAgICBjb21wb25lbnRzW2NvbXBvbmVudHMubGVuZ3RoLTFdID1cbiAgICAgICAgICAgIHt2YWx1ZTogdGhpcy5qb2luKGxhc3QudmFsdWUsIHZhbHVlKSwgYWRkZWQ6IGFkZGVkLCByZW1vdmVkOiByZW1vdmVkIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29tcG9uZW50cy5wdXNoKHt2YWx1ZTogdmFsdWUsIGFkZGVkOiBhZGRlZCwgcmVtb3ZlZDogcmVtb3ZlZCB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGV4dHJhY3RDb21tb246IGZ1bmN0aW9uKGJhc2VQYXRoLCBuZXdTdHJpbmcsIG9sZFN0cmluZywgZGlhZ29uYWxQYXRoKSB7XG4gICAgICAgIHZhciBuZXdMZW4gPSBuZXdTdHJpbmcubGVuZ3RoLFxuICAgICAgICAgICAgb2xkTGVuID0gb2xkU3RyaW5nLmxlbmd0aCxcbiAgICAgICAgICAgIG5ld1BvcyA9IGJhc2VQYXRoLm5ld1BvcyxcbiAgICAgICAgICAgIG9sZFBvcyA9IG5ld1BvcyAtIGRpYWdvbmFsUGF0aDtcbiAgICAgICAgd2hpbGUgKG5ld1BvcysxIDwgbmV3TGVuICYmIG9sZFBvcysxIDwgb2xkTGVuICYmIHRoaXMuZXF1YWxzKG5ld1N0cmluZ1tuZXdQb3MrMV0sIG9sZFN0cmluZ1tvbGRQb3MrMV0pKSB7XG4gICAgICAgICAgbmV3UG9zKys7XG4gICAgICAgICAgb2xkUG9zKys7XG5cbiAgICAgICAgICB0aGlzLnB1c2hDb21wb25lbnQoYmFzZVBhdGguY29tcG9uZW50cywgbmV3U3RyaW5nW25ld1Bvc10sIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcbiAgICAgICAgfVxuICAgICAgICBiYXNlUGF0aC5uZXdQb3MgPSBuZXdQb3M7XG4gICAgICAgIHJldHVybiBvbGRQb3M7XG4gICAgICB9LFxuXG4gICAgICBlcXVhbHM6IGZ1bmN0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gICAgICAgIHZhciByZVdoaXRlc3BhY2UgPSAvXFxTLztcbiAgICAgICAgaWYgKHRoaXMuaWdub3JlV2hpdGVzcGFjZSAmJiAhcmVXaGl0ZXNwYWNlLnRlc3QobGVmdCkgJiYgIXJlV2hpdGVzcGFjZS50ZXN0KHJpZ2h0KSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBsZWZ0ID09PSByaWdodDtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGpvaW46IGZ1bmN0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gICAgICAgIHJldHVybiBsZWZ0ICsgcmlnaHQ7XG4gICAgICB9LFxuICAgICAgdG9rZW5pemU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cbiAgfTtcblxuICB2YXIgQ2hhckRpZmYgPSBuZXcgRGlmZigpO1xuXG4gIHZhciBXb3JkRGlmZiA9IG5ldyBEaWZmKHRydWUpO1xuICB2YXIgV29yZFdpdGhTcGFjZURpZmYgPSBuZXcgRGlmZigpO1xuICBXb3JkRGlmZi50b2tlbml6ZSA9IFdvcmRXaXRoU3BhY2VEaWZmLnRva2VuaXplID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gcmVtb3ZlRW1wdHkodmFsdWUuc3BsaXQoLyhcXHMrfFxcYikvKSk7XG4gIH07XG5cbiAgdmFyIENzc0RpZmYgPSBuZXcgRGlmZih0cnVlKTtcbiAgQ3NzRGlmZi50b2tlbml6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHJlbW92ZUVtcHR5KHZhbHVlLnNwbGl0KC8oW3t9OjssXXxcXHMrKS8pKTtcbiAgfTtcblxuICB2YXIgTGluZURpZmYgPSBuZXcgRGlmZigpO1xuICBMaW5lRGlmZi50b2tlbml6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdmFyIHJldExpbmVzID0gW10sXG4gICAgICAgIGxpbmVzID0gdmFsdWUuc3BsaXQoL14vbSk7XG5cbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBsaW5lID0gbGluZXNbaV0sXG4gICAgICAgICAgbGFzdExpbmUgPSBsaW5lc1tpIC0gMV07XG5cbiAgICAgIC8vIE1lcmdlIGxpbmVzIHRoYXQgbWF5IGNvbnRhaW4gd2luZG93cyBuZXcgbGluZXNcbiAgICAgIGlmIChsaW5lID09ICdcXG4nICYmIGxhc3RMaW5lICYmIGxhc3RMaW5lW2xhc3RMaW5lLmxlbmd0aCAtIDFdID09PSAnXFxyJykge1xuICAgICAgICByZXRMaW5lc1tyZXRMaW5lcy5sZW5ndGggLSAxXSArPSAnXFxuJztcbiAgICAgIH0gZWxzZSBpZiAobGluZSkge1xuICAgICAgICByZXRMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXRMaW5lcztcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIERpZmY6IERpZmYsXG5cbiAgICBkaWZmQ2hhcnM6IGZ1bmN0aW9uKG9sZFN0ciwgbmV3U3RyKSB7IHJldHVybiBDaGFyRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyKTsgfSxcbiAgICBkaWZmV29yZHM6IGZ1bmN0aW9uKG9sZFN0ciwgbmV3U3RyKSB7IHJldHVybiBXb3JkRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyKTsgfSxcbiAgICBkaWZmV29yZHNXaXRoU3BhY2U6IGZ1bmN0aW9uKG9sZFN0ciwgbmV3U3RyKSB7IHJldHVybiBXb3JkV2l0aFNwYWNlRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyKTsgfSxcbiAgICBkaWZmTGluZXM6IGZ1bmN0aW9uKG9sZFN0ciwgbmV3U3RyKSB7IHJldHVybiBMaW5lRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyKTsgfSxcblxuICAgIGRpZmZDc3M6IGZ1bmN0aW9uKG9sZFN0ciwgbmV3U3RyKSB7IHJldHVybiBDc3NEaWZmLmRpZmYob2xkU3RyLCBuZXdTdHIpOyB9LFxuXG4gICAgY3JlYXRlUGF0Y2g6IGZ1bmN0aW9uKGZpbGVOYW1lLCBvbGRTdHIsIG5ld1N0ciwgb2xkSGVhZGVyLCBuZXdIZWFkZXIpIHtcbiAgICAgIHZhciByZXQgPSBbXTtcblxuICAgICAgcmV0LnB1c2goJ0luZGV4OiAnICsgZmlsZU5hbWUpO1xuICAgICAgcmV0LnB1c2goJz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0nKTtcbiAgICAgIHJldC5wdXNoKCctLS0gJyArIGZpbGVOYW1lICsgKHR5cGVvZiBvbGRIZWFkZXIgPT09ICd1bmRlZmluZWQnID8gJycgOiAnXFx0JyArIG9sZEhlYWRlcikpO1xuICAgICAgcmV0LnB1c2goJysrKyAnICsgZmlsZU5hbWUgKyAodHlwZW9mIG5ld0hlYWRlciA9PT0gJ3VuZGVmaW5lZCcgPyAnJyA6ICdcXHQnICsgbmV3SGVhZGVyKSk7XG5cbiAgICAgIHZhciBkaWZmID0gTGluZURpZmYuZGlmZihvbGRTdHIsIG5ld1N0cik7XG4gICAgICBpZiAoIWRpZmZbZGlmZi5sZW5ndGgtMV0udmFsdWUpIHtcbiAgICAgICAgZGlmZi5wb3AoKTsgICAvLyBSZW1vdmUgdHJhaWxpbmcgbmV3bGluZSBhZGRcbiAgICAgIH1cbiAgICAgIGRpZmYucHVzaCh7dmFsdWU6ICcnLCBsaW5lczogW119KTsgICAvLyBBcHBlbmQgYW4gZW1wdHkgdmFsdWUgdG8gbWFrZSBjbGVhbnVwIGVhc2llclxuXG4gICAgICBmdW5jdGlvbiBjb250ZXh0TGluZXMobGluZXMpIHtcbiAgICAgICAgcmV0dXJuIGxpbmVzLm1hcChmdW5jdGlvbihlbnRyeSkgeyByZXR1cm4gJyAnICsgZW50cnk7IH0pO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gZW9mTkwoY3VyUmFuZ2UsIGksIGN1cnJlbnQpIHtcbiAgICAgICAgdmFyIGxhc3QgPSBkaWZmW2RpZmYubGVuZ3RoLTJdLFxuICAgICAgICAgICAgaXNMYXN0ID0gaSA9PT0gZGlmZi5sZW5ndGgtMixcbiAgICAgICAgICAgIGlzTGFzdE9mVHlwZSA9IGkgPT09IGRpZmYubGVuZ3RoLTMgJiYgKGN1cnJlbnQuYWRkZWQgIT09IGxhc3QuYWRkZWQgfHwgY3VycmVudC5yZW1vdmVkICE9PSBsYXN0LnJlbW92ZWQpO1xuXG4gICAgICAgIC8vIEZpZ3VyZSBvdXQgaWYgdGhpcyBpcyB0aGUgbGFzdCBsaW5lIGZvciB0aGUgZ2l2ZW4gZmlsZSBhbmQgbWlzc2luZyBOTFxuICAgICAgICBpZiAoIS9cXG4kLy50ZXN0KGN1cnJlbnQudmFsdWUpICYmIChpc0xhc3QgfHwgaXNMYXN0T2ZUeXBlKSkge1xuICAgICAgICAgIGN1clJhbmdlLnB1c2goJ1xcXFwgTm8gbmV3bGluZSBhdCBlbmQgb2YgZmlsZScpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBvbGRSYW5nZVN0YXJ0ID0gMCwgbmV3UmFuZ2VTdGFydCA9IDAsIGN1clJhbmdlID0gW10sXG4gICAgICAgICAgb2xkTGluZSA9IDEsIG5ld0xpbmUgPSAxO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkaWZmLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjdXJyZW50ID0gZGlmZltpXSxcbiAgICAgICAgICAgIGxpbmVzID0gY3VycmVudC5saW5lcyB8fCBjdXJyZW50LnZhbHVlLnJlcGxhY2UoL1xcbiQvLCAnJykuc3BsaXQoJ1xcbicpO1xuICAgICAgICBjdXJyZW50LmxpbmVzID0gbGluZXM7XG5cbiAgICAgICAgaWYgKGN1cnJlbnQuYWRkZWQgfHwgY3VycmVudC5yZW1vdmVkKSB7XG4gICAgICAgICAgaWYgKCFvbGRSYW5nZVN0YXJ0KSB7XG4gICAgICAgICAgICB2YXIgcHJldiA9IGRpZmZbaS0xXTtcbiAgICAgICAgICAgIG9sZFJhbmdlU3RhcnQgPSBvbGRMaW5lO1xuICAgICAgICAgICAgbmV3UmFuZ2VTdGFydCA9IG5ld0xpbmU7XG5cbiAgICAgICAgICAgIGlmIChwcmV2KSB7XG4gICAgICAgICAgICAgIGN1clJhbmdlID0gY29udGV4dExpbmVzKHByZXYubGluZXMuc2xpY2UoLTQpKTtcbiAgICAgICAgICAgICAgb2xkUmFuZ2VTdGFydCAtPSBjdXJSYW5nZS5sZW5ndGg7XG4gICAgICAgICAgICAgIG5ld1JhbmdlU3RhcnQgLT0gY3VyUmFuZ2UubGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBjdXJSYW5nZS5wdXNoLmFwcGx5KGN1clJhbmdlLCBsaW5lcy5tYXAoZnVuY3Rpb24oZW50cnkpIHsgcmV0dXJuIChjdXJyZW50LmFkZGVkPycrJzonLScpICsgZW50cnk7IH0pKTtcbiAgICAgICAgICBlb2ZOTChjdXJSYW5nZSwgaSwgY3VycmVudCk7XG5cbiAgICAgICAgICBpZiAoY3VycmVudC5hZGRlZCkge1xuICAgICAgICAgICAgbmV3TGluZSArPSBsaW5lcy5sZW5ndGg7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9sZExpbmUgKz0gbGluZXMubGVuZ3RoO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAob2xkUmFuZ2VTdGFydCkge1xuICAgICAgICAgICAgLy8gQ2xvc2Ugb3V0IGFueSBjaGFuZ2VzIHRoYXQgaGF2ZSBiZWVuIG91dHB1dCAob3Igam9pbiBvdmVybGFwcGluZylcbiAgICAgICAgICAgIGlmIChsaW5lcy5sZW5ndGggPD0gOCAmJiBpIDwgZGlmZi5sZW5ndGgtMikge1xuICAgICAgICAgICAgICAvLyBPdmVybGFwcGluZ1xuICAgICAgICAgICAgICBjdXJSYW5nZS5wdXNoLmFwcGx5KGN1clJhbmdlLCBjb250ZXh0TGluZXMobGluZXMpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIGVuZCB0aGUgcmFuZ2UgYW5kIG91dHB1dFxuICAgICAgICAgICAgICB2YXIgY29udGV4dFNpemUgPSBNYXRoLm1pbihsaW5lcy5sZW5ndGgsIDQpO1xuICAgICAgICAgICAgICByZXQucHVzaChcbiAgICAgICAgICAgICAgICAgICdAQCAtJyArIG9sZFJhbmdlU3RhcnQgKyAnLCcgKyAob2xkTGluZS1vbGRSYW5nZVN0YXJ0K2NvbnRleHRTaXplKVxuICAgICAgICAgICAgICAgICAgKyAnICsnICsgbmV3UmFuZ2VTdGFydCArICcsJyArIChuZXdMaW5lLW5ld1JhbmdlU3RhcnQrY29udGV4dFNpemUpXG4gICAgICAgICAgICAgICAgICArICcgQEAnKTtcbiAgICAgICAgICAgICAgcmV0LnB1c2guYXBwbHkocmV0LCBjdXJSYW5nZSk7XG4gICAgICAgICAgICAgIHJldC5wdXNoLmFwcGx5KHJldCwgY29udGV4dExpbmVzKGxpbmVzLnNsaWNlKDAsIGNvbnRleHRTaXplKSkpO1xuICAgICAgICAgICAgICBpZiAobGluZXMubGVuZ3RoIDw9IDQpIHtcbiAgICAgICAgICAgICAgICBlb2ZOTChyZXQsIGksIGN1cnJlbnQpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgb2xkUmFuZ2VTdGFydCA9IDA7ICBuZXdSYW5nZVN0YXJ0ID0gMDsgY3VyUmFuZ2UgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgb2xkTGluZSArPSBsaW5lcy5sZW5ndGg7XG4gICAgICAgICAgbmV3TGluZSArPSBsaW5lcy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJldC5qb2luKCdcXG4nKSArICdcXG4nO1xuICAgIH0sXG5cbiAgICBhcHBseVBhdGNoOiBmdW5jdGlvbihvbGRTdHIsIHVuaURpZmYpIHtcbiAgICAgIHZhciBkaWZmc3RyID0gdW5pRGlmZi5zcGxpdCgnXFxuJyk7XG4gICAgICB2YXIgZGlmZiA9IFtdO1xuICAgICAgdmFyIHJlbUVPRk5MID0gZmFsc2UsXG4gICAgICAgICAgYWRkRU9GTkwgPSBmYWxzZTtcblxuICAgICAgZm9yICh2YXIgaSA9IChkaWZmc3RyWzBdWzBdPT09J0knPzQ6MCk7IGkgPCBkaWZmc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmKGRpZmZzdHJbaV1bMF0gPT09ICdAJykge1xuICAgICAgICAgIHZhciBtZWggPSBkaWZmc3RyW2ldLnNwbGl0KC9AQCAtKFxcZCspLChcXGQrKSBcXCsoXFxkKyksKFxcZCspIEBALyk7XG4gICAgICAgICAgZGlmZi51bnNoaWZ0KHtcbiAgICAgICAgICAgIHN0YXJ0Om1laFszXSxcbiAgICAgICAgICAgIG9sZGxlbmd0aDptZWhbMl0sXG4gICAgICAgICAgICBvbGRsaW5lczpbXSxcbiAgICAgICAgICAgIG5ld2xlbmd0aDptZWhbNF0sXG4gICAgICAgICAgICBuZXdsaW5lczpbXVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYoZGlmZnN0cltpXVswXSA9PT0gJysnKSB7XG4gICAgICAgICAgZGlmZlswXS5uZXdsaW5lcy5wdXNoKGRpZmZzdHJbaV0uc3Vic3RyKDEpKTtcbiAgICAgICAgfSBlbHNlIGlmKGRpZmZzdHJbaV1bMF0gPT09ICctJykge1xuICAgICAgICAgIGRpZmZbMF0ub2xkbGluZXMucHVzaChkaWZmc3RyW2ldLnN1YnN0cigxKSk7XG4gICAgICAgIH0gZWxzZSBpZihkaWZmc3RyW2ldWzBdID09PSAnICcpIHtcbiAgICAgICAgICBkaWZmWzBdLm5ld2xpbmVzLnB1c2goZGlmZnN0cltpXS5zdWJzdHIoMSkpO1xuICAgICAgICAgIGRpZmZbMF0ub2xkbGluZXMucHVzaChkaWZmc3RyW2ldLnN1YnN0cigxKSk7XG4gICAgICAgIH0gZWxzZSBpZihkaWZmc3RyW2ldWzBdID09PSAnXFxcXCcpIHtcbiAgICAgICAgICBpZiAoZGlmZnN0cltpLTFdWzBdID09PSAnKycpIHtcbiAgICAgICAgICAgIHJlbUVPRk5MID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2UgaWYoZGlmZnN0cltpLTFdWzBdID09PSAnLScpIHtcbiAgICAgICAgICAgIGFkZEVPRk5MID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIHN0ciA9IG9sZFN0ci5zcGxpdCgnXFxuJyk7XG4gICAgICBmb3IgKHZhciBpID0gZGlmZi5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICB2YXIgZCA9IGRpZmZbaV07XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZC5vbGRsZW5ndGg7IGorKykge1xuICAgICAgICAgIGlmKHN0cltkLnN0YXJ0LTEral0gIT09IGQub2xkbGluZXNbal0pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnNwbGljZS5hcHBseShzdHIsW2Quc3RhcnQtMSwrZC5vbGRsZW5ndGhdLmNvbmNhdChkLm5ld2xpbmVzKSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZW1FT0ZOTCkge1xuICAgICAgICB3aGlsZSAoIXN0cltzdHIubGVuZ3RoLTFdKSB7XG4gICAgICAgICAgc3RyLnBvcCgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGFkZEVPRk5MKSB7XG4gICAgICAgIHN0ci5wdXNoKCcnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzdHIuam9pbignXFxuJyk7XG4gICAgfSxcblxuICAgIGNvbnZlcnRDaGFuZ2VzVG9YTUw6IGZ1bmN0aW9uKGNoYW5nZXMpe1xuICAgICAgdmFyIHJldCA9IFtdO1xuICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgY2hhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hhbmdlID0gY2hhbmdlc1tpXTtcbiAgICAgICAgaWYgKGNoYW5nZS5hZGRlZCkge1xuICAgICAgICAgIHJldC5wdXNoKCc8aW5zPicpO1xuICAgICAgICB9IGVsc2UgaWYgKGNoYW5nZS5yZW1vdmVkKSB7XG4gICAgICAgICAgcmV0LnB1c2goJzxkZWw+Jyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXQucHVzaChlc2NhcGVIVE1MKGNoYW5nZS52YWx1ZSkpO1xuXG4gICAgICAgIGlmIChjaGFuZ2UuYWRkZWQpIHtcbiAgICAgICAgICByZXQucHVzaCgnPC9pbnM+Jyk7XG4gICAgICAgIH0gZWxzZSBpZiAoY2hhbmdlLnJlbW92ZWQpIHtcbiAgICAgICAgICByZXQucHVzaCgnPC9kZWw+Jyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXQuam9pbignJyk7XG4gICAgfSxcblxuICAgIC8vIFNlZTogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2dvb2dsZS1kaWZmLW1hdGNoLXBhdGNoL3dpa2kvQVBJXG4gICAgY29udmVydENoYW5nZXNUb0RNUDogZnVuY3Rpb24oY2hhbmdlcyl7XG4gICAgICB2YXIgcmV0ID0gW10sIGNoYW5nZTtcbiAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGNoYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2hhbmdlID0gY2hhbmdlc1tpXTtcbiAgICAgICAgcmV0LnB1c2goWyhjaGFuZ2UuYWRkZWQgPyAxIDogY2hhbmdlLnJlbW92ZWQgPyAtMSA6IDApLCBjaGFuZ2UudmFsdWVdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICB9O1xufSkoKTtcblxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBKc0RpZmY7XG59XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4hZnVuY3Rpb24oX2Upe3ZhciBlPWZ1bmN0aW9uKCl7cmV0dXJuIF9lKClbXCJkZWZhdWx0XCJdfTtpZihcIm9iamVjdFwiPT10eXBlb2YgZXhwb3J0cyltb2R1bGUuZXhwb3J0cz1lKCk7ZWxzZSBpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQpZGVmaW5lKGUpO2Vsc2V7dmFyIGY7XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz9mPXdpbmRvdzpcInVuZGVmaW5lZFwiIT10eXBlb2YgZ2xvYmFsP2Y9Z2xvYmFsOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmJiYoZj1zZWxmKSxmLiQ9ZSgpfX0oZnVuY3Rpb24oKXt2YXIgZGVmaW5lLG1vZHVsZSxleHBvcnRzO3JldHVybiAoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9hcGlcIjtcbnZhciBleHRlbmQgPSBfZGVyZXFfKCcuL3V0aWwnKS5leHRlbmQ7XG52YXIgYXBpID0ge30sXG4gICAgYXBpTm9kZUxpc3QgPSB7fSxcbiAgICAkID0ge307XG52YXIgYXJyYXkgPSBfZGVyZXFfKCcuL2FycmF5Jyk7XG52YXIgYXR0ciA9IF9kZXJlcV8oJy4vYXR0cicpO1xudmFyIGNsYXNzTmFtZSA9IF9kZXJlcV8oJy4vY2xhc3MnKTtcbnZhciBkb20gPSBfZGVyZXFfKCcuL2RvbScpO1xudmFyIGV2ZW50ID0gX2RlcmVxXygnLi9ldmVudCcpO1xudmFyIGh0bWwgPSBfZGVyZXFfKCcuL2h0bWwnKTtcbnZhciBzZWxlY3RvciA9IF9kZXJlcV8oJy4vc2VsZWN0b3InKTtcbmlmIChzZWxlY3RvciAhPT0gdW5kZWZpbmVkKSB7XG4gICQgPSBzZWxlY3Rvci4kO1xuICAkLm1hdGNoZXMgPSBzZWxlY3Rvci5tYXRjaGVzO1xuICBhcGkuZmluZCA9IHNlbGVjdG9yLmZpbmQ7XG59XG5leHRlbmQoJCk7XG52YXIgbm9jb25mbGljdCA9IF9kZXJlcV8oJy4vbm9jb25mbGljdCcpO1xuZXh0ZW5kKCQsIG5vY29uZmxpY3QpO1xuZXh0ZW5kKGFwaSwgYXJyYXksIGF0dHIsIGNsYXNzTmFtZSwgZG9tLCBldmVudCwgaHRtbCk7XG5leHRlbmQoYXBpTm9kZUxpc3QsIGFycmF5KTtcbiQudmVyc2lvbiA9ICcwLjcuMCc7XG4kLmV4dGVuZCA9IGV4dGVuZDtcbiQuZm4gPSBhcGk7XG4kLmZuTGlzdCA9IGFwaU5vZGVMaXN0O1xudmFyICRfX2RlZmF1bHQgPSAkO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGRlZmF1bHQ6ICRfX2RlZmF1bHQsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL2FycmF5XCI6MixcIi4vYXR0clwiOjMsXCIuL2NsYXNzXCI6NCxcIi4vZG9tXCI6NSxcIi4vZXZlbnRcIjo2LFwiLi9odG1sXCI6NyxcIi4vbm9jb25mbGljdFwiOjksXCIuL3NlbGVjdG9yXCI6MTAsXCIuL3V0aWxcIjoxMX1dLDI6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvYXJyYXlcIjtcbnZhciBfZWFjaCA9IF9kZXJlcV8oJy4vdXRpbCcpLmVhY2g7XG52YXIgJF9fMCA9IF9kZXJlcV8oJy4vc2VsZWN0b3InKSxcbiAgICAkID0gJF9fMC4kLFxuICAgIG1hdGNoZXMgPSAkX18wLm1hdGNoZXM7XG52YXIgQXJyYXlQcm90byA9IEFycmF5LnByb3RvdHlwZTtcbmZ1bmN0aW9uIGZpbHRlcihzZWxlY3Rvcikge1xuICB2YXIgY2FsbGJhY2sgPSB0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicgPyBzZWxlY3RvciA6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gbWF0Y2hlcyhlbGVtZW50LCBzZWxlY3Rvcik7XG4gIH07XG4gIHJldHVybiAkKEFycmF5UHJvdG8uZmlsdGVyLmNhbGwodGhpcywgY2FsbGJhY2spKTtcbn1cbmZ1bmN0aW9uIGVhY2goY2FsbGJhY2spIHtcbiAgcmV0dXJuIF9lYWNoKHRoaXMsIGNhbGxiYWNrKTtcbn1cbnZhciBmb3JFYWNoID0gZWFjaDtcbnZhciBtYXAgPSBBcnJheVByb3RvLm1hcDtcbmZ1bmN0aW9uIHJldmVyc2UoKSB7XG4gIHZhciBlbGVtZW50cyA9IEFycmF5UHJvdG8uc2xpY2UuY2FsbCh0aGlzKTtcbiAgcmV0dXJuICQoQXJyYXlQcm90by5yZXZlcnNlLmNhbGwoZWxlbWVudHMpKTtcbn1cbnZhciBldmVyeSA9IEFycmF5UHJvdG8uZXZlcnk7XG52YXIgc29tZSA9IEFycmF5UHJvdG8uc29tZTtcbnZhciBpbmRleE9mID0gQXJyYXlQcm90by5pbmRleE9mO1xuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGVhY2g6IGVhY2gsXG4gIGV2ZXJ5OiBldmVyeSxcbiAgZmlsdGVyOiBmaWx0ZXIsXG4gIGZvckVhY2g6IGZvckVhY2gsXG4gIGluZGV4T2Y6IGluZGV4T2YsXG4gIG1hcDogbWFwLFxuICByZXZlcnNlOiByZXZlcnNlLFxuICBzb21lOiBzb21lLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi9zZWxlY3RvclwiOjEwLFwiLi91dGlsXCI6MTF9XSwzOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL2F0dHJcIjtcbnZhciBlYWNoID0gX2RlcmVxXygnLi91dGlsJykuZWFjaDtcbmZ1bmN0aW9uIGF0dHIoa2V5LCB2YWx1ZSkge1xuICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgIHZhciBlbGVtZW50ID0gdGhpcy5ub2RlVHlwZSA/IHRoaXMgOiB0aGlzWzBdO1xuICAgIHJldHVybiBlbGVtZW50ID8gZWxlbWVudC5nZXRBdHRyaWJ1dGUoa2V5KSA6IHVuZGVmaW5lZDtcbiAgfVxuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGZvciAodmFyIGF0dHIgaW4ga2V5KSB7XG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKGF0dHIsIGtleVthdHRyXSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gcmVtb3ZlQXR0cihrZXkpIHtcbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGF0dHI6IGF0dHIsXG4gIHJlbW92ZUF0dHI6IHJlbW92ZUF0dHIsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL3V0aWxcIjoxMX1dLDQ6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvY2xhc3NcIjtcbnZhciAkX18wID0gX2RlcmVxXygnLi91dGlsJyksXG4gICAgbWFrZUl0ZXJhYmxlID0gJF9fMC5tYWtlSXRlcmFibGUsXG4gICAgZWFjaCA9ICRfXzAuZWFjaDtcbmZ1bmN0aW9uIGFkZENsYXNzKHZhbHVlKSB7XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCh2YWx1ZSk7XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIHJlbW92ZUNsYXNzKHZhbHVlKSB7XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSh2YWx1ZSk7XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIHRvZ2dsZUNsYXNzKHZhbHVlKSB7XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSh2YWx1ZSk7XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIGhhc0NsYXNzKHZhbHVlKSB7XG4gIHJldHVybiBtYWtlSXRlcmFibGUodGhpcykuc29tZShmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgcmV0dXJuIGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKHZhbHVlKTtcbiAgfSk7XG59XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWRkQ2xhc3M6IGFkZENsYXNzLFxuICByZW1vdmVDbGFzczogcmVtb3ZlQ2xhc3MsXG4gIHRvZ2dsZUNsYXNzOiB0b2dnbGVDbGFzcyxcbiAgaGFzQ2xhc3M6IGhhc0NsYXNzLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi91dGlsXCI6MTF9XSw1OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL2RvbVwiO1xudmFyIHRvQXJyYXkgPSBfZGVyZXFfKCcuL3V0aWwnKS50b0FycmF5O1xuZnVuY3Rpb24gYXBwZW5kKGVsZW1lbnQpIHtcbiAgaWYgKHRoaXMgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsIGVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBlbGVtZW50cyA9IGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlTGlzdCA/IHRvQXJyYXkoZWxlbWVudCkgOiBlbGVtZW50O1xuICAgICAgICBlbGVtZW50cy5mb3JFYWNoKHRoaXMuYXBwZW5kQ2hpbGQuYmluZCh0aGlzKSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgd2hpbGUgKGwtLSkge1xuICAgICAgdmFyIGVsbSA9IGwgPT09IDAgPyBlbGVtZW50IDogX2Nsb25lKGVsZW1lbnQpO1xuICAgICAgYXBwZW5kLmNhbGwodGhpc1tsXSwgZWxtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBwcmVwZW5kKGVsZW1lbnQpIHtcbiAgaWYgKHRoaXMgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyYmVnaW4nLCBlbGVtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAgIHRoaXMuaW5zZXJ0QmVmb3JlKGVsZW1lbnQsIHRoaXMuZmlyc3RDaGlsZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZWxlbWVudHMgPSBlbGVtZW50IGluc3RhbmNlb2YgTm9kZUxpc3QgPyB0b0FycmF5KGVsZW1lbnQpIDogZWxlbWVudDtcbiAgICAgICAgZWxlbWVudHMucmV2ZXJzZSgpLmZvckVhY2gocHJlcGVuZC5iaW5kKHRoaXMpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICB3aGlsZSAobC0tKSB7XG4gICAgICB2YXIgZWxtID0gbCA9PT0gMCA/IGVsZW1lbnQgOiBfY2xvbmUoZWxlbWVudCk7XG4gICAgICBwcmVwZW5kLmNhbGwodGhpc1tsXSwgZWxtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBiZWZvcmUoZWxlbWVudCkge1xuICBpZiAodGhpcyBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlYmVnaW4nLCBlbGVtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAgIHRoaXMucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWxlbWVudCwgdGhpcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZWxlbWVudHMgPSBlbGVtZW50IGluc3RhbmNlb2YgTm9kZUxpc3QgPyB0b0FycmF5KGVsZW1lbnQpIDogZWxlbWVudDtcbiAgICAgICAgZWxlbWVudHMuZm9yRWFjaChiZWZvcmUuYmluZCh0aGlzKSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgd2hpbGUgKGwtLSkge1xuICAgICAgdmFyIGVsbSA9IGwgPT09IDAgPyBlbGVtZW50IDogX2Nsb25lKGVsZW1lbnQpO1xuICAgICAgYmVmb3JlLmNhbGwodGhpc1tsXSwgZWxtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBhZnRlcihlbGVtZW50KSB7XG4gIGlmICh0aGlzIGluc3RhbmNlb2YgTm9kZSkge1xuICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRoaXMuaW5zZXJ0QWRqYWNlbnRIVE1MKCdhZnRlcmVuZCcsIGVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgdGhpcy5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbGVtZW50LCB0aGlzLm5leHRTaWJsaW5nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBlbGVtZW50cyA9IGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlTGlzdCA/IHRvQXJyYXkoZWxlbWVudCkgOiBlbGVtZW50O1xuICAgICAgICBlbGVtZW50cy5yZXZlcnNlKCkuZm9yRWFjaChhZnRlci5iaW5kKHRoaXMpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICB3aGlsZSAobC0tKSB7XG4gICAgICB2YXIgZWxtID0gbCA9PT0gMCA/IGVsZW1lbnQgOiBfY2xvbmUoZWxlbWVudCk7XG4gICAgICBhZnRlci5jYWxsKHRoaXNbbF0sIGVsbSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gY2xvbmUoKSB7XG4gIHJldHVybiAkKF9jbG9uZSh0aGlzKSk7XG59XG5mdW5jdGlvbiBfY2xvbmUoZWxlbWVudCkge1xuICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH0gZWxzZSBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICByZXR1cm4gZWxlbWVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gIH0gZWxzZSBpZiAoJ2xlbmd0aCcgaW4gZWxlbWVudCkge1xuICAgIHJldHVybiBbXS5tYXAuY2FsbChlbGVtZW50LCBmdW5jdGlvbihlbCkge1xuICAgICAgcmV0dXJuIGVsLmNsb25lTm9kZSh0cnVlKTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gZWxlbWVudDtcbn1cbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBhcHBlbmQ6IGFwcGVuZCxcbiAgcHJlcGVuZDogcHJlcGVuZCxcbiAgYmVmb3JlOiBiZWZvcmUsXG4gIGFmdGVyOiBhZnRlcixcbiAgY2xvbmU6IGNsb25lLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi91dGlsXCI6MTF9XSw2OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL2V2ZW50XCI7XG52YXIgJF9fMCA9IF9kZXJlcV8oJy4vdXRpbCcpLFxuICAgIGdsb2JhbCA9ICRfXzAuZ2xvYmFsLFxuICAgIGVhY2ggPSAkX18wLmVhY2g7XG52YXIgbWF0Y2hlcyA9IF9kZXJlcV8oJy4vc2VsZWN0b3InKS5tYXRjaGVzO1xuZnVuY3Rpb24gb24oZXZlbnROYW1lLCBzZWxlY3RvciwgaGFuZGxlciwgdXNlQ2FwdHVyZSkge1xuICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaGFuZGxlciA9IHNlbGVjdG9yO1xuICAgIHNlbGVjdG9yID0gbnVsbDtcbiAgfVxuICB2YXIgcGFydHMgPSBldmVudE5hbWUuc3BsaXQoJy4nKTtcbiAgZXZlbnROYW1lID0gcGFydHNbMF0gfHwgbnVsbDtcbiAgdmFyIG5hbWVzcGFjZSA9IHBhcnRzWzFdIHx8IG51bGw7XG4gIHZhciBldmVudExpc3RlbmVyID0gcHJveHlIYW5kbGVyKGhhbmRsZXIpO1xuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBpZiAoc2VsZWN0b3IpIHtcbiAgICAgIGV2ZW50TGlzdGVuZXIgPSBkZWxlZ2F0ZUhhbmRsZXIuYmluZChlbGVtZW50LCBzZWxlY3RvciwgaGFuZGxlcik7XG4gICAgfVxuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGV2ZW50TGlzdGVuZXIsIHVzZUNhcHR1cmUgfHwgZmFsc2UpO1xuICAgIGdldEhhbmRsZXJzKGVsZW1lbnQpLnB1c2goe1xuICAgICAgZXZlbnROYW1lOiBldmVudE5hbWUsXG4gICAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgICAgZXZlbnRMaXN0ZW5lcjogZXZlbnRMaXN0ZW5lcixcbiAgICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcbiAgICAgIG5hbWVzcGFjZTogbmFtZXNwYWNlXG4gICAgfSk7XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIG9mZihldmVudE5hbWUsIHNlbGVjdG9yLCBoYW5kbGVyLCB1c2VDYXB0dXJlKSB7XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICBoYW5kbGVyID0gc2VsZWN0b3I7XG4gICAgc2VsZWN0b3IgPSBudWxsO1xuICB9XG4gIGlmIChldmVudE5hbWUpIHtcbiAgICB2YXIgcGFydHMgPSBldmVudE5hbWUuc3BsaXQoJy4nKTtcbiAgICBldmVudE5hbWUgPSBwYXJ0c1swXTtcbiAgICB2YXIgbmFtZXNwYWNlID0gcGFydHNbMV07XG4gIH1cbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgdmFyIGhhbmRsZXJzID0gZ2V0SGFuZGxlcnMoZWxlbWVudCk7XG4gICAgaWYgKCFldmVudE5hbWUgJiYgIW5hbWVzcGFjZSAmJiAhc2VsZWN0b3IgJiYgIWhhbmRsZXIpIHtcbiAgICAgIGVhY2goaGFuZGxlcnMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGl0ZW0uZXZlbnROYW1lLCBpdGVtLmV2ZW50TGlzdGVuZXIsIHVzZUNhcHR1cmUgfHwgZmFsc2UpO1xuICAgICAgfSk7XG4gICAgICBjbGVhckhhbmRsZXJzKGVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlYWNoKGhhbmRsZXJzLmZpbHRlcihmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHJldHVybiAoKCFldmVudE5hbWUgfHwgaXRlbS5ldmVudE5hbWUgPT09IGV2ZW50TmFtZSkgJiYgKCFuYW1lc3BhY2UgfHwgaXRlbS5uYW1lc3BhY2UgPT09IG5hbWVzcGFjZSkgJiYgKCFoYW5kbGVyIHx8IGl0ZW0uaGFuZGxlciA9PT0gaGFuZGxlcikgJiYgKCFzZWxlY3RvciB8fCBpdGVtLnNlbGVjdG9yID09PSBzZWxlY3RvcikpO1xuICAgICAgfSksIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGl0ZW0uZXZlbnROYW1lLCBpdGVtLmV2ZW50TGlzdGVuZXIsIHVzZUNhcHR1cmUgfHwgZmFsc2UpO1xuICAgICAgICBoYW5kbGVycy5zcGxpY2UoaGFuZGxlcnMuaW5kZXhPZihpdGVtKSwgMSk7XG4gICAgICB9KTtcbiAgICAgIGlmIChoYW5kbGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY2xlYXJIYW5kbGVycyhlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIGRlbGVnYXRlKHNlbGVjdG9yLCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgcmV0dXJuIG9uLmNhbGwodGhpcywgZXZlbnROYW1lLCBzZWxlY3RvciwgaGFuZGxlcik7XG59XG5mdW5jdGlvbiB1bmRlbGVnYXRlKHNlbGVjdG9yLCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgcmV0dXJuIG9mZi5jYWxsKHRoaXMsIGV2ZW50TmFtZSwgc2VsZWN0b3IsIGhhbmRsZXIpO1xufVxuZnVuY3Rpb24gdHJpZ2dlcih0eXBlKSB7XG4gIHZhciBwYXJhbXMgPSBhcmd1bWVudHNbMl0gIT09ICh2b2lkIDApID8gYXJndW1lbnRzWzJdIDoge307XG4gIHBhcmFtcy5idWJibGVzID0gdHlwZW9mIHBhcmFtcy5idWJibGVzID09PSAnYm9vbGVhbicgPyBwYXJhbXMuYnViYmxlcyA6IHRydWU7XG4gIHBhcmFtcy5jYW5jZWxhYmxlID0gdHlwZW9mIHBhcmFtcy5jYW5jZWxhYmxlID09PSAnYm9vbGVhbicgPyBwYXJhbXMuY2FuY2VsYWJsZSA6IHRydWU7XG4gIHBhcmFtcy5wcmV2ZW50RGVmYXVsdCA9IHR5cGVvZiBwYXJhbXMucHJldmVudERlZmF1bHQgPT09ICdib29sZWFuJyA/IHBhcmFtcy5wcmV2ZW50RGVmYXVsdCA6IGZhbHNlO1xuICBwYXJhbXMuZGV0YWlsID0gZGF0YTtcbiAgdmFyIGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KHR5cGUsIHBhcmFtcyk7XG4gIGV2ZW50Ll9wcmV2ZW50RGVmYXVsdCA9IHBhcmFtcy5wcmV2ZW50RGVmYXVsdDtcbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgaWYgKCFwYXJhbXMuYnViYmxlcyB8fCBpc0V2ZW50QnViYmxpbmdJbkRldGFjaGVkVHJlZSB8fCBpc0F0dGFjaGVkVG9Eb2N1bWVudChlbGVtZW50KSkge1xuICAgICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHJpZ2dlckZvclBhdGgoZWxlbWVudCwgdHlwZSwgcGFyYW1zKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIHRyaWdnZXJIYW5kbGVyKHR5cGUpIHtcbiAgaWYgKHRoaXNbMF0pIHtcbiAgICB0cmlnZ2VyLmNhbGwodGhpc1swXSwgdHlwZSwge1xuICAgICAgYnViYmxlczogZmFsc2UsXG4gICAgICBwcmV2ZW50RGVmYXVsdDogdHJ1ZVxuICAgIH0pO1xuICB9XG59XG5mdW5jdGlvbiByZWFkeShoYW5kbGVyKSB7XG4gIGlmICgvY29tcGxldGV8bG9hZGVkfGludGVyYWN0aXZlLy50ZXN0KGRvY3VtZW50LnJlYWR5U3RhdGUpICYmIGRvY3VtZW50LmJvZHkpIHtcbiAgICBoYW5kbGVyKCk7XG4gIH0gZWxzZSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGhhbmRsZXIsIGZhbHNlKTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIGlzQXR0YWNoZWRUb0RvY3VtZW50KGVsZW1lbnQpIHtcbiAgaWYgKGVsZW1lbnQgPT09IHdpbmRvdyB8fCBlbGVtZW50ID09PSBkb2N1bWVudCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHZhciBjb250YWluZXIgPSBlbGVtZW50Lm93bmVyRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICBpZiAoY29udGFpbmVyLmNvbnRhaW5zKSB7XG4gICAgcmV0dXJuIGNvbnRhaW5lci5jb250YWlucyhlbGVtZW50KTtcbiAgfSBlbHNlIGlmIChjb250YWluZXIuY29tcGFyZURvY3VtZW50UG9zaXRpb24pIHtcbiAgICByZXR1cm4gIShjb250YWluZXIuY29tcGFyZURvY3VtZW50UG9zaXRpb24oZWxlbWVudCkgJiBOb2RlLkRPQ1VNRU5UX1BPU0lUSU9OX0RJU0NPTk5FQ1RFRCk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gdHJpZ2dlckZvclBhdGgoZWxlbWVudCwgdHlwZSkge1xuICB2YXIgcGFyYW1zID0gYXJndW1lbnRzWzJdICE9PSAodm9pZCAwKSA/IGFyZ3VtZW50c1syXSA6IHt9O1xuICBwYXJhbXMuYnViYmxlcyA9IGZhbHNlO1xuICB2YXIgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQodHlwZSwgcGFyYW1zKTtcbiAgZXZlbnQuX3RhcmdldCA9IGVsZW1lbnQ7XG4gIGRvIHtcbiAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICB9IHdoaWxlIChlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlKTtcbn1cbnZhciBldmVudEtleVByb3AgPSAnX19kb210YXN0aWNfZXZlbnRfXyc7XG52YXIgaWQgPSAxO1xudmFyIGhhbmRsZXJzID0ge307XG52YXIgdW51c2VkS2V5cyA9IFtdO1xuZnVuY3Rpb24gZ2V0SGFuZGxlcnMoZWxlbWVudCkge1xuICBpZiAoIWVsZW1lbnRbZXZlbnRLZXlQcm9wXSkge1xuICAgIGVsZW1lbnRbZXZlbnRLZXlQcm9wXSA9IHVudXNlZEtleXMubGVuZ3RoID09PSAwID8gKytpZCA6IHVudXNlZEtleXMucG9wKCk7XG4gIH1cbiAgdmFyIGtleSA9IGVsZW1lbnRbZXZlbnRLZXlQcm9wXTtcbiAgcmV0dXJuIGhhbmRsZXJzW2tleV0gfHwgKGhhbmRsZXJzW2tleV0gPSBbXSk7XG59XG5mdW5jdGlvbiBjbGVhckhhbmRsZXJzKGVsZW1lbnQpIHtcbiAgdmFyIGtleSA9IGVsZW1lbnRbZXZlbnRLZXlQcm9wXTtcbiAgaWYgKGhhbmRsZXJzW2tleV0pIHtcbiAgICBoYW5kbGVyc1trZXldID0gbnVsbDtcbiAgICBlbGVtZW50W2tleV0gPSBudWxsO1xuICAgIHVudXNlZEtleXMucHVzaChrZXkpO1xuICB9XG59XG5mdW5jdGlvbiBwcm94eUhhbmRsZXIoaGFuZGxlcikge1xuICByZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBoYW5kbGVyKGF1Z21lbnRFdmVudChldmVudCksIGV2ZW50LmRldGFpbCk7XG4gIH07XG59XG52YXIgYXVnbWVudEV2ZW50ID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgZXZlbnRNZXRob2RzID0ge1xuICAgIHByZXZlbnREZWZhdWx0OiAnaXNEZWZhdWx0UHJldmVudGVkJyxcbiAgICBzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb246ICdpc0ltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZCcsXG4gICAgc3RvcFByb3BhZ2F0aW9uOiAnaXNQcm9wYWdhdGlvblN0b3BwZWQnXG4gIH0sXG4gICAgICBub29wID0gKGZ1bmN0aW9uKCkge30pLFxuICAgICAgcmV0dXJuVHJ1ZSA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KSxcbiAgICAgIHJldHVybkZhbHNlID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KTtcbiAgcmV0dXJuIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgZm9yICh2YXIgbWV0aG9kTmFtZSBpbiBldmVudE1ldGhvZHMpIHtcbiAgICAgIChmdW5jdGlvbihtZXRob2ROYW1lLCB0ZXN0TWV0aG9kTmFtZSwgb3JpZ2luYWxNZXRob2QpIHtcbiAgICAgICAgZXZlbnRbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB0aGlzW3Rlc3RNZXRob2ROYW1lXSA9IHJldHVyblRydWU7XG4gICAgICAgICAgcmV0dXJuIG9yaWdpbmFsTWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIGV2ZW50W3Rlc3RNZXRob2ROYW1lXSA9IHJldHVybkZhbHNlO1xuICAgICAgfShtZXRob2ROYW1lLCBldmVudE1ldGhvZHNbbWV0aG9kTmFtZV0sIGV2ZW50W21ldGhvZE5hbWVdIHx8IG5vb3ApKTtcbiAgICB9XG4gICAgaWYgKGV2ZW50Ll9wcmV2ZW50RGVmYXVsdCkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gICAgcmV0dXJuIGV2ZW50O1xuICB9O1xufSkoKTtcbmZ1bmN0aW9uIGRlbGVnYXRlSGFuZGxlcihzZWxlY3RvciwgaGFuZGxlciwgZXZlbnQpIHtcbiAgdmFyIGV2ZW50VGFyZ2V0ID0gZXZlbnQuX3RhcmdldCB8fCBldmVudC50YXJnZXQ7XG4gIGlmIChtYXRjaGVzKGV2ZW50VGFyZ2V0LCBzZWxlY3RvcikpIHtcbiAgICBpZiAoIWV2ZW50LmN1cnJlbnRUYXJnZXQpIHtcbiAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQgPSBldmVudFRhcmdldDtcbiAgICB9XG4gICAgaGFuZGxlci5jYWxsKGV2ZW50VGFyZ2V0LCBldmVudCk7XG4gIH1cbn1cbihmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gQ3VzdG9tRXZlbnQoZXZlbnQpIHtcbiAgICB2YXIgcGFyYW1zID0gYXJndW1lbnRzWzFdICE9PSAodm9pZCAwKSA/IGFyZ3VtZW50c1sxXSA6IHtcbiAgICAgIGJ1YmJsZXM6IGZhbHNlLFxuICAgICAgY2FuY2VsYWJsZTogZmFsc2UsXG4gICAgICBkZXRhaWw6IHVuZGVmaW5lZFxuICAgIH07XG4gICAgdmFyIGN1c3RvbUV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gICAgY3VzdG9tRXZlbnQuaW5pdEN1c3RvbUV2ZW50KGV2ZW50LCBwYXJhbXMuYnViYmxlcywgcGFyYW1zLmNhbmNlbGFibGUsIHBhcmFtcy5kZXRhaWwpO1xuICAgIHJldHVybiBjdXN0b21FdmVudDtcbiAgfVxuICBDdXN0b21FdmVudC5wcm90b3R5cGUgPSBnbG9iYWwuQ3VzdG9tRXZlbnQgJiYgZ2xvYmFsLkN1c3RvbUV2ZW50LnByb3RvdHlwZTtcbiAgZ2xvYmFsLkN1c3RvbUV2ZW50ID0gQ3VzdG9tRXZlbnQ7XG59KSgpO1xudmFyIGlzRXZlbnRCdWJibGluZ0luRGV0YWNoZWRUcmVlID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgaXNCdWJibGluZyA9IGZhbHNlLFxuICAgICAgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xuICBpZiAoZG9jKSB7XG4gICAgdmFyIHBhcmVudCA9IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgY2hpbGQgPSBwYXJlbnQuY2xvbmVOb2RlKCk7XG4gICAgcGFyZW50LmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgICBwYXJlbnQuYWRkRXZlbnRMaXN0ZW5lcignZScsIGZ1bmN0aW9uKCkge1xuICAgICAgaXNCdWJibGluZyA9IHRydWU7XG4gICAgfSk7XG4gICAgY2hpbGQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ2UnLCB7YnViYmxlczogdHJ1ZX0pKTtcbiAgfVxuICByZXR1cm4gaXNCdWJibGluZztcbn0pKCk7XG52YXIgYmluZCA9IG9uLFxuICAgIHVuYmluZCA9IG9mZjtcbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBvbjogb24sXG4gIG9mZjogb2ZmLFxuICBkZWxlZ2F0ZTogZGVsZWdhdGUsXG4gIHVuZGVsZWdhdGU6IHVuZGVsZWdhdGUsXG4gIHRyaWdnZXI6IHRyaWdnZXIsXG4gIHRyaWdnZXJIYW5kbGVyOiB0cmlnZ2VySGFuZGxlcixcbiAgcmVhZHk6IHJlYWR5LFxuICBiaW5kOiBiaW5kLFxuICB1bmJpbmQ6IHVuYmluZCxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vc2VsZWN0b3JcIjoxMCxcIi4vdXRpbFwiOjExfV0sNzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9odG1sXCI7XG52YXIgZWFjaCA9IF9kZXJlcV8oJy4vdXRpbCcpLmVhY2g7XG5mdW5jdGlvbiBodG1sKGZyYWdtZW50KSB7XG4gIGlmICh0eXBlb2YgZnJhZ21lbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgdmFyIGVsZW1lbnQgPSB0aGlzLm5vZGVUeXBlID8gdGhpcyA6IHRoaXNbMF07XG4gICAgcmV0dXJuIGVsZW1lbnQgPyBlbGVtZW50LmlubmVySFRNTCA6IHVuZGVmaW5lZDtcbiAgfVxuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LmlubmVySFRNTCA9IGZyYWdtZW50O1xuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaHRtbDogaHRtbCxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vdXRpbFwiOjExfV0sODpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9pbmRleFwiO1xudmFyICQgPSBfZGVyZXFfKCcuL2FwaScpLmRlZmF1bHQ7XG52YXIgJF9fZGVmYXVsdCA9ICQ7XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZGVmYXVsdDogJF9fZGVmYXVsdCxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vYXBpXCI6MX1dLDk6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvbm9jb25mbGljdFwiO1xudmFyIGdsb2JhbCA9IF9kZXJlcV8oJy4vdXRpbCcpLmdsb2JhbDtcbnZhciBwcmV2aW91c0xpYiA9IGdsb2JhbC4kO1xuZnVuY3Rpb24gbm9Db25mbGljdCgpIHtcbiAgZ2xvYmFsLiQgPSBwcmV2aW91c0xpYjtcbiAgcmV0dXJuIHRoaXM7XG59XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbm9Db25mbGljdDogbm9Db25mbGljdCxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vdXRpbFwiOjExfV0sMTA6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvc2VsZWN0b3JcIjtcbnZhciAkX18wID0gX2RlcmVxXygnLi91dGlsJyksXG4gICAgZ2xvYmFsID0gJF9fMC5nbG9iYWwsXG4gICAgbWFrZUl0ZXJhYmxlID0gJF9fMC5tYWtlSXRlcmFibGU7XG52YXIgc2xpY2UgPSBbXS5zbGljZSxcbiAgICBpc1Byb3RvdHlwZVNldCA9IGZhbHNlLFxuICAgIHJlRnJhZ21lbnQgPSAvXlxccyo8KFxcdyt8ISlbXj5dKj4vLFxuICAgIHJlU2luZ2xlVGFnID0gL148KFxcdyspXFxzKlxcLz8+KD86PFxcL1xcMT58KSQvLFxuICAgIHJlU2ltcGxlU2VsZWN0b3IgPSAvXltcXC4jXT9bXFx3LV0qJC87XG5mdW5jdGlvbiAkKHNlbGVjdG9yKSB7XG4gIHZhciBjb250ZXh0ID0gYXJndW1lbnRzWzFdICE9PSAodm9pZCAwKSA/IGFyZ3VtZW50c1sxXSA6IGRvY3VtZW50O1xuICB2YXIgY29sbGVjdGlvbjtcbiAgaWYgKCFzZWxlY3Rvcikge1xuICAgIGNvbGxlY3Rpb24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKG51bGwpO1xuICB9IGVsc2UgaWYgKHNlbGVjdG9yIGluc3RhbmNlb2YgV3JhcHBlcikge1xuICAgIHJldHVybiBzZWxlY3RvcjtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygc2VsZWN0b3IgIT09ICdzdHJpbmcnKSB7XG4gICAgY29sbGVjdGlvbiA9IG1ha2VJdGVyYWJsZShzZWxlY3Rvcik7XG4gIH0gZWxzZSBpZiAocmVGcmFnbWVudC50ZXN0KHNlbGVjdG9yKSkge1xuICAgIGNvbGxlY3Rpb24gPSBjcmVhdGVGcmFnbWVudChzZWxlY3Rvcik7XG4gIH0gZWxzZSB7XG4gICAgY29udGV4dCA9IHR5cGVvZiBjb250ZXh0ID09PSAnc3RyaW5nJyA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY29udGV4dCkgOiBjb250ZXh0Lmxlbmd0aCA/IGNvbnRleHRbMF0gOiBjb250ZXh0O1xuICAgIGNvbGxlY3Rpb24gPSBxdWVyeVNlbGVjdG9yKHNlbGVjdG9yLCBjb250ZXh0KTtcbiAgfVxuICByZXR1cm4gJC5pc05hdGl2ZSA/IGNvbGxlY3Rpb24gOiB3cmFwKGNvbGxlY3Rpb24pO1xufVxuZnVuY3Rpb24gZmluZChzZWxlY3Rvcikge1xuICByZXR1cm4gJChzZWxlY3RvciwgdGhpcyk7XG59XG52YXIgbWF0Y2hlcyA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGNvbnRleHQgPSB0eXBlb2YgRWxlbWVudCAhPT0gJ3VuZGVmaW5lZCcgPyBFbGVtZW50LnByb3RvdHlwZSA6IGdsb2JhbCxcbiAgICAgIF9tYXRjaGVzID0gY29udGV4dC5tYXRjaGVzIHx8IGNvbnRleHQubWF0Y2hlc1NlbGVjdG9yIHx8IGNvbnRleHQubW96TWF0Y2hlc1NlbGVjdG9yIHx8IGNvbnRleHQud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8IGNvbnRleHQubXNNYXRjaGVzU2VsZWN0b3IgfHwgY29udGV4dC5vTWF0Y2hlc1NlbGVjdG9yO1xuICByZXR1cm4gZnVuY3Rpb24oZWxlbWVudCwgc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gX21hdGNoZXMuY2FsbChlbGVtZW50LCBzZWxlY3Rvcik7XG4gIH07XG59KSgpO1xuZnVuY3Rpb24gcXVlcnlTZWxlY3RvcihzZWxlY3RvciwgY29udGV4dCkge1xuICB2YXIgaXNTaW1wbGVTZWxlY3RvciA9IHJlU2ltcGxlU2VsZWN0b3IudGVzdChzZWxlY3Rvcik7XG4gIGlmIChpc1NpbXBsZVNlbGVjdG9yICYmICEkLmlzTmF0aXZlKSB7XG4gICAgaWYgKHNlbGVjdG9yWzBdID09PSAnIycpIHtcbiAgICAgIHZhciBlbGVtZW50ID0gKGNvbnRleHQuZ2V0RWxlbWVudEJ5SWQgPyBjb250ZXh0IDogZG9jdW1lbnQpLmdldEVsZW1lbnRCeUlkKHNlbGVjdG9yLnNsaWNlKDEpKTtcbiAgICAgIHJldHVybiBlbGVtZW50ID8gW2VsZW1lbnRdIDogW107XG4gICAgfVxuICAgIGlmIChzZWxlY3RvclswXSA9PT0gJy4nKSB7XG4gICAgICByZXR1cm4gY29udGV4dC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKHNlbGVjdG9yLnNsaWNlKDEpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRleHQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoc2VsZWN0b3IpO1xuICB9XG4gIHJldHVybiBjb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xufVxuZnVuY3Rpb24gY3JlYXRlRnJhZ21lbnQoaHRtbCkge1xuICBpZiAocmVTaW5nbGVUYWcudGVzdChodG1sKSkge1xuICAgIHJldHVybiBbZG9jdW1lbnQuY3JlYXRlRWxlbWVudChSZWdFeHAuJDEpXTtcbiAgfVxuICB2YXIgZWxlbWVudHMgPSBbXSxcbiAgICAgIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuICAgICAgY2hpbGRyZW4gPSBjb250YWluZXIuY2hpbGROb2RlcztcbiAgY29udGFpbmVyLmlubmVySFRNTCA9IGh0bWw7XG4gIGZvciAodmFyIGkgPSAwLFxuICAgICAgbCA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGVsZW1lbnRzLnB1c2goY2hpbGRyZW5baV0pO1xuICB9XG4gIHJldHVybiBlbGVtZW50cztcbn1cbmZ1bmN0aW9uIHdyYXAoY29sbGVjdGlvbikge1xuICBpZiAoIWlzUHJvdG90eXBlU2V0KSB7XG4gICAgV3JhcHBlci5wcm90b3R5cGUgPSAkLmZuO1xuICAgIFdyYXBwZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gV3JhcHBlcjtcbiAgICBpc1Byb3RvdHlwZVNldCA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIG5ldyBXcmFwcGVyKGNvbGxlY3Rpb24pO1xufVxuZnVuY3Rpb24gV3JhcHBlcihjb2xsZWN0aW9uKSB7XG4gIHZhciBpID0gMCxcbiAgICAgIGxlbmd0aCA9IGNvbGxlY3Rpb24ubGVuZ3RoO1xuICBmb3IgKDsgaSA8IGxlbmd0aDsgKSB7XG4gICAgdGhpc1tpXSA9IGNvbGxlY3Rpb25baSsrXTtcbiAgfVxuICB0aGlzLmxlbmd0aCA9IGxlbmd0aDtcbn1cbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICAkOiAkLFxuICBmaW5kOiBmaW5kLFxuICBtYXRjaGVzOiBtYXRjaGVzLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi91dGlsXCI6MTF9XSwxMTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy91dGlsXCI7XG52YXIgZ2xvYmFsID0gbmV3IEZ1bmN0aW9uKFwicmV0dXJuIHRoaXNcIikoKSxcbiAgICBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciB0b0FycmF5ID0gKGZ1bmN0aW9uKGNvbGxlY3Rpb24pIHtcbiAgcmV0dXJuIHNsaWNlLmNhbGwoY29sbGVjdGlvbik7XG59KTtcbnZhciBtYWtlSXRlcmFibGUgPSAoZnVuY3Rpb24oZWxlbWVudCkge1xuICByZXR1cm4gZWxlbWVudC5ub2RlVHlwZSB8fCBlbGVtZW50ID09PSB3aW5kb3cgPyBbZWxlbWVudF0gOiBlbGVtZW50O1xufSk7XG5mdW5jdGlvbiBlYWNoKGNvbGxlY3Rpb24sIGNhbGxiYWNrKSB7XG4gIHZhciBsZW5ndGggPSBjb2xsZWN0aW9uLmxlbmd0aDtcbiAgaWYgKGxlbmd0aCAhPT0gdW5kZWZpbmVkICYmIGNvbGxlY3Rpb24ubm9kZVR5cGUgPT09IHVuZGVmaW5lZCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGNhbGxiYWNrKGNvbGxlY3Rpb25baV0sIGksIGNvbGxlY3Rpb24pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjYWxsYmFjayhjb2xsZWN0aW9uLCAwLCBjb2xsZWN0aW9uKTtcbiAgfVxuICByZXR1cm4gY29sbGVjdGlvbjtcbn1cbmZ1bmN0aW9uIGV4dGVuZCh0YXJnZXQpIHtcbiAgZm9yICh2YXIgc291cmNlcyA9IFtdLFxuICAgICAgJF9fMCA9IDE7ICRfXzAgPCBhcmd1bWVudHMubGVuZ3RoOyAkX18wKyspXG4gICAgc291cmNlc1skX18wIC0gMV0gPSBhcmd1bWVudHNbJF9fMF07XG4gIHNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbihzcmMpIHtcbiAgICBpZiAoc3JjKSB7XG4gICAgICBmb3IgKHZhciBwcm9wIGluIHNyYykge1xuICAgICAgICB0YXJnZXRbcHJvcF0gPSBzcmNbcHJvcF07XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHRhcmdldDtcbn1cbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBnbG9iYWw6IGdsb2JhbCxcbiAgdG9BcnJheTogdG9BcnJheSxcbiAgbWFrZUl0ZXJhYmxlOiBtYWtlSXRlcmFibGUsXG4gIGVhY2g6IGVhY2gsXG4gIGV4dGVuZDogZXh0ZW5kLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se31dfSx7fSxbOF0pXG4oOClcbn0pO1xufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCJ2YXIgb2JqICAgICA9IHJlcXVpcmUoJy4vbW9kdWxlcy9vYmonKVxuLCAgIGV2ZW50cyAgPSByZXF1aXJlKCcuL21vZHVsZXMvZXZlbnRzJylcbiwgICBjb250ZW50ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2NvbnRlbnQnKTtcblxuY29udGVudC5pbml0KCk7XG5vYmouaW5pdCgpO1xuZXZlbnRzKCk7XG5cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyICQgPSB3aW5kb3cualF1ZXJ5IHx8IHJlcXVpcmUoJ2RvbXRhc3RpYycpO1xuXG52YXIgJGJvZHkgICAgICA9ICQoJ2JvZHknKSxcbiAgICBpc09yaWdpbmFsID0gdHJ1ZTtcblxudmFyIGNvbnRlbnQgPSB7XG5cbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMud3JhcENvbnRlbnQoKTtcbiAgfSxcblxuICB3cmFwQ29udGVudDogZnVuY3Rpb24oKSB7XG4gICAgJGJvZHkuaHRtbCgnPGRpdiBpZD1cIm5pY2UtY29udGVudFwiPicgKyAkYm9keS5odG1sKCkgKyAnPC9kaXY+Jyk7XG4gICAgdGhpcy5vcmlnaW5hbEhUTUwgPSB0aGlzLmN1cnJlbnRIVE1MID0gdGhpcy5nZXRIVE1MKCk7XG4gICAgcmV0dXJuIHRoaXMubWFrZUVkaXRhYmxlKCRib2R5KTtcbiAgfSxcblxuICBtYWtlRWRpdGFibGU6IGZ1bmN0aW9uKGVsKSB7XG4gICAgcmV0dXJuIGVsLmF0dHIoJ2NvbnRlbnRlZGl0YWJsZScsIHRydWUpO1xuICB9LFxuXG4gIHJlbW92ZU5pY2U6IGZ1bmN0aW9uKCkge1xuICAgICRib2R5XG4gICAgICAuaHRtbCgkKCcjbmljZS1jb250ZW50JykuaHRtbCgpKVxuICAgICAgLnJlbW92ZUF0dHIoJ2NvbnRlbnRlZGl0YWJsZScpO1xuICB9LFxuXG4gIGdldEhUTUw6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkKCcjbmljZS1jb250ZW50JykuaHRtbCgpO1xuICB9LFxuXG4gIHNldEhUTUw6IGZ1bmN0aW9uKGh0bWwpIHtcbiAgICByZXR1cm4gJCgnI25pY2UtY29udGVudCcpLmh0bWwoaHRtbCk7XG4gIH0sXG5cbiAgdG9nZ2xlSFRNTDogZnVuY3Rpb24oKSB7XG5cbiAgICBpc09yaWdpbmFsID0gdGhpcy5nZXRIVE1MKCkgPT09IHRoaXMub3JpZ2luYWxIVE1MID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgaWYgKCFpc09yaWdpbmFsKSB7XG4gICAgICB0aGlzLmN1cnJlbnRIVE1MID0gdGhpcy5nZXRIVE1MKCk7XG4gICAgfVxuXG4gICAgdmFyIGh0bWwgPSBpc09yaWdpbmFsID8gdGhpcy5jdXJyZW50SFRNTCA6IHRoaXMub3JpZ2luYWxIVE1MO1xuXG4gICAgdGhpcy5zZXRIVE1MKGh0bWwpO1xuXG4gIH0sXG5cbiAgb3JpZ2luYWxIVE1MOiAnJyxcblxuICBjdXJyZW50SFRNTDogJydcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjb250ZW50O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgJCA9IHdpbmRvdy5qUXVleSB8fCByZXF1aXJlKCdkb210YXN0aWMnKVxuLCAgIGpzZGlmZiA9IHJlcXVpcmUoJ2RpZmYnKVxuLCAgIGNvbnRlbnQgPSByZXF1aXJlKCcuL2NvbnRlbnQnKTtcblxudmFyIGRpZmZPYmogPSB7XG5cbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRpZmYgPSBqc2RpZmYuZGlmZkxpbmVzKGNvbnRlbnQub3JpZ2luYWxIVE1MLCBjb250ZW50LmdldEhUTUwoKSk7XG4gICAgdGhpcy5wb3B1bGF0ZURpZmYoZGlmZik7XG4gIH0sXG5cbiAgcG9wdWxhdGVEaWZmOiBmdW5jdGlvbihkaWZmKSB7XG4gICAgdmFyICRwcmUgPSAkKCcjbmljZS1wcmUnKS5odG1sKCcnKVxuICAgICwgICBjb2xvclxuICAgICwgICBzcGFuO1xuXG5cbiAgICBkaWZmLmZvckVhY2goZnVuY3Rpb24ocGFydCkge1xuICAgICAgaWYgKHBhcnQuYWRkZWQgfHwgcGFydC5yZW1vdmVkKSB7XG4gICAgICAgIGNvbG9yID0gcGFydC5hZGRlZCA/ICdncmVlbicgOiBwYXJ0LnJlbW92ZWQgPyAncmVkJyA6ICdncmV5JztcbiAgICAgICAgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgc3Bhbi5zdHlsZS5jb2xvciA9IGNvbG9yO1xuICAgICAgICBzcGFuLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHBhcnQudmFsdWUpKTtcbiAgICAgICAgJHByZS5hcHBlbmQoc3Bhbik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBkaWZmT2JqO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgJCAgICAgICA9IHdpbmRvdy5qUXVlcnkgfHwgcmVxdWlyZSgnZG9tdGFzdGljJylcbiwgICBkaWZmICAgID0gcmVxdWlyZSgnLi9kaWZmJylcbiwgICBjb250ZW50ID0gcmVxdWlyZSgnLi9jb250ZW50Jyk7XG5cbnZhciBldmVudHMgPSBmdW5jdGlvbigpIHtcblxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnI25pY2UtbmF2JywgZnVuY3Rpb24oKSB7XG4gICAgJCh0aGlzKS50b2dnbGVDbGFzcygnaXMtbWluJyk7XG4gIH0pO1xuXG4gICQoJyNuaWNlLW9mZicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29udGVudC5yZW1vdmVOaWNlKCk7XG4gIH0pO1xuXG4gICQoJyNuaWNlLWRpZmYnKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGRpZmYuaW5pdCgpO1xuICB9KTtcblxuICAkKCcjbmljZS10b2dnbGUnKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnRlbnQudG9nZ2xlSFRNTCgpO1xuICAgIC8vIHdpbmRvdy5jb25zb2xlLmxvZyhjb250ZW50Lm9yaWdpbmFsSFRNTCk7XG4gIH0pO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV2ZW50cztcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG9ialRlbXBsYXRlID0gcmVxdWlyZSgnLi90ZW1wbGF0ZScpO1xuXG52YXIgYm9keSA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbIDAgXTtcbnZhciBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVsgMCBdO1xuXG52YXIgbmF2ID0ge1xuXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY3JlYXRlT2JqKCk7XG4gICAgdGhpcy5zdHlsZSgpO1xuICB9LFxuXG4gIGNyZWF0ZU9iajogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRpdi5zZXRBdHRyaWJ1dGUoJ2lkJywgJ25pY2Utb2JqJyk7XG4gICAgZGl2LnNldEF0dHJpYnV0ZSgnY29udGVudGVkaXRhYmxlJywgZmFsc2UpO1xuICAgIGRpdi5pbm5lckhUTUwgPSBvYmpUZW1wbGF0ZTtcbiAgICB0aGlzLmFwcGVuZChkaXYpO1xuICB9LFxuXG4gIHN0eWxlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcbiAgICBsaW5rLnNldEF0dHJpYnV0ZSgncmVsJywnc3R5bGVzaGVldCcpO1xuICAgIGxpbmsuc2V0QXR0cmlidXRlKCdocmVmJywnaW5kZXguY3NzJyk7XG4gICAgbGluay5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCd0ZXh0L2NzcycpO1xuICAgIGhlYWQuYXBwZW5kQ2hpbGQobGluayk7XG4gIH0sXG5cbiAgYXBwZW5kOiBmdW5jdGlvbihkaXYpIHtcbiAgICBib2R5LmFwcGVuZENoaWxkKGRpdik7XG4gIH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBuYXY7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIHNldCBvYmpUZW1wbGF0ZVxudmFyIG9ialRlbXBsYXRlID0gJzx1bCBpZD1cIm5pY2UtbmF2XCI+JztcbiAgICBvYmpUZW1wbGF0ZSArPSAnPGxpIGlkPVwibmljZS10aXRsZVwiIHRpdGxlPVwiR28gVG8gSG9tZXBhZ2VcIj5OSUNFPC9saT4nO1xuICAgIG9ialRlbXBsYXRlICs9ICc8bGkgaWQ9XCJuaWNlLW9mZlwiIHRpdGxlPVwiVHVybiBvZmYgTklDRVwiPjwvbGk+JztcbiAgICBvYmpUZW1wbGF0ZSArPSAnPGxpIGlkPVwibmljZS1kaWZmXCIgdGl0bGU9XCJTZWUgRGlmZlwiPjwvbGk+JztcbiAgICBvYmpUZW1wbGF0ZSArPSAnPGxpIGlkPVwibmljZS10b2dnbGVcIiB0aXRsZT1cIlRvZ2dsZSBPcmlnaW5hbFwiPjwvbGk+JztcbiAgICBvYmpUZW1wbGF0ZSArPSAnPC91bD4nO1xuICAgIG9ialRlbXBsYXRlICs9ICc8cHJlIGlkPVwibmljZS1wcmVcIj48L3ByZT4nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG9ialRlbXBsYXRlO1xuIl19

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
var data = _dereq_('./data');
var dom = _dereq_('./dom');
var dom_extra = _dereq_('./dom_extra');
var event = _dereq_('./event');
var html = _dereq_('./html');
var selector = _dereq_('./selector');
var selector_extra = _dereq_('./selector_extra');
if (selector !== undefined) {
  $ = selector.$;
  $.matches = selector.matches;
  api.find = selector.find;
}
var mode = _dereq_('./mode');
extend($, mode);
var noconflict = _dereq_('./noconflict');
extend($, noconflict);
extend(api, array, attr, className, data, dom, dom_extra, event, html, selector_extra);
extend(apiNodeList, array);
$.version = '0.7.1';
$.extend = extend;
$.fn = api;
$.fnList = apiNodeList;
var $__default = $;
module.exports = {
  default: $__default,
  __esModule: true
};


},{"./array":2,"./attr":3,"./class":4,"./data":5,"./dom":6,"./dom_extra":7,"./event":8,"./html":9,"./mode":11,"./noconflict":12,"./selector":13,"./selector_extra":14,"./util":15}],2:[function(_dereq_,module,exports){
"use strict";
var __moduleName = "src/array";
var _each = _dereq_('./util').each;
var $__0 = _dereq_('./selector'),
    $ = $__0.$,
    matches = $__0.matches;
var ArrayProto = Array.prototype;
var every = ArrayProto.every;
function filter(selector, thisArg) {
  var callback = typeof selector === 'function' ? selector : function(element) {
    return matches(element, selector);
  };
  return $(ArrayProto.filter.call(this, callback, thisArg));
}
function forEach(callback, thisArg) {
  return _each(this, callback, thisArg);
}
var each = forEach;
var indexOf = ArrayProto.indexOf;
var map = ArrayProto.map;
var pop = ArrayProto.pop;
var push = ArrayProto.push;
function reverse() {
  var elements = ArrayProto.slice.call(this);
  return $(ArrayProto.reverse.call(elements));
}
var shift = ArrayProto.shift;
var some = ArrayProto.some;
var unshift = ArrayProto.unshift;
;
module.exports = {
  each: each,
  every: every,
  filter: filter,
  forEach: forEach,
  indexOf: indexOf,
  map: map,
  pop: pop,
  push: push,
  reverse: reverse,
  shift: shift,
  some: some,
  unshift: unshift,
  __esModule: true
};


},{"./selector":13,"./util":15}],3:[function(_dereq_,module,exports){
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


},{"./util":15}],4:[function(_dereq_,module,exports){
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


},{"./util":15}],5:[function(_dereq_,module,exports){
"use strict";
var __moduleName = "src/data";
var each = _dereq_('./util').each;
var dataKeyProp = '__domtastic_data__';
function data(key, value) {
  if (typeof key === 'string' && typeof value === 'undefined') {
    var element = this.nodeType ? this : this[0];
    return element && element[dataKeyProp] ? element[dataKeyProp][key] : undefined;
  }
  each(this, function(element) {
    element[dataKeyProp] = element[dataKeyProp] || {};
    element[dataKeyProp][key] = value;
  });
  return this;
}
function prop(key, value) {
  if (typeof key === 'string' && typeof value === 'undefined') {
    var element = this.nodeType ? this : this[0];
    return element && element ? element[key] : undefined;
  }
  each(this, function(element) {
    element[key] = value;
  });
  return this;
}
;
module.exports = {
  data: data,
  prop: prop,
  __esModule: true
};


},{"./util":15}],6:[function(_dereq_,module,exports){
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


},{"./util":15}],7:[function(_dereq_,module,exports){
"use strict";
var __moduleName = "src/dom_extra";
var each = _dereq_('./util').each;
var $__0 = _dereq_('./dom'),
    append = $__0.append,
    before = $__0.before,
    after = $__0.after;
var $ = _dereq_('./selector').$;
function appendTo(element) {
  var context = typeof element === 'string' ? $(element) : element;
  append.call(context, this);
  return this;
}
function empty() {
  return each(this, function(element) {
    element.innerHTML = '';
  });
}
function remove() {
  return each(this, function(element) {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });
}
function replaceWith() {
  return before.apply(this, arguments).remove();
}
function text(value) {
  if (typeof value !== 'string') {
    return this[0].textContent;
  }
  each(this, function(element) {
    element.textContent = '' + value;
  });
  return this;
}
function val(value) {
  if (typeof value !== 'string') {
    return this[0].value;
  }
  each(this, function(element) {
    element.value = value;
  });
  return this;
}
;
module.exports = {
  appendTo: appendTo,
  empty: empty,
  remove: remove,
  replaceWith: replaceWith,
  text: text,
  val: val,
  __esModule: true
};


},{"./dom":6,"./selector":13,"./util":15}],8:[function(_dereq_,module,exports){
"use strict";
var __moduleName = "src/event";
var $__0 = _dereq_('./util'),
    global = $__0.global,
    each = $__0.each;
var matches = _dereq_('./selector').matches;
function on(eventNames, selector, handler, useCapture) {
  if (typeof selector === 'function') {
    handler = selector;
    selector = null;
  }
  var parts,
      namespace,
      eventListener;
  eventNames.split(' ').forEach(function(eventName) {
    parts = eventName.split('.');
    eventName = parts[0] || null;
    namespace = parts[1] || null;
    eventListener = proxyHandler(handler);
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
  }, this);
  return this;
}
function off() {
  var eventNames = arguments[0] !== (void 0) ? arguments[0] : '';
  var selector = arguments[1];
  var handler = arguments[2];
  var useCapture = arguments[3];
  if (typeof selector === 'function') {
    handler = selector;
    selector = null;
  }
  var parts,
      namespace,
      handlers;
  eventNames.split(' ').forEach(function(eventName) {
    parts = eventName.split('.');
    eventName = parts[0] || null;
    namespace = parts[1] || null;
    each(this, function(element) {
      handlers = getHandlers(element);
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
  }, this);
  return this;
}
function delegate(selector, eventName, handler) {
  return on.call(this, eventName, selector, handler);
}
function undelegate(selector, eventName, handler) {
  return off.call(this, eventName, selector, handler);
}
function trigger(type, data) {
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
function triggerHandler(type, data) {
  if (this[0]) {
    trigger.call(this[0], type, data, {
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


},{"./selector":13,"./util":15}],9:[function(_dereq_,module,exports){
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


},{"./util":15}],10:[function(_dereq_,module,exports){
"use strict";
var __moduleName = "src/index";
var $ = _dereq_('./api').default;
var $__default = $;
module.exports = {
  default: $__default,
  __esModule: true
};


},{"./api":1}],11:[function(_dereq_,module,exports){
"use strict";
var __moduleName = "src/mode";
var global = _dereq_('./util').global;
var isNative = false;
function native() {
  var goNative = arguments[0] !== (void 0) ? arguments[0] : true;
  var wasNative = isNative;
  isNative = goNative;
  if (global.$) {
    global.$.isNative = isNative;
  }
  if (!wasNative && isNative) {
    augmentNativePrototypes(this.fn, this.fnList);
  }
  if (wasNative && !isNative) {
    unaugmentNativePrototypes(this.fn, this.fnList);
  }
  return isNative;
}
var NodeProto = typeof Node !== 'undefined' && Node.prototype,
    NodeListProto = typeof NodeList !== 'undefined' && NodeList.prototype;
function augment(obj, key, value) {
  if (!obj.hasOwnProperty(key)) {
    Object.defineProperty(obj, key, {
      value: value,
      configurable: true,
      enumerable: false
    });
  }
}
var unaugment = (function(obj, key) {
  delete obj[key];
});
function augmentNativePrototypes(methodsNode, methodsNodeList) {
  var key;
  for (key in methodsNode) {
    augment(NodeProto, key, methodsNode[key]);
    augment(NodeListProto, key, methodsNode[key]);
  }
  for (key in methodsNodeList) {
    augment(NodeListProto, key, methodsNodeList[key]);
  }
}
function unaugmentNativePrototypes(methodsNode, methodsNodeList) {
  var key;
  for (key in methodsNode) {
    unaugment(NodeProto, key);
    unaugment(NodeListProto, key);
  }
  for (key in methodsNodeList) {
    unaugment(NodeListProto, key);
  }
}
;
module.exports = {
  isNative: isNative,
  native: native,
  __esModule: true
};


},{"./util":15}],12:[function(_dereq_,module,exports){
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


},{"./util":15}],13:[function(_dereq_,module,exports){
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


},{"./util":15}],14:[function(_dereq_,module,exports){
"use strict";
var __moduleName = "src/selector_extra";
var $__0 = _dereq_('./util'),
    each = $__0.each,
    toArray = $__0.toArray;
var $__0 = _dereq_('./selector'),
    $ = $__0.$,
    matches = $__0.matches;
function children(selector) {
  var nodes = [];
  each(this, function(element) {
    if (element.children) {
      each(element.children, function(child) {
        if (!selector || (selector && matches(child, selector))) {
          nodes.push(child);
        }
      });
    }
  });
  return $(nodes);
}
function closest(selector) {
  var node = this[0];
  for (; node.nodeType !== node.DOCUMENT_NODE; node = node.parentNode) {
    if (matches(node, selector)) {
      return $(node);
    }
  }
  return $();
}
function contents() {
  var nodes = [];
  each(this, function(element) {
    nodes.push.apply(nodes, toArray(element.childNodes));
  });
  return $(nodes);
}
function eq(index) {
  return slice.call(this, index, index + 1);
}
function get(index) {
  return this[index];
}
function parent(selector) {
  var nodes = [];
  each(this, function(element) {
    if (!selector || (selector && matches(element.parentNode, selector))) {
      nodes.push(element.parentNode);
    }
  });
  return $(nodes);
}
function slice(start, end) {
  return $([].slice.apply(this, arguments));
}
;
module.exports = {
  children: children,
  contents: contents,
  closest: closest,
  eq: eq,
  get: get,
  parent: parent,
  slice: slice,
  __esModule: true
};


},{"./selector":13,"./util":15}],15:[function(_dereq_,module,exports){
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
function each(collection, callback, thisArg) {
  var length = collection.length;
  if (length !== undefined && collection.nodeType === undefined) {
    for (var i = 0; i < length; i++) {
      callback.call(thisArg, collection[i], i, collection);
    }
  } else {
    callback.call(thisArg, collection, 0, collection);
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


},{}]},{},[10])
(10)
});
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
module.exports = strip;

function strip(html){
  html = html || '';
  return html.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>?/gi, '').trim();
}

},{}],4:[function(require,module,exports){
var obj     = require('./modules/obj')
,   events  = require('./modules/events')
,   content = require('./modules/content');

content.init();
obj.init();
events();


},{"./modules/content":5,"./modules/events":7,"./modules/obj":8}],5:[function(require,module,exports){
'use strict';

var $ = require('domtastic/bundle/full/domtastic')
,   strip = require('strip');

var $body      = $('body'),
    isOriginal = true;

var content = {

  init: function() {
    return this.wrapContent();
  },

  wrapContent: function() {
    $body.html('<div id="nice-content">' + $body.html() + '</div>');
    this.originalHTML = this.currentHTML = this.getHTML();
    return this.makeEditable($('#nice-content'));
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
    var html = $('#nice-content').html();
    return html.trim();
  },

  stripHTML: function(str) {
    return strip(str)
      .replace(/(&lt;.+&gt;)/gi, '')
      .replace(/(((&amp;).+(lt;)).+((&amp;).+(gt;)))/gi, '')
      .replace(/(&amp;lt;.+&amp;gt;)/gi, '');
  },

  setHTML: function(html) {
    return $('#nice-content').html(html);
  },

  toggleHTML: function() {
    var strippedOriginal = this.stripHTML(this.originalHTML);
    var strippedCurrent = this.stripHTML(this.getHTML());

    isOriginal = strippedOriginal === strippedCurrent ? true : false;

    if (!isOriginal) {
      this.currentHTML = this.getHTML();
    }

    var html = isOriginal ? this.currentHTML : this.originalHTML;

    this.setHTML(html);

  },

  getSelection: function() {
    var range;
    if (document.selection) {
      range = document.body.createTextRange();
      range.moveToElementText(document.getElementById('nice-pre'));
      range.select();
    } else if (window.getSelection) {
      range = document.createRange();
      range.selectNode(document.getElementById('nice-pre'));
      window.getSelection().addRange(range);
    }

  },

  originalHTML: '',

  currentHTML: ''

};

module.exports = content;

},{"domtastic/bundle/full/domtastic":2,"strip":3}],6:[function(require,module,exports){
'use strict';

var $       = require('domtastic/bundle/full/domtastic')
,   jsdiff  = require('diff')
,   content = require('./content');

var diffObj = {

  init: function() {
    var originalHTML = content.stripHTML(content.originalHTML);
    var currentHTML = content.stripHTML(content.getHTML());

    var diff = jsdiff.diffLines(originalHTML, currentHTML);
    this.populateDiff(diff);
    console.table(diff, originalHTML, currentHTML )
  },

  populateDiff: function(diff) {
    var $pre = $('#nice-pre').html('')
    ,   color
    ,   klass
    ,   span;


    diff.forEach(function(part) {
      if (part.added || part.removed) {
        color = part.added ? 'green' : part.removed ? 'red' : 'grey';
        klass = part.added ? 'is-added' : part.removed ? 'is-removed' : '';
        span = document.createElement('span');
        span.style.color = color;
        span.setAttribute('class', klass);
        span.appendChild(document.createTextNode(part.value));
        $pre.append(span);
      }
    });
  }
};


module.exports = diffObj;

},{"./content":5,"diff":1,"domtastic/bundle/full/domtastic":2}],7:[function(require,module,exports){
'use strict';

var $       = require('domtastic/bundle/full/domtastic')
,   diff    = require('./diff')
,   content = require('./content');

var events = function() {

  $('#nice-min').on('click', function(e) {
    e.preventDefault();
    $('#nice-obj').toggleClass('is-min');
  });

  $('#nice-off').on('click', function(e) {
    e.preventDefault();
    content.removeNice();
  });

  $('#nice-diff').on('click', function(e) {
    e.preventDefault();
    $('#nice-pre').toggleClass('is-active');
    diff.init();
  });

  $('#nice-toggle').on('click', function(e) {
    e.preventDefault();
    content.toggleHTML();
  });

  $('#nice-pre').on('click', function(e) {
    e.preventDefault();
    content.getSelection();
  });

  $('#nice-nav li')
    .on('mouseover', function(e) {
      var $title = $('#nice-title');
      $title.text($(e.srcElement).attr('data-text'));
    }).on('mouseleave', function() {
      var $title = $('#nice-title');
      $title.text($title.attr('data-text'));
    });

};

module.exports = events;

},{"./content":5,"./diff":6,"domtastic/bundle/full/domtastic":2}],8:[function(require,module,exports){
'use strict';

var objTemplate = require('./template');

var body   = document.getElementsByTagName('body')[ 0 ]
,   head   = document.getElementsByTagName('head')[ 0 ]
,   cssLoc = 'https://seethroughtrees.github.io/nice-inline-copy-editor/index.css';


var nav = {

  init: function() {
    this.createObj();
  },

  createObj: function() {
    var div = document.createElement('div');
    div.setAttribute('id', 'nice-obj');
    div.setAttribute('contenteditable', false);
    div.setAttribute('class', 'is-min');
    div.innerHTML = objTemplate;
    this.style(div);
  },

  style: function(div) {
    var link = document.createElement('link');
    link.setAttribute('rel','stylesheet');
    link.setAttribute('href', cssLoc);
    link.setAttribute('type','text/css');
    head.appendChild(link);
    this.append(div);
  },

  append: function(div) {
    body.appendChild(div);
  }

};

module.exports = nav;

},{"./template":9}],9:[function(require,module,exports){
'use strict';

// set objTemplate
var objTemplate = '<ul id="nice-nav">';
    objTemplate += '<li id="nice-title" data-text="NICE" title="Go To Homepage">NICE</li>';
    objTemplate += '<li id="nice-min" data-text="HIDE" title="Minimize NICE"><span>\uE001</span></li>';
    objTemplate += '<li id="nice-toggle" data-text="TOGGLE" title="Toggle Original">\uE004</li>';
    objTemplate += '<li id="nice-diff" data-text="DIFF" title="See Diff">\uE002</li>';
    objTemplate += '<li id="nice-off" data-text="OFF" title="Turn off NICE">\uE003</li>';
    objTemplate += '</ul>';
    objTemplate += '<pre id="nice-pre"></pre>';

module.exports = objTemplate;

},{}]},{},[4])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYWRhbWwvU2l0ZXMvZ2l0aHViL25pY2UtaW5saW5lLWNvcHktZWRpdG9yL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYWRhbWwvU2l0ZXMvZ2l0aHViL25pY2UtaW5saW5lLWNvcHktZWRpdG9yL25vZGVfbW9kdWxlcy9kaWZmL2RpZmYuanMiLCIvVXNlcnMvYWRhbWwvU2l0ZXMvZ2l0aHViL25pY2UtaW5saW5lLWNvcHktZWRpdG9yL25vZGVfbW9kdWxlcy9kb210YXN0aWMvYnVuZGxlL2Z1bGwvZG9tdGFzdGljLmpzIiwiL1VzZXJzL2FkYW1sL1NpdGVzL2dpdGh1Yi9uaWNlLWlubGluZS1jb3B5LWVkaXRvci9ub2RlX21vZHVsZXMvc3RyaXAvaW5kZXguanMiLCIvVXNlcnMvYWRhbWwvU2l0ZXMvZ2l0aHViL25pY2UtaW5saW5lLWNvcHktZWRpdG9yL3NyYy9qcy9pbmRleC5qcyIsIi9Vc2Vycy9hZGFtbC9TaXRlcy9naXRodWIvbmljZS1pbmxpbmUtY29weS1lZGl0b3Ivc3JjL2pzL21vZHVsZXMvY29udGVudC5qcyIsIi9Vc2Vycy9hZGFtbC9TaXRlcy9naXRodWIvbmljZS1pbmxpbmUtY29weS1lZGl0b3Ivc3JjL2pzL21vZHVsZXMvZGlmZi5qcyIsIi9Vc2Vycy9hZGFtbC9TaXRlcy9naXRodWIvbmljZS1pbmxpbmUtY29weS1lZGl0b3Ivc3JjL2pzL21vZHVsZXMvZXZlbnRzLmpzIiwiL1VzZXJzL2FkYW1sL1NpdGVzL2dpdGh1Yi9uaWNlLWlubGluZS1jb3B5LWVkaXRvci9zcmMvanMvbW9kdWxlcy9vYmouanMiLCIvVXNlcnMvYWRhbWwvU2l0ZXMvZ2l0aHViL25pY2UtaW5saW5lLWNvcHktZWRpdG9yL3NyYy9qcy9tb2R1bGVzL3RlbXBsYXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaDZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBTZWUgTElDRU5TRSBmaWxlIGZvciB0ZXJtcyBvZiB1c2UgKi9cblxuLypcbiAqIFRleHQgZGlmZiBpbXBsZW1lbnRhdGlvbi5cbiAqXG4gKiBUaGlzIGxpYnJhcnkgc3VwcG9ydHMgdGhlIGZvbGxvd2luZyBBUElTOlxuICogSnNEaWZmLmRpZmZDaGFyczogQ2hhcmFjdGVyIGJ5IGNoYXJhY3RlciBkaWZmXG4gKiBKc0RpZmYuZGlmZldvcmRzOiBXb3JkIChhcyBkZWZpbmVkIGJ5IFxcYiByZWdleCkgZGlmZiB3aGljaCBpZ25vcmVzIHdoaXRlc3BhY2VcbiAqIEpzRGlmZi5kaWZmTGluZXM6IExpbmUgYmFzZWQgZGlmZlxuICpcbiAqIEpzRGlmZi5kaWZmQ3NzOiBEaWZmIHRhcmdldGVkIGF0IENTUyBjb250ZW50XG4gKlxuICogVGhlc2UgbWV0aG9kcyBhcmUgYmFzZWQgb24gdGhlIGltcGxlbWVudGF0aW9uIHByb3Bvc2VkIGluXG4gKiBcIkFuIE8oTkQpIERpZmZlcmVuY2UgQWxnb3JpdGhtIGFuZCBpdHMgVmFyaWF0aW9uc1wiIChNeWVycywgMTk4NikuXG4gKiBodHRwOi8vY2l0ZXNlZXJ4LmlzdC5wc3UuZWR1L3ZpZXdkb2Mvc3VtbWFyeT9kb2k9MTAuMS4xLjQuNjkyN1xuICovXG52YXIgSnNEaWZmID0gKGZ1bmN0aW9uKCkge1xuICAvKmpzaGludCBtYXhwYXJhbXM6IDUqL1xuICBmdW5jdGlvbiBjbG9uZVBhdGgocGF0aCkge1xuICAgIHJldHVybiB7IG5ld1BvczogcGF0aC5uZXdQb3MsIGNvbXBvbmVudHM6IHBhdGguY29tcG9uZW50cy5zbGljZSgwKSB9O1xuICB9XG4gIGZ1bmN0aW9uIHJlbW92ZUVtcHR5KGFycmF5KSB7XG4gICAgdmFyIHJldCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhcnJheVtpXSkge1xuICAgICAgICByZXQucHVzaChhcnJheVtpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cbiAgZnVuY3Rpb24gZXNjYXBlSFRNTChzKSB7XG4gICAgdmFyIG4gPSBzO1xuICAgIG4gPSBuLnJlcGxhY2UoLyYvZywgJyZhbXA7Jyk7XG4gICAgbiA9IG4ucmVwbGFjZSgvPC9nLCAnJmx0OycpO1xuICAgIG4gPSBuLnJlcGxhY2UoLz4vZywgJyZndDsnKTtcbiAgICBuID0gbi5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7Jyk7XG5cbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIHZhciBEaWZmID0gZnVuY3Rpb24oaWdub3JlV2hpdGVzcGFjZSkge1xuICAgIHRoaXMuaWdub3JlV2hpdGVzcGFjZSA9IGlnbm9yZVdoaXRlc3BhY2U7XG4gIH07XG4gIERpZmYucHJvdG90eXBlID0ge1xuICAgICAgZGlmZjogZnVuY3Rpb24ob2xkU3RyaW5nLCBuZXdTdHJpbmcpIHtcbiAgICAgICAgLy8gSGFuZGxlIHRoZSBpZGVudGl0eSBjYXNlICh0aGlzIGlzIGR1ZSB0byB1bnJvbGxpbmcgZWRpdExlbmd0aCA9PSAwXG4gICAgICAgIGlmIChuZXdTdHJpbmcgPT09IG9sZFN0cmluZykge1xuICAgICAgICAgIHJldHVybiBbeyB2YWx1ZTogbmV3U3RyaW5nIH1dO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbmV3U3RyaW5nKSB7XG4gICAgICAgICAgcmV0dXJuIFt7IHZhbHVlOiBvbGRTdHJpbmcsIHJlbW92ZWQ6IHRydWUgfV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFvbGRTdHJpbmcpIHtcbiAgICAgICAgICByZXR1cm4gW3sgdmFsdWU6IG5ld1N0cmluZywgYWRkZWQ6IHRydWUgfV07XG4gICAgICAgIH1cblxuICAgICAgICBuZXdTdHJpbmcgPSB0aGlzLnRva2VuaXplKG5ld1N0cmluZyk7XG4gICAgICAgIG9sZFN0cmluZyA9IHRoaXMudG9rZW5pemUob2xkU3RyaW5nKTtcblxuICAgICAgICB2YXIgbmV3TGVuID0gbmV3U3RyaW5nLmxlbmd0aCwgb2xkTGVuID0gb2xkU3RyaW5nLmxlbmd0aDtcbiAgICAgICAgdmFyIG1heEVkaXRMZW5ndGggPSBuZXdMZW4gKyBvbGRMZW47XG4gICAgICAgIHZhciBiZXN0UGF0aCA9IFt7IG5ld1BvczogLTEsIGNvbXBvbmVudHM6IFtdIH1dO1xuXG4gICAgICAgIC8vIFNlZWQgZWRpdExlbmd0aCA9IDBcbiAgICAgICAgdmFyIG9sZFBvcyA9IHRoaXMuZXh0cmFjdENvbW1vbihiZXN0UGF0aFswXSwgbmV3U3RyaW5nLCBvbGRTdHJpbmcsIDApO1xuICAgICAgICBpZiAoYmVzdFBhdGhbMF0ubmV3UG9zKzEgPj0gbmV3TGVuICYmIG9sZFBvcysxID49IG9sZExlbikge1xuICAgICAgICAgIHJldHVybiBiZXN0UGF0aFswXS5jb21wb25lbnRzO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgZWRpdExlbmd0aCA9IDE7IGVkaXRMZW5ndGggPD0gbWF4RWRpdExlbmd0aDsgZWRpdExlbmd0aCsrKSB7XG4gICAgICAgICAgZm9yICh2YXIgZGlhZ29uYWxQYXRoID0gLTEqZWRpdExlbmd0aDsgZGlhZ29uYWxQYXRoIDw9IGVkaXRMZW5ndGg7IGRpYWdvbmFsUGF0aCs9Mikge1xuICAgICAgICAgICAgdmFyIGJhc2VQYXRoO1xuICAgICAgICAgICAgdmFyIGFkZFBhdGggPSBiZXN0UGF0aFtkaWFnb25hbFBhdGgtMV0sXG4gICAgICAgICAgICAgICAgcmVtb3ZlUGF0aCA9IGJlc3RQYXRoW2RpYWdvbmFsUGF0aCsxXTtcbiAgICAgICAgICAgIG9sZFBvcyA9IChyZW1vdmVQYXRoID8gcmVtb3ZlUGF0aC5uZXdQb3MgOiAwKSAtIGRpYWdvbmFsUGF0aDtcbiAgICAgICAgICAgIGlmIChhZGRQYXRoKSB7XG4gICAgICAgICAgICAgIC8vIE5vIG9uZSBlbHNlIGlzIGdvaW5nIHRvIGF0dGVtcHQgdG8gdXNlIHRoaXMgdmFsdWUsIGNsZWFyIGl0XG4gICAgICAgICAgICAgIGJlc3RQYXRoW2RpYWdvbmFsUGF0aC0xXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGNhbkFkZCA9IGFkZFBhdGggJiYgYWRkUGF0aC5uZXdQb3MrMSA8IG5ld0xlbjtcbiAgICAgICAgICAgIHZhciBjYW5SZW1vdmUgPSByZW1vdmVQYXRoICYmIDAgPD0gb2xkUG9zICYmIG9sZFBvcyA8IG9sZExlbjtcbiAgICAgICAgICAgIGlmICghY2FuQWRkICYmICFjYW5SZW1vdmUpIHtcbiAgICAgICAgICAgICAgYmVzdFBhdGhbZGlhZ29uYWxQYXRoXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNlbGVjdCB0aGUgZGlhZ29uYWwgdGhhdCB3ZSB3YW50IHRvIGJyYW5jaCBmcm9tLiBXZSBzZWxlY3QgdGhlIHByaW9yXG4gICAgICAgICAgICAvLyBwYXRoIHdob3NlIHBvc2l0aW9uIGluIHRoZSBuZXcgc3RyaW5nIGlzIHRoZSBmYXJ0aGVzdCBmcm9tIHRoZSBvcmlnaW5cbiAgICAgICAgICAgIC8vIGFuZCBkb2VzIG5vdCBwYXNzIHRoZSBib3VuZHMgb2YgdGhlIGRpZmYgZ3JhcGhcbiAgICAgICAgICAgIGlmICghY2FuQWRkIHx8IChjYW5SZW1vdmUgJiYgYWRkUGF0aC5uZXdQb3MgPCByZW1vdmVQYXRoLm5ld1BvcykpIHtcbiAgICAgICAgICAgICAgYmFzZVBhdGggPSBjbG9uZVBhdGgocmVtb3ZlUGF0aCk7XG4gICAgICAgICAgICAgIHRoaXMucHVzaENvbXBvbmVudChiYXNlUGF0aC5jb21wb25lbnRzLCBvbGRTdHJpbmdbb2xkUG9zXSwgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGJhc2VQYXRoID0gY2xvbmVQYXRoKGFkZFBhdGgpO1xuICAgICAgICAgICAgICBiYXNlUGF0aC5uZXdQb3MrKztcbiAgICAgICAgICAgICAgdGhpcy5wdXNoQ29tcG9uZW50KGJhc2VQYXRoLmNvbXBvbmVudHMsIG5ld1N0cmluZ1tiYXNlUGF0aC5uZXdQb3NdLCB0cnVlLCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgb2xkUG9zID0gdGhpcy5leHRyYWN0Q29tbW9uKGJhc2VQYXRoLCBuZXdTdHJpbmcsIG9sZFN0cmluZywgZGlhZ29uYWxQYXRoKTtcblxuICAgICAgICAgICAgaWYgKGJhc2VQYXRoLm5ld1BvcysxID49IG5ld0xlbiAmJiBvbGRQb3MrMSA+PSBvbGRMZW4pIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGJhc2VQYXRoLmNvbXBvbmVudHM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBiZXN0UGF0aFtkaWFnb25hbFBhdGhdID0gYmFzZVBhdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBwdXNoQ29tcG9uZW50OiBmdW5jdGlvbihjb21wb25lbnRzLCB2YWx1ZSwgYWRkZWQsIHJlbW92ZWQpIHtcbiAgICAgICAgdmFyIGxhc3QgPSBjb21wb25lbnRzW2NvbXBvbmVudHMubGVuZ3RoLTFdO1xuICAgICAgICBpZiAobGFzdCAmJiBsYXN0LmFkZGVkID09PSBhZGRlZCAmJiBsYXN0LnJlbW92ZWQgPT09IHJlbW92ZWQpIHtcbiAgICAgICAgICAvLyBXZSBuZWVkIHRvIGNsb25lIGhlcmUgYXMgdGhlIGNvbXBvbmVudCBjbG9uZSBvcGVyYXRpb24gaXMganVzdFxuICAgICAgICAgIC8vIGFzIHNoYWxsb3cgYXJyYXkgY2xvbmVcbiAgICAgICAgICBjb21wb25lbnRzW2NvbXBvbmVudHMubGVuZ3RoLTFdID1cbiAgICAgICAgICAgIHt2YWx1ZTogdGhpcy5qb2luKGxhc3QudmFsdWUsIHZhbHVlKSwgYWRkZWQ6IGFkZGVkLCByZW1vdmVkOiByZW1vdmVkIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29tcG9uZW50cy5wdXNoKHt2YWx1ZTogdmFsdWUsIGFkZGVkOiBhZGRlZCwgcmVtb3ZlZDogcmVtb3ZlZCB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGV4dHJhY3RDb21tb246IGZ1bmN0aW9uKGJhc2VQYXRoLCBuZXdTdHJpbmcsIG9sZFN0cmluZywgZGlhZ29uYWxQYXRoKSB7XG4gICAgICAgIHZhciBuZXdMZW4gPSBuZXdTdHJpbmcubGVuZ3RoLFxuICAgICAgICAgICAgb2xkTGVuID0gb2xkU3RyaW5nLmxlbmd0aCxcbiAgICAgICAgICAgIG5ld1BvcyA9IGJhc2VQYXRoLm5ld1BvcyxcbiAgICAgICAgICAgIG9sZFBvcyA9IG5ld1BvcyAtIGRpYWdvbmFsUGF0aDtcbiAgICAgICAgd2hpbGUgKG5ld1BvcysxIDwgbmV3TGVuICYmIG9sZFBvcysxIDwgb2xkTGVuICYmIHRoaXMuZXF1YWxzKG5ld1N0cmluZ1tuZXdQb3MrMV0sIG9sZFN0cmluZ1tvbGRQb3MrMV0pKSB7XG4gICAgICAgICAgbmV3UG9zKys7XG4gICAgICAgICAgb2xkUG9zKys7XG5cbiAgICAgICAgICB0aGlzLnB1c2hDb21wb25lbnQoYmFzZVBhdGguY29tcG9uZW50cywgbmV3U3RyaW5nW25ld1Bvc10sIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcbiAgICAgICAgfVxuICAgICAgICBiYXNlUGF0aC5uZXdQb3MgPSBuZXdQb3M7XG4gICAgICAgIHJldHVybiBvbGRQb3M7XG4gICAgICB9LFxuXG4gICAgICBlcXVhbHM6IGZ1bmN0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gICAgICAgIHZhciByZVdoaXRlc3BhY2UgPSAvXFxTLztcbiAgICAgICAgaWYgKHRoaXMuaWdub3JlV2hpdGVzcGFjZSAmJiAhcmVXaGl0ZXNwYWNlLnRlc3QobGVmdCkgJiYgIXJlV2hpdGVzcGFjZS50ZXN0KHJpZ2h0KSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBsZWZ0ID09PSByaWdodDtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGpvaW46IGZ1bmN0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gICAgICAgIHJldHVybiBsZWZ0ICsgcmlnaHQ7XG4gICAgICB9LFxuICAgICAgdG9rZW5pemU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cbiAgfTtcblxuICB2YXIgQ2hhckRpZmYgPSBuZXcgRGlmZigpO1xuXG4gIHZhciBXb3JkRGlmZiA9IG5ldyBEaWZmKHRydWUpO1xuICB2YXIgV29yZFdpdGhTcGFjZURpZmYgPSBuZXcgRGlmZigpO1xuICBXb3JkRGlmZi50b2tlbml6ZSA9IFdvcmRXaXRoU3BhY2VEaWZmLnRva2VuaXplID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gcmVtb3ZlRW1wdHkodmFsdWUuc3BsaXQoLyhcXHMrfFxcYikvKSk7XG4gIH07XG5cbiAgdmFyIENzc0RpZmYgPSBuZXcgRGlmZih0cnVlKTtcbiAgQ3NzRGlmZi50b2tlbml6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHJlbW92ZUVtcHR5KHZhbHVlLnNwbGl0KC8oW3t9OjssXXxcXHMrKS8pKTtcbiAgfTtcblxuICB2YXIgTGluZURpZmYgPSBuZXcgRGlmZigpO1xuICBMaW5lRGlmZi50b2tlbml6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdmFyIHJldExpbmVzID0gW10sXG4gICAgICAgIGxpbmVzID0gdmFsdWUuc3BsaXQoL14vbSk7XG5cbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBsaW5lID0gbGluZXNbaV0sXG4gICAgICAgICAgbGFzdExpbmUgPSBsaW5lc1tpIC0gMV07XG5cbiAgICAgIC8vIE1lcmdlIGxpbmVzIHRoYXQgbWF5IGNvbnRhaW4gd2luZG93cyBuZXcgbGluZXNcbiAgICAgIGlmIChsaW5lID09ICdcXG4nICYmIGxhc3RMaW5lICYmIGxhc3RMaW5lW2xhc3RMaW5lLmxlbmd0aCAtIDFdID09PSAnXFxyJykge1xuICAgICAgICByZXRMaW5lc1tyZXRMaW5lcy5sZW5ndGggLSAxXSArPSAnXFxuJztcbiAgICAgIH0gZWxzZSBpZiAobGluZSkge1xuICAgICAgICByZXRMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXRMaW5lcztcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIERpZmY6IERpZmYsXG5cbiAgICBkaWZmQ2hhcnM6IGZ1bmN0aW9uKG9sZFN0ciwgbmV3U3RyKSB7IHJldHVybiBDaGFyRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyKTsgfSxcbiAgICBkaWZmV29yZHM6IGZ1bmN0aW9uKG9sZFN0ciwgbmV3U3RyKSB7IHJldHVybiBXb3JkRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyKTsgfSxcbiAgICBkaWZmV29yZHNXaXRoU3BhY2U6IGZ1bmN0aW9uKG9sZFN0ciwgbmV3U3RyKSB7IHJldHVybiBXb3JkV2l0aFNwYWNlRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyKTsgfSxcbiAgICBkaWZmTGluZXM6IGZ1bmN0aW9uKG9sZFN0ciwgbmV3U3RyKSB7IHJldHVybiBMaW5lRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyKTsgfSxcblxuICAgIGRpZmZDc3M6IGZ1bmN0aW9uKG9sZFN0ciwgbmV3U3RyKSB7IHJldHVybiBDc3NEaWZmLmRpZmYob2xkU3RyLCBuZXdTdHIpOyB9LFxuXG4gICAgY3JlYXRlUGF0Y2g6IGZ1bmN0aW9uKGZpbGVOYW1lLCBvbGRTdHIsIG5ld1N0ciwgb2xkSGVhZGVyLCBuZXdIZWFkZXIpIHtcbiAgICAgIHZhciByZXQgPSBbXTtcblxuICAgICAgcmV0LnB1c2goJ0luZGV4OiAnICsgZmlsZU5hbWUpO1xuICAgICAgcmV0LnB1c2goJz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0nKTtcbiAgICAgIHJldC5wdXNoKCctLS0gJyArIGZpbGVOYW1lICsgKHR5cGVvZiBvbGRIZWFkZXIgPT09ICd1bmRlZmluZWQnID8gJycgOiAnXFx0JyArIG9sZEhlYWRlcikpO1xuICAgICAgcmV0LnB1c2goJysrKyAnICsgZmlsZU5hbWUgKyAodHlwZW9mIG5ld0hlYWRlciA9PT0gJ3VuZGVmaW5lZCcgPyAnJyA6ICdcXHQnICsgbmV3SGVhZGVyKSk7XG5cbiAgICAgIHZhciBkaWZmID0gTGluZURpZmYuZGlmZihvbGRTdHIsIG5ld1N0cik7XG4gICAgICBpZiAoIWRpZmZbZGlmZi5sZW5ndGgtMV0udmFsdWUpIHtcbiAgICAgICAgZGlmZi5wb3AoKTsgICAvLyBSZW1vdmUgdHJhaWxpbmcgbmV3bGluZSBhZGRcbiAgICAgIH1cbiAgICAgIGRpZmYucHVzaCh7dmFsdWU6ICcnLCBsaW5lczogW119KTsgICAvLyBBcHBlbmQgYW4gZW1wdHkgdmFsdWUgdG8gbWFrZSBjbGVhbnVwIGVhc2llclxuXG4gICAgICBmdW5jdGlvbiBjb250ZXh0TGluZXMobGluZXMpIHtcbiAgICAgICAgcmV0dXJuIGxpbmVzLm1hcChmdW5jdGlvbihlbnRyeSkgeyByZXR1cm4gJyAnICsgZW50cnk7IH0pO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gZW9mTkwoY3VyUmFuZ2UsIGksIGN1cnJlbnQpIHtcbiAgICAgICAgdmFyIGxhc3QgPSBkaWZmW2RpZmYubGVuZ3RoLTJdLFxuICAgICAgICAgICAgaXNMYXN0ID0gaSA9PT0gZGlmZi5sZW5ndGgtMixcbiAgICAgICAgICAgIGlzTGFzdE9mVHlwZSA9IGkgPT09IGRpZmYubGVuZ3RoLTMgJiYgKGN1cnJlbnQuYWRkZWQgIT09IGxhc3QuYWRkZWQgfHwgY3VycmVudC5yZW1vdmVkICE9PSBsYXN0LnJlbW92ZWQpO1xuXG4gICAgICAgIC8vIEZpZ3VyZSBvdXQgaWYgdGhpcyBpcyB0aGUgbGFzdCBsaW5lIGZvciB0aGUgZ2l2ZW4gZmlsZSBhbmQgbWlzc2luZyBOTFxuICAgICAgICBpZiAoIS9cXG4kLy50ZXN0KGN1cnJlbnQudmFsdWUpICYmIChpc0xhc3QgfHwgaXNMYXN0T2ZUeXBlKSkge1xuICAgICAgICAgIGN1clJhbmdlLnB1c2goJ1xcXFwgTm8gbmV3bGluZSBhdCBlbmQgb2YgZmlsZScpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBvbGRSYW5nZVN0YXJ0ID0gMCwgbmV3UmFuZ2VTdGFydCA9IDAsIGN1clJhbmdlID0gW10sXG4gICAgICAgICAgb2xkTGluZSA9IDEsIG5ld0xpbmUgPSAxO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkaWZmLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjdXJyZW50ID0gZGlmZltpXSxcbiAgICAgICAgICAgIGxpbmVzID0gY3VycmVudC5saW5lcyB8fCBjdXJyZW50LnZhbHVlLnJlcGxhY2UoL1xcbiQvLCAnJykuc3BsaXQoJ1xcbicpO1xuICAgICAgICBjdXJyZW50LmxpbmVzID0gbGluZXM7XG5cbiAgICAgICAgaWYgKGN1cnJlbnQuYWRkZWQgfHwgY3VycmVudC5yZW1vdmVkKSB7XG4gICAgICAgICAgaWYgKCFvbGRSYW5nZVN0YXJ0KSB7XG4gICAgICAgICAgICB2YXIgcHJldiA9IGRpZmZbaS0xXTtcbiAgICAgICAgICAgIG9sZFJhbmdlU3RhcnQgPSBvbGRMaW5lO1xuICAgICAgICAgICAgbmV3UmFuZ2VTdGFydCA9IG5ld0xpbmU7XG5cbiAgICAgICAgICAgIGlmIChwcmV2KSB7XG4gICAgICAgICAgICAgIGN1clJhbmdlID0gY29udGV4dExpbmVzKHByZXYubGluZXMuc2xpY2UoLTQpKTtcbiAgICAgICAgICAgICAgb2xkUmFuZ2VTdGFydCAtPSBjdXJSYW5nZS5sZW5ndGg7XG4gICAgICAgICAgICAgIG5ld1JhbmdlU3RhcnQgLT0gY3VyUmFuZ2UubGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBjdXJSYW5nZS5wdXNoLmFwcGx5KGN1clJhbmdlLCBsaW5lcy5tYXAoZnVuY3Rpb24oZW50cnkpIHsgcmV0dXJuIChjdXJyZW50LmFkZGVkPycrJzonLScpICsgZW50cnk7IH0pKTtcbiAgICAgICAgICBlb2ZOTChjdXJSYW5nZSwgaSwgY3VycmVudCk7XG5cbiAgICAgICAgICBpZiAoY3VycmVudC5hZGRlZCkge1xuICAgICAgICAgICAgbmV3TGluZSArPSBsaW5lcy5sZW5ndGg7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9sZExpbmUgKz0gbGluZXMubGVuZ3RoO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAob2xkUmFuZ2VTdGFydCkge1xuICAgICAgICAgICAgLy8gQ2xvc2Ugb3V0IGFueSBjaGFuZ2VzIHRoYXQgaGF2ZSBiZWVuIG91dHB1dCAob3Igam9pbiBvdmVybGFwcGluZylcbiAgICAgICAgICAgIGlmIChsaW5lcy5sZW5ndGggPD0gOCAmJiBpIDwgZGlmZi5sZW5ndGgtMikge1xuICAgICAgICAgICAgICAvLyBPdmVybGFwcGluZ1xuICAgICAgICAgICAgICBjdXJSYW5nZS5wdXNoLmFwcGx5KGN1clJhbmdlLCBjb250ZXh0TGluZXMobGluZXMpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIGVuZCB0aGUgcmFuZ2UgYW5kIG91dHB1dFxuICAgICAgICAgICAgICB2YXIgY29udGV4dFNpemUgPSBNYXRoLm1pbihsaW5lcy5sZW5ndGgsIDQpO1xuICAgICAgICAgICAgICByZXQucHVzaChcbiAgICAgICAgICAgICAgICAgICdAQCAtJyArIG9sZFJhbmdlU3RhcnQgKyAnLCcgKyAob2xkTGluZS1vbGRSYW5nZVN0YXJ0K2NvbnRleHRTaXplKVxuICAgICAgICAgICAgICAgICAgKyAnICsnICsgbmV3UmFuZ2VTdGFydCArICcsJyArIChuZXdMaW5lLW5ld1JhbmdlU3RhcnQrY29udGV4dFNpemUpXG4gICAgICAgICAgICAgICAgICArICcgQEAnKTtcbiAgICAgICAgICAgICAgcmV0LnB1c2guYXBwbHkocmV0LCBjdXJSYW5nZSk7XG4gICAgICAgICAgICAgIHJldC5wdXNoLmFwcGx5KHJldCwgY29udGV4dExpbmVzKGxpbmVzLnNsaWNlKDAsIGNvbnRleHRTaXplKSkpO1xuICAgICAgICAgICAgICBpZiAobGluZXMubGVuZ3RoIDw9IDQpIHtcbiAgICAgICAgICAgICAgICBlb2ZOTChyZXQsIGksIGN1cnJlbnQpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgb2xkUmFuZ2VTdGFydCA9IDA7ICBuZXdSYW5nZVN0YXJ0ID0gMDsgY3VyUmFuZ2UgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgb2xkTGluZSArPSBsaW5lcy5sZW5ndGg7XG4gICAgICAgICAgbmV3TGluZSArPSBsaW5lcy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJldC5qb2luKCdcXG4nKSArICdcXG4nO1xuICAgIH0sXG5cbiAgICBhcHBseVBhdGNoOiBmdW5jdGlvbihvbGRTdHIsIHVuaURpZmYpIHtcbiAgICAgIHZhciBkaWZmc3RyID0gdW5pRGlmZi5zcGxpdCgnXFxuJyk7XG4gICAgICB2YXIgZGlmZiA9IFtdO1xuICAgICAgdmFyIHJlbUVPRk5MID0gZmFsc2UsXG4gICAgICAgICAgYWRkRU9GTkwgPSBmYWxzZTtcblxuICAgICAgZm9yICh2YXIgaSA9IChkaWZmc3RyWzBdWzBdPT09J0knPzQ6MCk7IGkgPCBkaWZmc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmKGRpZmZzdHJbaV1bMF0gPT09ICdAJykge1xuICAgICAgICAgIHZhciBtZWggPSBkaWZmc3RyW2ldLnNwbGl0KC9AQCAtKFxcZCspLChcXGQrKSBcXCsoXFxkKyksKFxcZCspIEBALyk7XG4gICAgICAgICAgZGlmZi51bnNoaWZ0KHtcbiAgICAgICAgICAgIHN0YXJ0Om1laFszXSxcbiAgICAgICAgICAgIG9sZGxlbmd0aDptZWhbMl0sXG4gICAgICAgICAgICBvbGRsaW5lczpbXSxcbiAgICAgICAgICAgIG5ld2xlbmd0aDptZWhbNF0sXG4gICAgICAgICAgICBuZXdsaW5lczpbXVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYoZGlmZnN0cltpXVswXSA9PT0gJysnKSB7XG4gICAgICAgICAgZGlmZlswXS5uZXdsaW5lcy5wdXNoKGRpZmZzdHJbaV0uc3Vic3RyKDEpKTtcbiAgICAgICAgfSBlbHNlIGlmKGRpZmZzdHJbaV1bMF0gPT09ICctJykge1xuICAgICAgICAgIGRpZmZbMF0ub2xkbGluZXMucHVzaChkaWZmc3RyW2ldLnN1YnN0cigxKSk7XG4gICAgICAgIH0gZWxzZSBpZihkaWZmc3RyW2ldWzBdID09PSAnICcpIHtcbiAgICAgICAgICBkaWZmWzBdLm5ld2xpbmVzLnB1c2goZGlmZnN0cltpXS5zdWJzdHIoMSkpO1xuICAgICAgICAgIGRpZmZbMF0ub2xkbGluZXMucHVzaChkaWZmc3RyW2ldLnN1YnN0cigxKSk7XG4gICAgICAgIH0gZWxzZSBpZihkaWZmc3RyW2ldWzBdID09PSAnXFxcXCcpIHtcbiAgICAgICAgICBpZiAoZGlmZnN0cltpLTFdWzBdID09PSAnKycpIHtcbiAgICAgICAgICAgIHJlbUVPRk5MID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2UgaWYoZGlmZnN0cltpLTFdWzBdID09PSAnLScpIHtcbiAgICAgICAgICAgIGFkZEVPRk5MID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIHN0ciA9IG9sZFN0ci5zcGxpdCgnXFxuJyk7XG4gICAgICBmb3IgKHZhciBpID0gZGlmZi5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICB2YXIgZCA9IGRpZmZbaV07XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZC5vbGRsZW5ndGg7IGorKykge1xuICAgICAgICAgIGlmKHN0cltkLnN0YXJ0LTEral0gIT09IGQub2xkbGluZXNbal0pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnNwbGljZS5hcHBseShzdHIsW2Quc3RhcnQtMSwrZC5vbGRsZW5ndGhdLmNvbmNhdChkLm5ld2xpbmVzKSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZW1FT0ZOTCkge1xuICAgICAgICB3aGlsZSAoIXN0cltzdHIubGVuZ3RoLTFdKSB7XG4gICAgICAgICAgc3RyLnBvcCgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGFkZEVPRk5MKSB7XG4gICAgICAgIHN0ci5wdXNoKCcnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzdHIuam9pbignXFxuJyk7XG4gICAgfSxcblxuICAgIGNvbnZlcnRDaGFuZ2VzVG9YTUw6IGZ1bmN0aW9uKGNoYW5nZXMpe1xuICAgICAgdmFyIHJldCA9IFtdO1xuICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgY2hhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hhbmdlID0gY2hhbmdlc1tpXTtcbiAgICAgICAgaWYgKGNoYW5nZS5hZGRlZCkge1xuICAgICAgICAgIHJldC5wdXNoKCc8aW5zPicpO1xuICAgICAgICB9IGVsc2UgaWYgKGNoYW5nZS5yZW1vdmVkKSB7XG4gICAgICAgICAgcmV0LnB1c2goJzxkZWw+Jyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXQucHVzaChlc2NhcGVIVE1MKGNoYW5nZS52YWx1ZSkpO1xuXG4gICAgICAgIGlmIChjaGFuZ2UuYWRkZWQpIHtcbiAgICAgICAgICByZXQucHVzaCgnPC9pbnM+Jyk7XG4gICAgICAgIH0gZWxzZSBpZiAoY2hhbmdlLnJlbW92ZWQpIHtcbiAgICAgICAgICByZXQucHVzaCgnPC9kZWw+Jyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXQuam9pbignJyk7XG4gICAgfSxcblxuICAgIC8vIFNlZTogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2dvb2dsZS1kaWZmLW1hdGNoLXBhdGNoL3dpa2kvQVBJXG4gICAgY29udmVydENoYW5nZXNUb0RNUDogZnVuY3Rpb24oY2hhbmdlcyl7XG4gICAgICB2YXIgcmV0ID0gW10sIGNoYW5nZTtcbiAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGNoYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2hhbmdlID0gY2hhbmdlc1tpXTtcbiAgICAgICAgcmV0LnB1c2goWyhjaGFuZ2UuYWRkZWQgPyAxIDogY2hhbmdlLnJlbW92ZWQgPyAtMSA6IDApLCBjaGFuZ2UudmFsdWVdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICB9O1xufSkoKTtcblxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBKc0RpZmY7XG59XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4hZnVuY3Rpb24oX2Upe3ZhciBlPWZ1bmN0aW9uKCl7cmV0dXJuIF9lKClbXCJkZWZhdWx0XCJdfTtpZihcIm9iamVjdFwiPT10eXBlb2YgZXhwb3J0cyltb2R1bGUuZXhwb3J0cz1lKCk7ZWxzZSBpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQpZGVmaW5lKGUpO2Vsc2V7dmFyIGY7XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz9mPXdpbmRvdzpcInVuZGVmaW5lZFwiIT10eXBlb2YgZ2xvYmFsP2Y9Z2xvYmFsOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmJiYoZj1zZWxmKSxmLiQ9ZSgpfX0oZnVuY3Rpb24oKXt2YXIgZGVmaW5lLG1vZHVsZSxleHBvcnRzO3JldHVybiAoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9hcGlcIjtcbnZhciBleHRlbmQgPSBfZGVyZXFfKCcuL3V0aWwnKS5leHRlbmQ7XG52YXIgYXBpID0ge30sXG4gICAgYXBpTm9kZUxpc3QgPSB7fSxcbiAgICAkID0ge307XG52YXIgYXJyYXkgPSBfZGVyZXFfKCcuL2FycmF5Jyk7XG52YXIgYXR0ciA9IF9kZXJlcV8oJy4vYXR0cicpO1xudmFyIGNsYXNzTmFtZSA9IF9kZXJlcV8oJy4vY2xhc3MnKTtcbnZhciBkYXRhID0gX2RlcmVxXygnLi9kYXRhJyk7XG52YXIgZG9tID0gX2RlcmVxXygnLi9kb20nKTtcbnZhciBkb21fZXh0cmEgPSBfZGVyZXFfKCcuL2RvbV9leHRyYScpO1xudmFyIGV2ZW50ID0gX2RlcmVxXygnLi9ldmVudCcpO1xudmFyIGh0bWwgPSBfZGVyZXFfKCcuL2h0bWwnKTtcbnZhciBzZWxlY3RvciA9IF9kZXJlcV8oJy4vc2VsZWN0b3InKTtcbnZhciBzZWxlY3Rvcl9leHRyYSA9IF9kZXJlcV8oJy4vc2VsZWN0b3JfZXh0cmEnKTtcbmlmIChzZWxlY3RvciAhPT0gdW5kZWZpbmVkKSB7XG4gICQgPSBzZWxlY3Rvci4kO1xuICAkLm1hdGNoZXMgPSBzZWxlY3Rvci5tYXRjaGVzO1xuICBhcGkuZmluZCA9IHNlbGVjdG9yLmZpbmQ7XG59XG52YXIgbW9kZSA9IF9kZXJlcV8oJy4vbW9kZScpO1xuZXh0ZW5kKCQsIG1vZGUpO1xudmFyIG5vY29uZmxpY3QgPSBfZGVyZXFfKCcuL25vY29uZmxpY3QnKTtcbmV4dGVuZCgkLCBub2NvbmZsaWN0KTtcbmV4dGVuZChhcGksIGFycmF5LCBhdHRyLCBjbGFzc05hbWUsIGRhdGEsIGRvbSwgZG9tX2V4dHJhLCBldmVudCwgaHRtbCwgc2VsZWN0b3JfZXh0cmEpO1xuZXh0ZW5kKGFwaU5vZGVMaXN0LCBhcnJheSk7XG4kLnZlcnNpb24gPSAnMC43LjEnO1xuJC5leHRlbmQgPSBleHRlbmQ7XG4kLmZuID0gYXBpO1xuJC5mbkxpc3QgPSBhcGlOb2RlTGlzdDtcbnZhciAkX19kZWZhdWx0ID0gJDtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBkZWZhdWx0OiAkX19kZWZhdWx0LFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi9hcnJheVwiOjIsXCIuL2F0dHJcIjozLFwiLi9jbGFzc1wiOjQsXCIuL2RhdGFcIjo1LFwiLi9kb21cIjo2LFwiLi9kb21fZXh0cmFcIjo3LFwiLi9ldmVudFwiOjgsXCIuL2h0bWxcIjo5LFwiLi9tb2RlXCI6MTEsXCIuL25vY29uZmxpY3RcIjoxMixcIi4vc2VsZWN0b3JcIjoxMyxcIi4vc2VsZWN0b3JfZXh0cmFcIjoxNCxcIi4vdXRpbFwiOjE1fV0sMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9hcnJheVwiO1xudmFyIF9lYWNoID0gX2RlcmVxXygnLi91dGlsJykuZWFjaDtcbnZhciAkX18wID0gX2RlcmVxXygnLi9zZWxlY3RvcicpLFxuICAgICQgPSAkX18wLiQsXG4gICAgbWF0Y2hlcyA9ICRfXzAubWF0Y2hlcztcbnZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlO1xudmFyIGV2ZXJ5ID0gQXJyYXlQcm90by5ldmVyeTtcbmZ1bmN0aW9uIGZpbHRlcihzZWxlY3RvciwgdGhpc0FyZykge1xuICB2YXIgY2FsbGJhY2sgPSB0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicgPyBzZWxlY3RvciA6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gbWF0Y2hlcyhlbGVtZW50LCBzZWxlY3Rvcik7XG4gIH07XG4gIHJldHVybiAkKEFycmF5UHJvdG8uZmlsdGVyLmNhbGwodGhpcywgY2FsbGJhY2ssIHRoaXNBcmcpKTtcbn1cbmZ1bmN0aW9uIGZvckVhY2goY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgcmV0dXJuIF9lYWNoKHRoaXMsIGNhbGxiYWNrLCB0aGlzQXJnKTtcbn1cbnZhciBlYWNoID0gZm9yRWFjaDtcbnZhciBpbmRleE9mID0gQXJyYXlQcm90by5pbmRleE9mO1xudmFyIG1hcCA9IEFycmF5UHJvdG8ubWFwO1xudmFyIHBvcCA9IEFycmF5UHJvdG8ucG9wO1xudmFyIHB1c2ggPSBBcnJheVByb3RvLnB1c2g7XG5mdW5jdGlvbiByZXZlcnNlKCkge1xuICB2YXIgZWxlbWVudHMgPSBBcnJheVByb3RvLnNsaWNlLmNhbGwodGhpcyk7XG4gIHJldHVybiAkKEFycmF5UHJvdG8ucmV2ZXJzZS5jYWxsKGVsZW1lbnRzKSk7XG59XG52YXIgc2hpZnQgPSBBcnJheVByb3RvLnNoaWZ0O1xudmFyIHNvbWUgPSBBcnJheVByb3RvLnNvbWU7XG52YXIgdW5zaGlmdCA9IEFycmF5UHJvdG8udW5zaGlmdDtcbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBlYWNoOiBlYWNoLFxuICBldmVyeTogZXZlcnksXG4gIGZpbHRlcjogZmlsdGVyLFxuICBmb3JFYWNoOiBmb3JFYWNoLFxuICBpbmRleE9mOiBpbmRleE9mLFxuICBtYXA6IG1hcCxcbiAgcG9wOiBwb3AsXG4gIHB1c2g6IHB1c2gsXG4gIHJldmVyc2U6IHJldmVyc2UsXG4gIHNoaWZ0OiBzaGlmdCxcbiAgc29tZTogc29tZSxcbiAgdW5zaGlmdDogdW5zaGlmdCxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vc2VsZWN0b3JcIjoxMyxcIi4vdXRpbFwiOjE1fV0sMzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9hdHRyXCI7XG52YXIgZWFjaCA9IF9kZXJlcV8oJy4vdXRpbCcpLmVhY2g7XG5mdW5jdGlvbiBhdHRyKGtleSwgdmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB2YXIgZWxlbWVudCA9IHRoaXMubm9kZVR5cGUgPyB0aGlzIDogdGhpc1swXTtcbiAgICByZXR1cm4gZWxlbWVudCA/IGVsZW1lbnQuZ2V0QXR0cmlidXRlKGtleSkgOiB1bmRlZmluZWQ7XG4gIH1cbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnKSB7XG4gICAgICBmb3IgKHZhciBhdHRyIGluIGtleSkge1xuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShhdHRyLCBrZXlbYXR0cl0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIHJlbW92ZUF0dHIoa2V5KSB7XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBhdHRyOiBhdHRyLFxuICByZW1vdmVBdHRyOiByZW1vdmVBdHRyLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi91dGlsXCI6MTV9XSw0OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL2NsYXNzXCI7XG52YXIgJF9fMCA9IF9kZXJlcV8oJy4vdXRpbCcpLFxuICAgIG1ha2VJdGVyYWJsZSA9ICRfXzAubWFrZUl0ZXJhYmxlLFxuICAgIGVhY2ggPSAkX18wLmVhY2g7XG5mdW5jdGlvbiBhZGRDbGFzcyh2YWx1ZSkge1xuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQodmFsdWUpO1xuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiByZW1vdmVDbGFzcyh2YWx1ZSkge1xuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUodmFsdWUpO1xuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiB0b2dnbGVDbGFzcyh2YWx1ZSkge1xuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUodmFsdWUpO1xuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBoYXNDbGFzcyh2YWx1ZSkge1xuICByZXR1cm4gbWFrZUl0ZXJhYmxlKHRoaXMpLnNvbWUoZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIHJldHVybiBlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyh2YWx1ZSk7XG4gIH0pO1xufVxuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFkZENsYXNzOiBhZGRDbGFzcyxcbiAgcmVtb3ZlQ2xhc3M6IHJlbW92ZUNsYXNzLFxuICB0b2dnbGVDbGFzczogdG9nZ2xlQ2xhc3MsXG4gIGhhc0NsYXNzOiBoYXNDbGFzcyxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vdXRpbFwiOjE1fV0sNTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9kYXRhXCI7XG52YXIgZWFjaCA9IF9kZXJlcV8oJy4vdXRpbCcpLmVhY2g7XG52YXIgZGF0YUtleVByb3AgPSAnX19kb210YXN0aWNfZGF0YV9fJztcbmZ1bmN0aW9uIGRhdGEoa2V5LCB2YWx1ZSkge1xuICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgIHZhciBlbGVtZW50ID0gdGhpcy5ub2RlVHlwZSA/IHRoaXMgOiB0aGlzWzBdO1xuICAgIHJldHVybiBlbGVtZW50ICYmIGVsZW1lbnRbZGF0YUtleVByb3BdID8gZWxlbWVudFtkYXRhS2V5UHJvcF1ba2V5XSA6IHVuZGVmaW5lZDtcbiAgfVxuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50W2RhdGFLZXlQcm9wXSA9IGVsZW1lbnRbZGF0YUtleVByb3BdIHx8IHt9O1xuICAgIGVsZW1lbnRbZGF0YUtleVByb3BdW2tleV0gPSB2YWx1ZTtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gcHJvcChrZXksIHZhbHVlKSB7XG4gIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJyAmJiB0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgdmFyIGVsZW1lbnQgPSB0aGlzLm5vZGVUeXBlID8gdGhpcyA6IHRoaXNbMF07XG4gICAgcmV0dXJuIGVsZW1lbnQgJiYgZWxlbWVudCA/IGVsZW1lbnRba2V5XSA6IHVuZGVmaW5lZDtcbiAgfVxuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50W2tleV0gPSB2YWx1ZTtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGRhdGE6IGRhdGEsXG4gIHByb3A6IHByb3AsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL3V0aWxcIjoxNX1dLDY6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvZG9tXCI7XG52YXIgdG9BcnJheSA9IF9kZXJlcV8oJy4vdXRpbCcpLnRvQXJyYXk7XG5mdW5jdGlvbiBhcHBlbmQoZWxlbWVudCkge1xuICBpZiAodGhpcyBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlZW5kJywgZWxlbWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGVsZW1lbnRzID0gZWxlbWVudCBpbnN0YW5jZW9mIE5vZGVMaXN0ID8gdG9BcnJheShlbGVtZW50KSA6IGVsZW1lbnQ7XG4gICAgICAgIGVsZW1lbnRzLmZvckVhY2godGhpcy5hcHBlbmRDaGlsZC5iaW5kKHRoaXMpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICB3aGlsZSAobC0tKSB7XG4gICAgICB2YXIgZWxtID0gbCA9PT0gMCA/IGVsZW1lbnQgOiBfY2xvbmUoZWxlbWVudCk7XG4gICAgICBhcHBlbmQuY2FsbCh0aGlzW2xdLCBlbG0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIHByZXBlbmQoZWxlbWVudCkge1xuICBpZiAodGhpcyBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLmluc2VydEFkamFjZW50SFRNTCgnYWZ0ZXJiZWdpbicsIGVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgdGhpcy5pbnNlcnRCZWZvcmUoZWxlbWVudCwgdGhpcy5maXJzdENoaWxkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBlbGVtZW50cyA9IGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlTGlzdCA/IHRvQXJyYXkoZWxlbWVudCkgOiBlbGVtZW50O1xuICAgICAgICBlbGVtZW50cy5yZXZlcnNlKCkuZm9yRWFjaChwcmVwZW5kLmJpbmQodGhpcykpO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgbCA9IHRoaXMubGVuZ3RoO1xuICAgIHdoaWxlIChsLS0pIHtcbiAgICAgIHZhciBlbG0gPSBsID09PSAwID8gZWxlbWVudCA6IF9jbG9uZShlbGVtZW50KTtcbiAgICAgIHByZXBlbmQuY2FsbCh0aGlzW2xdLCBlbG0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIGJlZm9yZShlbGVtZW50KSB7XG4gIGlmICh0aGlzIGluc3RhbmNlb2YgTm9kZSkge1xuICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRoaXMuaW5zZXJ0QWRqYWNlbnRIVE1MKCdiZWZvcmViZWdpbicsIGVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgdGhpcy5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbGVtZW50LCB0aGlzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBlbGVtZW50cyA9IGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlTGlzdCA/IHRvQXJyYXkoZWxlbWVudCkgOiBlbGVtZW50O1xuICAgICAgICBlbGVtZW50cy5mb3JFYWNoKGJlZm9yZS5iaW5kKHRoaXMpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICB3aGlsZSAobC0tKSB7XG4gICAgICB2YXIgZWxtID0gbCA9PT0gMCA/IGVsZW1lbnQgOiBfY2xvbmUoZWxlbWVudCk7XG4gICAgICBiZWZvcmUuY2FsbCh0aGlzW2xdLCBlbG0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIGFmdGVyKGVsZW1lbnQpIHtcbiAgaWYgKHRoaXMgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyZW5kJywgZWxlbWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgICB0aGlzLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGVsZW1lbnQsIHRoaXMubmV4dFNpYmxpbmcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGVsZW1lbnRzID0gZWxlbWVudCBpbnN0YW5jZW9mIE5vZGVMaXN0ID8gdG9BcnJheShlbGVtZW50KSA6IGVsZW1lbnQ7XG4gICAgICAgIGVsZW1lbnRzLnJldmVyc2UoKS5mb3JFYWNoKGFmdGVyLmJpbmQodGhpcykpO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgbCA9IHRoaXMubGVuZ3RoO1xuICAgIHdoaWxlIChsLS0pIHtcbiAgICAgIHZhciBlbG0gPSBsID09PSAwID8gZWxlbWVudCA6IF9jbG9uZShlbGVtZW50KTtcbiAgICAgIGFmdGVyLmNhbGwodGhpc1tsXSwgZWxtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBjbG9uZSgpIHtcbiAgcmV0dXJuICQoX2Nsb25lKHRoaXMpKTtcbn1cbmZ1bmN0aW9uIF9jbG9uZShlbGVtZW50KSB7XG4gIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfSBlbHNlIGlmIChlbGVtZW50IGluc3RhbmNlb2YgTm9kZSkge1xuICAgIHJldHVybiBlbGVtZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgfSBlbHNlIGlmICgnbGVuZ3RoJyBpbiBlbGVtZW50KSB7XG4gICAgcmV0dXJuIFtdLm1hcC5jYWxsKGVsZW1lbnQsIGZ1bmN0aW9uKGVsKSB7XG4gICAgICByZXR1cm4gZWwuY2xvbmVOb2RlKHRydWUpO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiBlbGVtZW50O1xufVxuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFwcGVuZDogYXBwZW5kLFxuICBwcmVwZW5kOiBwcmVwZW5kLFxuICBiZWZvcmU6IGJlZm9yZSxcbiAgYWZ0ZXI6IGFmdGVyLFxuICBjbG9uZTogY2xvbmUsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL3V0aWxcIjoxNX1dLDc6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvZG9tX2V4dHJhXCI7XG52YXIgZWFjaCA9IF9kZXJlcV8oJy4vdXRpbCcpLmVhY2g7XG52YXIgJF9fMCA9IF9kZXJlcV8oJy4vZG9tJyksXG4gICAgYXBwZW5kID0gJF9fMC5hcHBlbmQsXG4gICAgYmVmb3JlID0gJF9fMC5iZWZvcmUsXG4gICAgYWZ0ZXIgPSAkX18wLmFmdGVyO1xudmFyICQgPSBfZGVyZXFfKCcuL3NlbGVjdG9yJykuJDtcbmZ1bmN0aW9uIGFwcGVuZFRvKGVsZW1lbnQpIHtcbiAgdmFyIGNvbnRleHQgPSB0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycgPyAkKGVsZW1lbnQpIDogZWxlbWVudDtcbiAgYXBwZW5kLmNhbGwoY29udGV4dCwgdGhpcyk7XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gZW1wdHkoKSB7XG4gIHJldHVybiBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LmlubmVySFRNTCA9ICcnO1xuICB9KTtcbn1cbmZ1bmN0aW9uIHJlbW92ZSgpIHtcbiAgcmV0dXJuIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGlmIChlbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgICAgIGVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbGVtZW50KTtcbiAgICB9XG4gIH0pO1xufVxuZnVuY3Rpb24gcmVwbGFjZVdpdGgoKSB7XG4gIHJldHVybiBiZWZvcmUuYXBwbHkodGhpcywgYXJndW1lbnRzKS5yZW1vdmUoKTtcbn1cbmZ1bmN0aW9uIHRleHQodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdGhpc1swXS50ZXh0Q29udGVudDtcbiAgfVxuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnRleHRDb250ZW50ID0gJycgKyB2YWx1ZTtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gdmFsKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHRoaXNbMF0udmFsdWU7XG4gIH1cbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgZWxlbWVudC52YWx1ZSA9IHZhbHVlO1xuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYXBwZW5kVG86IGFwcGVuZFRvLFxuICBlbXB0eTogZW1wdHksXG4gIHJlbW92ZTogcmVtb3ZlLFxuICByZXBsYWNlV2l0aDogcmVwbGFjZVdpdGgsXG4gIHRleHQ6IHRleHQsXG4gIHZhbDogdmFsLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi9kb21cIjo2LFwiLi9zZWxlY3RvclwiOjEzLFwiLi91dGlsXCI6MTV9XSw4OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL2V2ZW50XCI7XG52YXIgJF9fMCA9IF9kZXJlcV8oJy4vdXRpbCcpLFxuICAgIGdsb2JhbCA9ICRfXzAuZ2xvYmFsLFxuICAgIGVhY2ggPSAkX18wLmVhY2g7XG52YXIgbWF0Y2hlcyA9IF9kZXJlcV8oJy4vc2VsZWN0b3InKS5tYXRjaGVzO1xuZnVuY3Rpb24gb24oZXZlbnROYW1lcywgc2VsZWN0b3IsIGhhbmRsZXIsIHVzZUNhcHR1cmUpIHtcbiAgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGhhbmRsZXIgPSBzZWxlY3RvcjtcbiAgICBzZWxlY3RvciA9IG51bGw7XG4gIH1cbiAgdmFyIHBhcnRzLFxuICAgICAgbmFtZXNwYWNlLFxuICAgICAgZXZlbnRMaXN0ZW5lcjtcbiAgZXZlbnROYW1lcy5zcGxpdCgnICcpLmZvckVhY2goZnVuY3Rpb24oZXZlbnROYW1lKSB7XG4gICAgcGFydHMgPSBldmVudE5hbWUuc3BsaXQoJy4nKTtcbiAgICBldmVudE5hbWUgPSBwYXJ0c1swXSB8fCBudWxsO1xuICAgIG5hbWVzcGFjZSA9IHBhcnRzWzFdIHx8IG51bGw7XG4gICAgZXZlbnRMaXN0ZW5lciA9IHByb3h5SGFuZGxlcihoYW5kbGVyKTtcbiAgICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIGlmIChzZWxlY3Rvcikge1xuICAgICAgICBldmVudExpc3RlbmVyID0gZGVsZWdhdGVIYW5kbGVyLmJpbmQoZWxlbWVudCwgc2VsZWN0b3IsIGhhbmRsZXIpO1xuICAgICAgfVxuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZXZlbnRMaXN0ZW5lciwgdXNlQ2FwdHVyZSB8fCBmYWxzZSk7XG4gICAgICBnZXRIYW5kbGVycyhlbGVtZW50KS5wdXNoKHtcbiAgICAgICAgZXZlbnROYW1lOiBldmVudE5hbWUsXG4gICAgICAgIGhhbmRsZXI6IGhhbmRsZXIsXG4gICAgICAgIGV2ZW50TGlzdGVuZXI6IGV2ZW50TGlzdGVuZXIsXG4gICAgICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcbiAgICAgICAgbmFtZXNwYWNlOiBuYW1lc3BhY2VcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LCB0aGlzKTtcbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBvZmYoKSB7XG4gIHZhciBldmVudE5hbWVzID0gYXJndW1lbnRzWzBdICE9PSAodm9pZCAwKSA/IGFyZ3VtZW50c1swXSA6ICcnO1xuICB2YXIgc2VsZWN0b3IgPSBhcmd1bWVudHNbMV07XG4gIHZhciBoYW5kbGVyID0gYXJndW1lbnRzWzJdO1xuICB2YXIgdXNlQ2FwdHVyZSA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGhhbmRsZXIgPSBzZWxlY3RvcjtcbiAgICBzZWxlY3RvciA9IG51bGw7XG4gIH1cbiAgdmFyIHBhcnRzLFxuICAgICAgbmFtZXNwYWNlLFxuICAgICAgaGFuZGxlcnM7XG4gIGV2ZW50TmFtZXMuc3BsaXQoJyAnKS5mb3JFYWNoKGZ1bmN0aW9uKGV2ZW50TmFtZSkge1xuICAgIHBhcnRzID0gZXZlbnROYW1lLnNwbGl0KCcuJyk7XG4gICAgZXZlbnROYW1lID0gcGFydHNbMF0gfHwgbnVsbDtcbiAgICBuYW1lc3BhY2UgPSBwYXJ0c1sxXSB8fCBudWxsO1xuICAgIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgaGFuZGxlcnMgPSBnZXRIYW5kbGVycyhlbGVtZW50KTtcbiAgICAgIGlmICghZXZlbnROYW1lICYmICFuYW1lc3BhY2UgJiYgIXNlbGVjdG9yICYmICFoYW5kbGVyKSB7XG4gICAgICAgIGVhY2goaGFuZGxlcnMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoaXRlbS5ldmVudE5hbWUsIGl0ZW0uZXZlbnRMaXN0ZW5lciwgdXNlQ2FwdHVyZSB8fCBmYWxzZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBjbGVhckhhbmRsZXJzKGVsZW1lbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWFjaChoYW5kbGVycy5maWx0ZXIoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgIHJldHVybiAoKCFldmVudE5hbWUgfHwgaXRlbS5ldmVudE5hbWUgPT09IGV2ZW50TmFtZSkgJiYgKCFuYW1lc3BhY2UgfHwgaXRlbS5uYW1lc3BhY2UgPT09IG5hbWVzcGFjZSkgJiYgKCFoYW5kbGVyIHx8IGl0ZW0uaGFuZGxlciA9PT0gaGFuZGxlcikgJiYgKCFzZWxlY3RvciB8fCBpdGVtLnNlbGVjdG9yID09PSBzZWxlY3RvcikpO1xuICAgICAgICB9KSwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihpdGVtLmV2ZW50TmFtZSwgaXRlbS5ldmVudExpc3RlbmVyLCB1c2VDYXB0dXJlIHx8IGZhbHNlKTtcbiAgICAgICAgICBoYW5kbGVycy5zcGxpY2UoaGFuZGxlcnMuaW5kZXhPZihpdGVtKSwgMSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoaGFuZGxlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgY2xlYXJIYW5kbGVycyhlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9LCB0aGlzKTtcbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBkZWxlZ2F0ZShzZWxlY3RvciwgZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gIHJldHVybiBvbi5jYWxsKHRoaXMsIGV2ZW50TmFtZSwgc2VsZWN0b3IsIGhhbmRsZXIpO1xufVxuZnVuY3Rpb24gdW5kZWxlZ2F0ZShzZWxlY3RvciwgZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gIHJldHVybiBvZmYuY2FsbCh0aGlzLCBldmVudE5hbWUsIHNlbGVjdG9yLCBoYW5kbGVyKTtcbn1cbmZ1bmN0aW9uIHRyaWdnZXIodHlwZSwgZGF0YSkge1xuICB2YXIgcGFyYW1zID0gYXJndW1lbnRzWzJdICE9PSAodm9pZCAwKSA/IGFyZ3VtZW50c1syXSA6IHt9O1xuICBwYXJhbXMuYnViYmxlcyA9IHR5cGVvZiBwYXJhbXMuYnViYmxlcyA9PT0gJ2Jvb2xlYW4nID8gcGFyYW1zLmJ1YmJsZXMgOiB0cnVlO1xuICBwYXJhbXMuY2FuY2VsYWJsZSA9IHR5cGVvZiBwYXJhbXMuY2FuY2VsYWJsZSA9PT0gJ2Jvb2xlYW4nID8gcGFyYW1zLmNhbmNlbGFibGUgOiB0cnVlO1xuICBwYXJhbXMucHJldmVudERlZmF1bHQgPSB0eXBlb2YgcGFyYW1zLnByZXZlbnREZWZhdWx0ID09PSAnYm9vbGVhbicgPyBwYXJhbXMucHJldmVudERlZmF1bHQgOiBmYWxzZTtcbiAgcGFyYW1zLmRldGFpbCA9IGRhdGE7XG4gIHZhciBldmVudCA9IG5ldyBDdXN0b21FdmVudCh0eXBlLCBwYXJhbXMpO1xuICBldmVudC5fcHJldmVudERlZmF1bHQgPSBwYXJhbXMucHJldmVudERlZmF1bHQ7XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGlmICghcGFyYW1zLmJ1YmJsZXMgfHwgaXNFdmVudEJ1YmJsaW5nSW5EZXRhY2hlZFRyZWUgfHwgaXNBdHRhY2hlZFRvRG9jdW1lbnQoZWxlbWVudCkpIHtcbiAgICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyaWdnZXJGb3JQYXRoKGVsZW1lbnQsIHR5cGUsIHBhcmFtcyk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiB0cmlnZ2VySGFuZGxlcih0eXBlLCBkYXRhKSB7XG4gIGlmICh0aGlzWzBdKSB7XG4gICAgdHJpZ2dlci5jYWxsKHRoaXNbMF0sIHR5cGUsIGRhdGEsIHtcbiAgICAgIGJ1YmJsZXM6IGZhbHNlLFxuICAgICAgcHJldmVudERlZmF1bHQ6IHRydWVcbiAgICB9KTtcbiAgfVxufVxuZnVuY3Rpb24gcmVhZHkoaGFuZGxlcikge1xuICBpZiAoL2NvbXBsZXRlfGxvYWRlZHxpbnRlcmFjdGl2ZS8udGVzdChkb2N1bWVudC5yZWFkeVN0YXRlKSAmJiBkb2N1bWVudC5ib2R5KSB7XG4gICAgaGFuZGxlcigpO1xuICB9IGVsc2Uge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBoYW5kbGVyLCBmYWxzZSk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBpc0F0dGFjaGVkVG9Eb2N1bWVudChlbGVtZW50KSB7XG4gIGlmIChlbGVtZW50ID09PSB3aW5kb3cgfHwgZWxlbWVudCA9PT0gZG9jdW1lbnQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICB2YXIgY29udGFpbmVyID0gZWxlbWVudC5vd25lckRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgaWYgKGNvbnRhaW5lci5jb250YWlucykge1xuICAgIHJldHVybiBjb250YWluZXIuY29udGFpbnMoZWxlbWVudCk7XG4gIH0gZWxzZSBpZiAoY29udGFpbmVyLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKSB7XG4gICAgcmV0dXJuICEoY29udGFpbmVyLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKGVsZW1lbnQpICYgTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9ESVNDT05ORUNURUQpO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbmZ1bmN0aW9uIHRyaWdnZXJGb3JQYXRoKGVsZW1lbnQsIHR5cGUpIHtcbiAgdmFyIHBhcmFtcyA9IGFyZ3VtZW50c1syXSAhPT0gKHZvaWQgMCkgPyBhcmd1bWVudHNbMl0gOiB7fTtcbiAgcGFyYW1zLmJ1YmJsZXMgPSBmYWxzZTtcbiAgdmFyIGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KHR5cGUsIHBhcmFtcyk7XG4gIGV2ZW50Ll90YXJnZXQgPSBlbGVtZW50O1xuICBkbyB7XG4gICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgfSB3aGlsZSAoZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSk7XG59XG52YXIgZXZlbnRLZXlQcm9wID0gJ19fZG9tdGFzdGljX2V2ZW50X18nO1xudmFyIGlkID0gMTtcbnZhciBoYW5kbGVycyA9IHt9O1xudmFyIHVudXNlZEtleXMgPSBbXTtcbmZ1bmN0aW9uIGdldEhhbmRsZXJzKGVsZW1lbnQpIHtcbiAgaWYgKCFlbGVtZW50W2V2ZW50S2V5UHJvcF0pIHtcbiAgICBlbGVtZW50W2V2ZW50S2V5UHJvcF0gPSB1bnVzZWRLZXlzLmxlbmd0aCA9PT0gMCA/ICsraWQgOiB1bnVzZWRLZXlzLnBvcCgpO1xuICB9XG4gIHZhciBrZXkgPSBlbGVtZW50W2V2ZW50S2V5UHJvcF07XG4gIHJldHVybiBoYW5kbGVyc1trZXldIHx8IChoYW5kbGVyc1trZXldID0gW10pO1xufVxuZnVuY3Rpb24gY2xlYXJIYW5kbGVycyhlbGVtZW50KSB7XG4gIHZhciBrZXkgPSBlbGVtZW50W2V2ZW50S2V5UHJvcF07XG4gIGlmIChoYW5kbGVyc1trZXldKSB7XG4gICAgaGFuZGxlcnNba2V5XSA9IG51bGw7XG4gICAgZWxlbWVudFtrZXldID0gbnVsbDtcbiAgICB1bnVzZWRLZXlzLnB1c2goa2V5KTtcbiAgfVxufVxuZnVuY3Rpb24gcHJveHlIYW5kbGVyKGhhbmRsZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgaGFuZGxlcihhdWdtZW50RXZlbnQoZXZlbnQpLCBldmVudC5kZXRhaWwpO1xuICB9O1xufVxudmFyIGF1Z21lbnRFdmVudCA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGV2ZW50TWV0aG9kcyA9IHtcbiAgICBwcmV2ZW50RGVmYXVsdDogJ2lzRGVmYXVsdFByZXZlbnRlZCcsXG4gICAgc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uOiAnaXNJbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQnLFxuICAgIHN0b3BQcm9wYWdhdGlvbjogJ2lzUHJvcGFnYXRpb25TdG9wcGVkJ1xuICB9LFxuICAgICAgbm9vcCA9IChmdW5jdGlvbigpIHt9KSxcbiAgICAgIHJldHVyblRydWUgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSksXG4gICAgICByZXR1cm5GYWxzZSA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSk7XG4gIHJldHVybiBmdW5jdGlvbihldmVudCkge1xuICAgIGZvciAodmFyIG1ldGhvZE5hbWUgaW4gZXZlbnRNZXRob2RzKSB7XG4gICAgICAoZnVuY3Rpb24obWV0aG9kTmFtZSwgdGVzdE1ldGhvZE5hbWUsIG9yaWdpbmFsTWV0aG9kKSB7XG4gICAgICAgIGV2ZW50W21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdGhpc1t0ZXN0TWV0aG9kTmFtZV0gPSByZXR1cm5UcnVlO1xuICAgICAgICAgIHJldHVybiBvcmlnaW5hbE1ldGhvZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgICAgICBldmVudFt0ZXN0TWV0aG9kTmFtZV0gPSByZXR1cm5GYWxzZTtcbiAgICAgIH0obWV0aG9kTmFtZSwgZXZlbnRNZXRob2RzW21ldGhvZE5hbWVdLCBldmVudFttZXRob2ROYW1lXSB8fCBub29wKSk7XG4gICAgfVxuICAgIGlmIChldmVudC5fcHJldmVudERlZmF1bHQpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuICAgIHJldHVybiBldmVudDtcbiAgfTtcbn0pKCk7XG5mdW5jdGlvbiBkZWxlZ2F0ZUhhbmRsZXIoc2VsZWN0b3IsIGhhbmRsZXIsIGV2ZW50KSB7XG4gIHZhciBldmVudFRhcmdldCA9IGV2ZW50Ll90YXJnZXQgfHwgZXZlbnQudGFyZ2V0O1xuICBpZiAobWF0Y2hlcyhldmVudFRhcmdldCwgc2VsZWN0b3IpKSB7XG4gICAgaWYgKCFldmVudC5jdXJyZW50VGFyZ2V0KSB7XG4gICAgICBldmVudC5jdXJyZW50VGFyZ2V0ID0gZXZlbnRUYXJnZXQ7XG4gICAgfVxuICAgIGhhbmRsZXIuY2FsbChldmVudFRhcmdldCwgZXZlbnQpO1xuICB9XG59XG4oZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIEN1c3RvbUV2ZW50KGV2ZW50KSB7XG4gICAgdmFyIHBhcmFtcyA9IGFyZ3VtZW50c1sxXSAhPT0gKHZvaWQgMCkgPyBhcmd1bWVudHNbMV0gOiB7XG4gICAgICBidWJibGVzOiBmYWxzZSxcbiAgICAgIGNhbmNlbGFibGU6IGZhbHNlLFxuICAgICAgZGV0YWlsOiB1bmRlZmluZWRcbiAgICB9O1xuICAgIHZhciBjdXN0b21FdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGN1c3RvbUV2ZW50LmluaXRDdXN0b21FdmVudChldmVudCwgcGFyYW1zLmJ1YmJsZXMsIHBhcmFtcy5jYW5jZWxhYmxlLCBwYXJhbXMuZGV0YWlsKTtcbiAgICByZXR1cm4gY3VzdG9tRXZlbnQ7XG4gIH1cbiAgQ3VzdG9tRXZlbnQucHJvdG90eXBlID0gZ2xvYmFsLkN1c3RvbUV2ZW50ICYmIGdsb2JhbC5DdXN0b21FdmVudC5wcm90b3R5cGU7XG4gIGdsb2JhbC5DdXN0b21FdmVudCA9IEN1c3RvbUV2ZW50O1xufSkoKTtcbnZhciBpc0V2ZW50QnViYmxpbmdJbkRldGFjaGVkVHJlZSA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGlzQnViYmxpbmcgPSBmYWxzZSxcbiAgICAgIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcbiAgaWYgKGRvYykge1xuICAgIHZhciBwYXJlbnQgPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICAgIGNoaWxkID0gcGFyZW50LmNsb25lTm9kZSgpO1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZChjaGlsZCk7XG4gICAgcGFyZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2UnLCBmdW5jdGlvbigpIHtcbiAgICAgIGlzQnViYmxpbmcgPSB0cnVlO1xuICAgIH0pO1xuICAgIGNoaWxkLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCdlJywge2J1YmJsZXM6IHRydWV9KSk7XG4gIH1cbiAgcmV0dXJuIGlzQnViYmxpbmc7XG59KSgpO1xudmFyIGJpbmQgPSBvbixcbiAgICB1bmJpbmQgPSBvZmY7XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgb246IG9uLFxuICBvZmY6IG9mZixcbiAgZGVsZWdhdGU6IGRlbGVnYXRlLFxuICB1bmRlbGVnYXRlOiB1bmRlbGVnYXRlLFxuICB0cmlnZ2VyOiB0cmlnZ2VyLFxuICB0cmlnZ2VySGFuZGxlcjogdHJpZ2dlckhhbmRsZXIsXG4gIHJlYWR5OiByZWFkeSxcbiAgYmluZDogYmluZCxcbiAgdW5iaW5kOiB1bmJpbmQsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL3NlbGVjdG9yXCI6MTMsXCIuL3V0aWxcIjoxNX1dLDk6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvaHRtbFwiO1xudmFyIGVhY2ggPSBfZGVyZXFfKCcuL3V0aWwnKS5lYWNoO1xuZnVuY3Rpb24gaHRtbChmcmFnbWVudCkge1xuICBpZiAodHlwZW9mIGZyYWdtZW50ICE9PSAnc3RyaW5nJykge1xuICAgIHZhciBlbGVtZW50ID0gdGhpcy5ub2RlVHlwZSA/IHRoaXMgOiB0aGlzWzBdO1xuICAgIHJldHVybiBlbGVtZW50ID8gZWxlbWVudC5pbm5lckhUTUwgOiB1bmRlZmluZWQ7XG4gIH1cbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgZWxlbWVudC5pbm5lckhUTUwgPSBmcmFnbWVudDtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGh0bWw6IGh0bWwsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL3V0aWxcIjoxNX1dLDEwOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL2luZGV4XCI7XG52YXIgJCA9IF9kZXJlcV8oJy4vYXBpJykuZGVmYXVsdDtcbnZhciAkX19kZWZhdWx0ID0gJDtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBkZWZhdWx0OiAkX19kZWZhdWx0LFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi9hcGlcIjoxfV0sMTE6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvbW9kZVwiO1xudmFyIGdsb2JhbCA9IF9kZXJlcV8oJy4vdXRpbCcpLmdsb2JhbDtcbnZhciBpc05hdGl2ZSA9IGZhbHNlO1xuZnVuY3Rpb24gbmF0aXZlKCkge1xuICB2YXIgZ29OYXRpdmUgPSBhcmd1bWVudHNbMF0gIT09ICh2b2lkIDApID8gYXJndW1lbnRzWzBdIDogdHJ1ZTtcbiAgdmFyIHdhc05hdGl2ZSA9IGlzTmF0aXZlO1xuICBpc05hdGl2ZSA9IGdvTmF0aXZlO1xuICBpZiAoZ2xvYmFsLiQpIHtcbiAgICBnbG9iYWwuJC5pc05hdGl2ZSA9IGlzTmF0aXZlO1xuICB9XG4gIGlmICghd2FzTmF0aXZlICYmIGlzTmF0aXZlKSB7XG4gICAgYXVnbWVudE5hdGl2ZVByb3RvdHlwZXModGhpcy5mbiwgdGhpcy5mbkxpc3QpO1xuICB9XG4gIGlmICh3YXNOYXRpdmUgJiYgIWlzTmF0aXZlKSB7XG4gICAgdW5hdWdtZW50TmF0aXZlUHJvdG90eXBlcyh0aGlzLmZuLCB0aGlzLmZuTGlzdCk7XG4gIH1cbiAgcmV0dXJuIGlzTmF0aXZlO1xufVxudmFyIE5vZGVQcm90byA9IHR5cGVvZiBOb2RlICE9PSAndW5kZWZpbmVkJyAmJiBOb2RlLnByb3RvdHlwZSxcbiAgICBOb2RlTGlzdFByb3RvID0gdHlwZW9mIE5vZGVMaXN0ICE9PSAndW5kZWZpbmVkJyAmJiBOb2RlTGlzdC5wcm90b3R5cGU7XG5mdW5jdGlvbiBhdWdtZW50KG9iaiwga2V5LCB2YWx1ZSkge1xuICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7XG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICAgIH0pO1xuICB9XG59XG52YXIgdW5hdWdtZW50ID0gKGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gIGRlbGV0ZSBvYmpba2V5XTtcbn0pO1xuZnVuY3Rpb24gYXVnbWVudE5hdGl2ZVByb3RvdHlwZXMobWV0aG9kc05vZGUsIG1ldGhvZHNOb2RlTGlzdCkge1xuICB2YXIga2V5O1xuICBmb3IgKGtleSBpbiBtZXRob2RzTm9kZSkge1xuICAgIGF1Z21lbnQoTm9kZVByb3RvLCBrZXksIG1ldGhvZHNOb2RlW2tleV0pO1xuICAgIGF1Z21lbnQoTm9kZUxpc3RQcm90bywga2V5LCBtZXRob2RzTm9kZVtrZXldKTtcbiAgfVxuICBmb3IgKGtleSBpbiBtZXRob2RzTm9kZUxpc3QpIHtcbiAgICBhdWdtZW50KE5vZGVMaXN0UHJvdG8sIGtleSwgbWV0aG9kc05vZGVMaXN0W2tleV0pO1xuICB9XG59XG5mdW5jdGlvbiB1bmF1Z21lbnROYXRpdmVQcm90b3R5cGVzKG1ldGhvZHNOb2RlLCBtZXRob2RzTm9kZUxpc3QpIHtcbiAgdmFyIGtleTtcbiAgZm9yIChrZXkgaW4gbWV0aG9kc05vZGUpIHtcbiAgICB1bmF1Z21lbnQoTm9kZVByb3RvLCBrZXkpO1xuICAgIHVuYXVnbWVudChOb2RlTGlzdFByb3RvLCBrZXkpO1xuICB9XG4gIGZvciAoa2V5IGluIG1ldGhvZHNOb2RlTGlzdCkge1xuICAgIHVuYXVnbWVudChOb2RlTGlzdFByb3RvLCBrZXkpO1xuICB9XG59XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaXNOYXRpdmU6IGlzTmF0aXZlLFxuICBuYXRpdmU6IG5hdGl2ZSxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vdXRpbFwiOjE1fV0sMTI6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvbm9jb25mbGljdFwiO1xudmFyIGdsb2JhbCA9IF9kZXJlcV8oJy4vdXRpbCcpLmdsb2JhbDtcbnZhciBwcmV2aW91c0xpYiA9IGdsb2JhbC4kO1xuZnVuY3Rpb24gbm9Db25mbGljdCgpIHtcbiAgZ2xvYmFsLiQgPSBwcmV2aW91c0xpYjtcbiAgcmV0dXJuIHRoaXM7XG59XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbm9Db25mbGljdDogbm9Db25mbGljdCxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vdXRpbFwiOjE1fV0sMTM6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvc2VsZWN0b3JcIjtcbnZhciAkX18wID0gX2RlcmVxXygnLi91dGlsJyksXG4gICAgZ2xvYmFsID0gJF9fMC5nbG9iYWwsXG4gICAgbWFrZUl0ZXJhYmxlID0gJF9fMC5tYWtlSXRlcmFibGU7XG52YXIgc2xpY2UgPSBbXS5zbGljZSxcbiAgICBpc1Byb3RvdHlwZVNldCA9IGZhbHNlLFxuICAgIHJlRnJhZ21lbnQgPSAvXlxccyo8KFxcdyt8ISlbXj5dKj4vLFxuICAgIHJlU2luZ2xlVGFnID0gL148KFxcdyspXFxzKlxcLz8+KD86PFxcL1xcMT58KSQvLFxuICAgIHJlU2ltcGxlU2VsZWN0b3IgPSAvXltcXC4jXT9bXFx3LV0qJC87XG5mdW5jdGlvbiAkKHNlbGVjdG9yKSB7XG4gIHZhciBjb250ZXh0ID0gYXJndW1lbnRzWzFdICE9PSAodm9pZCAwKSA/IGFyZ3VtZW50c1sxXSA6IGRvY3VtZW50O1xuICB2YXIgY29sbGVjdGlvbjtcbiAgaWYgKCFzZWxlY3Rvcikge1xuICAgIGNvbGxlY3Rpb24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKG51bGwpO1xuICB9IGVsc2UgaWYgKHNlbGVjdG9yIGluc3RhbmNlb2YgV3JhcHBlcikge1xuICAgIHJldHVybiBzZWxlY3RvcjtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygc2VsZWN0b3IgIT09ICdzdHJpbmcnKSB7XG4gICAgY29sbGVjdGlvbiA9IG1ha2VJdGVyYWJsZShzZWxlY3Rvcik7XG4gIH0gZWxzZSBpZiAocmVGcmFnbWVudC50ZXN0KHNlbGVjdG9yKSkge1xuICAgIGNvbGxlY3Rpb24gPSBjcmVhdGVGcmFnbWVudChzZWxlY3Rvcik7XG4gIH0gZWxzZSB7XG4gICAgY29udGV4dCA9IHR5cGVvZiBjb250ZXh0ID09PSAnc3RyaW5nJyA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY29udGV4dCkgOiBjb250ZXh0Lmxlbmd0aCA/IGNvbnRleHRbMF0gOiBjb250ZXh0O1xuICAgIGNvbGxlY3Rpb24gPSBxdWVyeVNlbGVjdG9yKHNlbGVjdG9yLCBjb250ZXh0KTtcbiAgfVxuICByZXR1cm4gJC5pc05hdGl2ZSA/IGNvbGxlY3Rpb24gOiB3cmFwKGNvbGxlY3Rpb24pO1xufVxuZnVuY3Rpb24gZmluZChzZWxlY3Rvcikge1xuICByZXR1cm4gJChzZWxlY3RvciwgdGhpcyk7XG59XG52YXIgbWF0Y2hlcyA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGNvbnRleHQgPSB0eXBlb2YgRWxlbWVudCAhPT0gJ3VuZGVmaW5lZCcgPyBFbGVtZW50LnByb3RvdHlwZSA6IGdsb2JhbCxcbiAgICAgIF9tYXRjaGVzID0gY29udGV4dC5tYXRjaGVzIHx8IGNvbnRleHQubWF0Y2hlc1NlbGVjdG9yIHx8IGNvbnRleHQubW96TWF0Y2hlc1NlbGVjdG9yIHx8IGNvbnRleHQud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8IGNvbnRleHQubXNNYXRjaGVzU2VsZWN0b3IgfHwgY29udGV4dC5vTWF0Y2hlc1NlbGVjdG9yO1xuICByZXR1cm4gZnVuY3Rpb24oZWxlbWVudCwgc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gX21hdGNoZXMuY2FsbChlbGVtZW50LCBzZWxlY3Rvcik7XG4gIH07XG59KSgpO1xuZnVuY3Rpb24gcXVlcnlTZWxlY3RvcihzZWxlY3RvciwgY29udGV4dCkge1xuICB2YXIgaXNTaW1wbGVTZWxlY3RvciA9IHJlU2ltcGxlU2VsZWN0b3IudGVzdChzZWxlY3Rvcik7XG4gIGlmIChpc1NpbXBsZVNlbGVjdG9yICYmICEkLmlzTmF0aXZlKSB7XG4gICAgaWYgKHNlbGVjdG9yWzBdID09PSAnIycpIHtcbiAgICAgIHZhciBlbGVtZW50ID0gKGNvbnRleHQuZ2V0RWxlbWVudEJ5SWQgPyBjb250ZXh0IDogZG9jdW1lbnQpLmdldEVsZW1lbnRCeUlkKHNlbGVjdG9yLnNsaWNlKDEpKTtcbiAgICAgIHJldHVybiBlbGVtZW50ID8gW2VsZW1lbnRdIDogW107XG4gICAgfVxuICAgIGlmIChzZWxlY3RvclswXSA9PT0gJy4nKSB7XG4gICAgICByZXR1cm4gY29udGV4dC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKHNlbGVjdG9yLnNsaWNlKDEpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRleHQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoc2VsZWN0b3IpO1xuICB9XG4gIHJldHVybiBjb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xufVxuZnVuY3Rpb24gY3JlYXRlRnJhZ21lbnQoaHRtbCkge1xuICBpZiAocmVTaW5nbGVUYWcudGVzdChodG1sKSkge1xuICAgIHJldHVybiBbZG9jdW1lbnQuY3JlYXRlRWxlbWVudChSZWdFeHAuJDEpXTtcbiAgfVxuICB2YXIgZWxlbWVudHMgPSBbXSxcbiAgICAgIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuICAgICAgY2hpbGRyZW4gPSBjb250YWluZXIuY2hpbGROb2RlcztcbiAgY29udGFpbmVyLmlubmVySFRNTCA9IGh0bWw7XG4gIGZvciAodmFyIGkgPSAwLFxuICAgICAgbCA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGVsZW1lbnRzLnB1c2goY2hpbGRyZW5baV0pO1xuICB9XG4gIHJldHVybiBlbGVtZW50cztcbn1cbmZ1bmN0aW9uIHdyYXAoY29sbGVjdGlvbikge1xuICBpZiAoIWlzUHJvdG90eXBlU2V0KSB7XG4gICAgV3JhcHBlci5wcm90b3R5cGUgPSAkLmZuO1xuICAgIFdyYXBwZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gV3JhcHBlcjtcbiAgICBpc1Byb3RvdHlwZVNldCA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIG5ldyBXcmFwcGVyKGNvbGxlY3Rpb24pO1xufVxuZnVuY3Rpb24gV3JhcHBlcihjb2xsZWN0aW9uKSB7XG4gIHZhciBpID0gMCxcbiAgICAgIGxlbmd0aCA9IGNvbGxlY3Rpb24ubGVuZ3RoO1xuICBmb3IgKDsgaSA8IGxlbmd0aDsgKSB7XG4gICAgdGhpc1tpXSA9IGNvbGxlY3Rpb25baSsrXTtcbiAgfVxuICB0aGlzLmxlbmd0aCA9IGxlbmd0aDtcbn1cbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICAkOiAkLFxuICBmaW5kOiBmaW5kLFxuICBtYXRjaGVzOiBtYXRjaGVzLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi91dGlsXCI6MTV9XSwxNDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9zZWxlY3Rvcl9leHRyYVwiO1xudmFyICRfXzAgPSBfZGVyZXFfKCcuL3V0aWwnKSxcbiAgICBlYWNoID0gJF9fMC5lYWNoLFxuICAgIHRvQXJyYXkgPSAkX18wLnRvQXJyYXk7XG52YXIgJF9fMCA9IF9kZXJlcV8oJy4vc2VsZWN0b3InKSxcbiAgICAkID0gJF9fMC4kLFxuICAgIG1hdGNoZXMgPSAkX18wLm1hdGNoZXM7XG5mdW5jdGlvbiBjaGlsZHJlbihzZWxlY3Rvcikge1xuICB2YXIgbm9kZXMgPSBbXTtcbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgaWYgKGVsZW1lbnQuY2hpbGRyZW4pIHtcbiAgICAgIGVhY2goZWxlbWVudC5jaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgaWYgKCFzZWxlY3RvciB8fCAoc2VsZWN0b3IgJiYgbWF0Y2hlcyhjaGlsZCwgc2VsZWN0b3IpKSkge1xuICAgICAgICAgIG5vZGVzLnB1c2goY2hpbGQpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gJChub2Rlcyk7XG59XG5mdW5jdGlvbiBjbG9zZXN0KHNlbGVjdG9yKSB7XG4gIHZhciBub2RlID0gdGhpc1swXTtcbiAgZm9yICg7IG5vZGUubm9kZVR5cGUgIT09IG5vZGUuRE9DVU1FTlRfTk9ERTsgbm9kZSA9IG5vZGUucGFyZW50Tm9kZSkge1xuICAgIGlmIChtYXRjaGVzKG5vZGUsIHNlbGVjdG9yKSkge1xuICAgICAgcmV0dXJuICQobm9kZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiAkKCk7XG59XG5mdW5jdGlvbiBjb250ZW50cygpIHtcbiAgdmFyIG5vZGVzID0gW107XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIG5vZGVzLnB1c2guYXBwbHkobm9kZXMsIHRvQXJyYXkoZWxlbWVudC5jaGlsZE5vZGVzKSk7XG4gIH0pO1xuICByZXR1cm4gJChub2Rlcyk7XG59XG5mdW5jdGlvbiBlcShpbmRleCkge1xuICByZXR1cm4gc2xpY2UuY2FsbCh0aGlzLCBpbmRleCwgaW5kZXggKyAxKTtcbn1cbmZ1bmN0aW9uIGdldChpbmRleCkge1xuICByZXR1cm4gdGhpc1tpbmRleF07XG59XG5mdW5jdGlvbiBwYXJlbnQoc2VsZWN0b3IpIHtcbiAgdmFyIG5vZGVzID0gW107XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGlmICghc2VsZWN0b3IgfHwgKHNlbGVjdG9yICYmIG1hdGNoZXMoZWxlbWVudC5wYXJlbnROb2RlLCBzZWxlY3RvcikpKSB7XG4gICAgICBub2Rlcy5wdXNoKGVsZW1lbnQucGFyZW50Tm9kZSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuICQobm9kZXMpO1xufVxuZnVuY3Rpb24gc2xpY2Uoc3RhcnQsIGVuZCkge1xuICByZXR1cm4gJChbXS5zbGljZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbn1cbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBjaGlsZHJlbjogY2hpbGRyZW4sXG4gIGNvbnRlbnRzOiBjb250ZW50cyxcbiAgY2xvc2VzdDogY2xvc2VzdCxcbiAgZXE6IGVxLFxuICBnZXQ6IGdldCxcbiAgcGFyZW50OiBwYXJlbnQsXG4gIHNsaWNlOiBzbGljZSxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vc2VsZWN0b3JcIjoxMyxcIi4vdXRpbFwiOjE1fV0sMTU6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvdXRpbFwiO1xudmFyIGdsb2JhbCA9IG5ldyBGdW5jdGlvbihcInJldHVybiB0aGlzXCIpKCksXG4gICAgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgdG9BcnJheSA9IChmdW5jdGlvbihjb2xsZWN0aW9uKSB7XG4gIHJldHVybiBzbGljZS5jYWxsKGNvbGxlY3Rpb24pO1xufSk7XG52YXIgbWFrZUl0ZXJhYmxlID0gKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgcmV0dXJuIGVsZW1lbnQubm9kZVR5cGUgfHwgZWxlbWVudCA9PT0gd2luZG93ID8gW2VsZW1lbnRdIDogZWxlbWVudDtcbn0pO1xuZnVuY3Rpb24gZWFjaChjb2xsZWN0aW9uLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICB2YXIgbGVuZ3RoID0gY29sbGVjdGlvbi5sZW5ndGg7XG4gIGlmIChsZW5ndGggIT09IHVuZGVmaW5lZCAmJiBjb2xsZWN0aW9uLm5vZGVUeXBlID09PSB1bmRlZmluZWQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIGNvbGxlY3Rpb25baV0sIGksIGNvbGxlY3Rpb24pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIGNvbGxlY3Rpb24sIDAsIGNvbGxlY3Rpb24pO1xuICB9XG4gIHJldHVybiBjb2xsZWN0aW9uO1xufVxuZnVuY3Rpb24gZXh0ZW5kKHRhcmdldCkge1xuICBmb3IgKHZhciBzb3VyY2VzID0gW10sXG4gICAgICAkX18wID0gMTsgJF9fMCA8IGFyZ3VtZW50cy5sZW5ndGg7ICRfXzArKylcbiAgICBzb3VyY2VzWyRfXzAgLSAxXSA9IGFyZ3VtZW50c1skX18wXTtcbiAgc291cmNlcy5mb3JFYWNoKGZ1bmN0aW9uKHNyYykge1xuICAgIGlmIChzcmMpIHtcbiAgICAgIGZvciAodmFyIHByb3AgaW4gc3JjKSB7XG4gICAgICAgIHRhcmdldFtwcm9wXSA9IHNyY1twcm9wXTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gdGFyZ2V0O1xufVxuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdsb2JhbDogZ2xvYmFsLFxuICB0b0FycmF5OiB0b0FycmF5LFxuICBtYWtlSXRlcmFibGU6IG1ha2VJdGVyYWJsZSxcbiAgZWFjaDogZWFjaCxcbiAgZXh0ZW5kOiBleHRlbmQsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7fV19LHt9LFsxMF0pXG4oMTApXG59KTtcbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwibW9kdWxlLmV4cG9ydHMgPSBzdHJpcDtcblxuZnVuY3Rpb24gc3RyaXAoaHRtbCl7XG4gIGh0bWwgPSBodG1sIHx8ICcnO1xuICByZXR1cm4gaHRtbC5yZXBsYWNlKC88XFwvPyhbYS16XVthLXowLTldKilcXGJbXj5dKj4/L2dpLCAnJykudHJpbSgpO1xufVxuIiwidmFyIG9iaiAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvb2JqJylcbiwgICBldmVudHMgID0gcmVxdWlyZSgnLi9tb2R1bGVzL2V2ZW50cycpXG4sICAgY29udGVudCA9IHJlcXVpcmUoJy4vbW9kdWxlcy9jb250ZW50Jyk7XG5cbmNvbnRlbnQuaW5pdCgpO1xub2JqLmluaXQoKTtcbmV2ZW50cygpO1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciAkID0gcmVxdWlyZSgnZG9tdGFzdGljL2J1bmRsZS9mdWxsL2RvbXRhc3RpYycpXG4sICAgc3RyaXAgPSByZXF1aXJlKCdzdHJpcCcpO1xuXG52YXIgJGJvZHkgICAgICA9ICQoJ2JvZHknKSxcbiAgICBpc09yaWdpbmFsID0gdHJ1ZTtcblxudmFyIGNvbnRlbnQgPSB7XG5cbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMud3JhcENvbnRlbnQoKTtcbiAgfSxcblxuICB3cmFwQ29udGVudDogZnVuY3Rpb24oKSB7XG4gICAgJGJvZHkuaHRtbCgnPGRpdiBpZD1cIm5pY2UtY29udGVudFwiPicgKyAkYm9keS5odG1sKCkgKyAnPC9kaXY+Jyk7XG4gICAgdGhpcy5vcmlnaW5hbEhUTUwgPSB0aGlzLmN1cnJlbnRIVE1MID0gdGhpcy5nZXRIVE1MKCk7XG4gICAgcmV0dXJuIHRoaXMubWFrZUVkaXRhYmxlKCQoJyNuaWNlLWNvbnRlbnQnKSk7XG4gIH0sXG5cbiAgbWFrZUVkaXRhYmxlOiBmdW5jdGlvbihlbCkge1xuICAgIHJldHVybiBlbC5hdHRyKCdjb250ZW50ZWRpdGFibGUnLCB0cnVlKTtcbiAgfSxcblxuICByZW1vdmVOaWNlOiBmdW5jdGlvbigpIHtcbiAgICAkYm9keVxuICAgICAgLmh0bWwoJCgnI25pY2UtY29udGVudCcpLmh0bWwoKSlcbiAgICAgIC5yZW1vdmVBdHRyKCdjb250ZW50ZWRpdGFibGUnKTtcbiAgfSxcblxuICBnZXRIVE1MOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgaHRtbCA9ICQoJyNuaWNlLWNvbnRlbnQnKS5odG1sKCk7XG4gICAgcmV0dXJuIGh0bWwudHJpbSgpO1xuICB9LFxuXG4gIHN0cmlwSFRNTDogZnVuY3Rpb24oc3RyKSB7XG4gICAgcmV0dXJuIHN0cmlwKHN0cilcbiAgICAgIC5yZXBsYWNlKC8oJmx0Oy4rJmd0OykvZ2ksICcnKVxuICAgICAgLnJlcGxhY2UoLygoKCZhbXA7KS4rKGx0OykpLisoKCZhbXA7KS4rKGd0OykpKS9naSwgJycpXG4gICAgICAucmVwbGFjZSgvKCZhbXA7bHQ7LismYW1wO2d0OykvZ2ksICcnKTtcbiAgfSxcblxuICBzZXRIVE1MOiBmdW5jdGlvbihodG1sKSB7XG4gICAgcmV0dXJuICQoJyNuaWNlLWNvbnRlbnQnKS5odG1sKGh0bWwpO1xuICB9LFxuXG4gIHRvZ2dsZUhUTUw6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdHJpcHBlZE9yaWdpbmFsID0gdGhpcy5zdHJpcEhUTUwodGhpcy5vcmlnaW5hbEhUTUwpO1xuICAgIHZhciBzdHJpcHBlZEN1cnJlbnQgPSB0aGlzLnN0cmlwSFRNTCh0aGlzLmdldEhUTUwoKSk7XG5cbiAgICBpc09yaWdpbmFsID0gc3RyaXBwZWRPcmlnaW5hbCA9PT0gc3RyaXBwZWRDdXJyZW50ID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgaWYgKCFpc09yaWdpbmFsKSB7XG4gICAgICB0aGlzLmN1cnJlbnRIVE1MID0gdGhpcy5nZXRIVE1MKCk7XG4gICAgfVxuXG4gICAgdmFyIGh0bWwgPSBpc09yaWdpbmFsID8gdGhpcy5jdXJyZW50SFRNTCA6IHRoaXMub3JpZ2luYWxIVE1MO1xuXG4gICAgdGhpcy5zZXRIVE1MKGh0bWwpO1xuXG4gIH0sXG5cbiAgZ2V0U2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmFuZ2U7XG4gICAgaWYgKGRvY3VtZW50LnNlbGVjdGlvbikge1xuICAgICAgcmFuZ2UgPSBkb2N1bWVudC5ib2R5LmNyZWF0ZVRleHRSYW5nZSgpO1xuICAgICAgcmFuZ2UubW92ZVRvRWxlbWVudFRleHQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25pY2UtcHJlJykpO1xuICAgICAgcmFuZ2Uuc2VsZWN0KCk7XG4gICAgfSBlbHNlIGlmICh3aW5kb3cuZ2V0U2VsZWN0aW9uKSB7XG4gICAgICByYW5nZSA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKCk7XG4gICAgICByYW5nZS5zZWxlY3ROb2RlKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduaWNlLXByZScpKTtcbiAgICAgIHdpbmRvdy5nZXRTZWxlY3Rpb24oKS5hZGRSYW5nZShyYW5nZSk7XG4gICAgfVxuXG4gIH0sXG5cbiAgb3JpZ2luYWxIVE1MOiAnJyxcblxuICBjdXJyZW50SFRNTDogJydcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjb250ZW50O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgJCAgICAgICA9IHJlcXVpcmUoJ2RvbXRhc3RpYy9idW5kbGUvZnVsbC9kb210YXN0aWMnKVxuLCAgIGpzZGlmZiAgPSByZXF1aXJlKCdkaWZmJylcbiwgICBjb250ZW50ID0gcmVxdWlyZSgnLi9jb250ZW50Jyk7XG5cbnZhciBkaWZmT2JqID0ge1xuXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvcmlnaW5hbEhUTUwgPSBjb250ZW50LnN0cmlwSFRNTChjb250ZW50Lm9yaWdpbmFsSFRNTCk7XG4gICAgdmFyIGN1cnJlbnRIVE1MID0gY29udGVudC5zdHJpcEhUTUwoY29udGVudC5nZXRIVE1MKCkpO1xuXG4gICAgdmFyIGRpZmYgPSBqc2RpZmYuZGlmZkxpbmVzKG9yaWdpbmFsSFRNTCwgY3VycmVudEhUTUwpO1xuICAgIHRoaXMucG9wdWxhdGVEaWZmKGRpZmYpO1xuICAgIGNvbnNvbGUudGFibGUoZGlmZiwgb3JpZ2luYWxIVE1MLCBjdXJyZW50SFRNTCApXG4gIH0sXG5cbiAgcG9wdWxhdGVEaWZmOiBmdW5jdGlvbihkaWZmKSB7XG4gICAgdmFyICRwcmUgPSAkKCcjbmljZS1wcmUnKS5odG1sKCcnKVxuICAgICwgICBjb2xvclxuICAgICwgICBrbGFzc1xuICAgICwgICBzcGFuO1xuXG5cbiAgICBkaWZmLmZvckVhY2goZnVuY3Rpb24ocGFydCkge1xuICAgICAgaWYgKHBhcnQuYWRkZWQgfHwgcGFydC5yZW1vdmVkKSB7XG4gICAgICAgIGNvbG9yID0gcGFydC5hZGRlZCA/ICdncmVlbicgOiBwYXJ0LnJlbW92ZWQgPyAncmVkJyA6ICdncmV5JztcbiAgICAgICAga2xhc3MgPSBwYXJ0LmFkZGVkID8gJ2lzLWFkZGVkJyA6IHBhcnQucmVtb3ZlZCA/ICdpcy1yZW1vdmVkJyA6ICcnO1xuICAgICAgICBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICBzcGFuLnN0eWxlLmNvbG9yID0gY29sb3I7XG4gICAgICAgIHNwYW4uc2V0QXR0cmlidXRlKCdjbGFzcycsIGtsYXNzKTtcbiAgICAgICAgc3Bhbi5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShwYXJ0LnZhbHVlKSk7XG4gICAgICAgICRwcmUuYXBwZW5kKHNwYW4pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZGlmZk9iajtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyICQgICAgICAgPSByZXF1aXJlKCdkb210YXN0aWMvYnVuZGxlL2Z1bGwvZG9tdGFzdGljJylcbiwgICBkaWZmICAgID0gcmVxdWlyZSgnLi9kaWZmJylcbiwgICBjb250ZW50ID0gcmVxdWlyZSgnLi9jb250ZW50Jyk7XG5cbnZhciBldmVudHMgPSBmdW5jdGlvbigpIHtcblxuICAkKCcjbmljZS1taW4nKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICQoJyNuaWNlLW9iaicpLnRvZ2dsZUNsYXNzKCdpcy1taW4nKTtcbiAgfSk7XG5cbiAgJCgnI25pY2Utb2ZmJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBjb250ZW50LnJlbW92ZU5pY2UoKTtcbiAgfSk7XG5cbiAgJCgnI25pY2UtZGlmZicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgJCgnI25pY2UtcHJlJykudG9nZ2xlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgIGRpZmYuaW5pdCgpO1xuICB9KTtcblxuICAkKCcjbmljZS10b2dnbGUnKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnRlbnQudG9nZ2xlSFRNTCgpO1xuICB9KTtcblxuICAkKCcjbmljZS1wcmUnKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnRlbnQuZ2V0U2VsZWN0aW9uKCk7XG4gIH0pO1xuXG4gICQoJyNuaWNlLW5hdiBsaScpXG4gICAgLm9uKCdtb3VzZW92ZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgJHRpdGxlID0gJCgnI25pY2UtdGl0bGUnKTtcbiAgICAgICR0aXRsZS50ZXh0KCQoZS5zcmNFbGVtZW50KS5hdHRyKCdkYXRhLXRleHQnKSk7XG4gICAgfSkub24oJ21vdXNlbGVhdmUnLCBmdW5jdGlvbigpIHtcbiAgICAgIHZhciAkdGl0bGUgPSAkKCcjbmljZS10aXRsZScpO1xuICAgICAgJHRpdGxlLnRleHQoJHRpdGxlLmF0dHIoJ2RhdGEtdGV4dCcpKTtcbiAgICB9KTtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBldmVudHM7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBvYmpUZW1wbGF0ZSA9IHJlcXVpcmUoJy4vdGVtcGxhdGUnKTtcblxudmFyIGJvZHkgICA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbIDAgXVxuLCAgIGhlYWQgICA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbIDAgXVxuLCAgIGNzc0xvYyA9ICdodHRwczovL3NlZXRocm91Z2h0cmVlcy5naXRodWIuaW8vbmljZS1pbmxpbmUtY29weS1lZGl0b3IvaW5kZXguY3NzJztcblxuXG52YXIgbmF2ID0ge1xuXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY3JlYXRlT2JqKCk7XG4gIH0sXG5cbiAgY3JlYXRlT2JqOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZGl2LnNldEF0dHJpYnV0ZSgnaWQnLCAnbmljZS1vYmonKTtcbiAgICBkaXYuc2V0QXR0cmlidXRlKCdjb250ZW50ZWRpdGFibGUnLCBmYWxzZSk7XG4gICAgZGl2LnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnaXMtbWluJyk7XG4gICAgZGl2LmlubmVySFRNTCA9IG9ialRlbXBsYXRlO1xuICAgIHRoaXMuc3R5bGUoZGl2KTtcbiAgfSxcblxuICBzdHlsZTogZnVuY3Rpb24oZGl2KSB7XG4gICAgdmFyIGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG4gICAgbGluay5zZXRBdHRyaWJ1dGUoJ3JlbCcsJ3N0eWxlc2hlZXQnKTtcbiAgICBsaW5rLnNldEF0dHJpYnV0ZSgnaHJlZicsIGNzc0xvYyk7XG4gICAgbGluay5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCd0ZXh0L2NzcycpO1xuICAgIGhlYWQuYXBwZW5kQ2hpbGQobGluayk7XG4gICAgdGhpcy5hcHBlbmQoZGl2KTtcbiAgfSxcblxuICBhcHBlbmQ6IGZ1bmN0aW9uKGRpdikge1xuICAgIGJvZHkuYXBwZW5kQ2hpbGQoZGl2KTtcbiAgfVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5hdjtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gc2V0IG9ialRlbXBsYXRlXG52YXIgb2JqVGVtcGxhdGUgPSAnPHVsIGlkPVwibmljZS1uYXZcIj4nO1xuICAgIG9ialRlbXBsYXRlICs9ICc8bGkgaWQ9XCJuaWNlLXRpdGxlXCIgZGF0YS10ZXh0PVwiTklDRVwiIHRpdGxlPVwiR28gVG8gSG9tZXBhZ2VcIj5OSUNFPC9saT4nO1xuICAgIG9ialRlbXBsYXRlICs9ICc8bGkgaWQ9XCJuaWNlLW1pblwiIGRhdGEtdGV4dD1cIkhJREVcIiB0aXRsZT1cIk1pbmltaXplIE5JQ0VcIj48c3Bhbj5cXHVFMDAxPC9zcGFuPjwvbGk+JztcbiAgICBvYmpUZW1wbGF0ZSArPSAnPGxpIGlkPVwibmljZS10b2dnbGVcIiBkYXRhLXRleHQ9XCJUT0dHTEVcIiB0aXRsZT1cIlRvZ2dsZSBPcmlnaW5hbFwiPlxcdUUwMDQ8L2xpPic7XG4gICAgb2JqVGVtcGxhdGUgKz0gJzxsaSBpZD1cIm5pY2UtZGlmZlwiIGRhdGEtdGV4dD1cIkRJRkZcIiB0aXRsZT1cIlNlZSBEaWZmXCI+XFx1RTAwMjwvbGk+JztcbiAgICBvYmpUZW1wbGF0ZSArPSAnPGxpIGlkPVwibmljZS1vZmZcIiBkYXRhLXRleHQ9XCJPRkZcIiB0aXRsZT1cIlR1cm4gb2ZmIE5JQ0VcIj5cXHVFMDAzPC9saT4nO1xuICAgIG9ialRlbXBsYXRlICs9ICc8L3VsPic7XG4gICAgb2JqVGVtcGxhdGUgKz0gJzxwcmUgaWQ9XCJuaWNlLXByZVwiPjwvcHJlPic7XG5cbm1vZHVsZS5leHBvcnRzID0gb2JqVGVtcGxhdGU7XG4iXX0=

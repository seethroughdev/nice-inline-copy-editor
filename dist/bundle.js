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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYWRhbWwvU2l0ZXMvZ2l0aHViL25pY2UtaW5saW5lLWNvcHktZWRpdG9yL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYWRhbWwvU2l0ZXMvZ2l0aHViL25pY2UtaW5saW5lLWNvcHktZWRpdG9yL25vZGVfbW9kdWxlcy9kaWZmL2RpZmYuanMiLCIvVXNlcnMvYWRhbWwvU2l0ZXMvZ2l0aHViL25pY2UtaW5saW5lLWNvcHktZWRpdG9yL25vZGVfbW9kdWxlcy9kb210YXN0aWMvYnVuZGxlL2Z1bGwvZG9tdGFzdGljLmpzIiwiL1VzZXJzL2FkYW1sL1NpdGVzL2dpdGh1Yi9uaWNlLWlubGluZS1jb3B5LWVkaXRvci9ub2RlX21vZHVsZXMvc3RyaXAvaW5kZXguanMiLCIvVXNlcnMvYWRhbWwvU2l0ZXMvZ2l0aHViL25pY2UtaW5saW5lLWNvcHktZWRpdG9yL3NyYy9qcy9pbmRleC5qcyIsIi9Vc2Vycy9hZGFtbC9TaXRlcy9naXRodWIvbmljZS1pbmxpbmUtY29weS1lZGl0b3Ivc3JjL2pzL21vZHVsZXMvY29udGVudC5qcyIsIi9Vc2Vycy9hZGFtbC9TaXRlcy9naXRodWIvbmljZS1pbmxpbmUtY29weS1lZGl0b3Ivc3JjL2pzL21vZHVsZXMvZGlmZi5qcyIsIi9Vc2Vycy9hZGFtbC9TaXRlcy9naXRodWIvbmljZS1pbmxpbmUtY29weS1lZGl0b3Ivc3JjL2pzL21vZHVsZXMvZXZlbnRzLmpzIiwiL1VzZXJzL2FkYW1sL1NpdGVzL2dpdGh1Yi9uaWNlLWlubGluZS1jb3B5LWVkaXRvci9zcmMvanMvbW9kdWxlcy9vYmouanMiLCIvVXNlcnMvYWRhbWwvU2l0ZXMvZ2l0aHViL25pY2UtaW5saW5lLWNvcHktZWRpdG9yL3NyYy9qcy9tb2R1bGVzL3RlbXBsYXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaDZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyogU2VlIExJQ0VOU0UgZmlsZSBmb3IgdGVybXMgb2YgdXNlICovXG5cbi8qXG4gKiBUZXh0IGRpZmYgaW1wbGVtZW50YXRpb24uXG4gKlxuICogVGhpcyBsaWJyYXJ5IHN1cHBvcnRzIHRoZSBmb2xsb3dpbmcgQVBJUzpcbiAqIEpzRGlmZi5kaWZmQ2hhcnM6IENoYXJhY3RlciBieSBjaGFyYWN0ZXIgZGlmZlxuICogSnNEaWZmLmRpZmZXb3JkczogV29yZCAoYXMgZGVmaW5lZCBieSBcXGIgcmVnZXgpIGRpZmYgd2hpY2ggaWdub3JlcyB3aGl0ZXNwYWNlXG4gKiBKc0RpZmYuZGlmZkxpbmVzOiBMaW5lIGJhc2VkIGRpZmZcbiAqXG4gKiBKc0RpZmYuZGlmZkNzczogRGlmZiB0YXJnZXRlZCBhdCBDU1MgY29udGVudFxuICpcbiAqIFRoZXNlIG1ldGhvZHMgYXJlIGJhc2VkIG9uIHRoZSBpbXBsZW1lbnRhdGlvbiBwcm9wb3NlZCBpblxuICogXCJBbiBPKE5EKSBEaWZmZXJlbmNlIEFsZ29yaXRobSBhbmQgaXRzIFZhcmlhdGlvbnNcIiAoTXllcnMsIDE5ODYpLlxuICogaHR0cDovL2NpdGVzZWVyeC5pc3QucHN1LmVkdS92aWV3ZG9jL3N1bW1hcnk/ZG9pPTEwLjEuMS40LjY5MjdcbiAqL1xudmFyIEpzRGlmZiA9IChmdW5jdGlvbigpIHtcbiAgLypqc2hpbnQgbWF4cGFyYW1zOiA1Ki9cbiAgZnVuY3Rpb24gY2xvbmVQYXRoKHBhdGgpIHtcbiAgICByZXR1cm4geyBuZXdQb3M6IHBhdGgubmV3UG9zLCBjb21wb25lbnRzOiBwYXRoLmNvbXBvbmVudHMuc2xpY2UoMCkgfTtcbiAgfVxuICBmdW5jdGlvbiByZW1vdmVFbXB0eShhcnJheSkge1xuICAgIHZhciByZXQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYXJyYXlbaV0pIHtcbiAgICAgICAgcmV0LnB1c2goYXJyYXlbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG4gIGZ1bmN0aW9uIGVzY2FwZUhUTUwocykge1xuICAgIHZhciBuID0gcztcbiAgICBuID0gbi5yZXBsYWNlKC8mL2csICcmYW1wOycpO1xuICAgIG4gPSBuLnJlcGxhY2UoLzwvZywgJyZsdDsnKTtcbiAgICBuID0gbi5yZXBsYWNlKC8+L2csICcmZ3Q7Jyk7XG4gICAgbiA9IG4ucmVwbGFjZSgvXCIvZywgJyZxdW90OycpO1xuXG4gICAgcmV0dXJuIG47XG4gIH1cblxuICB2YXIgRGlmZiA9IGZ1bmN0aW9uKGlnbm9yZVdoaXRlc3BhY2UpIHtcbiAgICB0aGlzLmlnbm9yZVdoaXRlc3BhY2UgPSBpZ25vcmVXaGl0ZXNwYWNlO1xuICB9O1xuICBEaWZmLnByb3RvdHlwZSA9IHtcbiAgICAgIGRpZmY6IGZ1bmN0aW9uKG9sZFN0cmluZywgbmV3U3RyaW5nKSB7XG4gICAgICAgIC8vIEhhbmRsZSB0aGUgaWRlbnRpdHkgY2FzZSAodGhpcyBpcyBkdWUgdG8gdW5yb2xsaW5nIGVkaXRMZW5ndGggPT0gMFxuICAgICAgICBpZiAobmV3U3RyaW5nID09PSBvbGRTdHJpbmcpIHtcbiAgICAgICAgICByZXR1cm4gW3sgdmFsdWU6IG5ld1N0cmluZyB9XTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW5ld1N0cmluZykge1xuICAgICAgICAgIHJldHVybiBbeyB2YWx1ZTogb2xkU3RyaW5nLCByZW1vdmVkOiB0cnVlIH1dO1xuICAgICAgICB9XG4gICAgICAgIGlmICghb2xkU3RyaW5nKSB7XG4gICAgICAgICAgcmV0dXJuIFt7IHZhbHVlOiBuZXdTdHJpbmcsIGFkZGVkOiB0cnVlIH1dO1xuICAgICAgICB9XG5cbiAgICAgICAgbmV3U3RyaW5nID0gdGhpcy50b2tlbml6ZShuZXdTdHJpbmcpO1xuICAgICAgICBvbGRTdHJpbmcgPSB0aGlzLnRva2VuaXplKG9sZFN0cmluZyk7XG5cbiAgICAgICAgdmFyIG5ld0xlbiA9IG5ld1N0cmluZy5sZW5ndGgsIG9sZExlbiA9IG9sZFN0cmluZy5sZW5ndGg7XG4gICAgICAgIHZhciBtYXhFZGl0TGVuZ3RoID0gbmV3TGVuICsgb2xkTGVuO1xuICAgICAgICB2YXIgYmVzdFBhdGggPSBbeyBuZXdQb3M6IC0xLCBjb21wb25lbnRzOiBbXSB9XTtcblxuICAgICAgICAvLyBTZWVkIGVkaXRMZW5ndGggPSAwXG4gICAgICAgIHZhciBvbGRQb3MgPSB0aGlzLmV4dHJhY3RDb21tb24oYmVzdFBhdGhbMF0sIG5ld1N0cmluZywgb2xkU3RyaW5nLCAwKTtcbiAgICAgICAgaWYgKGJlc3RQYXRoWzBdLm5ld1BvcysxID49IG5ld0xlbiAmJiBvbGRQb3MrMSA+PSBvbGRMZW4pIHtcbiAgICAgICAgICByZXR1cm4gYmVzdFBhdGhbMF0uY29tcG9uZW50cztcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGVkaXRMZW5ndGggPSAxOyBlZGl0TGVuZ3RoIDw9IG1heEVkaXRMZW5ndGg7IGVkaXRMZW5ndGgrKykge1xuICAgICAgICAgIGZvciAodmFyIGRpYWdvbmFsUGF0aCA9IC0xKmVkaXRMZW5ndGg7IGRpYWdvbmFsUGF0aCA8PSBlZGl0TGVuZ3RoOyBkaWFnb25hbFBhdGgrPTIpIHtcbiAgICAgICAgICAgIHZhciBiYXNlUGF0aDtcbiAgICAgICAgICAgIHZhciBhZGRQYXRoID0gYmVzdFBhdGhbZGlhZ29uYWxQYXRoLTFdLFxuICAgICAgICAgICAgICAgIHJlbW92ZVBhdGggPSBiZXN0UGF0aFtkaWFnb25hbFBhdGgrMV07XG4gICAgICAgICAgICBvbGRQb3MgPSAocmVtb3ZlUGF0aCA/IHJlbW92ZVBhdGgubmV3UG9zIDogMCkgLSBkaWFnb25hbFBhdGg7XG4gICAgICAgICAgICBpZiAoYWRkUGF0aCkge1xuICAgICAgICAgICAgICAvLyBObyBvbmUgZWxzZSBpcyBnb2luZyB0byBhdHRlbXB0IHRvIHVzZSB0aGlzIHZhbHVlLCBjbGVhciBpdFxuICAgICAgICAgICAgICBiZXN0UGF0aFtkaWFnb25hbFBhdGgtMV0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBjYW5BZGQgPSBhZGRQYXRoICYmIGFkZFBhdGgubmV3UG9zKzEgPCBuZXdMZW47XG4gICAgICAgICAgICB2YXIgY2FuUmVtb3ZlID0gcmVtb3ZlUGF0aCAmJiAwIDw9IG9sZFBvcyAmJiBvbGRQb3MgPCBvbGRMZW47XG4gICAgICAgICAgICBpZiAoIWNhbkFkZCAmJiAhY2FuUmVtb3ZlKSB7XG4gICAgICAgICAgICAgIGJlc3RQYXRoW2RpYWdvbmFsUGF0aF0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTZWxlY3QgdGhlIGRpYWdvbmFsIHRoYXQgd2Ugd2FudCB0byBicmFuY2ggZnJvbS4gV2Ugc2VsZWN0IHRoZSBwcmlvclxuICAgICAgICAgICAgLy8gcGF0aCB3aG9zZSBwb3NpdGlvbiBpbiB0aGUgbmV3IHN0cmluZyBpcyB0aGUgZmFydGhlc3QgZnJvbSB0aGUgb3JpZ2luXG4gICAgICAgICAgICAvLyBhbmQgZG9lcyBub3QgcGFzcyB0aGUgYm91bmRzIG9mIHRoZSBkaWZmIGdyYXBoXG4gICAgICAgICAgICBpZiAoIWNhbkFkZCB8fCAoY2FuUmVtb3ZlICYmIGFkZFBhdGgubmV3UG9zIDwgcmVtb3ZlUGF0aC5uZXdQb3MpKSB7XG4gICAgICAgICAgICAgIGJhc2VQYXRoID0gY2xvbmVQYXRoKHJlbW92ZVBhdGgpO1xuICAgICAgICAgICAgICB0aGlzLnB1c2hDb21wb25lbnQoYmFzZVBhdGguY29tcG9uZW50cywgb2xkU3RyaW5nW29sZFBvc10sIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBiYXNlUGF0aCA9IGNsb25lUGF0aChhZGRQYXRoKTtcbiAgICAgICAgICAgICAgYmFzZVBhdGgubmV3UG9zKys7XG4gICAgICAgICAgICAgIHRoaXMucHVzaENvbXBvbmVudChiYXNlUGF0aC5jb21wb25lbnRzLCBuZXdTdHJpbmdbYmFzZVBhdGgubmV3UG9zXSwgdHJ1ZSwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG9sZFBvcyA9IHRoaXMuZXh0cmFjdENvbW1vbihiYXNlUGF0aCwgbmV3U3RyaW5nLCBvbGRTdHJpbmcsIGRpYWdvbmFsUGF0aCk7XG5cbiAgICAgICAgICAgIGlmIChiYXNlUGF0aC5uZXdQb3MrMSA+PSBuZXdMZW4gJiYgb2xkUG9zKzEgPj0gb2xkTGVuKSB7XG4gICAgICAgICAgICAgIHJldHVybiBiYXNlUGF0aC5jb21wb25lbnRzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYmVzdFBhdGhbZGlhZ29uYWxQYXRoXSA9IGJhc2VQYXRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcHVzaENvbXBvbmVudDogZnVuY3Rpb24oY29tcG9uZW50cywgdmFsdWUsIGFkZGVkLCByZW1vdmVkKSB7XG4gICAgICAgIHZhciBsYXN0ID0gY29tcG9uZW50c1tjb21wb25lbnRzLmxlbmd0aC0xXTtcbiAgICAgICAgaWYgKGxhc3QgJiYgbGFzdC5hZGRlZCA9PT0gYWRkZWQgJiYgbGFzdC5yZW1vdmVkID09PSByZW1vdmVkKSB7XG4gICAgICAgICAgLy8gV2UgbmVlZCB0byBjbG9uZSBoZXJlIGFzIHRoZSBjb21wb25lbnQgY2xvbmUgb3BlcmF0aW9uIGlzIGp1c3RcbiAgICAgICAgICAvLyBhcyBzaGFsbG93IGFycmF5IGNsb25lXG4gICAgICAgICAgY29tcG9uZW50c1tjb21wb25lbnRzLmxlbmd0aC0xXSA9XG4gICAgICAgICAgICB7dmFsdWU6IHRoaXMuam9pbihsYXN0LnZhbHVlLCB2YWx1ZSksIGFkZGVkOiBhZGRlZCwgcmVtb3ZlZDogcmVtb3ZlZCB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbXBvbmVudHMucHVzaCh7dmFsdWU6IHZhbHVlLCBhZGRlZDogYWRkZWQsIHJlbW92ZWQ6IHJlbW92ZWQgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBleHRyYWN0Q29tbW9uOiBmdW5jdGlvbihiYXNlUGF0aCwgbmV3U3RyaW5nLCBvbGRTdHJpbmcsIGRpYWdvbmFsUGF0aCkge1xuICAgICAgICB2YXIgbmV3TGVuID0gbmV3U3RyaW5nLmxlbmd0aCxcbiAgICAgICAgICAgIG9sZExlbiA9IG9sZFN0cmluZy5sZW5ndGgsXG4gICAgICAgICAgICBuZXdQb3MgPSBiYXNlUGF0aC5uZXdQb3MsXG4gICAgICAgICAgICBvbGRQb3MgPSBuZXdQb3MgLSBkaWFnb25hbFBhdGg7XG4gICAgICAgIHdoaWxlIChuZXdQb3MrMSA8IG5ld0xlbiAmJiBvbGRQb3MrMSA8IG9sZExlbiAmJiB0aGlzLmVxdWFscyhuZXdTdHJpbmdbbmV3UG9zKzFdLCBvbGRTdHJpbmdbb2xkUG9zKzFdKSkge1xuICAgICAgICAgIG5ld1BvcysrO1xuICAgICAgICAgIG9sZFBvcysrO1xuXG4gICAgICAgICAgdGhpcy5wdXNoQ29tcG9uZW50KGJhc2VQYXRoLmNvbXBvbmVudHMsIG5ld1N0cmluZ1tuZXdQb3NdLCB1bmRlZmluZWQsIHVuZGVmaW5lZCk7XG4gICAgICAgIH1cbiAgICAgICAgYmFzZVBhdGgubmV3UG9zID0gbmV3UG9zO1xuICAgICAgICByZXR1cm4gb2xkUG9zO1xuICAgICAgfSxcblxuICAgICAgZXF1YWxzOiBmdW5jdGlvbihsZWZ0LCByaWdodCkge1xuICAgICAgICB2YXIgcmVXaGl0ZXNwYWNlID0gL1xcUy87XG4gICAgICAgIGlmICh0aGlzLmlnbm9yZVdoaXRlc3BhY2UgJiYgIXJlV2hpdGVzcGFjZS50ZXN0KGxlZnQpICYmICFyZVdoaXRlc3BhY2UudGVzdChyaWdodCkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbGVmdCA9PT0gcmlnaHQ7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBqb2luOiBmdW5jdGlvbihsZWZ0LCByaWdodCkge1xuICAgICAgICByZXR1cm4gbGVmdCArIHJpZ2h0O1xuICAgICAgfSxcbiAgICAgIHRva2VuaXplOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG4gIH07XG5cbiAgdmFyIENoYXJEaWZmID0gbmV3IERpZmYoKTtcblxuICB2YXIgV29yZERpZmYgPSBuZXcgRGlmZih0cnVlKTtcbiAgdmFyIFdvcmRXaXRoU3BhY2VEaWZmID0gbmV3IERpZmYoKTtcbiAgV29yZERpZmYudG9rZW5pemUgPSBXb3JkV2l0aFNwYWNlRGlmZi50b2tlbml6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHJlbW92ZUVtcHR5KHZhbHVlLnNwbGl0KC8oXFxzK3xcXGIpLykpO1xuICB9O1xuXG4gIHZhciBDc3NEaWZmID0gbmV3IERpZmYodHJ1ZSk7XG4gIENzc0RpZmYudG9rZW5pemUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiByZW1vdmVFbXB0eSh2YWx1ZS5zcGxpdCgvKFt7fTo7LF18XFxzKykvKSk7XG4gIH07XG5cbiAgdmFyIExpbmVEaWZmID0gbmV3IERpZmYoKTtcbiAgTGluZURpZmYudG9rZW5pemUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHZhciByZXRMaW5lcyA9IFtdLFxuICAgICAgICBsaW5lcyA9IHZhbHVlLnNwbGl0KC9eL20pO1xuXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbGluZSA9IGxpbmVzW2ldLFxuICAgICAgICAgIGxhc3RMaW5lID0gbGluZXNbaSAtIDFdO1xuXG4gICAgICAvLyBNZXJnZSBsaW5lcyB0aGF0IG1heSBjb250YWluIHdpbmRvd3MgbmV3IGxpbmVzXG4gICAgICBpZiAobGluZSA9PSAnXFxuJyAmJiBsYXN0TGluZSAmJiBsYXN0TGluZVtsYXN0TGluZS5sZW5ndGggLSAxXSA9PT0gJ1xccicpIHtcbiAgICAgICAgcmV0TGluZXNbcmV0TGluZXMubGVuZ3RoIC0gMV0gKz0gJ1xcbic7XG4gICAgICB9IGVsc2UgaWYgKGxpbmUpIHtcbiAgICAgICAgcmV0TGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmV0TGluZXM7XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBEaWZmOiBEaWZmLFxuXG4gICAgZGlmZkNoYXJzOiBmdW5jdGlvbihvbGRTdHIsIG5ld1N0cikgeyByZXR1cm4gQ2hhckRpZmYuZGlmZihvbGRTdHIsIG5ld1N0cik7IH0sXG4gICAgZGlmZldvcmRzOiBmdW5jdGlvbihvbGRTdHIsIG5ld1N0cikgeyByZXR1cm4gV29yZERpZmYuZGlmZihvbGRTdHIsIG5ld1N0cik7IH0sXG4gICAgZGlmZldvcmRzV2l0aFNwYWNlOiBmdW5jdGlvbihvbGRTdHIsIG5ld1N0cikgeyByZXR1cm4gV29yZFdpdGhTcGFjZURpZmYuZGlmZihvbGRTdHIsIG5ld1N0cik7IH0sXG4gICAgZGlmZkxpbmVzOiBmdW5jdGlvbihvbGRTdHIsIG5ld1N0cikgeyByZXR1cm4gTGluZURpZmYuZGlmZihvbGRTdHIsIG5ld1N0cik7IH0sXG5cbiAgICBkaWZmQ3NzOiBmdW5jdGlvbihvbGRTdHIsIG5ld1N0cikgeyByZXR1cm4gQ3NzRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyKTsgfSxcblxuICAgIGNyZWF0ZVBhdGNoOiBmdW5jdGlvbihmaWxlTmFtZSwgb2xkU3RyLCBuZXdTdHIsIG9sZEhlYWRlciwgbmV3SGVhZGVyKSB7XG4gICAgICB2YXIgcmV0ID0gW107XG5cbiAgICAgIHJldC5wdXNoKCdJbmRleDogJyArIGZpbGVOYW1lKTtcbiAgICAgIHJldC5wdXNoKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Jyk7XG4gICAgICByZXQucHVzaCgnLS0tICcgKyBmaWxlTmFtZSArICh0eXBlb2Ygb2xkSGVhZGVyID09PSAndW5kZWZpbmVkJyA/ICcnIDogJ1xcdCcgKyBvbGRIZWFkZXIpKTtcbiAgICAgIHJldC5wdXNoKCcrKysgJyArIGZpbGVOYW1lICsgKHR5cGVvZiBuZXdIZWFkZXIgPT09ICd1bmRlZmluZWQnID8gJycgOiAnXFx0JyArIG5ld0hlYWRlcikpO1xuXG4gICAgICB2YXIgZGlmZiA9IExpbmVEaWZmLmRpZmYob2xkU3RyLCBuZXdTdHIpO1xuICAgICAgaWYgKCFkaWZmW2RpZmYubGVuZ3RoLTFdLnZhbHVlKSB7XG4gICAgICAgIGRpZmYucG9wKCk7ICAgLy8gUmVtb3ZlIHRyYWlsaW5nIG5ld2xpbmUgYWRkXG4gICAgICB9XG4gICAgICBkaWZmLnB1c2goe3ZhbHVlOiAnJywgbGluZXM6IFtdfSk7ICAgLy8gQXBwZW5kIGFuIGVtcHR5IHZhbHVlIHRvIG1ha2UgY2xlYW51cCBlYXNpZXJcblxuICAgICAgZnVuY3Rpb24gY29udGV4dExpbmVzKGxpbmVzKSB7XG4gICAgICAgIHJldHVybiBsaW5lcy5tYXAoZnVuY3Rpb24oZW50cnkpIHsgcmV0dXJuICcgJyArIGVudHJ5OyB9KTtcbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIGVvZk5MKGN1clJhbmdlLCBpLCBjdXJyZW50KSB7XG4gICAgICAgIHZhciBsYXN0ID0gZGlmZltkaWZmLmxlbmd0aC0yXSxcbiAgICAgICAgICAgIGlzTGFzdCA9IGkgPT09IGRpZmYubGVuZ3RoLTIsXG4gICAgICAgICAgICBpc0xhc3RPZlR5cGUgPSBpID09PSBkaWZmLmxlbmd0aC0zICYmIChjdXJyZW50LmFkZGVkICE9PSBsYXN0LmFkZGVkIHx8IGN1cnJlbnQucmVtb3ZlZCAhPT0gbGFzdC5yZW1vdmVkKTtcblxuICAgICAgICAvLyBGaWd1cmUgb3V0IGlmIHRoaXMgaXMgdGhlIGxhc3QgbGluZSBmb3IgdGhlIGdpdmVuIGZpbGUgYW5kIG1pc3NpbmcgTkxcbiAgICAgICAgaWYgKCEvXFxuJC8udGVzdChjdXJyZW50LnZhbHVlKSAmJiAoaXNMYXN0IHx8IGlzTGFzdE9mVHlwZSkpIHtcbiAgICAgICAgICBjdXJSYW5nZS5wdXNoKCdcXFxcIE5vIG5ld2xpbmUgYXQgZW5kIG9mIGZpbGUnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgb2xkUmFuZ2VTdGFydCA9IDAsIG5ld1JhbmdlU3RhcnQgPSAwLCBjdXJSYW5nZSA9IFtdLFxuICAgICAgICAgIG9sZExpbmUgPSAxLCBuZXdMaW5lID0gMTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGlmZi5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY3VycmVudCA9IGRpZmZbaV0sXG4gICAgICAgICAgICBsaW5lcyA9IGN1cnJlbnQubGluZXMgfHwgY3VycmVudC52YWx1ZS5yZXBsYWNlKC9cXG4kLywgJycpLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgY3VycmVudC5saW5lcyA9IGxpbmVzO1xuXG4gICAgICAgIGlmIChjdXJyZW50LmFkZGVkIHx8IGN1cnJlbnQucmVtb3ZlZCkge1xuICAgICAgICAgIGlmICghb2xkUmFuZ2VTdGFydCkge1xuICAgICAgICAgICAgdmFyIHByZXYgPSBkaWZmW2ktMV07XG4gICAgICAgICAgICBvbGRSYW5nZVN0YXJ0ID0gb2xkTGluZTtcbiAgICAgICAgICAgIG5ld1JhbmdlU3RhcnQgPSBuZXdMaW5lO1xuXG4gICAgICAgICAgICBpZiAocHJldikge1xuICAgICAgICAgICAgICBjdXJSYW5nZSA9IGNvbnRleHRMaW5lcyhwcmV2LmxpbmVzLnNsaWNlKC00KSk7XG4gICAgICAgICAgICAgIG9sZFJhbmdlU3RhcnQgLT0gY3VyUmFuZ2UubGVuZ3RoO1xuICAgICAgICAgICAgICBuZXdSYW5nZVN0YXJ0IC09IGN1clJhbmdlLmxlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgY3VyUmFuZ2UucHVzaC5hcHBseShjdXJSYW5nZSwgbGluZXMubWFwKGZ1bmN0aW9uKGVudHJ5KSB7IHJldHVybiAoY3VycmVudC5hZGRlZD8nKyc6Jy0nKSArIGVudHJ5OyB9KSk7XG4gICAgICAgICAgZW9mTkwoY3VyUmFuZ2UsIGksIGN1cnJlbnQpO1xuXG4gICAgICAgICAgaWYgKGN1cnJlbnQuYWRkZWQpIHtcbiAgICAgICAgICAgIG5ld0xpbmUgKz0gbGluZXMubGVuZ3RoO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvbGRMaW5lICs9IGxpbmVzLmxlbmd0aDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKG9sZFJhbmdlU3RhcnQpIHtcbiAgICAgICAgICAgIC8vIENsb3NlIG91dCBhbnkgY2hhbmdlcyB0aGF0IGhhdmUgYmVlbiBvdXRwdXQgKG9yIGpvaW4gb3ZlcmxhcHBpbmcpXG4gICAgICAgICAgICBpZiAobGluZXMubGVuZ3RoIDw9IDggJiYgaSA8IGRpZmYubGVuZ3RoLTIpIHtcbiAgICAgICAgICAgICAgLy8gT3ZlcmxhcHBpbmdcbiAgICAgICAgICAgICAgY3VyUmFuZ2UucHVzaC5hcHBseShjdXJSYW5nZSwgY29udGV4dExpbmVzKGxpbmVzKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBlbmQgdGhlIHJhbmdlIGFuZCBvdXRwdXRcbiAgICAgICAgICAgICAgdmFyIGNvbnRleHRTaXplID0gTWF0aC5taW4obGluZXMubGVuZ3RoLCA0KTtcbiAgICAgICAgICAgICAgcmV0LnB1c2goXG4gICAgICAgICAgICAgICAgICAnQEAgLScgKyBvbGRSYW5nZVN0YXJ0ICsgJywnICsgKG9sZExpbmUtb2xkUmFuZ2VTdGFydCtjb250ZXh0U2l6ZSlcbiAgICAgICAgICAgICAgICAgICsgJyArJyArIG5ld1JhbmdlU3RhcnQgKyAnLCcgKyAobmV3TGluZS1uZXdSYW5nZVN0YXJ0K2NvbnRleHRTaXplKVxuICAgICAgICAgICAgICAgICAgKyAnIEBAJyk7XG4gICAgICAgICAgICAgIHJldC5wdXNoLmFwcGx5KHJldCwgY3VyUmFuZ2UpO1xuICAgICAgICAgICAgICByZXQucHVzaC5hcHBseShyZXQsIGNvbnRleHRMaW5lcyhsaW5lcy5zbGljZSgwLCBjb250ZXh0U2l6ZSkpKTtcbiAgICAgICAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA8PSA0KSB7XG4gICAgICAgICAgICAgICAgZW9mTkwocmV0LCBpLCBjdXJyZW50KTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIG9sZFJhbmdlU3RhcnQgPSAwOyAgbmV3UmFuZ2VTdGFydCA9IDA7IGN1clJhbmdlID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIG9sZExpbmUgKz0gbGluZXMubGVuZ3RoO1xuICAgICAgICAgIG5ld0xpbmUgKz0gbGluZXMubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXQuam9pbignXFxuJykgKyAnXFxuJztcbiAgICB9LFxuXG4gICAgYXBwbHlQYXRjaDogZnVuY3Rpb24ob2xkU3RyLCB1bmlEaWZmKSB7XG4gICAgICB2YXIgZGlmZnN0ciA9IHVuaURpZmYuc3BsaXQoJ1xcbicpO1xuICAgICAgdmFyIGRpZmYgPSBbXTtcbiAgICAgIHZhciByZW1FT0ZOTCA9IGZhbHNlLFxuICAgICAgICAgIGFkZEVPRk5MID0gZmFsc2U7XG5cbiAgICAgIGZvciAodmFyIGkgPSAoZGlmZnN0clswXVswXT09PSdJJz80OjApOyBpIDwgZGlmZnN0ci5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZihkaWZmc3RyW2ldWzBdID09PSAnQCcpIHtcbiAgICAgICAgICB2YXIgbWVoID0gZGlmZnN0cltpXS5zcGxpdCgvQEAgLShcXGQrKSwoXFxkKykgXFwrKFxcZCspLChcXGQrKSBAQC8pO1xuICAgICAgICAgIGRpZmYudW5zaGlmdCh7XG4gICAgICAgICAgICBzdGFydDptZWhbM10sXG4gICAgICAgICAgICBvbGRsZW5ndGg6bWVoWzJdLFxuICAgICAgICAgICAgb2xkbGluZXM6W10sXG4gICAgICAgICAgICBuZXdsZW5ndGg6bWVoWzRdLFxuICAgICAgICAgICAgbmV3bGluZXM6W11cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmKGRpZmZzdHJbaV1bMF0gPT09ICcrJykge1xuICAgICAgICAgIGRpZmZbMF0ubmV3bGluZXMucHVzaChkaWZmc3RyW2ldLnN1YnN0cigxKSk7XG4gICAgICAgIH0gZWxzZSBpZihkaWZmc3RyW2ldWzBdID09PSAnLScpIHtcbiAgICAgICAgICBkaWZmWzBdLm9sZGxpbmVzLnB1c2goZGlmZnN0cltpXS5zdWJzdHIoMSkpO1xuICAgICAgICB9IGVsc2UgaWYoZGlmZnN0cltpXVswXSA9PT0gJyAnKSB7XG4gICAgICAgICAgZGlmZlswXS5uZXdsaW5lcy5wdXNoKGRpZmZzdHJbaV0uc3Vic3RyKDEpKTtcbiAgICAgICAgICBkaWZmWzBdLm9sZGxpbmVzLnB1c2goZGlmZnN0cltpXS5zdWJzdHIoMSkpO1xuICAgICAgICB9IGVsc2UgaWYoZGlmZnN0cltpXVswXSA9PT0gJ1xcXFwnKSB7XG4gICAgICAgICAgaWYgKGRpZmZzdHJbaS0xXVswXSA9PT0gJysnKSB7XG4gICAgICAgICAgICByZW1FT0ZOTCA9IHRydWU7XG4gICAgICAgICAgfSBlbHNlIGlmKGRpZmZzdHJbaS0xXVswXSA9PT0gJy0nKSB7XG4gICAgICAgICAgICBhZGRFT0ZOTCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBzdHIgPSBvbGRTdHIuc3BsaXQoJ1xcbicpO1xuICAgICAgZm9yICh2YXIgaSA9IGRpZmYubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgdmFyIGQgPSBkaWZmW2ldO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGQub2xkbGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBpZihzdHJbZC5zdGFydC0xK2pdICE9PSBkLm9sZGxpbmVzW2pdKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5zcGxpY2UuYXBwbHkoc3RyLFtkLnN0YXJ0LTEsK2Qub2xkbGVuZ3RoXS5jb25jYXQoZC5uZXdsaW5lcykpO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVtRU9GTkwpIHtcbiAgICAgICAgd2hpbGUgKCFzdHJbc3RyLmxlbmd0aC0xXSkge1xuICAgICAgICAgIHN0ci5wb3AoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChhZGRFT0ZOTCkge1xuICAgICAgICBzdHIucHVzaCgnJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3RyLmpvaW4oJ1xcbicpO1xuICAgIH0sXG5cbiAgICBjb252ZXJ0Q2hhbmdlc1RvWE1MOiBmdW5jdGlvbihjaGFuZ2VzKXtcbiAgICAgIHZhciByZXQgPSBbXTtcbiAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGNoYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNoYW5nZSA9IGNoYW5nZXNbaV07XG4gICAgICAgIGlmIChjaGFuZ2UuYWRkZWQpIHtcbiAgICAgICAgICByZXQucHVzaCgnPGlucz4nKTtcbiAgICAgICAgfSBlbHNlIGlmIChjaGFuZ2UucmVtb3ZlZCkge1xuICAgICAgICAgIHJldC5wdXNoKCc8ZGVsPicpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0LnB1c2goZXNjYXBlSFRNTChjaGFuZ2UudmFsdWUpKTtcblxuICAgICAgICBpZiAoY2hhbmdlLmFkZGVkKSB7XG4gICAgICAgICAgcmV0LnB1c2goJzwvaW5zPicpO1xuICAgICAgICB9IGVsc2UgaWYgKGNoYW5nZS5yZW1vdmVkKSB7XG4gICAgICAgICAgcmV0LnB1c2goJzwvZGVsPicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmV0LmpvaW4oJycpO1xuICAgIH0sXG5cbiAgICAvLyBTZWU6IGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9nb29nbGUtZGlmZi1tYXRjaC1wYXRjaC93aWtpL0FQSVxuICAgIGNvbnZlcnRDaGFuZ2VzVG9ETVA6IGZ1bmN0aW9uKGNoYW5nZXMpe1xuICAgICAgdmFyIHJldCA9IFtdLCBjaGFuZ2U7XG4gICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBjaGFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNoYW5nZSA9IGNoYW5nZXNbaV07XG4gICAgICAgIHJldC5wdXNoKFsoY2hhbmdlLmFkZGVkID8gMSA6IGNoYW5nZS5yZW1vdmVkID8gLTEgOiAwKSwgY2hhbmdlLnZhbHVlXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmV0O1xuICAgIH1cbiAgfTtcbn0pKCk7XG5cbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gSnNEaWZmO1xufVxuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuIWZ1bmN0aW9uKF9lKXt2YXIgZT1mdW5jdGlvbigpe3JldHVybiBfZSgpW1wiZGVmYXVsdFwiXX07aWYoXCJvYmplY3RcIj09dHlwZW9mIGV4cG9ydHMpbW9kdWxlLmV4cG9ydHM9ZSgpO2Vsc2UgaWYoXCJmdW5jdGlvblwiPT10eXBlb2YgZGVmaW5lJiZkZWZpbmUuYW1kKWRlZmluZShlKTtlbHNle3ZhciBmO1widW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/Zj13aW5kb3c6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGdsb2JhbD9mPWdsb2JhbDpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZiYmKGY9c2VsZiksZi4kPWUoKX19KGZ1bmN0aW9uKCl7dmFyIGRlZmluZSxtb2R1bGUsZXhwb3J0cztyZXR1cm4gKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkoezE6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvYXBpXCI7XG52YXIgZXh0ZW5kID0gX2RlcmVxXygnLi91dGlsJykuZXh0ZW5kO1xudmFyIGFwaSA9IHt9LFxuICAgIGFwaU5vZGVMaXN0ID0ge30sXG4gICAgJCA9IHt9O1xudmFyIGFycmF5ID0gX2RlcmVxXygnLi9hcnJheScpO1xudmFyIGF0dHIgPSBfZGVyZXFfKCcuL2F0dHInKTtcbnZhciBjbGFzc05hbWUgPSBfZGVyZXFfKCcuL2NsYXNzJyk7XG52YXIgZGF0YSA9IF9kZXJlcV8oJy4vZGF0YScpO1xudmFyIGRvbSA9IF9kZXJlcV8oJy4vZG9tJyk7XG52YXIgZG9tX2V4dHJhID0gX2RlcmVxXygnLi9kb21fZXh0cmEnKTtcbnZhciBldmVudCA9IF9kZXJlcV8oJy4vZXZlbnQnKTtcbnZhciBodG1sID0gX2RlcmVxXygnLi9odG1sJyk7XG52YXIgc2VsZWN0b3IgPSBfZGVyZXFfKCcuL3NlbGVjdG9yJyk7XG52YXIgc2VsZWN0b3JfZXh0cmEgPSBfZGVyZXFfKCcuL3NlbGVjdG9yX2V4dHJhJyk7XG5pZiAoc2VsZWN0b3IgIT09IHVuZGVmaW5lZCkge1xuICAkID0gc2VsZWN0b3IuJDtcbiAgJC5tYXRjaGVzID0gc2VsZWN0b3IubWF0Y2hlcztcbiAgYXBpLmZpbmQgPSBzZWxlY3Rvci5maW5kO1xufVxudmFyIG1vZGUgPSBfZGVyZXFfKCcuL21vZGUnKTtcbmV4dGVuZCgkLCBtb2RlKTtcbnZhciBub2NvbmZsaWN0ID0gX2RlcmVxXygnLi9ub2NvbmZsaWN0Jyk7XG5leHRlbmQoJCwgbm9jb25mbGljdCk7XG5leHRlbmQoYXBpLCBhcnJheSwgYXR0ciwgY2xhc3NOYW1lLCBkYXRhLCBkb20sIGRvbV9leHRyYSwgZXZlbnQsIGh0bWwsIHNlbGVjdG9yX2V4dHJhKTtcbmV4dGVuZChhcGlOb2RlTGlzdCwgYXJyYXkpO1xuJC52ZXJzaW9uID0gJzAuNy4xJztcbiQuZXh0ZW5kID0gZXh0ZW5kO1xuJC5mbiA9IGFwaTtcbiQuZm5MaXN0ID0gYXBpTm9kZUxpc3Q7XG52YXIgJF9fZGVmYXVsdCA9ICQ7XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZGVmYXVsdDogJF9fZGVmYXVsdCxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vYXJyYXlcIjoyLFwiLi9hdHRyXCI6MyxcIi4vY2xhc3NcIjo0LFwiLi9kYXRhXCI6NSxcIi4vZG9tXCI6NixcIi4vZG9tX2V4dHJhXCI6NyxcIi4vZXZlbnRcIjo4LFwiLi9odG1sXCI6OSxcIi4vbW9kZVwiOjExLFwiLi9ub2NvbmZsaWN0XCI6MTIsXCIuL3NlbGVjdG9yXCI6MTMsXCIuL3NlbGVjdG9yX2V4dHJhXCI6MTQsXCIuL3V0aWxcIjoxNX1dLDI6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvYXJyYXlcIjtcbnZhciBfZWFjaCA9IF9kZXJlcV8oJy4vdXRpbCcpLmVhY2g7XG52YXIgJF9fMCA9IF9kZXJlcV8oJy4vc2VsZWN0b3InKSxcbiAgICAkID0gJF9fMC4kLFxuICAgIG1hdGNoZXMgPSAkX18wLm1hdGNoZXM7XG52YXIgQXJyYXlQcm90byA9IEFycmF5LnByb3RvdHlwZTtcbnZhciBldmVyeSA9IEFycmF5UHJvdG8uZXZlcnk7XG5mdW5jdGlvbiBmaWx0ZXIoc2VsZWN0b3IsIHRoaXNBcmcpIHtcbiAgdmFyIGNhbGxiYWNrID0gdHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nID8gc2VsZWN0b3IgOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgcmV0dXJuIG1hdGNoZXMoZWxlbWVudCwgc2VsZWN0b3IpO1xuICB9O1xuICByZXR1cm4gJChBcnJheVByb3RvLmZpbHRlci5jYWxsKHRoaXMsIGNhbGxiYWNrLCB0aGlzQXJnKSk7XG59XG5mdW5jdGlvbiBmb3JFYWNoKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gIHJldHVybiBfZWFjaCh0aGlzLCBjYWxsYmFjaywgdGhpc0FyZyk7XG59XG52YXIgZWFjaCA9IGZvckVhY2g7XG52YXIgaW5kZXhPZiA9IEFycmF5UHJvdG8uaW5kZXhPZjtcbnZhciBtYXAgPSBBcnJheVByb3RvLm1hcDtcbnZhciBwb3AgPSBBcnJheVByb3RvLnBvcDtcbnZhciBwdXNoID0gQXJyYXlQcm90by5wdXNoO1xuZnVuY3Rpb24gcmV2ZXJzZSgpIHtcbiAgdmFyIGVsZW1lbnRzID0gQXJyYXlQcm90by5zbGljZS5jYWxsKHRoaXMpO1xuICByZXR1cm4gJChBcnJheVByb3RvLnJldmVyc2UuY2FsbChlbGVtZW50cykpO1xufVxudmFyIHNoaWZ0ID0gQXJyYXlQcm90by5zaGlmdDtcbnZhciBzb21lID0gQXJyYXlQcm90by5zb21lO1xudmFyIHVuc2hpZnQgPSBBcnJheVByb3RvLnVuc2hpZnQ7XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZWFjaDogZWFjaCxcbiAgZXZlcnk6IGV2ZXJ5LFxuICBmaWx0ZXI6IGZpbHRlcixcbiAgZm9yRWFjaDogZm9yRWFjaCxcbiAgaW5kZXhPZjogaW5kZXhPZixcbiAgbWFwOiBtYXAsXG4gIHBvcDogcG9wLFxuICBwdXNoOiBwdXNoLFxuICByZXZlcnNlOiByZXZlcnNlLFxuICBzaGlmdDogc2hpZnQsXG4gIHNvbWU6IHNvbWUsXG4gIHVuc2hpZnQ6IHVuc2hpZnQsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL3NlbGVjdG9yXCI6MTMsXCIuL3V0aWxcIjoxNX1dLDM6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvYXR0clwiO1xudmFyIGVhY2ggPSBfZGVyZXFfKCcuL3V0aWwnKS5lYWNoO1xuZnVuY3Rpb24gYXR0cihrZXksIHZhbHVlKSB7XG4gIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJyAmJiB0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgdmFyIGVsZW1lbnQgPSB0aGlzLm5vZGVUeXBlID8gdGhpcyA6IHRoaXNbMF07XG4gICAgcmV0dXJuIGVsZW1lbnQgPyBlbGVtZW50LmdldEF0dHJpYnV0ZShrZXkpIDogdW5kZWZpbmVkO1xuICB9XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0Jykge1xuICAgICAgZm9yICh2YXIgYXR0ciBpbiBrZXkpIHtcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoYXR0ciwga2V5W2F0dHJdKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiByZW1vdmVBdHRyKGtleSkge1xuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYXR0cjogYXR0cixcbiAgcmVtb3ZlQXR0cjogcmVtb3ZlQXR0cixcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vdXRpbFwiOjE1fV0sNDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9jbGFzc1wiO1xudmFyICRfXzAgPSBfZGVyZXFfKCcuL3V0aWwnKSxcbiAgICBtYWtlSXRlcmFibGUgPSAkX18wLm1ha2VJdGVyYWJsZSxcbiAgICBlYWNoID0gJF9fMC5lYWNoO1xuZnVuY3Rpb24gYWRkQ2xhc3ModmFsdWUpIHtcbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKHZhbHVlKTtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gcmVtb3ZlQ2xhc3ModmFsdWUpIHtcbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKHZhbHVlKTtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gdG9nZ2xlQ2xhc3ModmFsdWUpIHtcbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKHZhbHVlKTtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gaGFzQ2xhc3ModmFsdWUpIHtcbiAgcmV0dXJuIG1ha2VJdGVyYWJsZSh0aGlzKS5zb21lKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnModmFsdWUpO1xuICB9KTtcbn1cbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGRDbGFzczogYWRkQ2xhc3MsXG4gIHJlbW92ZUNsYXNzOiByZW1vdmVDbGFzcyxcbiAgdG9nZ2xlQ2xhc3M6IHRvZ2dsZUNsYXNzLFxuICBoYXNDbGFzczogaGFzQ2xhc3MsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL3V0aWxcIjoxNX1dLDU6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvZGF0YVwiO1xudmFyIGVhY2ggPSBfZGVyZXFfKCcuL3V0aWwnKS5lYWNoO1xudmFyIGRhdGFLZXlQcm9wID0gJ19fZG9tdGFzdGljX2RhdGFfXyc7XG5mdW5jdGlvbiBkYXRhKGtleSwgdmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB2YXIgZWxlbWVudCA9IHRoaXMubm9kZVR5cGUgPyB0aGlzIDogdGhpc1swXTtcbiAgICByZXR1cm4gZWxlbWVudCAmJiBlbGVtZW50W2RhdGFLZXlQcm9wXSA/IGVsZW1lbnRbZGF0YUtleVByb3BdW2tleV0gOiB1bmRlZmluZWQ7XG4gIH1cbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgZWxlbWVudFtkYXRhS2V5UHJvcF0gPSBlbGVtZW50W2RhdGFLZXlQcm9wXSB8fCB7fTtcbiAgICBlbGVtZW50W2RhdGFLZXlQcm9wXVtrZXldID0gdmFsdWU7XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIHByb3Aoa2V5LCB2YWx1ZSkge1xuICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgIHZhciBlbGVtZW50ID0gdGhpcy5ub2RlVHlwZSA/IHRoaXMgOiB0aGlzWzBdO1xuICAgIHJldHVybiBlbGVtZW50ICYmIGVsZW1lbnQgPyBlbGVtZW50W2tleV0gOiB1bmRlZmluZWQ7XG4gIH1cbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgZWxlbWVudFtrZXldID0gdmFsdWU7XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBkYXRhOiBkYXRhLFxuICBwcm9wOiBwcm9wLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi91dGlsXCI6MTV9XSw2OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL2RvbVwiO1xudmFyIHRvQXJyYXkgPSBfZGVyZXFfKCcuL3V0aWwnKS50b0FycmF5O1xuZnVuY3Rpb24gYXBwZW5kKGVsZW1lbnQpIHtcbiAgaWYgKHRoaXMgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsIGVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBlbGVtZW50cyA9IGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlTGlzdCA/IHRvQXJyYXkoZWxlbWVudCkgOiBlbGVtZW50O1xuICAgICAgICBlbGVtZW50cy5mb3JFYWNoKHRoaXMuYXBwZW5kQ2hpbGQuYmluZCh0aGlzKSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgd2hpbGUgKGwtLSkge1xuICAgICAgdmFyIGVsbSA9IGwgPT09IDAgPyBlbGVtZW50IDogX2Nsb25lKGVsZW1lbnQpO1xuICAgICAgYXBwZW5kLmNhbGwodGhpc1tsXSwgZWxtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBwcmVwZW5kKGVsZW1lbnQpIHtcbiAgaWYgKHRoaXMgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyYmVnaW4nLCBlbGVtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAgIHRoaXMuaW5zZXJ0QmVmb3JlKGVsZW1lbnQsIHRoaXMuZmlyc3RDaGlsZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZWxlbWVudHMgPSBlbGVtZW50IGluc3RhbmNlb2YgTm9kZUxpc3QgPyB0b0FycmF5KGVsZW1lbnQpIDogZWxlbWVudDtcbiAgICAgICAgZWxlbWVudHMucmV2ZXJzZSgpLmZvckVhY2gocHJlcGVuZC5iaW5kKHRoaXMpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICB3aGlsZSAobC0tKSB7XG4gICAgICB2YXIgZWxtID0gbCA9PT0gMCA/IGVsZW1lbnQgOiBfY2xvbmUoZWxlbWVudCk7XG4gICAgICBwcmVwZW5kLmNhbGwodGhpc1tsXSwgZWxtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBiZWZvcmUoZWxlbWVudCkge1xuICBpZiAodGhpcyBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlYmVnaW4nLCBlbGVtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAgIHRoaXMucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWxlbWVudCwgdGhpcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZWxlbWVudHMgPSBlbGVtZW50IGluc3RhbmNlb2YgTm9kZUxpc3QgPyB0b0FycmF5KGVsZW1lbnQpIDogZWxlbWVudDtcbiAgICAgICAgZWxlbWVudHMuZm9yRWFjaChiZWZvcmUuYmluZCh0aGlzKSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgd2hpbGUgKGwtLSkge1xuICAgICAgdmFyIGVsbSA9IGwgPT09IDAgPyBlbGVtZW50IDogX2Nsb25lKGVsZW1lbnQpO1xuICAgICAgYmVmb3JlLmNhbGwodGhpc1tsXSwgZWxtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBhZnRlcihlbGVtZW50KSB7XG4gIGlmICh0aGlzIGluc3RhbmNlb2YgTm9kZSkge1xuICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRoaXMuaW5zZXJ0QWRqYWNlbnRIVE1MKCdhZnRlcmVuZCcsIGVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgdGhpcy5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbGVtZW50LCB0aGlzLm5leHRTaWJsaW5nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBlbGVtZW50cyA9IGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlTGlzdCA/IHRvQXJyYXkoZWxlbWVudCkgOiBlbGVtZW50O1xuICAgICAgICBlbGVtZW50cy5yZXZlcnNlKCkuZm9yRWFjaChhZnRlci5iaW5kKHRoaXMpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICB3aGlsZSAobC0tKSB7XG4gICAgICB2YXIgZWxtID0gbCA9PT0gMCA/IGVsZW1lbnQgOiBfY2xvbmUoZWxlbWVudCk7XG4gICAgICBhZnRlci5jYWxsKHRoaXNbbF0sIGVsbSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gY2xvbmUoKSB7XG4gIHJldHVybiAkKF9jbG9uZSh0aGlzKSk7XG59XG5mdW5jdGlvbiBfY2xvbmUoZWxlbWVudCkge1xuICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH0gZWxzZSBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICByZXR1cm4gZWxlbWVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gIH0gZWxzZSBpZiAoJ2xlbmd0aCcgaW4gZWxlbWVudCkge1xuICAgIHJldHVybiBbXS5tYXAuY2FsbChlbGVtZW50LCBmdW5jdGlvbihlbCkge1xuICAgICAgcmV0dXJuIGVsLmNsb25lTm9kZSh0cnVlKTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gZWxlbWVudDtcbn1cbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBhcHBlbmQ6IGFwcGVuZCxcbiAgcHJlcGVuZDogcHJlcGVuZCxcbiAgYmVmb3JlOiBiZWZvcmUsXG4gIGFmdGVyOiBhZnRlcixcbiAgY2xvbmU6IGNsb25lLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi91dGlsXCI6MTV9XSw3OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL2RvbV9leHRyYVwiO1xudmFyIGVhY2ggPSBfZGVyZXFfKCcuL3V0aWwnKS5lYWNoO1xudmFyICRfXzAgPSBfZGVyZXFfKCcuL2RvbScpLFxuICAgIGFwcGVuZCA9ICRfXzAuYXBwZW5kLFxuICAgIGJlZm9yZSA9ICRfXzAuYmVmb3JlLFxuICAgIGFmdGVyID0gJF9fMC5hZnRlcjtcbnZhciAkID0gX2RlcmVxXygnLi9zZWxlY3RvcicpLiQ7XG5mdW5jdGlvbiBhcHBlbmRUbyhlbGVtZW50KSB7XG4gIHZhciBjb250ZXh0ID0gdHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnID8gJChlbGVtZW50KSA6IGVsZW1lbnQ7XG4gIGFwcGVuZC5jYWxsKGNvbnRleHQsIHRoaXMpO1xuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIGVtcHR5KCkge1xuICByZXR1cm4gZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgZWxlbWVudC5pbm5lckhUTUwgPSAnJztcbiAgfSk7XG59XG5mdW5jdGlvbiByZW1vdmUoKSB7XG4gIHJldHVybiBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBpZiAoZWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICBlbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWxlbWVudCk7XG4gICAgfVxuICB9KTtcbn1cbmZ1bmN0aW9uIHJlcGxhY2VXaXRoKCkge1xuICByZXR1cm4gYmVmb3JlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykucmVtb3ZlKCk7XG59XG5mdW5jdGlvbiB0ZXh0KHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHRoaXNbMF0udGV4dENvbnRlbnQ7XG4gIH1cbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgZWxlbWVudC50ZXh0Q29udGVudCA9ICcnICsgdmFsdWU7XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIHZhbCh2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiB0aGlzWzBdLnZhbHVlO1xuICB9XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGVsZW1lbnQudmFsdWUgPSB2YWx1ZTtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFwcGVuZFRvOiBhcHBlbmRUbyxcbiAgZW1wdHk6IGVtcHR5LFxuICByZW1vdmU6IHJlbW92ZSxcbiAgcmVwbGFjZVdpdGg6IHJlcGxhY2VXaXRoLFxuICB0ZXh0OiB0ZXh0LFxuICB2YWw6IHZhbCxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vZG9tXCI6NixcIi4vc2VsZWN0b3JcIjoxMyxcIi4vdXRpbFwiOjE1fV0sODpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9ldmVudFwiO1xudmFyICRfXzAgPSBfZGVyZXFfKCcuL3V0aWwnKSxcbiAgICBnbG9iYWwgPSAkX18wLmdsb2JhbCxcbiAgICBlYWNoID0gJF9fMC5lYWNoO1xudmFyIG1hdGNoZXMgPSBfZGVyZXFfKCcuL3NlbGVjdG9yJykubWF0Y2hlcztcbmZ1bmN0aW9uIG9uKGV2ZW50TmFtZXMsIHNlbGVjdG9yLCBoYW5kbGVyLCB1c2VDYXB0dXJlKSB7XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICBoYW5kbGVyID0gc2VsZWN0b3I7XG4gICAgc2VsZWN0b3IgPSBudWxsO1xuICB9XG4gIHZhciBwYXJ0cyxcbiAgICAgIG5hbWVzcGFjZSxcbiAgICAgIGV2ZW50TGlzdGVuZXI7XG4gIGV2ZW50TmFtZXMuc3BsaXQoJyAnKS5mb3JFYWNoKGZ1bmN0aW9uKGV2ZW50TmFtZSkge1xuICAgIHBhcnRzID0gZXZlbnROYW1lLnNwbGl0KCcuJyk7XG4gICAgZXZlbnROYW1lID0gcGFydHNbMF0gfHwgbnVsbDtcbiAgICBuYW1lc3BhY2UgPSBwYXJ0c1sxXSB8fCBudWxsO1xuICAgIGV2ZW50TGlzdGVuZXIgPSBwcm94eUhhbmRsZXIoaGFuZGxlcik7XG4gICAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICBpZiAoc2VsZWN0b3IpIHtcbiAgICAgICAgZXZlbnRMaXN0ZW5lciA9IGRlbGVnYXRlSGFuZGxlci5iaW5kKGVsZW1lbnQsIHNlbGVjdG9yLCBoYW5kbGVyKTtcbiAgICAgIH1cbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGV2ZW50TGlzdGVuZXIsIHVzZUNhcHR1cmUgfHwgZmFsc2UpO1xuICAgICAgZ2V0SGFuZGxlcnMoZWxlbWVudCkucHVzaCh7XG4gICAgICAgIGV2ZW50TmFtZTogZXZlbnROYW1lLFxuICAgICAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgICAgICBldmVudExpc3RlbmVyOiBldmVudExpc3RlbmVyLFxuICAgICAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXG4gICAgICAgIG5hbWVzcGFjZTogbmFtZXNwYWNlXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSwgdGhpcyk7XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gb2ZmKCkge1xuICB2YXIgZXZlbnROYW1lcyA9IGFyZ3VtZW50c1swXSAhPT0gKHZvaWQgMCkgPyBhcmd1bWVudHNbMF0gOiAnJztcbiAgdmFyIHNlbGVjdG9yID0gYXJndW1lbnRzWzFdO1xuICB2YXIgaGFuZGxlciA9IGFyZ3VtZW50c1syXTtcbiAgdmFyIHVzZUNhcHR1cmUgPSBhcmd1bWVudHNbM107XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICBoYW5kbGVyID0gc2VsZWN0b3I7XG4gICAgc2VsZWN0b3IgPSBudWxsO1xuICB9XG4gIHZhciBwYXJ0cyxcbiAgICAgIG5hbWVzcGFjZSxcbiAgICAgIGhhbmRsZXJzO1xuICBldmVudE5hbWVzLnNwbGl0KCcgJykuZm9yRWFjaChmdW5jdGlvbihldmVudE5hbWUpIHtcbiAgICBwYXJ0cyA9IGV2ZW50TmFtZS5zcGxpdCgnLicpO1xuICAgIGV2ZW50TmFtZSA9IHBhcnRzWzBdIHx8IG51bGw7XG4gICAgbmFtZXNwYWNlID0gcGFydHNbMV0gfHwgbnVsbDtcbiAgICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIGhhbmRsZXJzID0gZ2V0SGFuZGxlcnMoZWxlbWVudCk7XG4gICAgICBpZiAoIWV2ZW50TmFtZSAmJiAhbmFtZXNwYWNlICYmICFzZWxlY3RvciAmJiAhaGFuZGxlcikge1xuICAgICAgICBlYWNoKGhhbmRsZXJzLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGl0ZW0uZXZlbnROYW1lLCBpdGVtLmV2ZW50TGlzdGVuZXIsIHVzZUNhcHR1cmUgfHwgZmFsc2UpO1xuICAgICAgICB9KTtcbiAgICAgICAgY2xlYXJIYW5kbGVycyhlbGVtZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVhY2goaGFuZGxlcnMuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICByZXR1cm4gKCghZXZlbnROYW1lIHx8IGl0ZW0uZXZlbnROYW1lID09PSBldmVudE5hbWUpICYmICghbmFtZXNwYWNlIHx8IGl0ZW0ubmFtZXNwYWNlID09PSBuYW1lc3BhY2UpICYmICghaGFuZGxlciB8fCBpdGVtLmhhbmRsZXIgPT09IGhhbmRsZXIpICYmICghc2VsZWN0b3IgfHwgaXRlbS5zZWxlY3RvciA9PT0gc2VsZWN0b3IpKTtcbiAgICAgICAgfSksIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoaXRlbS5ldmVudE5hbWUsIGl0ZW0uZXZlbnRMaXN0ZW5lciwgdXNlQ2FwdHVyZSB8fCBmYWxzZSk7XG4gICAgICAgICAgaGFuZGxlcnMuc3BsaWNlKGhhbmRsZXJzLmluZGV4T2YoaXRlbSksIDEpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGhhbmRsZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGNsZWFySGFuZGxlcnMoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfSwgdGhpcyk7XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gZGVsZWdhdGUoc2VsZWN0b3IsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICByZXR1cm4gb24uY2FsbCh0aGlzLCBldmVudE5hbWUsIHNlbGVjdG9yLCBoYW5kbGVyKTtcbn1cbmZ1bmN0aW9uIHVuZGVsZWdhdGUoc2VsZWN0b3IsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICByZXR1cm4gb2ZmLmNhbGwodGhpcywgZXZlbnROYW1lLCBzZWxlY3RvciwgaGFuZGxlcik7XG59XG5mdW5jdGlvbiB0cmlnZ2VyKHR5cGUsIGRhdGEpIHtcbiAgdmFyIHBhcmFtcyA9IGFyZ3VtZW50c1syXSAhPT0gKHZvaWQgMCkgPyBhcmd1bWVudHNbMl0gOiB7fTtcbiAgcGFyYW1zLmJ1YmJsZXMgPSB0eXBlb2YgcGFyYW1zLmJ1YmJsZXMgPT09ICdib29sZWFuJyA/IHBhcmFtcy5idWJibGVzIDogdHJ1ZTtcbiAgcGFyYW1zLmNhbmNlbGFibGUgPSB0eXBlb2YgcGFyYW1zLmNhbmNlbGFibGUgPT09ICdib29sZWFuJyA/IHBhcmFtcy5jYW5jZWxhYmxlIDogdHJ1ZTtcbiAgcGFyYW1zLnByZXZlbnREZWZhdWx0ID0gdHlwZW9mIHBhcmFtcy5wcmV2ZW50RGVmYXVsdCA9PT0gJ2Jvb2xlYW4nID8gcGFyYW1zLnByZXZlbnREZWZhdWx0IDogZmFsc2U7XG4gIHBhcmFtcy5kZXRhaWwgPSBkYXRhO1xuICB2YXIgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQodHlwZSwgcGFyYW1zKTtcbiAgZXZlbnQuX3ByZXZlbnREZWZhdWx0ID0gcGFyYW1zLnByZXZlbnREZWZhdWx0O1xuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBpZiAoIXBhcmFtcy5idWJibGVzIHx8IGlzRXZlbnRCdWJibGluZ0luRGV0YWNoZWRUcmVlIHx8IGlzQXR0YWNoZWRUb0RvY3VtZW50KGVsZW1lbnQpKSB7XG4gICAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0cmlnZ2VyRm9yUGF0aChlbGVtZW50LCB0eXBlLCBwYXJhbXMpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gdHJpZ2dlckhhbmRsZXIodHlwZSwgZGF0YSkge1xuICBpZiAodGhpc1swXSkge1xuICAgIHRyaWdnZXIuY2FsbCh0aGlzWzBdLCB0eXBlLCBkYXRhLCB7XG4gICAgICBidWJibGVzOiBmYWxzZSxcbiAgICAgIHByZXZlbnREZWZhdWx0OiB0cnVlXG4gICAgfSk7XG4gIH1cbn1cbmZ1bmN0aW9uIHJlYWR5KGhhbmRsZXIpIHtcbiAgaWYgKC9jb21wbGV0ZXxsb2FkZWR8aW50ZXJhY3RpdmUvLnRlc3QoZG9jdW1lbnQucmVhZHlTdGF0ZSkgJiYgZG9jdW1lbnQuYm9keSkge1xuICAgIGhhbmRsZXIoKTtcbiAgfSBlbHNlIHtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgaGFuZGxlciwgZmFsc2UpO1xuICB9XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gaXNBdHRhY2hlZFRvRG9jdW1lbnQoZWxlbWVudCkge1xuICBpZiAoZWxlbWVudCA9PT0gd2luZG93IHx8IGVsZW1lbnQgPT09IGRvY3VtZW50KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgdmFyIGNvbnRhaW5lciA9IGVsZW1lbnQub3duZXJEb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gIGlmIChjb250YWluZXIuY29udGFpbnMpIHtcbiAgICByZXR1cm4gY29udGFpbmVyLmNvbnRhaW5zKGVsZW1lbnQpO1xuICB9IGVsc2UgaWYgKGNvbnRhaW5lci5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbikge1xuICAgIHJldHVybiAhKGNvbnRhaW5lci5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihlbGVtZW50KSAmIE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fRElTQ09OTkVDVEVEKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5mdW5jdGlvbiB0cmlnZ2VyRm9yUGF0aChlbGVtZW50LCB0eXBlKSB7XG4gIHZhciBwYXJhbXMgPSBhcmd1bWVudHNbMl0gIT09ICh2b2lkIDApID8gYXJndW1lbnRzWzJdIDoge307XG4gIHBhcmFtcy5idWJibGVzID0gZmFsc2U7XG4gIHZhciBldmVudCA9IG5ldyBDdXN0b21FdmVudCh0eXBlLCBwYXJhbXMpO1xuICBldmVudC5fdGFyZ2V0ID0gZWxlbWVudDtcbiAgZG8ge1xuICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gIH0gd2hpbGUgKGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpO1xufVxudmFyIGV2ZW50S2V5UHJvcCA9ICdfX2RvbXRhc3RpY19ldmVudF9fJztcbnZhciBpZCA9IDE7XG52YXIgaGFuZGxlcnMgPSB7fTtcbnZhciB1bnVzZWRLZXlzID0gW107XG5mdW5jdGlvbiBnZXRIYW5kbGVycyhlbGVtZW50KSB7XG4gIGlmICghZWxlbWVudFtldmVudEtleVByb3BdKSB7XG4gICAgZWxlbWVudFtldmVudEtleVByb3BdID0gdW51c2VkS2V5cy5sZW5ndGggPT09IDAgPyArK2lkIDogdW51c2VkS2V5cy5wb3AoKTtcbiAgfVxuICB2YXIga2V5ID0gZWxlbWVudFtldmVudEtleVByb3BdO1xuICByZXR1cm4gaGFuZGxlcnNba2V5XSB8fCAoaGFuZGxlcnNba2V5XSA9IFtdKTtcbn1cbmZ1bmN0aW9uIGNsZWFySGFuZGxlcnMoZWxlbWVudCkge1xuICB2YXIga2V5ID0gZWxlbWVudFtldmVudEtleVByb3BdO1xuICBpZiAoaGFuZGxlcnNba2V5XSkge1xuICAgIGhhbmRsZXJzW2tleV0gPSBudWxsO1xuICAgIGVsZW1lbnRba2V5XSA9IG51bGw7XG4gICAgdW51c2VkS2V5cy5wdXNoKGtleSk7XG4gIH1cbn1cbmZ1bmN0aW9uIHByb3h5SGFuZGxlcihoYW5kbGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbihldmVudCkge1xuICAgIGhhbmRsZXIoYXVnbWVudEV2ZW50KGV2ZW50KSwgZXZlbnQuZGV0YWlsKTtcbiAgfTtcbn1cbnZhciBhdWdtZW50RXZlbnQgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBldmVudE1ldGhvZHMgPSB7XG4gICAgcHJldmVudERlZmF1bHQ6ICdpc0RlZmF1bHRQcmV2ZW50ZWQnLFxuICAgIHN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbjogJ2lzSW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkJyxcbiAgICBzdG9wUHJvcGFnYXRpb246ICdpc1Byb3BhZ2F0aW9uU3RvcHBlZCdcbiAgfSxcbiAgICAgIG5vb3AgPSAoZnVuY3Rpb24oKSB7fSksXG4gICAgICByZXR1cm5UcnVlID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pLFxuICAgICAgcmV0dXJuRmFsc2UgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0pO1xuICByZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBmb3IgKHZhciBtZXRob2ROYW1lIGluIGV2ZW50TWV0aG9kcykge1xuICAgICAgKGZ1bmN0aW9uKG1ldGhvZE5hbWUsIHRlc3RNZXRob2ROYW1lLCBvcmlnaW5hbE1ldGhvZCkge1xuICAgICAgICBldmVudFttZXRob2ROYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHRoaXNbdGVzdE1ldGhvZE5hbWVdID0gcmV0dXJuVHJ1ZTtcbiAgICAgICAgICByZXR1cm4gb3JpZ2luYWxNZXRob2QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgZXZlbnRbdGVzdE1ldGhvZE5hbWVdID0gcmV0dXJuRmFsc2U7XG4gICAgICB9KG1ldGhvZE5hbWUsIGV2ZW50TWV0aG9kc1ttZXRob2ROYW1lXSwgZXZlbnRbbWV0aG9kTmFtZV0gfHwgbm9vcCkpO1xuICAgIH1cbiAgICBpZiAoZXZlbnQuX3ByZXZlbnREZWZhdWx0KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbiAgICByZXR1cm4gZXZlbnQ7XG4gIH07XG59KSgpO1xuZnVuY3Rpb24gZGVsZWdhdGVIYW5kbGVyKHNlbGVjdG9yLCBoYW5kbGVyLCBldmVudCkge1xuICB2YXIgZXZlbnRUYXJnZXQgPSBldmVudC5fdGFyZ2V0IHx8IGV2ZW50LnRhcmdldDtcbiAgaWYgKG1hdGNoZXMoZXZlbnRUYXJnZXQsIHNlbGVjdG9yKSkge1xuICAgIGlmICghZXZlbnQuY3VycmVudFRhcmdldCkge1xuICAgICAgZXZlbnQuY3VycmVudFRhcmdldCA9IGV2ZW50VGFyZ2V0O1xuICAgIH1cbiAgICBoYW5kbGVyLmNhbGwoZXZlbnRUYXJnZXQsIGV2ZW50KTtcbiAgfVxufVxuKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBDdXN0b21FdmVudChldmVudCkge1xuICAgIHZhciBwYXJhbXMgPSBhcmd1bWVudHNbMV0gIT09ICh2b2lkIDApID8gYXJndW1lbnRzWzFdIDoge1xuICAgICAgYnViYmxlczogZmFsc2UsXG4gICAgICBjYW5jZWxhYmxlOiBmYWxzZSxcbiAgICAgIGRldGFpbDogdW5kZWZpbmVkXG4gICAgfTtcbiAgICB2YXIgY3VzdG9tRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcbiAgICBjdXN0b21FdmVudC5pbml0Q3VzdG9tRXZlbnQoZXZlbnQsIHBhcmFtcy5idWJibGVzLCBwYXJhbXMuY2FuY2VsYWJsZSwgcGFyYW1zLmRldGFpbCk7XG4gICAgcmV0dXJuIGN1c3RvbUV2ZW50O1xuICB9XG4gIEN1c3RvbUV2ZW50LnByb3RvdHlwZSA9IGdsb2JhbC5DdXN0b21FdmVudCAmJiBnbG9iYWwuQ3VzdG9tRXZlbnQucHJvdG90eXBlO1xuICBnbG9iYWwuQ3VzdG9tRXZlbnQgPSBDdXN0b21FdmVudDtcbn0pKCk7XG52YXIgaXNFdmVudEJ1YmJsaW5nSW5EZXRhY2hlZFRyZWUgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBpc0J1YmJsaW5nID0gZmFsc2UsXG4gICAgICBkb2MgPSBnbG9iYWwuZG9jdW1lbnQ7XG4gIGlmIChkb2MpIHtcbiAgICB2YXIgcGFyZW50ID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuICAgICAgICBjaGlsZCA9IHBhcmVudC5jbG9uZU5vZGUoKTtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgIHBhcmVudC5hZGRFdmVudExpc3RlbmVyKCdlJywgZnVuY3Rpb24oKSB7XG4gICAgICBpc0J1YmJsaW5nID0gdHJ1ZTtcbiAgICB9KTtcbiAgICBjaGlsZC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnZScsIHtidWJibGVzOiB0cnVlfSkpO1xuICB9XG4gIHJldHVybiBpc0J1YmJsaW5nO1xufSkoKTtcbnZhciBiaW5kID0gb24sXG4gICAgdW5iaW5kID0gb2ZmO1xuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG9uOiBvbixcbiAgb2ZmOiBvZmYsXG4gIGRlbGVnYXRlOiBkZWxlZ2F0ZSxcbiAgdW5kZWxlZ2F0ZTogdW5kZWxlZ2F0ZSxcbiAgdHJpZ2dlcjogdHJpZ2dlcixcbiAgdHJpZ2dlckhhbmRsZXI6IHRyaWdnZXJIYW5kbGVyLFxuICByZWFkeTogcmVhZHksXG4gIGJpbmQ6IGJpbmQsXG4gIHVuYmluZDogdW5iaW5kLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi9zZWxlY3RvclwiOjEzLFwiLi91dGlsXCI6MTV9XSw5OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL2h0bWxcIjtcbnZhciBlYWNoID0gX2RlcmVxXygnLi91dGlsJykuZWFjaDtcbmZ1bmN0aW9uIGh0bWwoZnJhZ21lbnQpIHtcbiAgaWYgKHR5cGVvZiBmcmFnbWVudCAhPT0gJ3N0cmluZycpIHtcbiAgICB2YXIgZWxlbWVudCA9IHRoaXMubm9kZVR5cGUgPyB0aGlzIDogdGhpc1swXTtcbiAgICByZXR1cm4gZWxlbWVudCA/IGVsZW1lbnQuaW5uZXJIVE1MIDogdW5kZWZpbmVkO1xuICB9XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gZnJhZ21lbnQ7XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBodG1sOiBodG1sLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi91dGlsXCI6MTV9XSwxMDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9pbmRleFwiO1xudmFyICQgPSBfZGVyZXFfKCcuL2FwaScpLmRlZmF1bHQ7XG52YXIgJF9fZGVmYXVsdCA9ICQ7XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZGVmYXVsdDogJF9fZGVmYXVsdCxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vYXBpXCI6MX1dLDExOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL21vZGVcIjtcbnZhciBnbG9iYWwgPSBfZGVyZXFfKCcuL3V0aWwnKS5nbG9iYWw7XG52YXIgaXNOYXRpdmUgPSBmYWxzZTtcbmZ1bmN0aW9uIG5hdGl2ZSgpIHtcbiAgdmFyIGdvTmF0aXZlID0gYXJndW1lbnRzWzBdICE9PSAodm9pZCAwKSA/IGFyZ3VtZW50c1swXSA6IHRydWU7XG4gIHZhciB3YXNOYXRpdmUgPSBpc05hdGl2ZTtcbiAgaXNOYXRpdmUgPSBnb05hdGl2ZTtcbiAgaWYgKGdsb2JhbC4kKSB7XG4gICAgZ2xvYmFsLiQuaXNOYXRpdmUgPSBpc05hdGl2ZTtcbiAgfVxuICBpZiAoIXdhc05hdGl2ZSAmJiBpc05hdGl2ZSkge1xuICAgIGF1Z21lbnROYXRpdmVQcm90b3R5cGVzKHRoaXMuZm4sIHRoaXMuZm5MaXN0KTtcbiAgfVxuICBpZiAod2FzTmF0aXZlICYmICFpc05hdGl2ZSkge1xuICAgIHVuYXVnbWVudE5hdGl2ZVByb3RvdHlwZXModGhpcy5mbiwgdGhpcy5mbkxpc3QpO1xuICB9XG4gIHJldHVybiBpc05hdGl2ZTtcbn1cbnZhciBOb2RlUHJvdG8gPSB0eXBlb2YgTm9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgTm9kZS5wcm90b3R5cGUsXG4gICAgTm9kZUxpc3RQcm90byA9IHR5cGVvZiBOb2RlTGlzdCAhPT0gJ3VuZGVmaW5lZCcgJiYgTm9kZUxpc3QucHJvdG90eXBlO1xuZnVuY3Rpb24gYXVnbWVudChvYmosIGtleSwgdmFsdWUpIHtcbiAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwge1xuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2VcbiAgICB9KTtcbiAgfVxufVxudmFyIHVuYXVnbWVudCA9IChmdW5jdGlvbihvYmosIGtleSkge1xuICBkZWxldGUgb2JqW2tleV07XG59KTtcbmZ1bmN0aW9uIGF1Z21lbnROYXRpdmVQcm90b3R5cGVzKG1ldGhvZHNOb2RlLCBtZXRob2RzTm9kZUxpc3QpIHtcbiAgdmFyIGtleTtcbiAgZm9yIChrZXkgaW4gbWV0aG9kc05vZGUpIHtcbiAgICBhdWdtZW50KE5vZGVQcm90bywga2V5LCBtZXRob2RzTm9kZVtrZXldKTtcbiAgICBhdWdtZW50KE5vZGVMaXN0UHJvdG8sIGtleSwgbWV0aG9kc05vZGVba2V5XSk7XG4gIH1cbiAgZm9yIChrZXkgaW4gbWV0aG9kc05vZGVMaXN0KSB7XG4gICAgYXVnbWVudChOb2RlTGlzdFByb3RvLCBrZXksIG1ldGhvZHNOb2RlTGlzdFtrZXldKTtcbiAgfVxufVxuZnVuY3Rpb24gdW5hdWdtZW50TmF0aXZlUHJvdG90eXBlcyhtZXRob2RzTm9kZSwgbWV0aG9kc05vZGVMaXN0KSB7XG4gIHZhciBrZXk7XG4gIGZvciAoa2V5IGluIG1ldGhvZHNOb2RlKSB7XG4gICAgdW5hdWdtZW50KE5vZGVQcm90bywga2V5KTtcbiAgICB1bmF1Z21lbnQoTm9kZUxpc3RQcm90bywga2V5KTtcbiAgfVxuICBmb3IgKGtleSBpbiBtZXRob2RzTm9kZUxpc3QpIHtcbiAgICB1bmF1Z21lbnQoTm9kZUxpc3RQcm90bywga2V5KTtcbiAgfVxufVxuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGlzTmF0aXZlOiBpc05hdGl2ZSxcbiAgbmF0aXZlOiBuYXRpdmUsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL3V0aWxcIjoxNX1dLDEyOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL25vY29uZmxpY3RcIjtcbnZhciBnbG9iYWwgPSBfZGVyZXFfKCcuL3V0aWwnKS5nbG9iYWw7XG52YXIgcHJldmlvdXNMaWIgPSBnbG9iYWwuJDtcbmZ1bmN0aW9uIG5vQ29uZmxpY3QoKSB7XG4gIGdsb2JhbC4kID0gcHJldmlvdXNMaWI7XG4gIHJldHVybiB0aGlzO1xufVxuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG5vQ29uZmxpY3Q6IG5vQ29uZmxpY3QsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL3V0aWxcIjoxNX1dLDEzOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL3NlbGVjdG9yXCI7XG52YXIgJF9fMCA9IF9kZXJlcV8oJy4vdXRpbCcpLFxuICAgIGdsb2JhbCA9ICRfXzAuZ2xvYmFsLFxuICAgIG1ha2VJdGVyYWJsZSA9ICRfXzAubWFrZUl0ZXJhYmxlO1xudmFyIHNsaWNlID0gW10uc2xpY2UsXG4gICAgaXNQcm90b3R5cGVTZXQgPSBmYWxzZSxcbiAgICByZUZyYWdtZW50ID0gL15cXHMqPChcXHcrfCEpW14+XSo+LyxcbiAgICByZVNpbmdsZVRhZyA9IC9ePChcXHcrKVxccypcXC8/Pig/OjxcXC9cXDE+fCkkLyxcbiAgICByZVNpbXBsZVNlbGVjdG9yID0gL15bXFwuI10/W1xcdy1dKiQvO1xuZnVuY3Rpb24gJChzZWxlY3Rvcikge1xuICB2YXIgY29udGV4dCA9IGFyZ3VtZW50c1sxXSAhPT0gKHZvaWQgMCkgPyBhcmd1bWVudHNbMV0gOiBkb2N1bWVudDtcbiAgdmFyIGNvbGxlY3Rpb247XG4gIGlmICghc2VsZWN0b3IpIHtcbiAgICBjb2xsZWN0aW9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChudWxsKTtcbiAgfSBlbHNlIGlmIChzZWxlY3RvciBpbnN0YW5jZW9mIFdyYXBwZXIpIHtcbiAgICByZXR1cm4gc2VsZWN0b3I7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHNlbGVjdG9yICE9PSAnc3RyaW5nJykge1xuICAgIGNvbGxlY3Rpb24gPSBtYWtlSXRlcmFibGUoc2VsZWN0b3IpO1xuICB9IGVsc2UgaWYgKHJlRnJhZ21lbnQudGVzdChzZWxlY3RvcikpIHtcbiAgICBjb2xsZWN0aW9uID0gY3JlYXRlRnJhZ21lbnQoc2VsZWN0b3IpO1xuICB9IGVsc2Uge1xuICAgIGNvbnRleHQgPSB0eXBlb2YgY29udGV4dCA9PT0gJ3N0cmluZycgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGNvbnRleHQpIDogY29udGV4dC5sZW5ndGggPyBjb250ZXh0WzBdIDogY29udGV4dDtcbiAgICBjb2xsZWN0aW9uID0gcXVlcnlTZWxlY3RvcihzZWxlY3RvciwgY29udGV4dCk7XG4gIH1cbiAgcmV0dXJuICQuaXNOYXRpdmUgPyBjb2xsZWN0aW9uIDogd3JhcChjb2xsZWN0aW9uKTtcbn1cbmZ1bmN0aW9uIGZpbmQoc2VsZWN0b3IpIHtcbiAgcmV0dXJuICQoc2VsZWN0b3IsIHRoaXMpO1xufVxudmFyIG1hdGNoZXMgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBjb250ZXh0ID0gdHlwZW9mIEVsZW1lbnQgIT09ICd1bmRlZmluZWQnID8gRWxlbWVudC5wcm90b3R5cGUgOiBnbG9iYWwsXG4gICAgICBfbWF0Y2hlcyA9IGNvbnRleHQubWF0Y2hlcyB8fCBjb250ZXh0Lm1hdGNoZXNTZWxlY3RvciB8fCBjb250ZXh0Lm1vek1hdGNoZXNTZWxlY3RvciB8fCBjb250ZXh0LndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBjb250ZXh0Lm1zTWF0Y2hlc1NlbGVjdG9yIHx8IGNvbnRleHQub01hdGNoZXNTZWxlY3RvcjtcbiAgcmV0dXJuIGZ1bmN0aW9uKGVsZW1lbnQsIHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIF9tYXRjaGVzLmNhbGwoZWxlbWVudCwgc2VsZWN0b3IpO1xuICB9O1xufSkoKTtcbmZ1bmN0aW9uIHF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IsIGNvbnRleHQpIHtcbiAgdmFyIGlzU2ltcGxlU2VsZWN0b3IgPSByZVNpbXBsZVNlbGVjdG9yLnRlc3Qoc2VsZWN0b3IpO1xuICBpZiAoaXNTaW1wbGVTZWxlY3RvciAmJiAhJC5pc05hdGl2ZSkge1xuICAgIGlmIChzZWxlY3RvclswXSA9PT0gJyMnKSB7XG4gICAgICB2YXIgZWxlbWVudCA9IChjb250ZXh0LmdldEVsZW1lbnRCeUlkID8gY29udGV4dCA6IGRvY3VtZW50KS5nZXRFbGVtZW50QnlJZChzZWxlY3Rvci5zbGljZSgxKSk7XG4gICAgICByZXR1cm4gZWxlbWVudCA/IFtlbGVtZW50XSA6IFtdO1xuICAgIH1cbiAgICBpZiAoc2VsZWN0b3JbMF0gPT09ICcuJykge1xuICAgICAgcmV0dXJuIGNvbnRleHQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShzZWxlY3Rvci5zbGljZSgxKSk7XG4gICAgfVxuICAgIHJldHVybiBjb250ZXh0LmdldEVsZW1lbnRzQnlUYWdOYW1lKHNlbGVjdG9yKTtcbiAgfVxuICByZXR1cm4gY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUZyYWdtZW50KGh0bWwpIHtcbiAgaWYgKHJlU2luZ2xlVGFnLnRlc3QoaHRtbCkpIHtcbiAgICByZXR1cm4gW2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoUmVnRXhwLiQxKV07XG4gIH1cbiAgdmFyIGVsZW1lbnRzID0gW10sXG4gICAgICBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgIGNoaWxkcmVuID0gY29udGFpbmVyLmNoaWxkTm9kZXM7XG4gIGNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sO1xuICBmb3IgKHZhciBpID0gMCxcbiAgICAgIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBlbGVtZW50cy5wdXNoKGNoaWxkcmVuW2ldKTtcbiAgfVxuICByZXR1cm4gZWxlbWVudHM7XG59XG5mdW5jdGlvbiB3cmFwKGNvbGxlY3Rpb24pIHtcbiAgaWYgKCFpc1Byb3RvdHlwZVNldCkge1xuICAgIFdyYXBwZXIucHJvdG90eXBlID0gJC5mbjtcbiAgICBXcmFwcGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFdyYXBwZXI7XG4gICAgaXNQcm90b3R5cGVTZXQgPSB0cnVlO1xuICB9XG4gIHJldHVybiBuZXcgV3JhcHBlcihjb2xsZWN0aW9uKTtcbn1cbmZ1bmN0aW9uIFdyYXBwZXIoY29sbGVjdGlvbikge1xuICB2YXIgaSA9IDAsXG4gICAgICBsZW5ndGggPSBjb2xsZWN0aW9uLmxlbmd0aDtcbiAgZm9yICg7IGkgPCBsZW5ndGg7ICkge1xuICAgIHRoaXNbaV0gPSBjb2xsZWN0aW9uW2krK107XG4gIH1cbiAgdGhpcy5sZW5ndGggPSBsZW5ndGg7XG59XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgJDogJCxcbiAgZmluZDogZmluZCxcbiAgbWF0Y2hlczogbWF0Y2hlcyxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vdXRpbFwiOjE1fV0sMTQ6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvc2VsZWN0b3JfZXh0cmFcIjtcbnZhciAkX18wID0gX2RlcmVxXygnLi91dGlsJyksXG4gICAgZWFjaCA9ICRfXzAuZWFjaCxcbiAgICB0b0FycmF5ID0gJF9fMC50b0FycmF5O1xudmFyICRfXzAgPSBfZGVyZXFfKCcuL3NlbGVjdG9yJyksXG4gICAgJCA9ICRfXzAuJCxcbiAgICBtYXRjaGVzID0gJF9fMC5tYXRjaGVzO1xuZnVuY3Rpb24gY2hpbGRyZW4oc2VsZWN0b3IpIHtcbiAgdmFyIG5vZGVzID0gW107XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGlmIChlbGVtZW50LmNoaWxkcmVuKSB7XG4gICAgICBlYWNoKGVsZW1lbnQuY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IgfHwgKHNlbGVjdG9yICYmIG1hdGNoZXMoY2hpbGQsIHNlbGVjdG9yKSkpIHtcbiAgICAgICAgICBub2Rlcy5wdXNoKGNoaWxkKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuICQobm9kZXMpO1xufVxuZnVuY3Rpb24gY2xvc2VzdChzZWxlY3Rvcikge1xuICB2YXIgbm9kZSA9IHRoaXNbMF07XG4gIGZvciAoOyBub2RlLm5vZGVUeXBlICE9PSBub2RlLkRPQ1VNRU5UX05PREU7IG5vZGUgPSBub2RlLnBhcmVudE5vZGUpIHtcbiAgICBpZiAobWF0Y2hlcyhub2RlLCBzZWxlY3RvcikpIHtcbiAgICAgIHJldHVybiAkKG5vZGUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gJCgpO1xufVxuZnVuY3Rpb24gY29udGVudHMoKSB7XG4gIHZhciBub2RlcyA9IFtdO1xuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBub2Rlcy5wdXNoLmFwcGx5KG5vZGVzLCB0b0FycmF5KGVsZW1lbnQuY2hpbGROb2RlcykpO1xuICB9KTtcbiAgcmV0dXJuICQobm9kZXMpO1xufVxuZnVuY3Rpb24gZXEoaW5kZXgpIHtcbiAgcmV0dXJuIHNsaWNlLmNhbGwodGhpcywgaW5kZXgsIGluZGV4ICsgMSk7XG59XG5mdW5jdGlvbiBnZXQoaW5kZXgpIHtcbiAgcmV0dXJuIHRoaXNbaW5kZXhdO1xufVxuZnVuY3Rpb24gcGFyZW50KHNlbGVjdG9yKSB7XG4gIHZhciBub2RlcyA9IFtdO1xuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBpZiAoIXNlbGVjdG9yIHx8IChzZWxlY3RvciAmJiBtYXRjaGVzKGVsZW1lbnQucGFyZW50Tm9kZSwgc2VsZWN0b3IpKSkge1xuICAgICAgbm9kZXMucHVzaChlbGVtZW50LnBhcmVudE5vZGUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiAkKG5vZGVzKTtcbn1cbmZ1bmN0aW9uIHNsaWNlKHN0YXJ0LCBlbmQpIHtcbiAgcmV0dXJuICQoW10uc2xpY2UuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG59XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY2hpbGRyZW46IGNoaWxkcmVuLFxuICBjb250ZW50czogY29udGVudHMsXG4gIGNsb3Nlc3Q6IGNsb3Nlc3QsXG4gIGVxOiBlcSxcbiAgZ2V0OiBnZXQsXG4gIHBhcmVudDogcGFyZW50LFxuICBzbGljZTogc2xpY2UsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL3NlbGVjdG9yXCI6MTMsXCIuL3V0aWxcIjoxNX1dLDE1OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL3V0aWxcIjtcbnZhciBnbG9iYWwgPSBuZXcgRnVuY3Rpb24oXCJyZXR1cm4gdGhpc1wiKSgpLFxuICAgIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIHRvQXJyYXkgPSAoZnVuY3Rpb24oY29sbGVjdGlvbikge1xuICByZXR1cm4gc2xpY2UuY2FsbChjb2xsZWN0aW9uKTtcbn0pO1xudmFyIG1ha2VJdGVyYWJsZSA9IChmdW5jdGlvbihlbGVtZW50KSB7XG4gIHJldHVybiBlbGVtZW50Lm5vZGVUeXBlIHx8IGVsZW1lbnQgPT09IHdpbmRvdyA/IFtlbGVtZW50XSA6IGVsZW1lbnQ7XG59KTtcbmZ1bmN0aW9uIGVhY2goY29sbGVjdGlvbiwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgdmFyIGxlbmd0aCA9IGNvbGxlY3Rpb24ubGVuZ3RoO1xuICBpZiAobGVuZ3RoICE9PSB1bmRlZmluZWQgJiYgY29sbGVjdGlvbi5ub2RlVHlwZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCBjb2xsZWN0aW9uW2ldLCBpLCBjb2xsZWN0aW9uKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCBjb2xsZWN0aW9uLCAwLCBjb2xsZWN0aW9uKTtcbiAgfVxuICByZXR1cm4gY29sbGVjdGlvbjtcbn1cbmZ1bmN0aW9uIGV4dGVuZCh0YXJnZXQpIHtcbiAgZm9yICh2YXIgc291cmNlcyA9IFtdLFxuICAgICAgJF9fMCA9IDE7ICRfXzAgPCBhcmd1bWVudHMubGVuZ3RoOyAkX18wKyspXG4gICAgc291cmNlc1skX18wIC0gMV0gPSBhcmd1bWVudHNbJF9fMF07XG4gIHNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbihzcmMpIHtcbiAgICBpZiAoc3JjKSB7XG4gICAgICBmb3IgKHZhciBwcm9wIGluIHNyYykge1xuICAgICAgICB0YXJnZXRbcHJvcF0gPSBzcmNbcHJvcF07XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHRhcmdldDtcbn1cbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBnbG9iYWw6IGdsb2JhbCxcbiAgdG9BcnJheTogdG9BcnJheSxcbiAgbWFrZUl0ZXJhYmxlOiBtYWtlSXRlcmFibGUsXG4gIGVhY2g6IGVhY2gsXG4gIGV4dGVuZDogZXh0ZW5kLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se31dfSx7fSxbMTBdKVxuKDEwKVxufSk7XG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIm1vZHVsZS5leHBvcnRzID0gc3RyaXA7XG5cbmZ1bmN0aW9uIHN0cmlwKGh0bWwpe1xuICBodG1sID0gaHRtbCB8fCAnJztcbiAgcmV0dXJuIGh0bWwucmVwbGFjZSgvPFxcLz8oW2Etel1bYS16MC05XSopXFxiW14+XSo+Py9naSwgJycpLnRyaW0oKTtcbn1cbiIsInZhciBvYmogICAgID0gcmVxdWlyZSgnLi9tb2R1bGVzL29iaicpXG4sICAgZXZlbnRzICA9IHJlcXVpcmUoJy4vbW9kdWxlcy9ldmVudHMnKVxuLCAgIGNvbnRlbnQgPSByZXF1aXJlKCcuL21vZHVsZXMvY29udGVudCcpO1xuXG5jb250ZW50LmluaXQoKTtcbm9iai5pbml0KCk7XG5ldmVudHMoKTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgJCA9IHJlcXVpcmUoJ2RvbXRhc3RpYy9idW5kbGUvZnVsbC9kb210YXN0aWMnKVxuLCAgIHN0cmlwID0gcmVxdWlyZSgnc3RyaXAnKTtcblxudmFyICRib2R5ICAgICAgPSAkKCdib2R5JyksXG4gICAgaXNPcmlnaW5hbCA9IHRydWU7XG5cbnZhciBjb250ZW50ID0ge1xuXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLndyYXBDb250ZW50KCk7XG4gIH0sXG5cbiAgd3JhcENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICRib2R5Lmh0bWwoJzxkaXYgaWQ9XCJuaWNlLWNvbnRlbnRcIj4nICsgJGJvZHkuaHRtbCgpICsgJzwvZGl2PicpO1xuICAgIHRoaXMub3JpZ2luYWxIVE1MID0gdGhpcy5jdXJyZW50SFRNTCA9IHRoaXMuZ2V0SFRNTCgpO1xuICAgIHJldHVybiB0aGlzLm1ha2VFZGl0YWJsZSgkKCcjbmljZS1jb250ZW50JykpO1xuICB9LFxuXG4gIG1ha2VFZGl0YWJsZTogZnVuY3Rpb24oZWwpIHtcbiAgICByZXR1cm4gZWwuYXR0cignY29udGVudGVkaXRhYmxlJywgdHJ1ZSk7XG4gIH0sXG5cbiAgcmVtb3ZlTmljZTogZnVuY3Rpb24oKSB7XG4gICAgJGJvZHlcbiAgICAgIC5odG1sKCQoJyNuaWNlLWNvbnRlbnQnKS5odG1sKCkpXG4gICAgICAucmVtb3ZlQXR0cignY29udGVudGVkaXRhYmxlJyk7XG4gIH0sXG5cbiAgZ2V0SFRNTDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGh0bWwgPSAkKCcjbmljZS1jb250ZW50JykuaHRtbCgpO1xuICAgIHJldHVybiBodG1sLnRyaW0oKTtcbiAgfSxcblxuICBzdHJpcEhUTUw6IGZ1bmN0aW9uKHN0cikge1xuICAgIHJldHVybiBzdHJpcChzdHIpXG4gICAgICAucmVwbGFjZSgvKCZsdDsuKyZndDspL2dpLCAnJylcbiAgICAgIC5yZXBsYWNlKC8oKCgmYW1wOykuKyhsdDspKS4rKCgmYW1wOykuKyhndDspKSkvZ2ksICcnKVxuICAgICAgLnJlcGxhY2UoLygmYW1wO2x0Oy4rJmFtcDtndDspL2dpLCAnJyk7XG4gIH0sXG5cbiAgc2V0SFRNTDogZnVuY3Rpb24oaHRtbCkge1xuICAgIHJldHVybiAkKCcjbmljZS1jb250ZW50JykuaHRtbChodG1sKTtcbiAgfSxcblxuICB0b2dnbGVIVE1MOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3RyaXBwZWRPcmlnaW5hbCA9IHRoaXMuc3RyaXBIVE1MKHRoaXMub3JpZ2luYWxIVE1MKTtcbiAgICB2YXIgc3RyaXBwZWRDdXJyZW50ID0gdGhpcy5zdHJpcEhUTUwodGhpcy5nZXRIVE1MKCkpO1xuXG4gICAgaXNPcmlnaW5hbCA9IHN0cmlwcGVkT3JpZ2luYWwgPT09IHN0cmlwcGVkQ3VycmVudCA/IHRydWUgOiBmYWxzZTtcblxuICAgIGlmICghaXNPcmlnaW5hbCkge1xuICAgICAgdGhpcy5jdXJyZW50SFRNTCA9IHRoaXMuZ2V0SFRNTCgpO1xuICAgIH1cblxuICAgIHZhciBodG1sID0gaXNPcmlnaW5hbCA/IHRoaXMuY3VycmVudEhUTUwgOiB0aGlzLm9yaWdpbmFsSFRNTDtcblxuICAgIHRoaXMuc2V0SFRNTChodG1sKTtcblxuICB9LFxuXG4gIGdldFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJhbmdlO1xuICAgIGlmIChkb2N1bWVudC5zZWxlY3Rpb24pIHtcbiAgICAgIHJhbmdlID0gZG9jdW1lbnQuYm9keS5jcmVhdGVUZXh0UmFuZ2UoKTtcbiAgICAgIHJhbmdlLm1vdmVUb0VsZW1lbnRUZXh0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduaWNlLXByZScpKTtcbiAgICAgIHJhbmdlLnNlbGVjdCgpO1xuICAgIH0gZWxzZSBpZiAod2luZG93LmdldFNlbGVjdGlvbikge1xuICAgICAgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xuICAgICAgcmFuZ2Uuc2VsZWN0Tm9kZShkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmljZS1wcmUnKSk7XG4gICAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkuYWRkUmFuZ2UocmFuZ2UpO1xuICAgIH1cblxuICB9LFxuXG4gIG9yaWdpbmFsSFRNTDogJycsXG5cbiAgY3VycmVudEhUTUw6ICcnXG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gY29udGVudDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyICQgICAgICAgPSByZXF1aXJlKCdkb210YXN0aWMvYnVuZGxlL2Z1bGwvZG9tdGFzdGljJylcbiwgICBqc2RpZmYgID0gcmVxdWlyZSgnZGlmZicpXG4sICAgY29udGVudCA9IHJlcXVpcmUoJy4vY29udGVudCcpO1xuXG52YXIgZGlmZk9iaiA9IHtcblxuICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3JpZ2luYWxIVE1MID0gY29udGVudC5zdHJpcEhUTUwoY29udGVudC5vcmlnaW5hbEhUTUwpO1xuICAgIHZhciBjdXJyZW50SFRNTCA9IGNvbnRlbnQuc3RyaXBIVE1MKGNvbnRlbnQuZ2V0SFRNTCgpKTtcblxuICAgIHZhciBkaWZmID0ganNkaWZmLmRpZmZMaW5lcyhvcmlnaW5hbEhUTUwsIGN1cnJlbnRIVE1MKTtcbiAgICB0aGlzLnBvcHVsYXRlRGlmZihkaWZmKTtcbiAgfSxcblxuICBwb3B1bGF0ZURpZmY6IGZ1bmN0aW9uKGRpZmYpIHtcbiAgICB2YXIgJHByZSA9ICQoJyNuaWNlLXByZScpLmh0bWwoJycpXG4gICAgLCAgIGNvbG9yXG4gICAgLCAgIGtsYXNzXG4gICAgLCAgIHNwYW47XG5cblxuICAgIGRpZmYuZm9yRWFjaChmdW5jdGlvbihwYXJ0KSB7XG4gICAgICBpZiAocGFydC5hZGRlZCB8fCBwYXJ0LnJlbW92ZWQpIHtcbiAgICAgICAgY29sb3IgPSBwYXJ0LmFkZGVkID8gJ2dyZWVuJyA6IHBhcnQucmVtb3ZlZCA/ICdyZWQnIDogJ2dyZXknO1xuICAgICAgICBrbGFzcyA9IHBhcnQuYWRkZWQgPyAnaXMtYWRkZWQnIDogcGFydC5yZW1vdmVkID8gJ2lzLXJlbW92ZWQnIDogJyc7XG4gICAgICAgIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIHNwYW4uc3R5bGUuY29sb3IgPSBjb2xvcjtcbiAgICAgICAgc3Bhbi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywga2xhc3MpO1xuICAgICAgICBzcGFuLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHBhcnQudmFsdWUpKTtcbiAgICAgICAgJHByZS5hcHBlbmQoc3Bhbik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBkaWZmT2JqO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgJCAgICAgICA9IHJlcXVpcmUoJ2RvbXRhc3RpYy9idW5kbGUvZnVsbC9kb210YXN0aWMnKVxuLCAgIGRpZmYgICAgPSByZXF1aXJlKCcuL2RpZmYnKVxuLCAgIGNvbnRlbnQgPSByZXF1aXJlKCcuL2NvbnRlbnQnKTtcblxudmFyIGV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuXG4gICQoJyNuaWNlLW1pbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgJCgnI25pY2Utb2JqJykudG9nZ2xlQ2xhc3MoJ2lzLW1pbicpO1xuICB9KTtcblxuICAkKCcjbmljZS1vZmYnKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnRlbnQucmVtb3ZlTmljZSgpO1xuICB9KTtcblxuICAkKCcjbmljZS1kaWZmJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAkKCcjbmljZS1wcmUnKS50b2dnbGVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgZGlmZi5pbml0KCk7XG4gIH0pO1xuXG4gICQoJyNuaWNlLXRvZ2dsZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29udGVudC50b2dnbGVIVE1MKCk7XG4gIH0pO1xuXG4gICQoJyNuaWNlLXByZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29udGVudC5nZXRTZWxlY3Rpb24oKTtcbiAgfSk7XG5cbiAgJCgnI25pY2UtbmF2IGxpJylcbiAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciAkdGl0bGUgPSAkKCcjbmljZS10aXRsZScpO1xuICAgICAgJHRpdGxlLnRleHQoJChlLnNyY0VsZW1lbnQpLmF0dHIoJ2RhdGEtdGV4dCcpKTtcbiAgICB9KS5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICR0aXRsZSA9ICQoJyNuaWNlLXRpdGxlJyk7XG4gICAgICAkdGl0bGUudGV4dCgkdGl0bGUuYXR0cignZGF0YS10ZXh0JykpO1xuICAgIH0pO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV2ZW50cztcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG9ialRlbXBsYXRlID0gcmVxdWlyZSgnLi90ZW1wbGF0ZScpO1xuXG52YXIgYm9keSAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVsgMCBdXG4sICAgaGVhZCAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVsgMCBdXG4sICAgY3NzTG9jID0gJ2h0dHBzOi8vc2VldGhyb3VnaHRyZWVzLmdpdGh1Yi5pby9uaWNlLWlubGluZS1jb3B5LWVkaXRvci9pbmRleC5jc3MnO1xuXG5cbnZhciBuYXYgPSB7XG5cbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jcmVhdGVPYmooKTtcbiAgfSxcblxuICBjcmVhdGVPYmo6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBkaXYuc2V0QXR0cmlidXRlKCdpZCcsICduaWNlLW9iaicpO1xuICAgIGRpdi5zZXRBdHRyaWJ1dGUoJ2NvbnRlbnRlZGl0YWJsZScsIGZhbHNlKTtcbiAgICBkaXYuc2V0QXR0cmlidXRlKCdjbGFzcycsICdpcy1taW4nKTtcbiAgICBkaXYuaW5uZXJIVE1MID0gb2JqVGVtcGxhdGU7XG4gICAgdGhpcy5zdHlsZShkaXYpO1xuICB9LFxuXG4gIHN0eWxlOiBmdW5jdGlvbihkaXYpIHtcbiAgICB2YXIgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcbiAgICBsaW5rLnNldEF0dHJpYnV0ZSgncmVsJywnc3R5bGVzaGVldCcpO1xuICAgIGxpbmsuc2V0QXR0cmlidXRlKCdocmVmJywgY3NzTG9jKTtcbiAgICBsaW5rLnNldEF0dHJpYnV0ZSgndHlwZScsJ3RleHQvY3NzJyk7XG4gICAgaGVhZC5hcHBlbmRDaGlsZChsaW5rKTtcbiAgICB0aGlzLmFwcGVuZChkaXYpO1xuICB9LFxuXG4gIGFwcGVuZDogZnVuY3Rpb24oZGl2KSB7XG4gICAgYm9keS5hcHBlbmRDaGlsZChkaXYpO1xuICB9XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbmF2O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBzZXQgb2JqVGVtcGxhdGVcbnZhciBvYmpUZW1wbGF0ZSA9ICc8dWwgaWQ9XCJuaWNlLW5hdlwiPic7XG4gICAgb2JqVGVtcGxhdGUgKz0gJzxsaSBpZD1cIm5pY2UtdGl0bGVcIiBkYXRhLXRleHQ9XCJOSUNFXCIgdGl0bGU9XCJHbyBUbyBIb21lcGFnZVwiPk5JQ0U8L2xpPic7XG4gICAgb2JqVGVtcGxhdGUgKz0gJzxsaSBpZD1cIm5pY2UtbWluXCIgZGF0YS10ZXh0PVwiSElERVwiIHRpdGxlPVwiTWluaW1pemUgTklDRVwiPjxzcGFuPlxcdUUwMDE8L3NwYW4+PC9saT4nO1xuICAgIG9ialRlbXBsYXRlICs9ICc8bGkgaWQ9XCJuaWNlLXRvZ2dsZVwiIGRhdGEtdGV4dD1cIlRPR0dMRVwiIHRpdGxlPVwiVG9nZ2xlIE9yaWdpbmFsXCI+XFx1RTAwNDwvbGk+JztcbiAgICBvYmpUZW1wbGF0ZSArPSAnPGxpIGlkPVwibmljZS1kaWZmXCIgZGF0YS10ZXh0PVwiRElGRlwiIHRpdGxlPVwiU2VlIERpZmZcIj5cXHVFMDAyPC9saT4nO1xuICAgIG9ialRlbXBsYXRlICs9ICc8bGkgaWQ9XCJuaWNlLW9mZlwiIGRhdGEtdGV4dD1cIk9GRlwiIHRpdGxlPVwiVHVybiBvZmYgTklDRVwiPlxcdUUwMDM8L2xpPic7XG4gICAgb2JqVGVtcGxhdGUgKz0gJzwvdWw+JztcbiAgICBvYmpUZW1wbGF0ZSArPSAnPHByZSBpZD1cIm5pY2UtcHJlXCI+PC9wcmU+JztcblxubW9kdWxlLmV4cG9ydHMgPSBvYmpUZW1wbGF0ZTtcbiJdfQ==

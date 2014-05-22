(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{}],2:[function(require,module,exports){
var $ = window.jQuery || require('domtastic')
,   nav = require('./modules/nav');

var $body = $('body'),
    initHTML = $body.html(),
    postHTML = '';

// Make page editable
$body.attr('contenteditable', true);

nav.append();


},{"./modules/nav":3,"domtastic":1}],3:[function(require,module,exports){
'use strict';

var $ = window.jQuery || require('domtastic');



var nav = {
  append: function() {
    return window.console.log('appending nav');
  }
};

module.exports = nav;

},{"domtastic":1}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVm9sdW1lcy9TZXNzaW9ucy93ZWIvZGV2L2NvcHktZWRpdG9yL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVm9sdW1lcy9TZXNzaW9ucy93ZWIvZGV2L2NvcHktZWRpdG9yL25vZGVfbW9kdWxlcy9kb210YXN0aWMvZG9tdGFzdGljLmpzIiwiL1ZvbHVtZXMvU2Vzc2lvbnMvd2ViL2Rldi9jb3B5LWVkaXRvci9zcmMvanMvaW5kZXguanMiLCIvVm9sdW1lcy9TZXNzaW9ucy93ZWIvZGV2L2NvcHktZWRpdG9yL3NyYy9qcy9tb2R1bGVzL25hdi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4cUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbiFmdW5jdGlvbihfZSl7dmFyIGU9ZnVuY3Rpb24oKXtyZXR1cm4gX2UoKVtcImRlZmF1bHRcIl19O2lmKFwib2JqZWN0XCI9PXR5cGVvZiBleHBvcnRzKW1vZHVsZS5leHBvcnRzPWUoKTtlbHNlIGlmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZClkZWZpbmUoZSk7ZWxzZXt2YXIgZjtcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P2Y9d2luZG93OlwidW5kZWZpbmVkXCIhPXR5cGVvZiBnbG9iYWw/Zj1nbG9iYWw6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGYmJihmPXNlbGYpLGYuJD1lKCl9fShmdW5jdGlvbigpe3ZhciBkZWZpbmUsbW9kdWxlLGV4cG9ydHM7cmV0dXJuIChmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pKHsxOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL2FwaVwiO1xudmFyIGV4dGVuZCA9IF9kZXJlcV8oJy4vdXRpbCcpLmV4dGVuZDtcbnZhciBhcGkgPSB7fSxcbiAgICBhcGlOb2RlTGlzdCA9IHt9LFxuICAgICQgPSB7fTtcbnZhciBhcnJheSA9IF9kZXJlcV8oJy4vYXJyYXknKTtcbnZhciBhdHRyID0gX2RlcmVxXygnLi9hdHRyJyk7XG52YXIgY2xhc3NOYW1lID0gX2RlcmVxXygnLi9jbGFzcycpO1xudmFyIGRvbSA9IF9kZXJlcV8oJy4vZG9tJyk7XG52YXIgZXZlbnQgPSBfZGVyZXFfKCcuL2V2ZW50Jyk7XG52YXIgaHRtbCA9IF9kZXJlcV8oJy4vaHRtbCcpO1xudmFyIHNlbGVjdG9yID0gX2RlcmVxXygnLi9zZWxlY3RvcicpO1xuaWYgKHNlbGVjdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgJCA9IHNlbGVjdG9yLiQ7XG4gICQubWF0Y2hlcyA9IHNlbGVjdG9yLm1hdGNoZXM7XG4gIGFwaS5maW5kID0gc2VsZWN0b3IuZmluZDtcbn1cbmV4dGVuZCgkKTtcbnZhciBub2NvbmZsaWN0ID0gX2RlcmVxXygnLi9ub2NvbmZsaWN0Jyk7XG5leHRlbmQoJCwgbm9jb25mbGljdCk7XG5leHRlbmQoYXBpLCBhcnJheSwgYXR0ciwgY2xhc3NOYW1lLCBkb20sIGV2ZW50LCBodG1sKTtcbmV4dGVuZChhcGlOb2RlTGlzdCwgYXJyYXkpO1xuJC52ZXJzaW9uID0gJzAuNy4wJztcbiQuZXh0ZW5kID0gZXh0ZW5kO1xuJC5mbiA9IGFwaTtcbiQuZm5MaXN0ID0gYXBpTm9kZUxpc3Q7XG52YXIgJF9fZGVmYXVsdCA9ICQ7XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZGVmYXVsdDogJF9fZGVmYXVsdCxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vYXJyYXlcIjoyLFwiLi9hdHRyXCI6MyxcIi4vY2xhc3NcIjo0LFwiLi9kb21cIjo1LFwiLi9ldmVudFwiOjYsXCIuL2h0bWxcIjo3LFwiLi9ub2NvbmZsaWN0XCI6OSxcIi4vc2VsZWN0b3JcIjoxMCxcIi4vdXRpbFwiOjExfV0sMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9hcnJheVwiO1xudmFyIF9lYWNoID0gX2RlcmVxXygnLi91dGlsJykuZWFjaDtcbnZhciAkX18wID0gX2RlcmVxXygnLi9zZWxlY3RvcicpLFxuICAgICQgPSAkX18wLiQsXG4gICAgbWF0Y2hlcyA9ICRfXzAubWF0Y2hlcztcbnZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlO1xuZnVuY3Rpb24gZmlsdGVyKHNlbGVjdG9yKSB7XG4gIHZhciBjYWxsYmFjayA9IHR5cGVvZiBzZWxlY3RvciA9PT0gJ2Z1bmN0aW9uJyA/IHNlbGVjdG9yIDogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIHJldHVybiBtYXRjaGVzKGVsZW1lbnQsIHNlbGVjdG9yKTtcbiAgfTtcbiAgcmV0dXJuICQoQXJyYXlQcm90by5maWx0ZXIuY2FsbCh0aGlzLCBjYWxsYmFjaykpO1xufVxuZnVuY3Rpb24gZWFjaChjYWxsYmFjaykge1xuICByZXR1cm4gX2VhY2godGhpcywgY2FsbGJhY2spO1xufVxudmFyIGZvckVhY2ggPSBlYWNoO1xudmFyIG1hcCA9IEFycmF5UHJvdG8ubWFwO1xuZnVuY3Rpb24gcmV2ZXJzZSgpIHtcbiAgdmFyIGVsZW1lbnRzID0gQXJyYXlQcm90by5zbGljZS5jYWxsKHRoaXMpO1xuICByZXR1cm4gJChBcnJheVByb3RvLnJldmVyc2UuY2FsbChlbGVtZW50cykpO1xufVxudmFyIGV2ZXJ5ID0gQXJyYXlQcm90by5ldmVyeTtcbnZhciBzb21lID0gQXJyYXlQcm90by5zb21lO1xudmFyIGluZGV4T2YgPSBBcnJheVByb3RvLmluZGV4T2Y7XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZWFjaDogZWFjaCxcbiAgZXZlcnk6IGV2ZXJ5LFxuICBmaWx0ZXI6IGZpbHRlcixcbiAgZm9yRWFjaDogZm9yRWFjaCxcbiAgaW5kZXhPZjogaW5kZXhPZixcbiAgbWFwOiBtYXAsXG4gIHJldmVyc2U6IHJldmVyc2UsXG4gIHNvbWU6IHNvbWUsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL3NlbGVjdG9yXCI6MTAsXCIuL3V0aWxcIjoxMX1dLDM6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvYXR0clwiO1xudmFyIGVhY2ggPSBfZGVyZXFfKCcuL3V0aWwnKS5lYWNoO1xuZnVuY3Rpb24gYXR0cihrZXksIHZhbHVlKSB7XG4gIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJyAmJiB0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgdmFyIGVsZW1lbnQgPSB0aGlzLm5vZGVUeXBlID8gdGhpcyA6IHRoaXNbMF07XG4gICAgcmV0dXJuIGVsZW1lbnQgPyBlbGVtZW50LmdldEF0dHJpYnV0ZShrZXkpIDogdW5kZWZpbmVkO1xuICB9XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0Jykge1xuICAgICAgZm9yICh2YXIgYXR0ciBpbiBrZXkpIHtcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoYXR0ciwga2V5W2F0dHJdKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiByZW1vdmVBdHRyKGtleSkge1xuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYXR0cjogYXR0cixcbiAgcmVtb3ZlQXR0cjogcmVtb3ZlQXR0cixcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vdXRpbFwiOjExfV0sNDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9jbGFzc1wiO1xudmFyICRfXzAgPSBfZGVyZXFfKCcuL3V0aWwnKSxcbiAgICBtYWtlSXRlcmFibGUgPSAkX18wLm1ha2VJdGVyYWJsZSxcbiAgICBlYWNoID0gJF9fMC5lYWNoO1xuZnVuY3Rpb24gYWRkQ2xhc3ModmFsdWUpIHtcbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKHZhbHVlKTtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gcmVtb3ZlQ2xhc3ModmFsdWUpIHtcbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKHZhbHVlKTtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gdG9nZ2xlQ2xhc3ModmFsdWUpIHtcbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKHZhbHVlKTtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gaGFzQ2xhc3ModmFsdWUpIHtcbiAgcmV0dXJuIG1ha2VJdGVyYWJsZSh0aGlzKS5zb21lKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnModmFsdWUpO1xuICB9KTtcbn1cbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGRDbGFzczogYWRkQ2xhc3MsXG4gIHJlbW92ZUNsYXNzOiByZW1vdmVDbGFzcyxcbiAgdG9nZ2xlQ2xhc3M6IHRvZ2dsZUNsYXNzLFxuICBoYXNDbGFzczogaGFzQ2xhc3MsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL3V0aWxcIjoxMX1dLDU6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvZG9tXCI7XG52YXIgdG9BcnJheSA9IF9kZXJlcV8oJy4vdXRpbCcpLnRvQXJyYXk7XG5mdW5jdGlvbiBhcHBlbmQoZWxlbWVudCkge1xuICBpZiAodGhpcyBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlZW5kJywgZWxlbWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGVsZW1lbnRzID0gZWxlbWVudCBpbnN0YW5jZW9mIE5vZGVMaXN0ID8gdG9BcnJheShlbGVtZW50KSA6IGVsZW1lbnQ7XG4gICAgICAgIGVsZW1lbnRzLmZvckVhY2godGhpcy5hcHBlbmRDaGlsZC5iaW5kKHRoaXMpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICB3aGlsZSAobC0tKSB7XG4gICAgICB2YXIgZWxtID0gbCA9PT0gMCA/IGVsZW1lbnQgOiBfY2xvbmUoZWxlbWVudCk7XG4gICAgICBhcHBlbmQuY2FsbCh0aGlzW2xdLCBlbG0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIHByZXBlbmQoZWxlbWVudCkge1xuICBpZiAodGhpcyBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLmluc2VydEFkamFjZW50SFRNTCgnYWZ0ZXJiZWdpbicsIGVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgdGhpcy5pbnNlcnRCZWZvcmUoZWxlbWVudCwgdGhpcy5maXJzdENoaWxkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBlbGVtZW50cyA9IGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlTGlzdCA/IHRvQXJyYXkoZWxlbWVudCkgOiBlbGVtZW50O1xuICAgICAgICBlbGVtZW50cy5yZXZlcnNlKCkuZm9yRWFjaChwcmVwZW5kLmJpbmQodGhpcykpO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgbCA9IHRoaXMubGVuZ3RoO1xuICAgIHdoaWxlIChsLS0pIHtcbiAgICAgIHZhciBlbG0gPSBsID09PSAwID8gZWxlbWVudCA6IF9jbG9uZShlbGVtZW50KTtcbiAgICAgIHByZXBlbmQuY2FsbCh0aGlzW2xdLCBlbG0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIGJlZm9yZShlbGVtZW50KSB7XG4gIGlmICh0aGlzIGluc3RhbmNlb2YgTm9kZSkge1xuICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRoaXMuaW5zZXJ0QWRqYWNlbnRIVE1MKCdiZWZvcmViZWdpbicsIGVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgdGhpcy5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbGVtZW50LCB0aGlzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBlbGVtZW50cyA9IGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlTGlzdCA/IHRvQXJyYXkoZWxlbWVudCkgOiBlbGVtZW50O1xuICAgICAgICBlbGVtZW50cy5mb3JFYWNoKGJlZm9yZS5iaW5kKHRoaXMpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICB3aGlsZSAobC0tKSB7XG4gICAgICB2YXIgZWxtID0gbCA9PT0gMCA/IGVsZW1lbnQgOiBfY2xvbmUoZWxlbWVudCk7XG4gICAgICBiZWZvcmUuY2FsbCh0aGlzW2xdLCBlbG0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIGFmdGVyKGVsZW1lbnQpIHtcbiAgaWYgKHRoaXMgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyZW5kJywgZWxlbWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgICB0aGlzLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGVsZW1lbnQsIHRoaXMubmV4dFNpYmxpbmcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGVsZW1lbnRzID0gZWxlbWVudCBpbnN0YW5jZW9mIE5vZGVMaXN0ID8gdG9BcnJheShlbGVtZW50KSA6IGVsZW1lbnQ7XG4gICAgICAgIGVsZW1lbnRzLnJldmVyc2UoKS5mb3JFYWNoKGFmdGVyLmJpbmQodGhpcykpO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgbCA9IHRoaXMubGVuZ3RoO1xuICAgIHdoaWxlIChsLS0pIHtcbiAgICAgIHZhciBlbG0gPSBsID09PSAwID8gZWxlbWVudCA6IF9jbG9uZShlbGVtZW50KTtcbiAgICAgIGFmdGVyLmNhbGwodGhpc1tsXSwgZWxtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBjbG9uZSgpIHtcbiAgcmV0dXJuICQoX2Nsb25lKHRoaXMpKTtcbn1cbmZ1bmN0aW9uIF9jbG9uZShlbGVtZW50KSB7XG4gIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfSBlbHNlIGlmIChlbGVtZW50IGluc3RhbmNlb2YgTm9kZSkge1xuICAgIHJldHVybiBlbGVtZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgfSBlbHNlIGlmICgnbGVuZ3RoJyBpbiBlbGVtZW50KSB7XG4gICAgcmV0dXJuIFtdLm1hcC5jYWxsKGVsZW1lbnQsIGZ1bmN0aW9uKGVsKSB7XG4gICAgICByZXR1cm4gZWwuY2xvbmVOb2RlKHRydWUpO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiBlbGVtZW50O1xufVxuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFwcGVuZDogYXBwZW5kLFxuICBwcmVwZW5kOiBwcmVwZW5kLFxuICBiZWZvcmU6IGJlZm9yZSxcbiAgYWZ0ZXI6IGFmdGVyLFxuICBjbG9uZTogY2xvbmUsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL3V0aWxcIjoxMX1dLDY6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvZXZlbnRcIjtcbnZhciAkX18wID0gX2RlcmVxXygnLi91dGlsJyksXG4gICAgZ2xvYmFsID0gJF9fMC5nbG9iYWwsXG4gICAgZWFjaCA9ICRfXzAuZWFjaDtcbnZhciBtYXRjaGVzID0gX2RlcmVxXygnLi9zZWxlY3RvcicpLm1hdGNoZXM7XG5mdW5jdGlvbiBvbihldmVudE5hbWUsIHNlbGVjdG9yLCBoYW5kbGVyLCB1c2VDYXB0dXJlKSB7XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICBoYW5kbGVyID0gc2VsZWN0b3I7XG4gICAgc2VsZWN0b3IgPSBudWxsO1xuICB9XG4gIHZhciBwYXJ0cyA9IGV2ZW50TmFtZS5zcGxpdCgnLicpO1xuICBldmVudE5hbWUgPSBwYXJ0c1swXSB8fCBudWxsO1xuICB2YXIgbmFtZXNwYWNlID0gcGFydHNbMV0gfHwgbnVsbDtcbiAgdmFyIGV2ZW50TGlzdGVuZXIgPSBwcm94eUhhbmRsZXIoaGFuZGxlcik7XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGlmIChzZWxlY3Rvcikge1xuICAgICAgZXZlbnRMaXN0ZW5lciA9IGRlbGVnYXRlSGFuZGxlci5iaW5kKGVsZW1lbnQsIHNlbGVjdG9yLCBoYW5kbGVyKTtcbiAgICB9XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZXZlbnRMaXN0ZW5lciwgdXNlQ2FwdHVyZSB8fCBmYWxzZSk7XG4gICAgZ2V0SGFuZGxlcnMoZWxlbWVudCkucHVzaCh7XG4gICAgICBldmVudE5hbWU6IGV2ZW50TmFtZSxcbiAgICAgIGhhbmRsZXI6IGhhbmRsZXIsXG4gICAgICBldmVudExpc3RlbmVyOiBldmVudExpc3RlbmVyLFxuICAgICAgc2VsZWN0b3I6IHNlbGVjdG9yLFxuICAgICAgbmFtZXNwYWNlOiBuYW1lc3BhY2VcbiAgICB9KTtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gb2ZmKGV2ZW50TmFtZSwgc2VsZWN0b3IsIGhhbmRsZXIsIHVzZUNhcHR1cmUpIHtcbiAgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGhhbmRsZXIgPSBzZWxlY3RvcjtcbiAgICBzZWxlY3RvciA9IG51bGw7XG4gIH1cbiAgaWYgKGV2ZW50TmFtZSkge1xuICAgIHZhciBwYXJ0cyA9IGV2ZW50TmFtZS5zcGxpdCgnLicpO1xuICAgIGV2ZW50TmFtZSA9IHBhcnRzWzBdO1xuICAgIHZhciBuYW1lc3BhY2UgPSBwYXJ0c1sxXTtcbiAgfVxuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICB2YXIgaGFuZGxlcnMgPSBnZXRIYW5kbGVycyhlbGVtZW50KTtcbiAgICBpZiAoIWV2ZW50TmFtZSAmJiAhbmFtZXNwYWNlICYmICFzZWxlY3RvciAmJiAhaGFuZGxlcikge1xuICAgICAgZWFjaChoYW5kbGVycywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoaXRlbS5ldmVudE5hbWUsIGl0ZW0uZXZlbnRMaXN0ZW5lciwgdXNlQ2FwdHVyZSB8fCBmYWxzZSk7XG4gICAgICB9KTtcbiAgICAgIGNsZWFySGFuZGxlcnMoZWxlbWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVhY2goaGFuZGxlcnMuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuICgoIWV2ZW50TmFtZSB8fCBpdGVtLmV2ZW50TmFtZSA9PT0gZXZlbnROYW1lKSAmJiAoIW5hbWVzcGFjZSB8fCBpdGVtLm5hbWVzcGFjZSA9PT0gbmFtZXNwYWNlKSAmJiAoIWhhbmRsZXIgfHwgaXRlbS5oYW5kbGVyID09PSBoYW5kbGVyKSAmJiAoIXNlbGVjdG9yIHx8IGl0ZW0uc2VsZWN0b3IgPT09IHNlbGVjdG9yKSk7XG4gICAgICB9KSwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoaXRlbS5ldmVudE5hbWUsIGl0ZW0uZXZlbnRMaXN0ZW5lciwgdXNlQ2FwdHVyZSB8fCBmYWxzZSk7XG4gICAgICAgIGhhbmRsZXJzLnNwbGljZShoYW5kbGVycy5pbmRleE9mKGl0ZW0pLCAxKTtcbiAgICAgIH0pO1xuICAgICAgaWYgKGhhbmRsZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBjbGVhckhhbmRsZXJzKGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gZGVsZWdhdGUoc2VsZWN0b3IsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICByZXR1cm4gb24uY2FsbCh0aGlzLCBldmVudE5hbWUsIHNlbGVjdG9yLCBoYW5kbGVyKTtcbn1cbmZ1bmN0aW9uIHVuZGVsZWdhdGUoc2VsZWN0b3IsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICByZXR1cm4gb2ZmLmNhbGwodGhpcywgZXZlbnROYW1lLCBzZWxlY3RvciwgaGFuZGxlcik7XG59XG5mdW5jdGlvbiB0cmlnZ2VyKHR5cGUpIHtcbiAgdmFyIHBhcmFtcyA9IGFyZ3VtZW50c1syXSAhPT0gKHZvaWQgMCkgPyBhcmd1bWVudHNbMl0gOiB7fTtcbiAgcGFyYW1zLmJ1YmJsZXMgPSB0eXBlb2YgcGFyYW1zLmJ1YmJsZXMgPT09ICdib29sZWFuJyA/IHBhcmFtcy5idWJibGVzIDogdHJ1ZTtcbiAgcGFyYW1zLmNhbmNlbGFibGUgPSB0eXBlb2YgcGFyYW1zLmNhbmNlbGFibGUgPT09ICdib29sZWFuJyA/IHBhcmFtcy5jYW5jZWxhYmxlIDogdHJ1ZTtcbiAgcGFyYW1zLnByZXZlbnREZWZhdWx0ID0gdHlwZW9mIHBhcmFtcy5wcmV2ZW50RGVmYXVsdCA9PT0gJ2Jvb2xlYW4nID8gcGFyYW1zLnByZXZlbnREZWZhdWx0IDogZmFsc2U7XG4gIHBhcmFtcy5kZXRhaWwgPSBkYXRhO1xuICB2YXIgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQodHlwZSwgcGFyYW1zKTtcbiAgZXZlbnQuX3ByZXZlbnREZWZhdWx0ID0gcGFyYW1zLnByZXZlbnREZWZhdWx0O1xuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBpZiAoIXBhcmFtcy5idWJibGVzIHx8IGlzRXZlbnRCdWJibGluZ0luRGV0YWNoZWRUcmVlIHx8IGlzQXR0YWNoZWRUb0RvY3VtZW50KGVsZW1lbnQpKSB7XG4gICAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0cmlnZ2VyRm9yUGF0aChlbGVtZW50LCB0eXBlLCBwYXJhbXMpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gdHJpZ2dlckhhbmRsZXIodHlwZSkge1xuICBpZiAodGhpc1swXSkge1xuICAgIHRyaWdnZXIuY2FsbCh0aGlzWzBdLCB0eXBlLCB7XG4gICAgICBidWJibGVzOiBmYWxzZSxcbiAgICAgIHByZXZlbnREZWZhdWx0OiB0cnVlXG4gICAgfSk7XG4gIH1cbn1cbmZ1bmN0aW9uIHJlYWR5KGhhbmRsZXIpIHtcbiAgaWYgKC9jb21wbGV0ZXxsb2FkZWR8aW50ZXJhY3RpdmUvLnRlc3QoZG9jdW1lbnQucmVhZHlTdGF0ZSkgJiYgZG9jdW1lbnQuYm9keSkge1xuICAgIGhhbmRsZXIoKTtcbiAgfSBlbHNlIHtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgaGFuZGxlciwgZmFsc2UpO1xuICB9XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gaXNBdHRhY2hlZFRvRG9jdW1lbnQoZWxlbWVudCkge1xuICBpZiAoZWxlbWVudCA9PT0gd2luZG93IHx8IGVsZW1lbnQgPT09IGRvY3VtZW50KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgdmFyIGNvbnRhaW5lciA9IGVsZW1lbnQub3duZXJEb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gIGlmIChjb250YWluZXIuY29udGFpbnMpIHtcbiAgICByZXR1cm4gY29udGFpbmVyLmNvbnRhaW5zKGVsZW1lbnQpO1xuICB9IGVsc2UgaWYgKGNvbnRhaW5lci5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbikge1xuICAgIHJldHVybiAhKGNvbnRhaW5lci5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihlbGVtZW50KSAmIE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fRElTQ09OTkVDVEVEKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5mdW5jdGlvbiB0cmlnZ2VyRm9yUGF0aChlbGVtZW50LCB0eXBlKSB7XG4gIHZhciBwYXJhbXMgPSBhcmd1bWVudHNbMl0gIT09ICh2b2lkIDApID8gYXJndW1lbnRzWzJdIDoge307XG4gIHBhcmFtcy5idWJibGVzID0gZmFsc2U7XG4gIHZhciBldmVudCA9IG5ldyBDdXN0b21FdmVudCh0eXBlLCBwYXJhbXMpO1xuICBldmVudC5fdGFyZ2V0ID0gZWxlbWVudDtcbiAgZG8ge1xuICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gIH0gd2hpbGUgKGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpO1xufVxudmFyIGV2ZW50S2V5UHJvcCA9ICdfX2RvbXRhc3RpY19ldmVudF9fJztcbnZhciBpZCA9IDE7XG52YXIgaGFuZGxlcnMgPSB7fTtcbnZhciB1bnVzZWRLZXlzID0gW107XG5mdW5jdGlvbiBnZXRIYW5kbGVycyhlbGVtZW50KSB7XG4gIGlmICghZWxlbWVudFtldmVudEtleVByb3BdKSB7XG4gICAgZWxlbWVudFtldmVudEtleVByb3BdID0gdW51c2VkS2V5cy5sZW5ndGggPT09IDAgPyArK2lkIDogdW51c2VkS2V5cy5wb3AoKTtcbiAgfVxuICB2YXIga2V5ID0gZWxlbWVudFtldmVudEtleVByb3BdO1xuICByZXR1cm4gaGFuZGxlcnNba2V5XSB8fCAoaGFuZGxlcnNba2V5XSA9IFtdKTtcbn1cbmZ1bmN0aW9uIGNsZWFySGFuZGxlcnMoZWxlbWVudCkge1xuICB2YXIga2V5ID0gZWxlbWVudFtldmVudEtleVByb3BdO1xuICBpZiAoaGFuZGxlcnNba2V5XSkge1xuICAgIGhhbmRsZXJzW2tleV0gPSBudWxsO1xuICAgIGVsZW1lbnRba2V5XSA9IG51bGw7XG4gICAgdW51c2VkS2V5cy5wdXNoKGtleSk7XG4gIH1cbn1cbmZ1bmN0aW9uIHByb3h5SGFuZGxlcihoYW5kbGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbihldmVudCkge1xuICAgIGhhbmRsZXIoYXVnbWVudEV2ZW50KGV2ZW50KSwgZXZlbnQuZGV0YWlsKTtcbiAgfTtcbn1cbnZhciBhdWdtZW50RXZlbnQgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBldmVudE1ldGhvZHMgPSB7XG4gICAgcHJldmVudERlZmF1bHQ6ICdpc0RlZmF1bHRQcmV2ZW50ZWQnLFxuICAgIHN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbjogJ2lzSW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkJyxcbiAgICBzdG9wUHJvcGFnYXRpb246ICdpc1Byb3BhZ2F0aW9uU3RvcHBlZCdcbiAgfSxcbiAgICAgIG5vb3AgPSAoZnVuY3Rpb24oKSB7fSksXG4gICAgICByZXR1cm5UcnVlID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pLFxuICAgICAgcmV0dXJuRmFsc2UgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0pO1xuICByZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBmb3IgKHZhciBtZXRob2ROYW1lIGluIGV2ZW50TWV0aG9kcykge1xuICAgICAgKGZ1bmN0aW9uKG1ldGhvZE5hbWUsIHRlc3RNZXRob2ROYW1lLCBvcmlnaW5hbE1ldGhvZCkge1xuICAgICAgICBldmVudFttZXRob2ROYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHRoaXNbdGVzdE1ldGhvZE5hbWVdID0gcmV0dXJuVHJ1ZTtcbiAgICAgICAgICByZXR1cm4gb3JpZ2luYWxNZXRob2QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgZXZlbnRbdGVzdE1ldGhvZE5hbWVdID0gcmV0dXJuRmFsc2U7XG4gICAgICB9KG1ldGhvZE5hbWUsIGV2ZW50TWV0aG9kc1ttZXRob2ROYW1lXSwgZXZlbnRbbWV0aG9kTmFtZV0gfHwgbm9vcCkpO1xuICAgIH1cbiAgICBpZiAoZXZlbnQuX3ByZXZlbnREZWZhdWx0KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbiAgICByZXR1cm4gZXZlbnQ7XG4gIH07XG59KSgpO1xuZnVuY3Rpb24gZGVsZWdhdGVIYW5kbGVyKHNlbGVjdG9yLCBoYW5kbGVyLCBldmVudCkge1xuICB2YXIgZXZlbnRUYXJnZXQgPSBldmVudC5fdGFyZ2V0IHx8IGV2ZW50LnRhcmdldDtcbiAgaWYgKG1hdGNoZXMoZXZlbnRUYXJnZXQsIHNlbGVjdG9yKSkge1xuICAgIGlmICghZXZlbnQuY3VycmVudFRhcmdldCkge1xuICAgICAgZXZlbnQuY3VycmVudFRhcmdldCA9IGV2ZW50VGFyZ2V0O1xuICAgIH1cbiAgICBoYW5kbGVyLmNhbGwoZXZlbnRUYXJnZXQsIGV2ZW50KTtcbiAgfVxufVxuKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBDdXN0b21FdmVudChldmVudCkge1xuICAgIHZhciBwYXJhbXMgPSBhcmd1bWVudHNbMV0gIT09ICh2b2lkIDApID8gYXJndW1lbnRzWzFdIDoge1xuICAgICAgYnViYmxlczogZmFsc2UsXG4gICAgICBjYW5jZWxhYmxlOiBmYWxzZSxcbiAgICAgIGRldGFpbDogdW5kZWZpbmVkXG4gICAgfTtcbiAgICB2YXIgY3VzdG9tRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcbiAgICBjdXN0b21FdmVudC5pbml0Q3VzdG9tRXZlbnQoZXZlbnQsIHBhcmFtcy5idWJibGVzLCBwYXJhbXMuY2FuY2VsYWJsZSwgcGFyYW1zLmRldGFpbCk7XG4gICAgcmV0dXJuIGN1c3RvbUV2ZW50O1xuICB9XG4gIEN1c3RvbUV2ZW50LnByb3RvdHlwZSA9IGdsb2JhbC5DdXN0b21FdmVudCAmJiBnbG9iYWwuQ3VzdG9tRXZlbnQucHJvdG90eXBlO1xuICBnbG9iYWwuQ3VzdG9tRXZlbnQgPSBDdXN0b21FdmVudDtcbn0pKCk7XG52YXIgaXNFdmVudEJ1YmJsaW5nSW5EZXRhY2hlZFRyZWUgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBpc0J1YmJsaW5nID0gZmFsc2UsXG4gICAgICBkb2MgPSBnbG9iYWwuZG9jdW1lbnQ7XG4gIGlmIChkb2MpIHtcbiAgICB2YXIgcGFyZW50ID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuICAgICAgICBjaGlsZCA9IHBhcmVudC5jbG9uZU5vZGUoKTtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgIHBhcmVudC5hZGRFdmVudExpc3RlbmVyKCdlJywgZnVuY3Rpb24oKSB7XG4gICAgICBpc0J1YmJsaW5nID0gdHJ1ZTtcbiAgICB9KTtcbiAgICBjaGlsZC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnZScsIHtidWJibGVzOiB0cnVlfSkpO1xuICB9XG4gIHJldHVybiBpc0J1YmJsaW5nO1xufSkoKTtcbnZhciBiaW5kID0gb24sXG4gICAgdW5iaW5kID0gb2ZmO1xuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG9uOiBvbixcbiAgb2ZmOiBvZmYsXG4gIGRlbGVnYXRlOiBkZWxlZ2F0ZSxcbiAgdW5kZWxlZ2F0ZTogdW5kZWxlZ2F0ZSxcbiAgdHJpZ2dlcjogdHJpZ2dlcixcbiAgdHJpZ2dlckhhbmRsZXI6IHRyaWdnZXJIYW5kbGVyLFxuICByZWFkeTogcmVhZHksXG4gIGJpbmQ6IGJpbmQsXG4gIHVuYmluZDogdW5iaW5kLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi9zZWxlY3RvclwiOjEwLFwiLi91dGlsXCI6MTF9XSw3OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL2h0bWxcIjtcbnZhciBlYWNoID0gX2RlcmVxXygnLi91dGlsJykuZWFjaDtcbmZ1bmN0aW9uIGh0bWwoZnJhZ21lbnQpIHtcbiAgaWYgKHR5cGVvZiBmcmFnbWVudCAhPT0gJ3N0cmluZycpIHtcbiAgICB2YXIgZWxlbWVudCA9IHRoaXMubm9kZVR5cGUgPyB0aGlzIDogdGhpc1swXTtcbiAgICByZXR1cm4gZWxlbWVudCA/IGVsZW1lbnQuaW5uZXJIVE1MIDogdW5kZWZpbmVkO1xuICB9XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gZnJhZ21lbnQ7XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBodG1sOiBodG1sLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi91dGlsXCI6MTF9XSw4OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL2luZGV4XCI7XG52YXIgJCA9IF9kZXJlcV8oJy4vYXBpJykuZGVmYXVsdDtcbnZhciAkX19kZWZhdWx0ID0gJDtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBkZWZhdWx0OiAkX19kZWZhdWx0LFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi9hcGlcIjoxfV0sOTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9ub2NvbmZsaWN0XCI7XG52YXIgZ2xvYmFsID0gX2RlcmVxXygnLi91dGlsJykuZ2xvYmFsO1xudmFyIHByZXZpb3VzTGliID0gZ2xvYmFsLiQ7XG5mdW5jdGlvbiBub0NvbmZsaWN0KCkge1xuICBnbG9iYWwuJCA9IHByZXZpb3VzTGliO1xuICByZXR1cm4gdGhpcztcbn1cbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBub0NvbmZsaWN0OiBub0NvbmZsaWN0LFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi91dGlsXCI6MTF9XSwxMDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9zZWxlY3RvclwiO1xudmFyICRfXzAgPSBfZGVyZXFfKCcuL3V0aWwnKSxcbiAgICBnbG9iYWwgPSAkX18wLmdsb2JhbCxcbiAgICBtYWtlSXRlcmFibGUgPSAkX18wLm1ha2VJdGVyYWJsZTtcbnZhciBzbGljZSA9IFtdLnNsaWNlLFxuICAgIGlzUHJvdG90eXBlU2V0ID0gZmFsc2UsXG4gICAgcmVGcmFnbWVudCA9IC9eXFxzKjwoXFx3K3whKVtePl0qPi8sXG4gICAgcmVTaW5nbGVUYWcgPSAvXjwoXFx3KylcXHMqXFwvPz4oPzo8XFwvXFwxPnwpJC8sXG4gICAgcmVTaW1wbGVTZWxlY3RvciA9IC9eW1xcLiNdP1tcXHctXSokLztcbmZ1bmN0aW9uICQoc2VsZWN0b3IpIHtcbiAgdmFyIGNvbnRleHQgPSBhcmd1bWVudHNbMV0gIT09ICh2b2lkIDApID8gYXJndW1lbnRzWzFdIDogZG9jdW1lbnQ7XG4gIHZhciBjb2xsZWN0aW9uO1xuICBpZiAoIXNlbGVjdG9yKSB7XG4gICAgY29sbGVjdGlvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwobnVsbCk7XG4gIH0gZWxzZSBpZiAoc2VsZWN0b3IgaW5zdGFuY2VvZiBXcmFwcGVyKSB7XG4gICAgcmV0dXJuIHNlbGVjdG9yO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxlY3RvciAhPT0gJ3N0cmluZycpIHtcbiAgICBjb2xsZWN0aW9uID0gbWFrZUl0ZXJhYmxlKHNlbGVjdG9yKTtcbiAgfSBlbHNlIGlmIChyZUZyYWdtZW50LnRlc3Qoc2VsZWN0b3IpKSB7XG4gICAgY29sbGVjdGlvbiA9IGNyZWF0ZUZyYWdtZW50KHNlbGVjdG9yKTtcbiAgfSBlbHNlIHtcbiAgICBjb250ZXh0ID0gdHlwZW9mIGNvbnRleHQgPT09ICdzdHJpbmcnID8gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihjb250ZXh0KSA6IGNvbnRleHQubGVuZ3RoID8gY29udGV4dFswXSA6IGNvbnRleHQ7XG4gICAgY29sbGVjdGlvbiA9IHF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IsIGNvbnRleHQpO1xuICB9XG4gIHJldHVybiAkLmlzTmF0aXZlID8gY29sbGVjdGlvbiA6IHdyYXAoY29sbGVjdGlvbik7XG59XG5mdW5jdGlvbiBmaW5kKHNlbGVjdG9yKSB7XG4gIHJldHVybiAkKHNlbGVjdG9yLCB0aGlzKTtcbn1cbnZhciBtYXRjaGVzID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgY29udGV4dCA9IHR5cGVvZiBFbGVtZW50ICE9PSAndW5kZWZpbmVkJyA/IEVsZW1lbnQucHJvdG90eXBlIDogZ2xvYmFsLFxuICAgICAgX21hdGNoZXMgPSBjb250ZXh0Lm1hdGNoZXMgfHwgY29udGV4dC5tYXRjaGVzU2VsZWN0b3IgfHwgY29udGV4dC5tb3pNYXRjaGVzU2VsZWN0b3IgfHwgY29udGV4dC53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHwgY29udGV4dC5tc01hdGNoZXNTZWxlY3RvciB8fCBjb250ZXh0Lm9NYXRjaGVzU2VsZWN0b3I7XG4gIHJldHVybiBmdW5jdGlvbihlbGVtZW50LCBzZWxlY3Rvcikge1xuICAgIHJldHVybiBfbWF0Y2hlcy5jYWxsKGVsZW1lbnQsIHNlbGVjdG9yKTtcbiAgfTtcbn0pKCk7XG5mdW5jdGlvbiBxdWVyeVNlbGVjdG9yKHNlbGVjdG9yLCBjb250ZXh0KSB7XG4gIHZhciBpc1NpbXBsZVNlbGVjdG9yID0gcmVTaW1wbGVTZWxlY3Rvci50ZXN0KHNlbGVjdG9yKTtcbiAgaWYgKGlzU2ltcGxlU2VsZWN0b3IgJiYgISQuaXNOYXRpdmUpIHtcbiAgICBpZiAoc2VsZWN0b3JbMF0gPT09ICcjJykge1xuICAgICAgdmFyIGVsZW1lbnQgPSAoY29udGV4dC5nZXRFbGVtZW50QnlJZCA/IGNvbnRleHQgOiBkb2N1bWVudCkuZ2V0RWxlbWVudEJ5SWQoc2VsZWN0b3Iuc2xpY2UoMSkpO1xuICAgICAgcmV0dXJuIGVsZW1lbnQgPyBbZWxlbWVudF0gOiBbXTtcbiAgICB9XG4gICAgaWYgKHNlbGVjdG9yWzBdID09PSAnLicpIHtcbiAgICAgIHJldHVybiBjb250ZXh0LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoc2VsZWN0b3Iuc2xpY2UoMSkpO1xuICAgIH1cbiAgICByZXR1cm4gY29udGV4dC5nZXRFbGVtZW50c0J5VGFnTmFtZShzZWxlY3Rvcik7XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG59XG5mdW5jdGlvbiBjcmVhdGVGcmFnbWVudChodG1sKSB7XG4gIGlmIChyZVNpbmdsZVRhZy50ZXN0KGh0bWwpKSB7XG4gICAgcmV0dXJuIFtkb2N1bWVudC5jcmVhdGVFbGVtZW50KFJlZ0V4cC4kMSldO1xuICB9XG4gIHZhciBlbGVtZW50cyA9IFtdLFxuICAgICAgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICBjaGlsZHJlbiA9IGNvbnRhaW5lci5jaGlsZE5vZGVzO1xuICBjb250YWluZXIuaW5uZXJIVE1MID0gaHRtbDtcbiAgZm9yICh2YXIgaSA9IDAsXG4gICAgICBsID0gY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgZWxlbWVudHMucHVzaChjaGlsZHJlbltpXSk7XG4gIH1cbiAgcmV0dXJuIGVsZW1lbnRzO1xufVxuZnVuY3Rpb24gd3JhcChjb2xsZWN0aW9uKSB7XG4gIGlmICghaXNQcm90b3R5cGVTZXQpIHtcbiAgICBXcmFwcGVyLnByb3RvdHlwZSA9ICQuZm47XG4gICAgV3JhcHBlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBXcmFwcGVyO1xuICAgIGlzUHJvdG90eXBlU2V0ID0gdHJ1ZTtcbiAgfVxuICByZXR1cm4gbmV3IFdyYXBwZXIoY29sbGVjdGlvbik7XG59XG5mdW5jdGlvbiBXcmFwcGVyKGNvbGxlY3Rpb24pIHtcbiAgdmFyIGkgPSAwLFxuICAgICAgbGVuZ3RoID0gY29sbGVjdGlvbi5sZW5ndGg7XG4gIGZvciAoOyBpIDwgbGVuZ3RoOyApIHtcbiAgICB0aGlzW2ldID0gY29sbGVjdGlvbltpKytdO1xuICB9XG4gIHRoaXMubGVuZ3RoID0gbGVuZ3RoO1xufVxuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICQ6ICQsXG4gIGZpbmQ6IGZpbmQsXG4gIG1hdGNoZXM6IG1hdGNoZXMsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL3V0aWxcIjoxMX1dLDExOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL3V0aWxcIjtcbnZhciBnbG9iYWwgPSBuZXcgRnVuY3Rpb24oXCJyZXR1cm4gdGhpc1wiKSgpLFxuICAgIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIHRvQXJyYXkgPSAoZnVuY3Rpb24oY29sbGVjdGlvbikge1xuICByZXR1cm4gc2xpY2UuY2FsbChjb2xsZWN0aW9uKTtcbn0pO1xudmFyIG1ha2VJdGVyYWJsZSA9IChmdW5jdGlvbihlbGVtZW50KSB7XG4gIHJldHVybiBlbGVtZW50Lm5vZGVUeXBlIHx8IGVsZW1lbnQgPT09IHdpbmRvdyA/IFtlbGVtZW50XSA6IGVsZW1lbnQ7XG59KTtcbmZ1bmN0aW9uIGVhY2goY29sbGVjdGlvbiwgY2FsbGJhY2spIHtcbiAgdmFyIGxlbmd0aCA9IGNvbGxlY3Rpb24ubGVuZ3RoO1xuICBpZiAobGVuZ3RoICE9PSB1bmRlZmluZWQgJiYgY29sbGVjdGlvbi5ub2RlVHlwZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgY2FsbGJhY2soY29sbGVjdGlvbltpXSwgaSwgY29sbGVjdGlvbik7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNhbGxiYWNrKGNvbGxlY3Rpb24sIDAsIGNvbGxlY3Rpb24pO1xuICB9XG4gIHJldHVybiBjb2xsZWN0aW9uO1xufVxuZnVuY3Rpb24gZXh0ZW5kKHRhcmdldCkge1xuICBmb3IgKHZhciBzb3VyY2VzID0gW10sXG4gICAgICAkX18wID0gMTsgJF9fMCA8IGFyZ3VtZW50cy5sZW5ndGg7ICRfXzArKylcbiAgICBzb3VyY2VzWyRfXzAgLSAxXSA9IGFyZ3VtZW50c1skX18wXTtcbiAgc291cmNlcy5mb3JFYWNoKGZ1bmN0aW9uKHNyYykge1xuICAgIGlmIChzcmMpIHtcbiAgICAgIGZvciAodmFyIHByb3AgaW4gc3JjKSB7XG4gICAgICAgIHRhcmdldFtwcm9wXSA9IHNyY1twcm9wXTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gdGFyZ2V0O1xufVxuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdsb2JhbDogZ2xvYmFsLFxuICB0b0FycmF5OiB0b0FycmF5LFxuICBtYWtlSXRlcmFibGU6IG1ha2VJdGVyYWJsZSxcbiAgZWFjaDogZWFjaCxcbiAgZXh0ZW5kOiBleHRlbmQsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7fV19LHt9LFs4XSlcbig4KVxufSk7XG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsInZhciAkID0gd2luZG93LmpRdWVyeSB8fCByZXF1aXJlKCdkb210YXN0aWMnKVxuLCAgIG5hdiA9IHJlcXVpcmUoJy4vbW9kdWxlcy9uYXYnKTtcblxudmFyICRib2R5ID0gJCgnYm9keScpLFxuICAgIGluaXRIVE1MID0gJGJvZHkuaHRtbCgpLFxuICAgIHBvc3RIVE1MID0gJyc7XG5cbi8vIE1ha2UgcGFnZSBlZGl0YWJsZVxuJGJvZHkuYXR0cignY29udGVudGVkaXRhYmxlJywgdHJ1ZSk7XG5cbm5hdi5hcHBlbmQoKTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgJCA9IHdpbmRvdy5qUXVlcnkgfHwgcmVxdWlyZSgnZG9tdGFzdGljJyk7XG5cblxuXG52YXIgbmF2ID0ge1xuICBhcHBlbmQ6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB3aW5kb3cuY29uc29sZS5sb2coJ2FwcGVuZGluZyBuYXYnKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBuYXY7XG4iXX0=

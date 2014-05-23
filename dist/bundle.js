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
var $       = window.jQuery || require('domtastic')
,   nav     = require('./modules/nav')
,   events  = require('./modules/events')
,   content = require('./modules/content');

content.init();
nav.init();
events();


},{"./modules/content":3,"./modules/events":4,"./modules/nav":6,"domtastic":1}],3:[function(require,module,exports){
'use strict';

var $ = window.jQuery || require('domtastic');

var $body = $('body');

var content = {

  wrapContent: function() {
    $body.html('<div id="ice-content">' + $body.html() + '</div>');
    return this.makeEditable($body);
  },

  makeEditable: function(el) {
    return el.attr('contenteditable', true);
  },

  removeIce: function() {
    $body.html($('#ice-content').html());
    $body.removeAttr('contenteditable');
  },

  getContent: function() {
    return $('#ice-content').html();
  },

  init: function() {
    this.wrapContent();
  }

};

module.exports = content;

},{"domtastic":1}],4:[function(require,module,exports){
'use strict';

var $       = window.jQuery || require('domtastic')
,   nav     = require('./nav')
,   content = require('./content')
,   html    = require('./html');

var events = function() {

  $('#ice-off').on('click', function(e) {
    e.preventDefault();
    content.removeIce();
  });

  $('#ice-diff').on('click', function(e) {
    e.preventDefault();
  });

  $('#ice-toggle').on('click', function(e) {
    e.preventDefault();
    window.console.log(html.getHTML());
  });

};

module.exports = events;

},{"./content":3,"./html":5,"./nav":6,"domtastic":1}],5:[function(require,module,exports){
'use strict';

var $ = window.jQuery || require('domtastic');

// set navTemplate
var navTemplate =  '<li id="ice-off">Off</li>';
    navTemplate += '<li id="ice-diff">Diff</li>';
    navTemplate += '<li id="ice-toggle">Original</li>';

var html = {

  navTemplate: navTemplate,

  cssLocation: '<link rel="stylesheet" href="index.css" type="text/css" />',

  getHTML: function() {
    return $('body').html();
  }

};

module.exports = html;

},{"domtastic":1}],6:[function(require,module,exports){
'use strict';

var $    = window.jQuery || require('domtastic')
,   html = require('./html');

var cssLocation = html.cssLocation;
var body = document.getElementsByTagName('body')[ 0 ];

var nav = {

  create: function() {
    var el = document.createElement('ul');
    el.innerHTML = html.navTemplate;
    el.setAttribute('id','ice-nav');
    el.setAttribute('contenteditable', false);
    this.style(el);
  },

  style: function(el) {
    $('head').append(cssLocation);
    this.append(el);
  },

  append: function(el) {
    body.appendChild(el);
  },

  init: function() {
    this.create();
  }

};

module.exports = nav;

},{"./html":5,"domtastic":1}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVm9sdW1lcy9TZXNzaW9ucy93ZWIvZGV2L2NvcHktZWRpdG9yL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVm9sdW1lcy9TZXNzaW9ucy93ZWIvZGV2L2NvcHktZWRpdG9yL25vZGVfbW9kdWxlcy9kb210YXN0aWMvZG9tdGFzdGljLmpzIiwiL1ZvbHVtZXMvU2Vzc2lvbnMvd2ViL2Rldi9jb3B5LWVkaXRvci9zcmMvanMvaW5kZXguanMiLCIvVm9sdW1lcy9TZXNzaW9ucy93ZWIvZGV2L2NvcHktZWRpdG9yL3NyYy9qcy9tb2R1bGVzL2NvbnRlbnQuanMiLCIvVm9sdW1lcy9TZXNzaW9ucy93ZWIvZGV2L2NvcHktZWRpdG9yL3NyYy9qcy9tb2R1bGVzL2V2ZW50cy5qcyIsIi9Wb2x1bWVzL1Nlc3Npb25zL3dlYi9kZXYvY29weS1lZGl0b3Ivc3JjL2pzL21vZHVsZXMvaHRtbC5qcyIsIi9Wb2x1bWVzL1Nlc3Npb25zL3dlYi9kZXYvY29weS1lZGl0b3Ivc3JjL2pzL21vZHVsZXMvbmF2LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuIWZ1bmN0aW9uKF9lKXt2YXIgZT1mdW5jdGlvbigpe3JldHVybiBfZSgpW1wiZGVmYXVsdFwiXX07aWYoXCJvYmplY3RcIj09dHlwZW9mIGV4cG9ydHMpbW9kdWxlLmV4cG9ydHM9ZSgpO2Vsc2UgaWYoXCJmdW5jdGlvblwiPT10eXBlb2YgZGVmaW5lJiZkZWZpbmUuYW1kKWRlZmluZShlKTtlbHNle3ZhciBmO1widW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/Zj13aW5kb3c6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGdsb2JhbD9mPWdsb2JhbDpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZiYmKGY9c2VsZiksZi4kPWUoKX19KGZ1bmN0aW9uKCl7dmFyIGRlZmluZSxtb2R1bGUsZXhwb3J0cztyZXR1cm4gKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkoezE6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvYXBpXCI7XG52YXIgZXh0ZW5kID0gX2RlcmVxXygnLi91dGlsJykuZXh0ZW5kO1xudmFyIGFwaSA9IHt9LFxuICAgIGFwaU5vZGVMaXN0ID0ge30sXG4gICAgJCA9IHt9O1xudmFyIGFycmF5ID0gX2RlcmVxXygnLi9hcnJheScpO1xudmFyIGF0dHIgPSBfZGVyZXFfKCcuL2F0dHInKTtcbnZhciBjbGFzc05hbWUgPSBfZGVyZXFfKCcuL2NsYXNzJyk7XG52YXIgZG9tID0gX2RlcmVxXygnLi9kb20nKTtcbnZhciBldmVudCA9IF9kZXJlcV8oJy4vZXZlbnQnKTtcbnZhciBodG1sID0gX2RlcmVxXygnLi9odG1sJyk7XG52YXIgc2VsZWN0b3IgPSBfZGVyZXFfKCcuL3NlbGVjdG9yJyk7XG5pZiAoc2VsZWN0b3IgIT09IHVuZGVmaW5lZCkge1xuICAkID0gc2VsZWN0b3IuJDtcbiAgJC5tYXRjaGVzID0gc2VsZWN0b3IubWF0Y2hlcztcbiAgYXBpLmZpbmQgPSBzZWxlY3Rvci5maW5kO1xufVxuZXh0ZW5kKCQpO1xudmFyIG5vY29uZmxpY3QgPSBfZGVyZXFfKCcuL25vY29uZmxpY3QnKTtcbmV4dGVuZCgkLCBub2NvbmZsaWN0KTtcbmV4dGVuZChhcGksIGFycmF5LCBhdHRyLCBjbGFzc05hbWUsIGRvbSwgZXZlbnQsIGh0bWwpO1xuZXh0ZW5kKGFwaU5vZGVMaXN0LCBhcnJheSk7XG4kLnZlcnNpb24gPSAnMC43LjAnO1xuJC5leHRlbmQgPSBleHRlbmQ7XG4kLmZuID0gYXBpO1xuJC5mbkxpc3QgPSBhcGlOb2RlTGlzdDtcbnZhciAkX19kZWZhdWx0ID0gJDtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBkZWZhdWx0OiAkX19kZWZhdWx0LFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi9hcnJheVwiOjIsXCIuL2F0dHJcIjozLFwiLi9jbGFzc1wiOjQsXCIuL2RvbVwiOjUsXCIuL2V2ZW50XCI6NixcIi4vaHRtbFwiOjcsXCIuL25vY29uZmxpY3RcIjo5LFwiLi9zZWxlY3RvclwiOjEwLFwiLi91dGlsXCI6MTF9XSwyOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL2FycmF5XCI7XG52YXIgX2VhY2ggPSBfZGVyZXFfKCcuL3V0aWwnKS5lYWNoO1xudmFyICRfXzAgPSBfZGVyZXFfKCcuL3NlbGVjdG9yJyksXG4gICAgJCA9ICRfXzAuJCxcbiAgICBtYXRjaGVzID0gJF9fMC5tYXRjaGVzO1xudmFyIEFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGU7XG5mdW5jdGlvbiBmaWx0ZXIoc2VsZWN0b3IpIHtcbiAgdmFyIGNhbGxiYWNrID0gdHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nID8gc2VsZWN0b3IgOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgcmV0dXJuIG1hdGNoZXMoZWxlbWVudCwgc2VsZWN0b3IpO1xuICB9O1xuICByZXR1cm4gJChBcnJheVByb3RvLmZpbHRlci5jYWxsKHRoaXMsIGNhbGxiYWNrKSk7XG59XG5mdW5jdGlvbiBlYWNoKGNhbGxiYWNrKSB7XG4gIHJldHVybiBfZWFjaCh0aGlzLCBjYWxsYmFjayk7XG59XG52YXIgZm9yRWFjaCA9IGVhY2g7XG52YXIgbWFwID0gQXJyYXlQcm90by5tYXA7XG5mdW5jdGlvbiByZXZlcnNlKCkge1xuICB2YXIgZWxlbWVudHMgPSBBcnJheVByb3RvLnNsaWNlLmNhbGwodGhpcyk7XG4gIHJldHVybiAkKEFycmF5UHJvdG8ucmV2ZXJzZS5jYWxsKGVsZW1lbnRzKSk7XG59XG52YXIgZXZlcnkgPSBBcnJheVByb3RvLmV2ZXJ5O1xudmFyIHNvbWUgPSBBcnJheVByb3RvLnNvbWU7XG52YXIgaW5kZXhPZiA9IEFycmF5UHJvdG8uaW5kZXhPZjtcbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBlYWNoOiBlYWNoLFxuICBldmVyeTogZXZlcnksXG4gIGZpbHRlcjogZmlsdGVyLFxuICBmb3JFYWNoOiBmb3JFYWNoLFxuICBpbmRleE9mOiBpbmRleE9mLFxuICBtYXA6IG1hcCxcbiAgcmV2ZXJzZTogcmV2ZXJzZSxcbiAgc29tZTogc29tZSxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vc2VsZWN0b3JcIjoxMCxcIi4vdXRpbFwiOjExfV0sMzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9hdHRyXCI7XG52YXIgZWFjaCA9IF9kZXJlcV8oJy4vdXRpbCcpLmVhY2g7XG5mdW5jdGlvbiBhdHRyKGtleSwgdmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB2YXIgZWxlbWVudCA9IHRoaXMubm9kZVR5cGUgPyB0aGlzIDogdGhpc1swXTtcbiAgICByZXR1cm4gZWxlbWVudCA/IGVsZW1lbnQuZ2V0QXR0cmlidXRlKGtleSkgOiB1bmRlZmluZWQ7XG4gIH1cbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnKSB7XG4gICAgICBmb3IgKHZhciBhdHRyIGluIGtleSkge1xuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShhdHRyLCBrZXlbYXR0cl0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIHJlbW92ZUF0dHIoa2V5KSB7XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBhdHRyOiBhdHRyLFxuICByZW1vdmVBdHRyOiByZW1vdmVBdHRyLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi91dGlsXCI6MTF9XSw0OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL2NsYXNzXCI7XG52YXIgJF9fMCA9IF9kZXJlcV8oJy4vdXRpbCcpLFxuICAgIG1ha2VJdGVyYWJsZSA9ICRfXzAubWFrZUl0ZXJhYmxlLFxuICAgIGVhY2ggPSAkX18wLmVhY2g7XG5mdW5jdGlvbiBhZGRDbGFzcyh2YWx1ZSkge1xuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQodmFsdWUpO1xuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiByZW1vdmVDbGFzcyh2YWx1ZSkge1xuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUodmFsdWUpO1xuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiB0b2dnbGVDbGFzcyh2YWx1ZSkge1xuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUodmFsdWUpO1xuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBoYXNDbGFzcyh2YWx1ZSkge1xuICByZXR1cm4gbWFrZUl0ZXJhYmxlKHRoaXMpLnNvbWUoZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIHJldHVybiBlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyh2YWx1ZSk7XG4gIH0pO1xufVxuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFkZENsYXNzOiBhZGRDbGFzcyxcbiAgcmVtb3ZlQ2xhc3M6IHJlbW92ZUNsYXNzLFxuICB0b2dnbGVDbGFzczogdG9nZ2xlQ2xhc3MsXG4gIGhhc0NsYXNzOiBoYXNDbGFzcyxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vdXRpbFwiOjExfV0sNTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9kb21cIjtcbnZhciB0b0FycmF5ID0gX2RlcmVxXygnLi91dGlsJykudG9BcnJheTtcbmZ1bmN0aW9uIGFwcGVuZChlbGVtZW50KSB7XG4gIGlmICh0aGlzIGluc3RhbmNlb2YgTm9kZSkge1xuICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRoaXMuaW5zZXJ0QWRqYWNlbnRIVE1MKCdiZWZvcmVlbmQnLCBlbGVtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZWxlbWVudHMgPSBlbGVtZW50IGluc3RhbmNlb2YgTm9kZUxpc3QgPyB0b0FycmF5KGVsZW1lbnQpIDogZWxlbWVudDtcbiAgICAgICAgZWxlbWVudHMuZm9yRWFjaCh0aGlzLmFwcGVuZENoaWxkLmJpbmQodGhpcykpO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgbCA9IHRoaXMubGVuZ3RoO1xuICAgIHdoaWxlIChsLS0pIHtcbiAgICAgIHZhciBlbG0gPSBsID09PSAwID8gZWxlbWVudCA6IF9jbG9uZShlbGVtZW50KTtcbiAgICAgIGFwcGVuZC5jYWxsKHRoaXNbbF0sIGVsbSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gcHJlcGVuZChlbGVtZW50KSB7XG4gIGlmICh0aGlzIGluc3RhbmNlb2YgTm9kZSkge1xuICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRoaXMuaW5zZXJ0QWRqYWNlbnRIVE1MKCdhZnRlcmJlZ2luJywgZWxlbWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgICB0aGlzLmluc2VydEJlZm9yZShlbGVtZW50LCB0aGlzLmZpcnN0Q2hpbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGVsZW1lbnRzID0gZWxlbWVudCBpbnN0YW5jZW9mIE5vZGVMaXN0ID8gdG9BcnJheShlbGVtZW50KSA6IGVsZW1lbnQ7XG4gICAgICAgIGVsZW1lbnRzLnJldmVyc2UoKS5mb3JFYWNoKHByZXBlbmQuYmluZCh0aGlzKSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgd2hpbGUgKGwtLSkge1xuICAgICAgdmFyIGVsbSA9IGwgPT09IDAgPyBlbGVtZW50IDogX2Nsb25lKGVsZW1lbnQpO1xuICAgICAgcHJlcGVuZC5jYWxsKHRoaXNbbF0sIGVsbSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gYmVmb3JlKGVsZW1lbnQpIHtcbiAgaWYgKHRoaXMgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWJlZ2luJywgZWxlbWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgICB0aGlzLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGVsZW1lbnQsIHRoaXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGVsZW1lbnRzID0gZWxlbWVudCBpbnN0YW5jZW9mIE5vZGVMaXN0ID8gdG9BcnJheShlbGVtZW50KSA6IGVsZW1lbnQ7XG4gICAgICAgIGVsZW1lbnRzLmZvckVhY2goYmVmb3JlLmJpbmQodGhpcykpO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgbCA9IHRoaXMubGVuZ3RoO1xuICAgIHdoaWxlIChsLS0pIHtcbiAgICAgIHZhciBlbG0gPSBsID09PSAwID8gZWxlbWVudCA6IF9jbG9uZShlbGVtZW50KTtcbiAgICAgIGJlZm9yZS5jYWxsKHRoaXNbbF0sIGVsbSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gYWZ0ZXIoZWxlbWVudCkge1xuICBpZiAodGhpcyBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLmluc2VydEFkamFjZW50SFRNTCgnYWZ0ZXJlbmQnLCBlbGVtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAgIHRoaXMucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWxlbWVudCwgdGhpcy5uZXh0U2libGluZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZWxlbWVudHMgPSBlbGVtZW50IGluc3RhbmNlb2YgTm9kZUxpc3QgPyB0b0FycmF5KGVsZW1lbnQpIDogZWxlbWVudDtcbiAgICAgICAgZWxlbWVudHMucmV2ZXJzZSgpLmZvckVhY2goYWZ0ZXIuYmluZCh0aGlzKSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgd2hpbGUgKGwtLSkge1xuICAgICAgdmFyIGVsbSA9IGwgPT09IDAgPyBlbGVtZW50IDogX2Nsb25lKGVsZW1lbnQpO1xuICAgICAgYWZ0ZXIuY2FsbCh0aGlzW2xdLCBlbG0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIGNsb25lKCkge1xuICByZXR1cm4gJChfY2xvbmUodGhpcykpO1xufVxuZnVuY3Rpb24gX2Nsb25lKGVsZW1lbnQpIHtcbiAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBlbGVtZW50O1xuICB9IGVsc2UgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgcmV0dXJuIGVsZW1lbnQuY2xvbmVOb2RlKHRydWUpO1xuICB9IGVsc2UgaWYgKCdsZW5ndGgnIGluIGVsZW1lbnQpIHtcbiAgICByZXR1cm4gW10ubWFwLmNhbGwoZWxlbWVudCwgZnVuY3Rpb24oZWwpIHtcbiAgICAgIHJldHVybiBlbC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGVsZW1lbnQ7XG59XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYXBwZW5kOiBhcHBlbmQsXG4gIHByZXBlbmQ6IHByZXBlbmQsXG4gIGJlZm9yZTogYmVmb3JlLFxuICBhZnRlcjogYWZ0ZXIsXG4gIGNsb25lOiBjbG9uZSxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vdXRpbFwiOjExfV0sNjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9ldmVudFwiO1xudmFyICRfXzAgPSBfZGVyZXFfKCcuL3V0aWwnKSxcbiAgICBnbG9iYWwgPSAkX18wLmdsb2JhbCxcbiAgICBlYWNoID0gJF9fMC5lYWNoO1xudmFyIG1hdGNoZXMgPSBfZGVyZXFfKCcuL3NlbGVjdG9yJykubWF0Y2hlcztcbmZ1bmN0aW9uIG9uKGV2ZW50TmFtZSwgc2VsZWN0b3IsIGhhbmRsZXIsIHVzZUNhcHR1cmUpIHtcbiAgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGhhbmRsZXIgPSBzZWxlY3RvcjtcbiAgICBzZWxlY3RvciA9IG51bGw7XG4gIH1cbiAgdmFyIHBhcnRzID0gZXZlbnROYW1lLnNwbGl0KCcuJyk7XG4gIGV2ZW50TmFtZSA9IHBhcnRzWzBdIHx8IG51bGw7XG4gIHZhciBuYW1lc3BhY2UgPSBwYXJ0c1sxXSB8fCBudWxsO1xuICB2YXIgZXZlbnRMaXN0ZW5lciA9IHByb3h5SGFuZGxlcihoYW5kbGVyKTtcbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgaWYgKHNlbGVjdG9yKSB7XG4gICAgICBldmVudExpc3RlbmVyID0gZGVsZWdhdGVIYW5kbGVyLmJpbmQoZWxlbWVudCwgc2VsZWN0b3IsIGhhbmRsZXIpO1xuICAgIH1cbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBldmVudExpc3RlbmVyLCB1c2VDYXB0dXJlIHx8IGZhbHNlKTtcbiAgICBnZXRIYW5kbGVycyhlbGVtZW50KS5wdXNoKHtcbiAgICAgIGV2ZW50TmFtZTogZXZlbnROYW1lLFxuICAgICAgaGFuZGxlcjogaGFuZGxlcixcbiAgICAgIGV2ZW50TGlzdGVuZXI6IGV2ZW50TGlzdGVuZXIsXG4gICAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXG4gICAgICBuYW1lc3BhY2U6IG5hbWVzcGFjZVxuICAgIH0pO1xuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBvZmYoZXZlbnROYW1lLCBzZWxlY3RvciwgaGFuZGxlciwgdXNlQ2FwdHVyZSkge1xuICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaGFuZGxlciA9IHNlbGVjdG9yO1xuICAgIHNlbGVjdG9yID0gbnVsbDtcbiAgfVxuICBpZiAoZXZlbnROYW1lKSB7XG4gICAgdmFyIHBhcnRzID0gZXZlbnROYW1lLnNwbGl0KCcuJyk7XG4gICAgZXZlbnROYW1lID0gcGFydHNbMF07XG4gICAgdmFyIG5hbWVzcGFjZSA9IHBhcnRzWzFdO1xuICB9XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIHZhciBoYW5kbGVycyA9IGdldEhhbmRsZXJzKGVsZW1lbnQpO1xuICAgIGlmICghZXZlbnROYW1lICYmICFuYW1lc3BhY2UgJiYgIXNlbGVjdG9yICYmICFoYW5kbGVyKSB7XG4gICAgICBlYWNoKGhhbmRsZXJzLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihpdGVtLmV2ZW50TmFtZSwgaXRlbS5ldmVudExpc3RlbmVyLCB1c2VDYXB0dXJlIHx8IGZhbHNlKTtcbiAgICAgIH0pO1xuICAgICAgY2xlYXJIYW5kbGVycyhlbGVtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWFjaChoYW5kbGVycy5maWx0ZXIoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICByZXR1cm4gKCghZXZlbnROYW1lIHx8IGl0ZW0uZXZlbnROYW1lID09PSBldmVudE5hbWUpICYmICghbmFtZXNwYWNlIHx8IGl0ZW0ubmFtZXNwYWNlID09PSBuYW1lc3BhY2UpICYmICghaGFuZGxlciB8fCBpdGVtLmhhbmRsZXIgPT09IGhhbmRsZXIpICYmICghc2VsZWN0b3IgfHwgaXRlbS5zZWxlY3RvciA9PT0gc2VsZWN0b3IpKTtcbiAgICAgIH0pLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihpdGVtLmV2ZW50TmFtZSwgaXRlbS5ldmVudExpc3RlbmVyLCB1c2VDYXB0dXJlIHx8IGZhbHNlKTtcbiAgICAgICAgaGFuZGxlcnMuc3BsaWNlKGhhbmRsZXJzLmluZGV4T2YoaXRlbSksIDEpO1xuICAgICAgfSk7XG4gICAgICBpZiAoaGFuZGxlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNsZWFySGFuZGxlcnMoZWxlbWVudCk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBkZWxlZ2F0ZShzZWxlY3RvciwgZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gIHJldHVybiBvbi5jYWxsKHRoaXMsIGV2ZW50TmFtZSwgc2VsZWN0b3IsIGhhbmRsZXIpO1xufVxuZnVuY3Rpb24gdW5kZWxlZ2F0ZShzZWxlY3RvciwgZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gIHJldHVybiBvZmYuY2FsbCh0aGlzLCBldmVudE5hbWUsIHNlbGVjdG9yLCBoYW5kbGVyKTtcbn1cbmZ1bmN0aW9uIHRyaWdnZXIodHlwZSkge1xuICB2YXIgcGFyYW1zID0gYXJndW1lbnRzWzJdICE9PSAodm9pZCAwKSA/IGFyZ3VtZW50c1syXSA6IHt9O1xuICBwYXJhbXMuYnViYmxlcyA9IHR5cGVvZiBwYXJhbXMuYnViYmxlcyA9PT0gJ2Jvb2xlYW4nID8gcGFyYW1zLmJ1YmJsZXMgOiB0cnVlO1xuICBwYXJhbXMuY2FuY2VsYWJsZSA9IHR5cGVvZiBwYXJhbXMuY2FuY2VsYWJsZSA9PT0gJ2Jvb2xlYW4nID8gcGFyYW1zLmNhbmNlbGFibGUgOiB0cnVlO1xuICBwYXJhbXMucHJldmVudERlZmF1bHQgPSB0eXBlb2YgcGFyYW1zLnByZXZlbnREZWZhdWx0ID09PSAnYm9vbGVhbicgPyBwYXJhbXMucHJldmVudERlZmF1bHQgOiBmYWxzZTtcbiAgcGFyYW1zLmRldGFpbCA9IGRhdGE7XG4gIHZhciBldmVudCA9IG5ldyBDdXN0b21FdmVudCh0eXBlLCBwYXJhbXMpO1xuICBldmVudC5fcHJldmVudERlZmF1bHQgPSBwYXJhbXMucHJldmVudERlZmF1bHQ7XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGlmICghcGFyYW1zLmJ1YmJsZXMgfHwgaXNFdmVudEJ1YmJsaW5nSW5EZXRhY2hlZFRyZWUgfHwgaXNBdHRhY2hlZFRvRG9jdW1lbnQoZWxlbWVudCkpIHtcbiAgICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyaWdnZXJGb3JQYXRoKGVsZW1lbnQsIHR5cGUsIHBhcmFtcyk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiB0cmlnZ2VySGFuZGxlcih0eXBlKSB7XG4gIGlmICh0aGlzWzBdKSB7XG4gICAgdHJpZ2dlci5jYWxsKHRoaXNbMF0sIHR5cGUsIHtcbiAgICAgIGJ1YmJsZXM6IGZhbHNlLFxuICAgICAgcHJldmVudERlZmF1bHQ6IHRydWVcbiAgICB9KTtcbiAgfVxufVxuZnVuY3Rpb24gcmVhZHkoaGFuZGxlcikge1xuICBpZiAoL2NvbXBsZXRlfGxvYWRlZHxpbnRlcmFjdGl2ZS8udGVzdChkb2N1bWVudC5yZWFkeVN0YXRlKSAmJiBkb2N1bWVudC5ib2R5KSB7XG4gICAgaGFuZGxlcigpO1xuICB9IGVsc2Uge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBoYW5kbGVyLCBmYWxzZSk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBpc0F0dGFjaGVkVG9Eb2N1bWVudChlbGVtZW50KSB7XG4gIGlmIChlbGVtZW50ID09PSB3aW5kb3cgfHwgZWxlbWVudCA9PT0gZG9jdW1lbnQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICB2YXIgY29udGFpbmVyID0gZWxlbWVudC5vd25lckRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgaWYgKGNvbnRhaW5lci5jb250YWlucykge1xuICAgIHJldHVybiBjb250YWluZXIuY29udGFpbnMoZWxlbWVudCk7XG4gIH0gZWxzZSBpZiAoY29udGFpbmVyLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKSB7XG4gICAgcmV0dXJuICEoY29udGFpbmVyLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKGVsZW1lbnQpICYgTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9ESVNDT05ORUNURUQpO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbmZ1bmN0aW9uIHRyaWdnZXJGb3JQYXRoKGVsZW1lbnQsIHR5cGUpIHtcbiAgdmFyIHBhcmFtcyA9IGFyZ3VtZW50c1syXSAhPT0gKHZvaWQgMCkgPyBhcmd1bWVudHNbMl0gOiB7fTtcbiAgcGFyYW1zLmJ1YmJsZXMgPSBmYWxzZTtcbiAgdmFyIGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KHR5cGUsIHBhcmFtcyk7XG4gIGV2ZW50Ll90YXJnZXQgPSBlbGVtZW50O1xuICBkbyB7XG4gICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgfSB3aGlsZSAoZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSk7XG59XG52YXIgZXZlbnRLZXlQcm9wID0gJ19fZG9tdGFzdGljX2V2ZW50X18nO1xudmFyIGlkID0gMTtcbnZhciBoYW5kbGVycyA9IHt9O1xudmFyIHVudXNlZEtleXMgPSBbXTtcbmZ1bmN0aW9uIGdldEhhbmRsZXJzKGVsZW1lbnQpIHtcbiAgaWYgKCFlbGVtZW50W2V2ZW50S2V5UHJvcF0pIHtcbiAgICBlbGVtZW50W2V2ZW50S2V5UHJvcF0gPSB1bnVzZWRLZXlzLmxlbmd0aCA9PT0gMCA/ICsraWQgOiB1bnVzZWRLZXlzLnBvcCgpO1xuICB9XG4gIHZhciBrZXkgPSBlbGVtZW50W2V2ZW50S2V5UHJvcF07XG4gIHJldHVybiBoYW5kbGVyc1trZXldIHx8IChoYW5kbGVyc1trZXldID0gW10pO1xufVxuZnVuY3Rpb24gY2xlYXJIYW5kbGVycyhlbGVtZW50KSB7XG4gIHZhciBrZXkgPSBlbGVtZW50W2V2ZW50S2V5UHJvcF07XG4gIGlmIChoYW5kbGVyc1trZXldKSB7XG4gICAgaGFuZGxlcnNba2V5XSA9IG51bGw7XG4gICAgZWxlbWVudFtrZXldID0gbnVsbDtcbiAgICB1bnVzZWRLZXlzLnB1c2goa2V5KTtcbiAgfVxufVxuZnVuY3Rpb24gcHJveHlIYW5kbGVyKGhhbmRsZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgaGFuZGxlcihhdWdtZW50RXZlbnQoZXZlbnQpLCBldmVudC5kZXRhaWwpO1xuICB9O1xufVxudmFyIGF1Z21lbnRFdmVudCA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGV2ZW50TWV0aG9kcyA9IHtcbiAgICBwcmV2ZW50RGVmYXVsdDogJ2lzRGVmYXVsdFByZXZlbnRlZCcsXG4gICAgc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uOiAnaXNJbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQnLFxuICAgIHN0b3BQcm9wYWdhdGlvbjogJ2lzUHJvcGFnYXRpb25TdG9wcGVkJ1xuICB9LFxuICAgICAgbm9vcCA9IChmdW5jdGlvbigpIHt9KSxcbiAgICAgIHJldHVyblRydWUgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSksXG4gICAgICByZXR1cm5GYWxzZSA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSk7XG4gIHJldHVybiBmdW5jdGlvbihldmVudCkge1xuICAgIGZvciAodmFyIG1ldGhvZE5hbWUgaW4gZXZlbnRNZXRob2RzKSB7XG4gICAgICAoZnVuY3Rpb24obWV0aG9kTmFtZSwgdGVzdE1ldGhvZE5hbWUsIG9yaWdpbmFsTWV0aG9kKSB7XG4gICAgICAgIGV2ZW50W21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdGhpc1t0ZXN0TWV0aG9kTmFtZV0gPSByZXR1cm5UcnVlO1xuICAgICAgICAgIHJldHVybiBvcmlnaW5hbE1ldGhvZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgICAgICBldmVudFt0ZXN0TWV0aG9kTmFtZV0gPSByZXR1cm5GYWxzZTtcbiAgICAgIH0obWV0aG9kTmFtZSwgZXZlbnRNZXRob2RzW21ldGhvZE5hbWVdLCBldmVudFttZXRob2ROYW1lXSB8fCBub29wKSk7XG4gICAgfVxuICAgIGlmIChldmVudC5fcHJldmVudERlZmF1bHQpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuICAgIHJldHVybiBldmVudDtcbiAgfTtcbn0pKCk7XG5mdW5jdGlvbiBkZWxlZ2F0ZUhhbmRsZXIoc2VsZWN0b3IsIGhhbmRsZXIsIGV2ZW50KSB7XG4gIHZhciBldmVudFRhcmdldCA9IGV2ZW50Ll90YXJnZXQgfHwgZXZlbnQudGFyZ2V0O1xuICBpZiAobWF0Y2hlcyhldmVudFRhcmdldCwgc2VsZWN0b3IpKSB7XG4gICAgaWYgKCFldmVudC5jdXJyZW50VGFyZ2V0KSB7XG4gICAgICBldmVudC5jdXJyZW50VGFyZ2V0ID0gZXZlbnRUYXJnZXQ7XG4gICAgfVxuICAgIGhhbmRsZXIuY2FsbChldmVudFRhcmdldCwgZXZlbnQpO1xuICB9XG59XG4oZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIEN1c3RvbUV2ZW50KGV2ZW50KSB7XG4gICAgdmFyIHBhcmFtcyA9IGFyZ3VtZW50c1sxXSAhPT0gKHZvaWQgMCkgPyBhcmd1bWVudHNbMV0gOiB7XG4gICAgICBidWJibGVzOiBmYWxzZSxcbiAgICAgIGNhbmNlbGFibGU6IGZhbHNlLFxuICAgICAgZGV0YWlsOiB1bmRlZmluZWRcbiAgICB9O1xuICAgIHZhciBjdXN0b21FdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGN1c3RvbUV2ZW50LmluaXRDdXN0b21FdmVudChldmVudCwgcGFyYW1zLmJ1YmJsZXMsIHBhcmFtcy5jYW5jZWxhYmxlLCBwYXJhbXMuZGV0YWlsKTtcbiAgICByZXR1cm4gY3VzdG9tRXZlbnQ7XG4gIH1cbiAgQ3VzdG9tRXZlbnQucHJvdG90eXBlID0gZ2xvYmFsLkN1c3RvbUV2ZW50ICYmIGdsb2JhbC5DdXN0b21FdmVudC5wcm90b3R5cGU7XG4gIGdsb2JhbC5DdXN0b21FdmVudCA9IEN1c3RvbUV2ZW50O1xufSkoKTtcbnZhciBpc0V2ZW50QnViYmxpbmdJbkRldGFjaGVkVHJlZSA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGlzQnViYmxpbmcgPSBmYWxzZSxcbiAgICAgIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcbiAgaWYgKGRvYykge1xuICAgIHZhciBwYXJlbnQgPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICAgIGNoaWxkID0gcGFyZW50LmNsb25lTm9kZSgpO1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZChjaGlsZCk7XG4gICAgcGFyZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2UnLCBmdW5jdGlvbigpIHtcbiAgICAgIGlzQnViYmxpbmcgPSB0cnVlO1xuICAgIH0pO1xuICAgIGNoaWxkLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCdlJywge2J1YmJsZXM6IHRydWV9KSk7XG4gIH1cbiAgcmV0dXJuIGlzQnViYmxpbmc7XG59KSgpO1xudmFyIGJpbmQgPSBvbixcbiAgICB1bmJpbmQgPSBvZmY7XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgb246IG9uLFxuICBvZmY6IG9mZixcbiAgZGVsZWdhdGU6IGRlbGVnYXRlLFxuICB1bmRlbGVnYXRlOiB1bmRlbGVnYXRlLFxuICB0cmlnZ2VyOiB0cmlnZ2VyLFxuICB0cmlnZ2VySGFuZGxlcjogdHJpZ2dlckhhbmRsZXIsXG4gIHJlYWR5OiByZWFkeSxcbiAgYmluZDogYmluZCxcbiAgdW5iaW5kOiB1bmJpbmQsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL3NlbGVjdG9yXCI6MTAsXCIuL3V0aWxcIjoxMX1dLDc6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvaHRtbFwiO1xudmFyIGVhY2ggPSBfZGVyZXFfKCcuL3V0aWwnKS5lYWNoO1xuZnVuY3Rpb24gaHRtbChmcmFnbWVudCkge1xuICBpZiAodHlwZW9mIGZyYWdtZW50ICE9PSAnc3RyaW5nJykge1xuICAgIHZhciBlbGVtZW50ID0gdGhpcy5ub2RlVHlwZSA/IHRoaXMgOiB0aGlzWzBdO1xuICAgIHJldHVybiBlbGVtZW50ID8gZWxlbWVudC5pbm5lckhUTUwgOiB1bmRlZmluZWQ7XG4gIH1cbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgZWxlbWVudC5pbm5lckhUTUwgPSBmcmFnbWVudDtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGh0bWw6IGh0bWwsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL3V0aWxcIjoxMX1dLDg6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvaW5kZXhcIjtcbnZhciAkID0gX2RlcmVxXygnLi9hcGknKS5kZWZhdWx0O1xudmFyICRfX2RlZmF1bHQgPSAkO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGRlZmF1bHQ6ICRfX2RlZmF1bHQsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL2FwaVwiOjF9XSw5OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL25vY29uZmxpY3RcIjtcbnZhciBnbG9iYWwgPSBfZGVyZXFfKCcuL3V0aWwnKS5nbG9iYWw7XG52YXIgcHJldmlvdXNMaWIgPSBnbG9iYWwuJDtcbmZ1bmN0aW9uIG5vQ29uZmxpY3QoKSB7XG4gIGdsb2JhbC4kID0gcHJldmlvdXNMaWI7XG4gIHJldHVybiB0aGlzO1xufVxuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG5vQ29uZmxpY3Q6IG5vQ29uZmxpY3QsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL3V0aWxcIjoxMX1dLDEwOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL3NlbGVjdG9yXCI7XG52YXIgJF9fMCA9IF9kZXJlcV8oJy4vdXRpbCcpLFxuICAgIGdsb2JhbCA9ICRfXzAuZ2xvYmFsLFxuICAgIG1ha2VJdGVyYWJsZSA9ICRfXzAubWFrZUl0ZXJhYmxlO1xudmFyIHNsaWNlID0gW10uc2xpY2UsXG4gICAgaXNQcm90b3R5cGVTZXQgPSBmYWxzZSxcbiAgICByZUZyYWdtZW50ID0gL15cXHMqPChcXHcrfCEpW14+XSo+LyxcbiAgICByZVNpbmdsZVRhZyA9IC9ePChcXHcrKVxccypcXC8/Pig/OjxcXC9cXDE+fCkkLyxcbiAgICByZVNpbXBsZVNlbGVjdG9yID0gL15bXFwuI10/W1xcdy1dKiQvO1xuZnVuY3Rpb24gJChzZWxlY3Rvcikge1xuICB2YXIgY29udGV4dCA9IGFyZ3VtZW50c1sxXSAhPT0gKHZvaWQgMCkgPyBhcmd1bWVudHNbMV0gOiBkb2N1bWVudDtcbiAgdmFyIGNvbGxlY3Rpb247XG4gIGlmICghc2VsZWN0b3IpIHtcbiAgICBjb2xsZWN0aW9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChudWxsKTtcbiAgfSBlbHNlIGlmIChzZWxlY3RvciBpbnN0YW5jZW9mIFdyYXBwZXIpIHtcbiAgICByZXR1cm4gc2VsZWN0b3I7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHNlbGVjdG9yICE9PSAnc3RyaW5nJykge1xuICAgIGNvbGxlY3Rpb24gPSBtYWtlSXRlcmFibGUoc2VsZWN0b3IpO1xuICB9IGVsc2UgaWYgKHJlRnJhZ21lbnQudGVzdChzZWxlY3RvcikpIHtcbiAgICBjb2xsZWN0aW9uID0gY3JlYXRlRnJhZ21lbnQoc2VsZWN0b3IpO1xuICB9IGVsc2Uge1xuICAgIGNvbnRleHQgPSB0eXBlb2YgY29udGV4dCA9PT0gJ3N0cmluZycgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGNvbnRleHQpIDogY29udGV4dC5sZW5ndGggPyBjb250ZXh0WzBdIDogY29udGV4dDtcbiAgICBjb2xsZWN0aW9uID0gcXVlcnlTZWxlY3RvcihzZWxlY3RvciwgY29udGV4dCk7XG4gIH1cbiAgcmV0dXJuICQuaXNOYXRpdmUgPyBjb2xsZWN0aW9uIDogd3JhcChjb2xsZWN0aW9uKTtcbn1cbmZ1bmN0aW9uIGZpbmQoc2VsZWN0b3IpIHtcbiAgcmV0dXJuICQoc2VsZWN0b3IsIHRoaXMpO1xufVxudmFyIG1hdGNoZXMgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBjb250ZXh0ID0gdHlwZW9mIEVsZW1lbnQgIT09ICd1bmRlZmluZWQnID8gRWxlbWVudC5wcm90b3R5cGUgOiBnbG9iYWwsXG4gICAgICBfbWF0Y2hlcyA9IGNvbnRleHQubWF0Y2hlcyB8fCBjb250ZXh0Lm1hdGNoZXNTZWxlY3RvciB8fCBjb250ZXh0Lm1vek1hdGNoZXNTZWxlY3RvciB8fCBjb250ZXh0LndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBjb250ZXh0Lm1zTWF0Y2hlc1NlbGVjdG9yIHx8IGNvbnRleHQub01hdGNoZXNTZWxlY3RvcjtcbiAgcmV0dXJuIGZ1bmN0aW9uKGVsZW1lbnQsIHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIF9tYXRjaGVzLmNhbGwoZWxlbWVudCwgc2VsZWN0b3IpO1xuICB9O1xufSkoKTtcbmZ1bmN0aW9uIHF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IsIGNvbnRleHQpIHtcbiAgdmFyIGlzU2ltcGxlU2VsZWN0b3IgPSByZVNpbXBsZVNlbGVjdG9yLnRlc3Qoc2VsZWN0b3IpO1xuICBpZiAoaXNTaW1wbGVTZWxlY3RvciAmJiAhJC5pc05hdGl2ZSkge1xuICAgIGlmIChzZWxlY3RvclswXSA9PT0gJyMnKSB7XG4gICAgICB2YXIgZWxlbWVudCA9IChjb250ZXh0LmdldEVsZW1lbnRCeUlkID8gY29udGV4dCA6IGRvY3VtZW50KS5nZXRFbGVtZW50QnlJZChzZWxlY3Rvci5zbGljZSgxKSk7XG4gICAgICByZXR1cm4gZWxlbWVudCA/IFtlbGVtZW50XSA6IFtdO1xuICAgIH1cbiAgICBpZiAoc2VsZWN0b3JbMF0gPT09ICcuJykge1xuICAgICAgcmV0dXJuIGNvbnRleHQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShzZWxlY3Rvci5zbGljZSgxKSk7XG4gICAgfVxuICAgIHJldHVybiBjb250ZXh0LmdldEVsZW1lbnRzQnlUYWdOYW1lKHNlbGVjdG9yKTtcbiAgfVxuICByZXR1cm4gY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUZyYWdtZW50KGh0bWwpIHtcbiAgaWYgKHJlU2luZ2xlVGFnLnRlc3QoaHRtbCkpIHtcbiAgICByZXR1cm4gW2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoUmVnRXhwLiQxKV07XG4gIH1cbiAgdmFyIGVsZW1lbnRzID0gW10sXG4gICAgICBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgIGNoaWxkcmVuID0gY29udGFpbmVyLmNoaWxkTm9kZXM7XG4gIGNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sO1xuICBmb3IgKHZhciBpID0gMCxcbiAgICAgIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBlbGVtZW50cy5wdXNoKGNoaWxkcmVuW2ldKTtcbiAgfVxuICByZXR1cm4gZWxlbWVudHM7XG59XG5mdW5jdGlvbiB3cmFwKGNvbGxlY3Rpb24pIHtcbiAgaWYgKCFpc1Byb3RvdHlwZVNldCkge1xuICAgIFdyYXBwZXIucHJvdG90eXBlID0gJC5mbjtcbiAgICBXcmFwcGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFdyYXBwZXI7XG4gICAgaXNQcm90b3R5cGVTZXQgPSB0cnVlO1xuICB9XG4gIHJldHVybiBuZXcgV3JhcHBlcihjb2xsZWN0aW9uKTtcbn1cbmZ1bmN0aW9uIFdyYXBwZXIoY29sbGVjdGlvbikge1xuICB2YXIgaSA9IDAsXG4gICAgICBsZW5ndGggPSBjb2xsZWN0aW9uLmxlbmd0aDtcbiAgZm9yICg7IGkgPCBsZW5ndGg7ICkge1xuICAgIHRoaXNbaV0gPSBjb2xsZWN0aW9uW2krK107XG4gIH1cbiAgdGhpcy5sZW5ndGggPSBsZW5ndGg7XG59XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgJDogJCxcbiAgZmluZDogZmluZCxcbiAgbWF0Y2hlczogbWF0Y2hlcyxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vdXRpbFwiOjExfV0sMTE6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvdXRpbFwiO1xudmFyIGdsb2JhbCA9IG5ldyBGdW5jdGlvbihcInJldHVybiB0aGlzXCIpKCksXG4gICAgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgdG9BcnJheSA9IChmdW5jdGlvbihjb2xsZWN0aW9uKSB7XG4gIHJldHVybiBzbGljZS5jYWxsKGNvbGxlY3Rpb24pO1xufSk7XG52YXIgbWFrZUl0ZXJhYmxlID0gKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgcmV0dXJuIGVsZW1lbnQubm9kZVR5cGUgfHwgZWxlbWVudCA9PT0gd2luZG93ID8gW2VsZW1lbnRdIDogZWxlbWVudDtcbn0pO1xuZnVuY3Rpb24gZWFjaChjb2xsZWN0aW9uLCBjYWxsYmFjaykge1xuICB2YXIgbGVuZ3RoID0gY29sbGVjdGlvbi5sZW5ndGg7XG4gIGlmIChsZW5ndGggIT09IHVuZGVmaW5lZCAmJiBjb2xsZWN0aW9uLm5vZGVUeXBlID09PSB1bmRlZmluZWQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBjYWxsYmFjayhjb2xsZWN0aW9uW2ldLCBpLCBjb2xsZWN0aW9uKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY2FsbGJhY2soY29sbGVjdGlvbiwgMCwgY29sbGVjdGlvbik7XG4gIH1cbiAgcmV0dXJuIGNvbGxlY3Rpb247XG59XG5mdW5jdGlvbiBleHRlbmQodGFyZ2V0KSB7XG4gIGZvciAodmFyIHNvdXJjZXMgPSBbXSxcbiAgICAgICRfXzAgPSAxOyAkX18wIDwgYXJndW1lbnRzLmxlbmd0aDsgJF9fMCsrKVxuICAgIHNvdXJjZXNbJF9fMCAtIDFdID0gYXJndW1lbnRzWyRfXzBdO1xuICBzb3VyY2VzLmZvckVhY2goZnVuY3Rpb24oc3JjKSB7XG4gICAgaWYgKHNyYykge1xuICAgICAgZm9yICh2YXIgcHJvcCBpbiBzcmMpIHtcbiAgICAgICAgdGFyZ2V0W3Byb3BdID0gc3JjW3Byb3BdO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldHVybiB0YXJnZXQ7XG59XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2xvYmFsOiBnbG9iYWwsXG4gIHRvQXJyYXk6IHRvQXJyYXksXG4gIG1ha2VJdGVyYWJsZTogbWFrZUl0ZXJhYmxlLFxuICBlYWNoOiBlYWNoLFxuICBleHRlbmQ6IGV4dGVuZCxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHt9XX0se30sWzhdKVxuKDgpXG59KTtcbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwidmFyICQgICAgICAgPSB3aW5kb3cualF1ZXJ5IHx8IHJlcXVpcmUoJ2RvbXRhc3RpYycpXG4sICAgbmF2ICAgICA9IHJlcXVpcmUoJy4vbW9kdWxlcy9uYXYnKVxuLCAgIGV2ZW50cyAgPSByZXF1aXJlKCcuL21vZHVsZXMvZXZlbnRzJylcbiwgICBjb250ZW50ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2NvbnRlbnQnKTtcblxuY29udGVudC5pbml0KCk7XG5uYXYuaW5pdCgpO1xuZXZlbnRzKCk7XG5cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyICQgPSB3aW5kb3cualF1ZXJ5IHx8IHJlcXVpcmUoJ2RvbXRhc3RpYycpO1xuXG52YXIgJGJvZHkgPSAkKCdib2R5Jyk7XG5cbnZhciBjb250ZW50ID0ge1xuXG4gIHdyYXBDb250ZW50OiBmdW5jdGlvbigpIHtcbiAgICAkYm9keS5odG1sKCc8ZGl2IGlkPVwiaWNlLWNvbnRlbnRcIj4nICsgJGJvZHkuaHRtbCgpICsgJzwvZGl2PicpO1xuICAgIHJldHVybiB0aGlzLm1ha2VFZGl0YWJsZSgkYm9keSk7XG4gIH0sXG5cbiAgbWFrZUVkaXRhYmxlOiBmdW5jdGlvbihlbCkge1xuICAgIHJldHVybiBlbC5hdHRyKCdjb250ZW50ZWRpdGFibGUnLCB0cnVlKTtcbiAgfSxcblxuICByZW1vdmVJY2U6IGZ1bmN0aW9uKCkge1xuICAgICRib2R5Lmh0bWwoJCgnI2ljZS1jb250ZW50JykuaHRtbCgpKTtcbiAgICAkYm9keS5yZW1vdmVBdHRyKCdjb250ZW50ZWRpdGFibGUnKTtcbiAgfSxcblxuICBnZXRDb250ZW50OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJCgnI2ljZS1jb250ZW50JykuaHRtbCgpO1xuICB9LFxuXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMud3JhcENvbnRlbnQoKTtcbiAgfVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciAkICAgICAgID0gd2luZG93LmpRdWVyeSB8fCByZXF1aXJlKCdkb210YXN0aWMnKVxuLCAgIG5hdiAgICAgPSByZXF1aXJlKCcuL25hdicpXG4sICAgY29udGVudCA9IHJlcXVpcmUoJy4vY29udGVudCcpXG4sICAgaHRtbCAgICA9IHJlcXVpcmUoJy4vaHRtbCcpO1xuXG52YXIgZXZlbnRzID0gZnVuY3Rpb24oKSB7XG5cbiAgJCgnI2ljZS1vZmYnKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnRlbnQucmVtb3ZlSWNlKCk7XG4gIH0pO1xuXG4gICQoJyNpY2UtZGlmZicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xuXG4gICQoJyNpY2UtdG9nZ2xlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB3aW5kb3cuY29uc29sZS5sb2coaHRtbC5nZXRIVE1MKCkpO1xuICB9KTtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBldmVudHM7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciAkID0gd2luZG93LmpRdWVyeSB8fCByZXF1aXJlKCdkb210YXN0aWMnKTtcblxuLy8gc2V0IG5hdlRlbXBsYXRlXG52YXIgbmF2VGVtcGxhdGUgPSAgJzxsaSBpZD1cImljZS1vZmZcIj5PZmY8L2xpPic7XG4gICAgbmF2VGVtcGxhdGUgKz0gJzxsaSBpZD1cImljZS1kaWZmXCI+RGlmZjwvbGk+JztcbiAgICBuYXZUZW1wbGF0ZSArPSAnPGxpIGlkPVwiaWNlLXRvZ2dsZVwiPk9yaWdpbmFsPC9saT4nO1xuXG52YXIgaHRtbCA9IHtcblxuICBuYXZUZW1wbGF0ZTogbmF2VGVtcGxhdGUsXG5cbiAgY3NzTG9jYXRpb246ICc8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgaHJlZj1cImluZGV4LmNzc1wiIHR5cGU9XCJ0ZXh0L2Nzc1wiIC8+JyxcblxuICBnZXRIVE1MOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJCgnYm9keScpLmh0bWwoKTtcbiAgfVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGh0bWw7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciAkICAgID0gd2luZG93LmpRdWVyeSB8fCByZXF1aXJlKCdkb210YXN0aWMnKVxuLCAgIGh0bWwgPSByZXF1aXJlKCcuL2h0bWwnKTtcblxudmFyIGNzc0xvY2F0aW9uID0gaHRtbC5jc3NMb2NhdGlvbjtcbnZhciBib2R5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVsgMCBdO1xuXG52YXIgbmF2ID0ge1xuXG4gIGNyZWF0ZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICBlbC5pbm5lckhUTUwgPSBodG1sLm5hdlRlbXBsYXRlO1xuICAgIGVsLnNldEF0dHJpYnV0ZSgnaWQnLCdpY2UtbmF2Jyk7XG4gICAgZWwuc2V0QXR0cmlidXRlKCdjb250ZW50ZWRpdGFibGUnLCBmYWxzZSk7XG4gICAgdGhpcy5zdHlsZShlbCk7XG4gIH0sXG5cbiAgc3R5bGU6IGZ1bmN0aW9uKGVsKSB7XG4gICAgJCgnaGVhZCcpLmFwcGVuZChjc3NMb2NhdGlvbik7XG4gICAgdGhpcy5hcHBlbmQoZWwpO1xuICB9LFxuXG4gIGFwcGVuZDogZnVuY3Rpb24oZWwpIHtcbiAgICBib2R5LmFwcGVuZENoaWxkKGVsKTtcbiAgfSxcblxuICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNyZWF0ZSgpO1xuICB9XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbmF2O1xuIl19

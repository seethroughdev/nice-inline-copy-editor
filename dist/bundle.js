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
var nav     = require('./modules/nav')
,   events  = require('./modules/events')
,   content = require('./modules/content');

content.init();
nav.init();
events();


},{"./modules/content":3,"./modules/events":4,"./modules/nav":6}],3:[function(require,module,exports){
'use strict';

var $ = window.jQuery || require('domtastic');

var $body = $('body');

var content = {

  init: function() {
    return this.wrapContent();
  },

  wrapContent: function() {
    $body.html('<div id="nice-content">' + $body.html() + '</div>');
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
  }

};

module.exports = content;

},{"domtastic":1}],4:[function(require,module,exports){
'use strict';

var $       = window.jQuery || require('domtastic')
,   nav     = require('./nav')
,   content = require('./content');

var events = function() {

  $('#nice-off').on('click', function(e) {
    e.preventDefault();
    content.removeNice();
  });

  $('#nice-diff').on('click', function(e) {
    e.preventDefault();
  });

  $('#nice-toggle').on('click', function(e) {
    e.preventDefault();
    window.console.log(content.getHTML());
  });

};

module.exports = events;

},{"./content":3,"./nav":6,"domtastic":1}],5:[function(require,module,exports){
'use strict';

// set navTemplate
var navTemplate =  '<li id="nice-off">Off</li>';
    navTemplate += '<li id="nice-diff">Diff</li>';
    navTemplate += '<li id="nice-toggle">Original</li>';

var html = {

  navTemplate: navTemplate,

  cssLocation: '<link rel="stylesheet" href="index.css" type="text/css" />'

};

module.exports = html;

},{}],6:[function(require,module,exports){
'use strict';

var $    = window.jQuery || require('domtastic')
,   html = require('./html');

var body = document.getElementsByTagName('body')[ 0 ];

var nav = {

  init: function() {
    this.create();
  },

  create: function() {
    var el = document.createElement('ul');
    el.innerHTML = html.navTemplate;
    el.setAttribute('id','nice-nav');
    el.setAttribute('contenteditable', false);
    this.style(el);
  },

  style: function(el) {
    $('head').append(html.cssLocation);
    this.append(el);
  },

  append: function(el) {
    body.appendChild(el);
  }

};

module.exports = nav;

},{"./html":5,"domtastic":1}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVm9sdW1lcy9TZXNzaW9ucy93ZWIvZGV2L2NvcHktZWRpdG9yL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVm9sdW1lcy9TZXNzaW9ucy93ZWIvZGV2L2NvcHktZWRpdG9yL25vZGVfbW9kdWxlcy9kb210YXN0aWMvZG9tdGFzdGljLmpzIiwiL1ZvbHVtZXMvU2Vzc2lvbnMvd2ViL2Rldi9jb3B5LWVkaXRvci9zcmMvanMvaW5kZXguanMiLCIvVm9sdW1lcy9TZXNzaW9ucy93ZWIvZGV2L2NvcHktZWRpdG9yL3NyYy9qcy9tb2R1bGVzL2NvbnRlbnQuanMiLCIvVm9sdW1lcy9TZXNzaW9ucy93ZWIvZGV2L2NvcHktZWRpdG9yL3NyYy9qcy9tb2R1bGVzL2V2ZW50cy5qcyIsIi9Wb2x1bWVzL1Nlc3Npb25zL3dlYi9kZXYvY29weS1lZGl0b3Ivc3JjL2pzL21vZHVsZXMvaHRtbC5qcyIsIi9Wb2x1bWVzL1Nlc3Npb25zL3dlYi9kZXYvY29weS1lZGl0b3Ivc3JjL2pzL21vZHVsZXMvbmF2LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4hZnVuY3Rpb24oX2Upe3ZhciBlPWZ1bmN0aW9uKCl7cmV0dXJuIF9lKClbXCJkZWZhdWx0XCJdfTtpZihcIm9iamVjdFwiPT10eXBlb2YgZXhwb3J0cyltb2R1bGUuZXhwb3J0cz1lKCk7ZWxzZSBpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQpZGVmaW5lKGUpO2Vsc2V7dmFyIGY7XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz9mPXdpbmRvdzpcInVuZGVmaW5lZFwiIT10eXBlb2YgZ2xvYmFsP2Y9Z2xvYmFsOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmJiYoZj1zZWxmKSxmLiQ9ZSgpfX0oZnVuY3Rpb24oKXt2YXIgZGVmaW5lLG1vZHVsZSxleHBvcnRzO3JldHVybiAoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9hcGlcIjtcbnZhciBleHRlbmQgPSBfZGVyZXFfKCcuL3V0aWwnKS5leHRlbmQ7XG52YXIgYXBpID0ge30sXG4gICAgYXBpTm9kZUxpc3QgPSB7fSxcbiAgICAkID0ge307XG52YXIgYXJyYXkgPSBfZGVyZXFfKCcuL2FycmF5Jyk7XG52YXIgYXR0ciA9IF9kZXJlcV8oJy4vYXR0cicpO1xudmFyIGNsYXNzTmFtZSA9IF9kZXJlcV8oJy4vY2xhc3MnKTtcbnZhciBkb20gPSBfZGVyZXFfKCcuL2RvbScpO1xudmFyIGV2ZW50ID0gX2RlcmVxXygnLi9ldmVudCcpO1xudmFyIGh0bWwgPSBfZGVyZXFfKCcuL2h0bWwnKTtcbnZhciBzZWxlY3RvciA9IF9kZXJlcV8oJy4vc2VsZWN0b3InKTtcbmlmIChzZWxlY3RvciAhPT0gdW5kZWZpbmVkKSB7XG4gICQgPSBzZWxlY3Rvci4kO1xuICAkLm1hdGNoZXMgPSBzZWxlY3Rvci5tYXRjaGVzO1xuICBhcGkuZmluZCA9IHNlbGVjdG9yLmZpbmQ7XG59XG5leHRlbmQoJCk7XG52YXIgbm9jb25mbGljdCA9IF9kZXJlcV8oJy4vbm9jb25mbGljdCcpO1xuZXh0ZW5kKCQsIG5vY29uZmxpY3QpO1xuZXh0ZW5kKGFwaSwgYXJyYXksIGF0dHIsIGNsYXNzTmFtZSwgZG9tLCBldmVudCwgaHRtbCk7XG5leHRlbmQoYXBpTm9kZUxpc3QsIGFycmF5KTtcbiQudmVyc2lvbiA9ICcwLjcuMCc7XG4kLmV4dGVuZCA9IGV4dGVuZDtcbiQuZm4gPSBhcGk7XG4kLmZuTGlzdCA9IGFwaU5vZGVMaXN0O1xudmFyICRfX2RlZmF1bHQgPSAkO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGRlZmF1bHQ6ICRfX2RlZmF1bHQsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL2FycmF5XCI6MixcIi4vYXR0clwiOjMsXCIuL2NsYXNzXCI6NCxcIi4vZG9tXCI6NSxcIi4vZXZlbnRcIjo2LFwiLi9odG1sXCI6NyxcIi4vbm9jb25mbGljdFwiOjksXCIuL3NlbGVjdG9yXCI6MTAsXCIuL3V0aWxcIjoxMX1dLDI6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvYXJyYXlcIjtcbnZhciBfZWFjaCA9IF9kZXJlcV8oJy4vdXRpbCcpLmVhY2g7XG52YXIgJF9fMCA9IF9kZXJlcV8oJy4vc2VsZWN0b3InKSxcbiAgICAkID0gJF9fMC4kLFxuICAgIG1hdGNoZXMgPSAkX18wLm1hdGNoZXM7XG52YXIgQXJyYXlQcm90byA9IEFycmF5LnByb3RvdHlwZTtcbmZ1bmN0aW9uIGZpbHRlcihzZWxlY3Rvcikge1xuICB2YXIgY2FsbGJhY2sgPSB0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicgPyBzZWxlY3RvciA6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gbWF0Y2hlcyhlbGVtZW50LCBzZWxlY3Rvcik7XG4gIH07XG4gIHJldHVybiAkKEFycmF5UHJvdG8uZmlsdGVyLmNhbGwodGhpcywgY2FsbGJhY2spKTtcbn1cbmZ1bmN0aW9uIGVhY2goY2FsbGJhY2spIHtcbiAgcmV0dXJuIF9lYWNoKHRoaXMsIGNhbGxiYWNrKTtcbn1cbnZhciBmb3JFYWNoID0gZWFjaDtcbnZhciBtYXAgPSBBcnJheVByb3RvLm1hcDtcbmZ1bmN0aW9uIHJldmVyc2UoKSB7XG4gIHZhciBlbGVtZW50cyA9IEFycmF5UHJvdG8uc2xpY2UuY2FsbCh0aGlzKTtcbiAgcmV0dXJuICQoQXJyYXlQcm90by5yZXZlcnNlLmNhbGwoZWxlbWVudHMpKTtcbn1cbnZhciBldmVyeSA9IEFycmF5UHJvdG8uZXZlcnk7XG52YXIgc29tZSA9IEFycmF5UHJvdG8uc29tZTtcbnZhciBpbmRleE9mID0gQXJyYXlQcm90by5pbmRleE9mO1xuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGVhY2g6IGVhY2gsXG4gIGV2ZXJ5OiBldmVyeSxcbiAgZmlsdGVyOiBmaWx0ZXIsXG4gIGZvckVhY2g6IGZvckVhY2gsXG4gIGluZGV4T2Y6IGluZGV4T2YsXG4gIG1hcDogbWFwLFxuICByZXZlcnNlOiByZXZlcnNlLFxuICBzb21lOiBzb21lLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi9zZWxlY3RvclwiOjEwLFwiLi91dGlsXCI6MTF9XSwzOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL2F0dHJcIjtcbnZhciBlYWNoID0gX2RlcmVxXygnLi91dGlsJykuZWFjaDtcbmZ1bmN0aW9uIGF0dHIoa2V5LCB2YWx1ZSkge1xuICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgIHZhciBlbGVtZW50ID0gdGhpcy5ub2RlVHlwZSA/IHRoaXMgOiB0aGlzWzBdO1xuICAgIHJldHVybiBlbGVtZW50ID8gZWxlbWVudC5nZXRBdHRyaWJ1dGUoa2V5KSA6IHVuZGVmaW5lZDtcbiAgfVxuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGZvciAodmFyIGF0dHIgaW4ga2V5KSB7XG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKGF0dHIsIGtleVthdHRyXSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gcmVtb3ZlQXR0cihrZXkpIHtcbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufVxuO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGF0dHI6IGF0dHIsXG4gIHJlbW92ZUF0dHI6IHJlbW92ZUF0dHIsXG4gIF9fZXNNb2R1bGU6IHRydWVcbn07XG5cblxufSx7XCIuL3V0aWxcIjoxMX1dLDQ6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvY2xhc3NcIjtcbnZhciAkX18wID0gX2RlcmVxXygnLi91dGlsJyksXG4gICAgbWFrZUl0ZXJhYmxlID0gJF9fMC5tYWtlSXRlcmFibGUsXG4gICAgZWFjaCA9ICRfXzAuZWFjaDtcbmZ1bmN0aW9uIGFkZENsYXNzKHZhbHVlKSB7XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCh2YWx1ZSk7XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIHJlbW92ZUNsYXNzKHZhbHVlKSB7XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSh2YWx1ZSk7XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIHRvZ2dsZUNsYXNzKHZhbHVlKSB7XG4gIGVhY2godGhpcywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSh2YWx1ZSk7XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIGhhc0NsYXNzKHZhbHVlKSB7XG4gIHJldHVybiBtYWtlSXRlcmFibGUodGhpcykuc29tZShmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgcmV0dXJuIGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKHZhbHVlKTtcbiAgfSk7XG59XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWRkQ2xhc3M6IGFkZENsYXNzLFxuICByZW1vdmVDbGFzczogcmVtb3ZlQ2xhc3MsXG4gIHRvZ2dsZUNsYXNzOiB0b2dnbGVDbGFzcyxcbiAgaGFzQ2xhc3M6IGhhc0NsYXNzLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi91dGlsXCI6MTF9XSw1OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL2RvbVwiO1xudmFyIHRvQXJyYXkgPSBfZGVyZXFfKCcuL3V0aWwnKS50b0FycmF5O1xuZnVuY3Rpb24gYXBwZW5kKGVsZW1lbnQpIHtcbiAgaWYgKHRoaXMgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsIGVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBlbGVtZW50cyA9IGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlTGlzdCA/IHRvQXJyYXkoZWxlbWVudCkgOiBlbGVtZW50O1xuICAgICAgICBlbGVtZW50cy5mb3JFYWNoKHRoaXMuYXBwZW5kQ2hpbGQuYmluZCh0aGlzKSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgd2hpbGUgKGwtLSkge1xuICAgICAgdmFyIGVsbSA9IGwgPT09IDAgPyBlbGVtZW50IDogX2Nsb25lKGVsZW1lbnQpO1xuICAgICAgYXBwZW5kLmNhbGwodGhpc1tsXSwgZWxtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBwcmVwZW5kKGVsZW1lbnQpIHtcbiAgaWYgKHRoaXMgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyYmVnaW4nLCBlbGVtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAgIHRoaXMuaW5zZXJ0QmVmb3JlKGVsZW1lbnQsIHRoaXMuZmlyc3RDaGlsZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZWxlbWVudHMgPSBlbGVtZW50IGluc3RhbmNlb2YgTm9kZUxpc3QgPyB0b0FycmF5KGVsZW1lbnQpIDogZWxlbWVudDtcbiAgICAgICAgZWxlbWVudHMucmV2ZXJzZSgpLmZvckVhY2gocHJlcGVuZC5iaW5kKHRoaXMpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICB3aGlsZSAobC0tKSB7XG4gICAgICB2YXIgZWxtID0gbCA9PT0gMCA/IGVsZW1lbnQgOiBfY2xvbmUoZWxlbWVudCk7XG4gICAgICBwcmVwZW5kLmNhbGwodGhpc1tsXSwgZWxtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBiZWZvcmUoZWxlbWVudCkge1xuICBpZiAodGhpcyBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlYmVnaW4nLCBlbGVtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAgIHRoaXMucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWxlbWVudCwgdGhpcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZWxlbWVudHMgPSBlbGVtZW50IGluc3RhbmNlb2YgTm9kZUxpc3QgPyB0b0FycmF5KGVsZW1lbnQpIDogZWxlbWVudDtcbiAgICAgICAgZWxlbWVudHMuZm9yRWFjaChiZWZvcmUuYmluZCh0aGlzKSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgd2hpbGUgKGwtLSkge1xuICAgICAgdmFyIGVsbSA9IGwgPT09IDAgPyBlbGVtZW50IDogX2Nsb25lKGVsZW1lbnQpO1xuICAgICAgYmVmb3JlLmNhbGwodGhpc1tsXSwgZWxtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBhZnRlcihlbGVtZW50KSB7XG4gIGlmICh0aGlzIGluc3RhbmNlb2YgTm9kZSkge1xuICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRoaXMuaW5zZXJ0QWRqYWNlbnRIVE1MKCdhZnRlcmVuZCcsIGVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgdGhpcy5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbGVtZW50LCB0aGlzLm5leHRTaWJsaW5nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBlbGVtZW50cyA9IGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlTGlzdCA/IHRvQXJyYXkoZWxlbWVudCkgOiBlbGVtZW50O1xuICAgICAgICBlbGVtZW50cy5yZXZlcnNlKCkuZm9yRWFjaChhZnRlci5iaW5kKHRoaXMpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICB3aGlsZSAobC0tKSB7XG4gICAgICB2YXIgZWxtID0gbCA9PT0gMCA/IGVsZW1lbnQgOiBfY2xvbmUoZWxlbWVudCk7XG4gICAgICBhZnRlci5jYWxsKHRoaXNbbF0sIGVsbSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gY2xvbmUoKSB7XG4gIHJldHVybiAkKF9jbG9uZSh0aGlzKSk7XG59XG5mdW5jdGlvbiBfY2xvbmUoZWxlbWVudCkge1xuICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH0gZWxzZSBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICByZXR1cm4gZWxlbWVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gIH0gZWxzZSBpZiAoJ2xlbmd0aCcgaW4gZWxlbWVudCkge1xuICAgIHJldHVybiBbXS5tYXAuY2FsbChlbGVtZW50LCBmdW5jdGlvbihlbCkge1xuICAgICAgcmV0dXJuIGVsLmNsb25lTm9kZSh0cnVlKTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gZWxlbWVudDtcbn1cbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBhcHBlbmQ6IGFwcGVuZCxcbiAgcHJlcGVuZDogcHJlcGVuZCxcbiAgYmVmb3JlOiBiZWZvcmUsXG4gIGFmdGVyOiBhZnRlcixcbiAgY2xvbmU6IGNsb25lLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi91dGlsXCI6MTF9XSw2OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIF9fbW9kdWxlTmFtZSA9IFwic3JjL2V2ZW50XCI7XG52YXIgJF9fMCA9IF9kZXJlcV8oJy4vdXRpbCcpLFxuICAgIGdsb2JhbCA9ICRfXzAuZ2xvYmFsLFxuICAgIGVhY2ggPSAkX18wLmVhY2g7XG52YXIgbWF0Y2hlcyA9IF9kZXJlcV8oJy4vc2VsZWN0b3InKS5tYXRjaGVzO1xuZnVuY3Rpb24gb24oZXZlbnROYW1lLCBzZWxlY3RvciwgaGFuZGxlciwgdXNlQ2FwdHVyZSkge1xuICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaGFuZGxlciA9IHNlbGVjdG9yO1xuICAgIHNlbGVjdG9yID0gbnVsbDtcbiAgfVxuICB2YXIgcGFydHMgPSBldmVudE5hbWUuc3BsaXQoJy4nKTtcbiAgZXZlbnROYW1lID0gcGFydHNbMF0gfHwgbnVsbDtcbiAgdmFyIG5hbWVzcGFjZSA9IHBhcnRzWzFdIHx8IG51bGw7XG4gIHZhciBldmVudExpc3RlbmVyID0gcHJveHlIYW5kbGVyKGhhbmRsZXIpO1xuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBpZiAoc2VsZWN0b3IpIHtcbiAgICAgIGV2ZW50TGlzdGVuZXIgPSBkZWxlZ2F0ZUhhbmRsZXIuYmluZChlbGVtZW50LCBzZWxlY3RvciwgaGFuZGxlcik7XG4gICAgfVxuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGV2ZW50TGlzdGVuZXIsIHVzZUNhcHR1cmUgfHwgZmFsc2UpO1xuICAgIGdldEhhbmRsZXJzKGVsZW1lbnQpLnB1c2goe1xuICAgICAgZXZlbnROYW1lOiBldmVudE5hbWUsXG4gICAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgICAgZXZlbnRMaXN0ZW5lcjogZXZlbnRMaXN0ZW5lcixcbiAgICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcbiAgICAgIG5hbWVzcGFjZTogbmFtZXNwYWNlXG4gICAgfSk7XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIG9mZihldmVudE5hbWUsIHNlbGVjdG9yLCBoYW5kbGVyLCB1c2VDYXB0dXJlKSB7XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICBoYW5kbGVyID0gc2VsZWN0b3I7XG4gICAgc2VsZWN0b3IgPSBudWxsO1xuICB9XG4gIGlmIChldmVudE5hbWUpIHtcbiAgICB2YXIgcGFydHMgPSBldmVudE5hbWUuc3BsaXQoJy4nKTtcbiAgICBldmVudE5hbWUgPSBwYXJ0c1swXTtcbiAgICB2YXIgbmFtZXNwYWNlID0gcGFydHNbMV07XG4gIH1cbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgdmFyIGhhbmRsZXJzID0gZ2V0SGFuZGxlcnMoZWxlbWVudCk7XG4gICAgaWYgKCFldmVudE5hbWUgJiYgIW5hbWVzcGFjZSAmJiAhc2VsZWN0b3IgJiYgIWhhbmRsZXIpIHtcbiAgICAgIGVhY2goaGFuZGxlcnMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGl0ZW0uZXZlbnROYW1lLCBpdGVtLmV2ZW50TGlzdGVuZXIsIHVzZUNhcHR1cmUgfHwgZmFsc2UpO1xuICAgICAgfSk7XG4gICAgICBjbGVhckhhbmRsZXJzKGVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlYWNoKGhhbmRsZXJzLmZpbHRlcihmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHJldHVybiAoKCFldmVudE5hbWUgfHwgaXRlbS5ldmVudE5hbWUgPT09IGV2ZW50TmFtZSkgJiYgKCFuYW1lc3BhY2UgfHwgaXRlbS5uYW1lc3BhY2UgPT09IG5hbWVzcGFjZSkgJiYgKCFoYW5kbGVyIHx8IGl0ZW0uaGFuZGxlciA9PT0gaGFuZGxlcikgJiYgKCFzZWxlY3RvciB8fCBpdGVtLnNlbGVjdG9yID09PSBzZWxlY3RvcikpO1xuICAgICAgfSksIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGl0ZW0uZXZlbnROYW1lLCBpdGVtLmV2ZW50TGlzdGVuZXIsIHVzZUNhcHR1cmUgfHwgZmFsc2UpO1xuICAgICAgICBoYW5kbGVycy5zcGxpY2UoaGFuZGxlcnMuaW5kZXhPZihpdGVtKSwgMSk7XG4gICAgICB9KTtcbiAgICAgIGlmIChoYW5kbGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY2xlYXJIYW5kbGVycyhlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIGRlbGVnYXRlKHNlbGVjdG9yLCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgcmV0dXJuIG9uLmNhbGwodGhpcywgZXZlbnROYW1lLCBzZWxlY3RvciwgaGFuZGxlcik7XG59XG5mdW5jdGlvbiB1bmRlbGVnYXRlKHNlbGVjdG9yLCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgcmV0dXJuIG9mZi5jYWxsKHRoaXMsIGV2ZW50TmFtZSwgc2VsZWN0b3IsIGhhbmRsZXIpO1xufVxuZnVuY3Rpb24gdHJpZ2dlcih0eXBlKSB7XG4gIHZhciBwYXJhbXMgPSBhcmd1bWVudHNbMl0gIT09ICh2b2lkIDApID8gYXJndW1lbnRzWzJdIDoge307XG4gIHBhcmFtcy5idWJibGVzID0gdHlwZW9mIHBhcmFtcy5idWJibGVzID09PSAnYm9vbGVhbicgPyBwYXJhbXMuYnViYmxlcyA6IHRydWU7XG4gIHBhcmFtcy5jYW5jZWxhYmxlID0gdHlwZW9mIHBhcmFtcy5jYW5jZWxhYmxlID09PSAnYm9vbGVhbicgPyBwYXJhbXMuY2FuY2VsYWJsZSA6IHRydWU7XG4gIHBhcmFtcy5wcmV2ZW50RGVmYXVsdCA9IHR5cGVvZiBwYXJhbXMucHJldmVudERlZmF1bHQgPT09ICdib29sZWFuJyA/IHBhcmFtcy5wcmV2ZW50RGVmYXVsdCA6IGZhbHNlO1xuICBwYXJhbXMuZGV0YWlsID0gZGF0YTtcbiAgdmFyIGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KHR5cGUsIHBhcmFtcyk7XG4gIGV2ZW50Ll9wcmV2ZW50RGVmYXVsdCA9IHBhcmFtcy5wcmV2ZW50RGVmYXVsdDtcbiAgZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgaWYgKCFwYXJhbXMuYnViYmxlcyB8fCBpc0V2ZW50QnViYmxpbmdJbkRldGFjaGVkVHJlZSB8fCBpc0F0dGFjaGVkVG9Eb2N1bWVudChlbGVtZW50KSkge1xuICAgICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHJpZ2dlckZvclBhdGgoZWxlbWVudCwgdHlwZSwgcGFyYW1zKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIHRyaWdnZXJIYW5kbGVyKHR5cGUpIHtcbiAgaWYgKHRoaXNbMF0pIHtcbiAgICB0cmlnZ2VyLmNhbGwodGhpc1swXSwgdHlwZSwge1xuICAgICAgYnViYmxlczogZmFsc2UsXG4gICAgICBwcmV2ZW50RGVmYXVsdDogdHJ1ZVxuICAgIH0pO1xuICB9XG59XG5mdW5jdGlvbiByZWFkeShoYW5kbGVyKSB7XG4gIGlmICgvY29tcGxldGV8bG9hZGVkfGludGVyYWN0aXZlLy50ZXN0KGRvY3VtZW50LnJlYWR5U3RhdGUpICYmIGRvY3VtZW50LmJvZHkpIHtcbiAgICBoYW5kbGVyKCk7XG4gIH0gZWxzZSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGhhbmRsZXIsIGZhbHNlKTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIGlzQXR0YWNoZWRUb0RvY3VtZW50KGVsZW1lbnQpIHtcbiAgaWYgKGVsZW1lbnQgPT09IHdpbmRvdyB8fCBlbGVtZW50ID09PSBkb2N1bWVudCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHZhciBjb250YWluZXIgPSBlbGVtZW50Lm93bmVyRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICBpZiAoY29udGFpbmVyLmNvbnRhaW5zKSB7XG4gICAgcmV0dXJuIGNvbnRhaW5lci5jb250YWlucyhlbGVtZW50KTtcbiAgfSBlbHNlIGlmIChjb250YWluZXIuY29tcGFyZURvY3VtZW50UG9zaXRpb24pIHtcbiAgICByZXR1cm4gIShjb250YWluZXIuY29tcGFyZURvY3VtZW50UG9zaXRpb24oZWxlbWVudCkgJiBOb2RlLkRPQ1VNRU5UX1BPU0lUSU9OX0RJU0NPTk5FQ1RFRCk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gdHJpZ2dlckZvclBhdGgoZWxlbWVudCwgdHlwZSkge1xuICB2YXIgcGFyYW1zID0gYXJndW1lbnRzWzJdICE9PSAodm9pZCAwKSA/IGFyZ3VtZW50c1syXSA6IHt9O1xuICBwYXJhbXMuYnViYmxlcyA9IGZhbHNlO1xuICB2YXIgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQodHlwZSwgcGFyYW1zKTtcbiAgZXZlbnQuX3RhcmdldCA9IGVsZW1lbnQ7XG4gIGRvIHtcbiAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICB9IHdoaWxlIChlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlKTtcbn1cbnZhciBldmVudEtleVByb3AgPSAnX19kb210YXN0aWNfZXZlbnRfXyc7XG52YXIgaWQgPSAxO1xudmFyIGhhbmRsZXJzID0ge307XG52YXIgdW51c2VkS2V5cyA9IFtdO1xuZnVuY3Rpb24gZ2V0SGFuZGxlcnMoZWxlbWVudCkge1xuICBpZiAoIWVsZW1lbnRbZXZlbnRLZXlQcm9wXSkge1xuICAgIGVsZW1lbnRbZXZlbnRLZXlQcm9wXSA9IHVudXNlZEtleXMubGVuZ3RoID09PSAwID8gKytpZCA6IHVudXNlZEtleXMucG9wKCk7XG4gIH1cbiAgdmFyIGtleSA9IGVsZW1lbnRbZXZlbnRLZXlQcm9wXTtcbiAgcmV0dXJuIGhhbmRsZXJzW2tleV0gfHwgKGhhbmRsZXJzW2tleV0gPSBbXSk7XG59XG5mdW5jdGlvbiBjbGVhckhhbmRsZXJzKGVsZW1lbnQpIHtcbiAgdmFyIGtleSA9IGVsZW1lbnRbZXZlbnRLZXlQcm9wXTtcbiAgaWYgKGhhbmRsZXJzW2tleV0pIHtcbiAgICBoYW5kbGVyc1trZXldID0gbnVsbDtcbiAgICBlbGVtZW50W2tleV0gPSBudWxsO1xuICAgIHVudXNlZEtleXMucHVzaChrZXkpO1xuICB9XG59XG5mdW5jdGlvbiBwcm94eUhhbmRsZXIoaGFuZGxlcikge1xuICByZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBoYW5kbGVyKGF1Z21lbnRFdmVudChldmVudCksIGV2ZW50LmRldGFpbCk7XG4gIH07XG59XG52YXIgYXVnbWVudEV2ZW50ID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgZXZlbnRNZXRob2RzID0ge1xuICAgIHByZXZlbnREZWZhdWx0OiAnaXNEZWZhdWx0UHJldmVudGVkJyxcbiAgICBzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb246ICdpc0ltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZCcsXG4gICAgc3RvcFByb3BhZ2F0aW9uOiAnaXNQcm9wYWdhdGlvblN0b3BwZWQnXG4gIH0sXG4gICAgICBub29wID0gKGZ1bmN0aW9uKCkge30pLFxuICAgICAgcmV0dXJuVHJ1ZSA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KSxcbiAgICAgIHJldHVybkZhbHNlID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KTtcbiAgcmV0dXJuIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgZm9yICh2YXIgbWV0aG9kTmFtZSBpbiBldmVudE1ldGhvZHMpIHtcbiAgICAgIChmdW5jdGlvbihtZXRob2ROYW1lLCB0ZXN0TWV0aG9kTmFtZSwgb3JpZ2luYWxNZXRob2QpIHtcbiAgICAgICAgZXZlbnRbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB0aGlzW3Rlc3RNZXRob2ROYW1lXSA9IHJldHVyblRydWU7XG4gICAgICAgICAgcmV0dXJuIG9yaWdpbmFsTWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIGV2ZW50W3Rlc3RNZXRob2ROYW1lXSA9IHJldHVybkZhbHNlO1xuICAgICAgfShtZXRob2ROYW1lLCBldmVudE1ldGhvZHNbbWV0aG9kTmFtZV0sIGV2ZW50W21ldGhvZE5hbWVdIHx8IG5vb3ApKTtcbiAgICB9XG4gICAgaWYgKGV2ZW50Ll9wcmV2ZW50RGVmYXVsdCkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gICAgcmV0dXJuIGV2ZW50O1xuICB9O1xufSkoKTtcbmZ1bmN0aW9uIGRlbGVnYXRlSGFuZGxlcihzZWxlY3RvciwgaGFuZGxlciwgZXZlbnQpIHtcbiAgdmFyIGV2ZW50VGFyZ2V0ID0gZXZlbnQuX3RhcmdldCB8fCBldmVudC50YXJnZXQ7XG4gIGlmIChtYXRjaGVzKGV2ZW50VGFyZ2V0LCBzZWxlY3RvcikpIHtcbiAgICBpZiAoIWV2ZW50LmN1cnJlbnRUYXJnZXQpIHtcbiAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQgPSBldmVudFRhcmdldDtcbiAgICB9XG4gICAgaGFuZGxlci5jYWxsKGV2ZW50VGFyZ2V0LCBldmVudCk7XG4gIH1cbn1cbihmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gQ3VzdG9tRXZlbnQoZXZlbnQpIHtcbiAgICB2YXIgcGFyYW1zID0gYXJndW1lbnRzWzFdICE9PSAodm9pZCAwKSA/IGFyZ3VtZW50c1sxXSA6IHtcbiAgICAgIGJ1YmJsZXM6IGZhbHNlLFxuICAgICAgY2FuY2VsYWJsZTogZmFsc2UsXG4gICAgICBkZXRhaWw6IHVuZGVmaW5lZFxuICAgIH07XG4gICAgdmFyIGN1c3RvbUV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gICAgY3VzdG9tRXZlbnQuaW5pdEN1c3RvbUV2ZW50KGV2ZW50LCBwYXJhbXMuYnViYmxlcywgcGFyYW1zLmNhbmNlbGFibGUsIHBhcmFtcy5kZXRhaWwpO1xuICAgIHJldHVybiBjdXN0b21FdmVudDtcbiAgfVxuICBDdXN0b21FdmVudC5wcm90b3R5cGUgPSBnbG9iYWwuQ3VzdG9tRXZlbnQgJiYgZ2xvYmFsLkN1c3RvbUV2ZW50LnByb3RvdHlwZTtcbiAgZ2xvYmFsLkN1c3RvbUV2ZW50ID0gQ3VzdG9tRXZlbnQ7XG59KSgpO1xudmFyIGlzRXZlbnRCdWJibGluZ0luRGV0YWNoZWRUcmVlID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgaXNCdWJibGluZyA9IGZhbHNlLFxuICAgICAgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xuICBpZiAoZG9jKSB7XG4gICAgdmFyIHBhcmVudCA9IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgY2hpbGQgPSBwYXJlbnQuY2xvbmVOb2RlKCk7XG4gICAgcGFyZW50LmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgICBwYXJlbnQuYWRkRXZlbnRMaXN0ZW5lcignZScsIGZ1bmN0aW9uKCkge1xuICAgICAgaXNCdWJibGluZyA9IHRydWU7XG4gICAgfSk7XG4gICAgY2hpbGQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ2UnLCB7YnViYmxlczogdHJ1ZX0pKTtcbiAgfVxuICByZXR1cm4gaXNCdWJibGluZztcbn0pKCk7XG52YXIgYmluZCA9IG9uLFxuICAgIHVuYmluZCA9IG9mZjtcbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBvbjogb24sXG4gIG9mZjogb2ZmLFxuICBkZWxlZ2F0ZTogZGVsZWdhdGUsXG4gIHVuZGVsZWdhdGU6IHVuZGVsZWdhdGUsXG4gIHRyaWdnZXI6IHRyaWdnZXIsXG4gIHRyaWdnZXJIYW5kbGVyOiB0cmlnZ2VySGFuZGxlcixcbiAgcmVhZHk6IHJlYWR5LFxuICBiaW5kOiBiaW5kLFxuICB1bmJpbmQ6IHVuYmluZCxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vc2VsZWN0b3JcIjoxMCxcIi4vdXRpbFwiOjExfV0sNzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9odG1sXCI7XG52YXIgZWFjaCA9IF9kZXJlcV8oJy4vdXRpbCcpLmVhY2g7XG5mdW5jdGlvbiBodG1sKGZyYWdtZW50KSB7XG4gIGlmICh0eXBlb2YgZnJhZ21lbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgdmFyIGVsZW1lbnQgPSB0aGlzLm5vZGVUeXBlID8gdGhpcyA6IHRoaXNbMF07XG4gICAgcmV0dXJuIGVsZW1lbnQgPyBlbGVtZW50LmlubmVySFRNTCA6IHVuZGVmaW5lZDtcbiAgfVxuICBlYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LmlubmVySFRNTCA9IGZyYWdtZW50O1xuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaHRtbDogaHRtbCxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vdXRpbFwiOjExfV0sODpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy9pbmRleFwiO1xudmFyICQgPSBfZGVyZXFfKCcuL2FwaScpLmRlZmF1bHQ7XG52YXIgJF9fZGVmYXVsdCA9ICQ7XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZGVmYXVsdDogJF9fZGVmYXVsdCxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vYXBpXCI6MX1dLDk6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvbm9jb25mbGljdFwiO1xudmFyIGdsb2JhbCA9IF9kZXJlcV8oJy4vdXRpbCcpLmdsb2JhbDtcbnZhciBwcmV2aW91c0xpYiA9IGdsb2JhbC4kO1xuZnVuY3Rpb24gbm9Db25mbGljdCgpIHtcbiAgZ2xvYmFsLiQgPSBwcmV2aW91c0xpYjtcbiAgcmV0dXJuIHRoaXM7XG59XG47XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbm9Db25mbGljdDogbm9Db25mbGljdCxcbiAgX19lc01vZHVsZTogdHJ1ZVxufTtcblxuXG59LHtcIi4vdXRpbFwiOjExfV0sMTA6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19tb2R1bGVOYW1lID0gXCJzcmMvc2VsZWN0b3JcIjtcbnZhciAkX18wID0gX2RlcmVxXygnLi91dGlsJyksXG4gICAgZ2xvYmFsID0gJF9fMC5nbG9iYWwsXG4gICAgbWFrZUl0ZXJhYmxlID0gJF9fMC5tYWtlSXRlcmFibGU7XG52YXIgc2xpY2UgPSBbXS5zbGljZSxcbiAgICBpc1Byb3RvdHlwZVNldCA9IGZhbHNlLFxuICAgIHJlRnJhZ21lbnQgPSAvXlxccyo8KFxcdyt8ISlbXj5dKj4vLFxuICAgIHJlU2luZ2xlVGFnID0gL148KFxcdyspXFxzKlxcLz8+KD86PFxcL1xcMT58KSQvLFxuICAgIHJlU2ltcGxlU2VsZWN0b3IgPSAvXltcXC4jXT9bXFx3LV0qJC87XG5mdW5jdGlvbiAkKHNlbGVjdG9yKSB7XG4gIHZhciBjb250ZXh0ID0gYXJndW1lbnRzWzFdICE9PSAodm9pZCAwKSA/IGFyZ3VtZW50c1sxXSA6IGRvY3VtZW50O1xuICB2YXIgY29sbGVjdGlvbjtcbiAgaWYgKCFzZWxlY3Rvcikge1xuICAgIGNvbGxlY3Rpb24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKG51bGwpO1xuICB9IGVsc2UgaWYgKHNlbGVjdG9yIGluc3RhbmNlb2YgV3JhcHBlcikge1xuICAgIHJldHVybiBzZWxlY3RvcjtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygc2VsZWN0b3IgIT09ICdzdHJpbmcnKSB7XG4gICAgY29sbGVjdGlvbiA9IG1ha2VJdGVyYWJsZShzZWxlY3Rvcik7XG4gIH0gZWxzZSBpZiAocmVGcmFnbWVudC50ZXN0KHNlbGVjdG9yKSkge1xuICAgIGNvbGxlY3Rpb24gPSBjcmVhdGVGcmFnbWVudChzZWxlY3Rvcik7XG4gIH0gZWxzZSB7XG4gICAgY29udGV4dCA9IHR5cGVvZiBjb250ZXh0ID09PSAnc3RyaW5nJyA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY29udGV4dCkgOiBjb250ZXh0Lmxlbmd0aCA/IGNvbnRleHRbMF0gOiBjb250ZXh0O1xuICAgIGNvbGxlY3Rpb24gPSBxdWVyeVNlbGVjdG9yKHNlbGVjdG9yLCBjb250ZXh0KTtcbiAgfVxuICByZXR1cm4gJC5pc05hdGl2ZSA/IGNvbGxlY3Rpb24gOiB3cmFwKGNvbGxlY3Rpb24pO1xufVxuZnVuY3Rpb24gZmluZChzZWxlY3Rvcikge1xuICByZXR1cm4gJChzZWxlY3RvciwgdGhpcyk7XG59XG52YXIgbWF0Y2hlcyA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGNvbnRleHQgPSB0eXBlb2YgRWxlbWVudCAhPT0gJ3VuZGVmaW5lZCcgPyBFbGVtZW50LnByb3RvdHlwZSA6IGdsb2JhbCxcbiAgICAgIF9tYXRjaGVzID0gY29udGV4dC5tYXRjaGVzIHx8IGNvbnRleHQubWF0Y2hlc1NlbGVjdG9yIHx8IGNvbnRleHQubW96TWF0Y2hlc1NlbGVjdG9yIHx8IGNvbnRleHQud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8IGNvbnRleHQubXNNYXRjaGVzU2VsZWN0b3IgfHwgY29udGV4dC5vTWF0Y2hlc1NlbGVjdG9yO1xuICByZXR1cm4gZnVuY3Rpb24oZWxlbWVudCwgc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gX21hdGNoZXMuY2FsbChlbGVtZW50LCBzZWxlY3Rvcik7XG4gIH07XG59KSgpO1xuZnVuY3Rpb24gcXVlcnlTZWxlY3RvcihzZWxlY3RvciwgY29udGV4dCkge1xuICB2YXIgaXNTaW1wbGVTZWxlY3RvciA9IHJlU2ltcGxlU2VsZWN0b3IudGVzdChzZWxlY3Rvcik7XG4gIGlmIChpc1NpbXBsZVNlbGVjdG9yICYmICEkLmlzTmF0aXZlKSB7XG4gICAgaWYgKHNlbGVjdG9yWzBdID09PSAnIycpIHtcbiAgICAgIHZhciBlbGVtZW50ID0gKGNvbnRleHQuZ2V0RWxlbWVudEJ5SWQgPyBjb250ZXh0IDogZG9jdW1lbnQpLmdldEVsZW1lbnRCeUlkKHNlbGVjdG9yLnNsaWNlKDEpKTtcbiAgICAgIHJldHVybiBlbGVtZW50ID8gW2VsZW1lbnRdIDogW107XG4gICAgfVxuICAgIGlmIChzZWxlY3RvclswXSA9PT0gJy4nKSB7XG4gICAgICByZXR1cm4gY29udGV4dC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKHNlbGVjdG9yLnNsaWNlKDEpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRleHQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoc2VsZWN0b3IpO1xuICB9XG4gIHJldHVybiBjb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xufVxuZnVuY3Rpb24gY3JlYXRlRnJhZ21lbnQoaHRtbCkge1xuICBpZiAocmVTaW5nbGVUYWcudGVzdChodG1sKSkge1xuICAgIHJldHVybiBbZG9jdW1lbnQuY3JlYXRlRWxlbWVudChSZWdFeHAuJDEpXTtcbiAgfVxuICB2YXIgZWxlbWVudHMgPSBbXSxcbiAgICAgIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuICAgICAgY2hpbGRyZW4gPSBjb250YWluZXIuY2hpbGROb2RlcztcbiAgY29udGFpbmVyLmlubmVySFRNTCA9IGh0bWw7XG4gIGZvciAodmFyIGkgPSAwLFxuICAgICAgbCA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGVsZW1lbnRzLnB1c2goY2hpbGRyZW5baV0pO1xuICB9XG4gIHJldHVybiBlbGVtZW50cztcbn1cbmZ1bmN0aW9uIHdyYXAoY29sbGVjdGlvbikge1xuICBpZiAoIWlzUHJvdG90eXBlU2V0KSB7XG4gICAgV3JhcHBlci5wcm90b3R5cGUgPSAkLmZuO1xuICAgIFdyYXBwZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gV3JhcHBlcjtcbiAgICBpc1Byb3RvdHlwZVNldCA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIG5ldyBXcmFwcGVyKGNvbGxlY3Rpb24pO1xufVxuZnVuY3Rpb24gV3JhcHBlcihjb2xsZWN0aW9uKSB7XG4gIHZhciBpID0gMCxcbiAgICAgIGxlbmd0aCA9IGNvbGxlY3Rpb24ubGVuZ3RoO1xuICBmb3IgKDsgaSA8IGxlbmd0aDsgKSB7XG4gICAgdGhpc1tpXSA9IGNvbGxlY3Rpb25baSsrXTtcbiAgfVxuICB0aGlzLmxlbmd0aCA9IGxlbmd0aDtcbn1cbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICAkOiAkLFxuICBmaW5kOiBmaW5kLFxuICBtYXRjaGVzOiBtYXRjaGVzLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se1wiLi91dGlsXCI6MTF9XSwxMTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX21vZHVsZU5hbWUgPSBcInNyYy91dGlsXCI7XG52YXIgZ2xvYmFsID0gbmV3IEZ1bmN0aW9uKFwicmV0dXJuIHRoaXNcIikoKSxcbiAgICBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciB0b0FycmF5ID0gKGZ1bmN0aW9uKGNvbGxlY3Rpb24pIHtcbiAgcmV0dXJuIHNsaWNlLmNhbGwoY29sbGVjdGlvbik7XG59KTtcbnZhciBtYWtlSXRlcmFibGUgPSAoZnVuY3Rpb24oZWxlbWVudCkge1xuICByZXR1cm4gZWxlbWVudC5ub2RlVHlwZSB8fCBlbGVtZW50ID09PSB3aW5kb3cgPyBbZWxlbWVudF0gOiBlbGVtZW50O1xufSk7XG5mdW5jdGlvbiBlYWNoKGNvbGxlY3Rpb24sIGNhbGxiYWNrKSB7XG4gIHZhciBsZW5ndGggPSBjb2xsZWN0aW9uLmxlbmd0aDtcbiAgaWYgKGxlbmd0aCAhPT0gdW5kZWZpbmVkICYmIGNvbGxlY3Rpb24ubm9kZVR5cGUgPT09IHVuZGVmaW5lZCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGNhbGxiYWNrKGNvbGxlY3Rpb25baV0sIGksIGNvbGxlY3Rpb24pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjYWxsYmFjayhjb2xsZWN0aW9uLCAwLCBjb2xsZWN0aW9uKTtcbiAgfVxuICByZXR1cm4gY29sbGVjdGlvbjtcbn1cbmZ1bmN0aW9uIGV4dGVuZCh0YXJnZXQpIHtcbiAgZm9yICh2YXIgc291cmNlcyA9IFtdLFxuICAgICAgJF9fMCA9IDE7ICRfXzAgPCBhcmd1bWVudHMubGVuZ3RoOyAkX18wKyspXG4gICAgc291cmNlc1skX18wIC0gMV0gPSBhcmd1bWVudHNbJF9fMF07XG4gIHNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbihzcmMpIHtcbiAgICBpZiAoc3JjKSB7XG4gICAgICBmb3IgKHZhciBwcm9wIGluIHNyYykge1xuICAgICAgICB0YXJnZXRbcHJvcF0gPSBzcmNbcHJvcF07XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHRhcmdldDtcbn1cbjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBnbG9iYWw6IGdsb2JhbCxcbiAgdG9BcnJheTogdG9BcnJheSxcbiAgbWFrZUl0ZXJhYmxlOiBtYWtlSXRlcmFibGUsXG4gIGVhY2g6IGVhY2gsXG4gIGV4dGVuZDogZXh0ZW5kLFxuICBfX2VzTW9kdWxlOiB0cnVlXG59O1xuXG5cbn0se31dfSx7fSxbOF0pXG4oOClcbn0pO1xufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCJ2YXIgbmF2ICAgICA9IHJlcXVpcmUoJy4vbW9kdWxlcy9uYXYnKVxuLCAgIGV2ZW50cyAgPSByZXF1aXJlKCcuL21vZHVsZXMvZXZlbnRzJylcbiwgICBjb250ZW50ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2NvbnRlbnQnKTtcblxuY29udGVudC5pbml0KCk7XG5uYXYuaW5pdCgpO1xuZXZlbnRzKCk7XG5cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyICQgPSB3aW5kb3cualF1ZXJ5IHx8IHJlcXVpcmUoJ2RvbXRhc3RpYycpO1xuXG52YXIgJGJvZHkgPSAkKCdib2R5Jyk7XG5cbnZhciBjb250ZW50ID0ge1xuXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLndyYXBDb250ZW50KCk7XG4gIH0sXG5cbiAgd3JhcENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICRib2R5Lmh0bWwoJzxkaXYgaWQ9XCJuaWNlLWNvbnRlbnRcIj4nICsgJGJvZHkuaHRtbCgpICsgJzwvZGl2PicpO1xuICAgIHJldHVybiB0aGlzLm1ha2VFZGl0YWJsZSgkYm9keSk7XG4gIH0sXG5cbiAgbWFrZUVkaXRhYmxlOiBmdW5jdGlvbihlbCkge1xuICAgIHJldHVybiBlbC5hdHRyKCdjb250ZW50ZWRpdGFibGUnLCB0cnVlKTtcbiAgfSxcblxuICByZW1vdmVOaWNlOiBmdW5jdGlvbigpIHtcbiAgICAkYm9keVxuICAgICAgLmh0bWwoJCgnI25pY2UtY29udGVudCcpLmh0bWwoKSlcbiAgICAgIC5yZW1vdmVBdHRyKCdjb250ZW50ZWRpdGFibGUnKTtcbiAgfSxcblxuICBnZXRIVE1MOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJCgnI25pY2UtY29udGVudCcpLmh0bWwoKTtcbiAgfVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciAkICAgICAgID0gd2luZG93LmpRdWVyeSB8fCByZXF1aXJlKCdkb210YXN0aWMnKVxuLCAgIG5hdiAgICAgPSByZXF1aXJlKCcuL25hdicpXG4sICAgY29udGVudCA9IHJlcXVpcmUoJy4vY29udGVudCcpO1xuXG52YXIgZXZlbnRzID0gZnVuY3Rpb24oKSB7XG5cbiAgJCgnI25pY2Utb2ZmJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBjb250ZW50LnJlbW92ZU5pY2UoKTtcbiAgfSk7XG5cbiAgJCgnI25pY2UtZGlmZicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xuXG4gICQoJyNuaWNlLXRvZ2dsZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgd2luZG93LmNvbnNvbGUubG9nKGNvbnRlbnQuZ2V0SFRNTCgpKTtcbiAgfSk7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXZlbnRzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBzZXQgbmF2VGVtcGxhdGVcbnZhciBuYXZUZW1wbGF0ZSA9ICAnPGxpIGlkPVwibmljZS1vZmZcIj5PZmY8L2xpPic7XG4gICAgbmF2VGVtcGxhdGUgKz0gJzxsaSBpZD1cIm5pY2UtZGlmZlwiPkRpZmY8L2xpPic7XG4gICAgbmF2VGVtcGxhdGUgKz0gJzxsaSBpZD1cIm5pY2UtdG9nZ2xlXCI+T3JpZ2luYWw8L2xpPic7XG5cbnZhciBodG1sID0ge1xuXG4gIG5hdlRlbXBsYXRlOiBuYXZUZW1wbGF0ZSxcblxuICBjc3NMb2NhdGlvbjogJzxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiBocmVmPVwiaW5kZXguY3NzXCIgdHlwZT1cInRleHQvY3NzXCIgLz4nXG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaHRtbDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyICQgICAgPSB3aW5kb3cualF1ZXJ5IHx8IHJlcXVpcmUoJ2RvbXRhc3RpYycpXG4sICAgaHRtbCA9IHJlcXVpcmUoJy4vaHRtbCcpO1xuXG52YXIgYm9keSA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbIDAgXTtcblxudmFyIG5hdiA9IHtcblxuICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNyZWF0ZSgpO1xuICB9LFxuXG4gIGNyZWF0ZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICBlbC5pbm5lckhUTUwgPSBodG1sLm5hdlRlbXBsYXRlO1xuICAgIGVsLnNldEF0dHJpYnV0ZSgnaWQnLCduaWNlLW5hdicpO1xuICAgIGVsLnNldEF0dHJpYnV0ZSgnY29udGVudGVkaXRhYmxlJywgZmFsc2UpO1xuICAgIHRoaXMuc3R5bGUoZWwpO1xuICB9LFxuXG4gIHN0eWxlOiBmdW5jdGlvbihlbCkge1xuICAgICQoJ2hlYWQnKS5hcHBlbmQoaHRtbC5jc3NMb2NhdGlvbik7XG4gICAgdGhpcy5hcHBlbmQoZWwpO1xuICB9LFxuXG4gIGFwcGVuZDogZnVuY3Rpb24oZWwpIHtcbiAgICBib2R5LmFwcGVuZENoaWxkKGVsKTtcbiAgfVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5hdjtcbiJdfQ==

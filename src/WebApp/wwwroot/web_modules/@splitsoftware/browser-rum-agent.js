var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/@splitsoftware/browser-rum-agent/esm/utils/constants.js
var UNAVAILABLE = "unavailable";
var CONSENT_GRANTED = "GRANTED";
var CONSENT_DECLINED = "DECLINED";
var DEFAULT_PREFIX = "split.rum";

// node_modules/@splitsoftware/browser-rum-agent/esm/utils/context.js
function getUserAgent() {
  return typeof navigator === "object" ? navigator.userAgent : UNAVAILABLE;
}
function getConnectionType() {
  var connection = typeof navigator === "object" && (navigator.connection || navigator.mozConnection || navigator.webkitConnection);
  return connection ? connection.effectiveType : UNAVAILABLE;
}
function getUrl() {
  return location.href;
}
function getRoute() {
  return location.pathname + location.search + location.hash;
}
var userAgent = getUserAgent();
var languageVersion = "jsrum-1.0.0";

// node_modules/@splitsoftware/browser-rum-agent/esm/utils/assign.js
var objectAssign = Object.assign || function(target) {
  if (target === null || target === void 0)
    throw new TypeError("Object.assign cannot be called with null or undefined");
  target = Object(target);
  for (var i2 = 1; i2 < arguments.length; i2++) {
    var source = Object(arguments[i2]);
    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
  return target;
};
function assignIdentities(event, identities, queue2) {
  if (event.eventTypeId && event.timestamp) {
    if (!identities.length || event.key && event.trafficTypeName) {
      queue2.push(event);
    } else {
      identities.forEach(function(identity) {
        queue2.push(objectAssign({
          trafficTypeName: identity.trafficType,
          key: identity.key
        }, event));
      });
    }
  }
}

// node_modules/@splitsoftware/browser-rum-agent/esm/utils/transport.js
function sendEvents(events, useBeacon) {
  var config = window.SplitRumAgent.__getConfig();
  var eventsWithIdentity = [];
  for (var i2 = 0; i2 < events.length; i2++) {
    var event_1 = events[i2];
    assignIdentities(event_1, config.i, eventsWithIdentity);
  }
  if (eventsWithIdentity.length) {
    return post(config.url + "/events/beacon", {
      entries: eventsWithIdentity,
      token: config.a,
      sdk: languageVersion
    }, useBeacon);
  }
  return false;
}
function post(url, data, useBeacon) {
  var stringifiedData = JSON.stringify(data);
  useBeacon = useBeacon && typeof navigator === "object" && navigator.sendBeacon;
  if (useBeacon) {
    try {
      useBeacon = navigator.sendBeacon.bind(navigator)(url, stringifiedData);
    } catch (e3) {
      useBeacon = false;
    }
  }
  return useBeacon || fallbackPost(url, stringifiedData);
}
function fallbackPost(url, payload) {
  if (typeof fetch === "function") {
    fetch(url, {
      method: "POST",
      body: payload,
      headers: {
        "Content-Type": "text/plain;charset=UTF-8"
      }
    }).catch(function() {
    });
  } else {
    try {
      var req = new XMLHttpRequest();
      req.open("POST", url, true);
      req.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
      req.send(payload);
    } catch (e3) {
      return false;
    }
  }
  return true;
}

// node_modules/@splitsoftware/browser-rum-agent/esm/utils/isObject.js
function isObject(obj) {
  return obj && typeof obj === "object" && obj.constructor === Object;
}

// node_modules/@splitsoftware/browser-rum-agent/esm/utils/isBoolean.js
function isBoolean(val) {
  return val === true || val === false;
}

// node_modules/@splitsoftware/browser-rum-agent/esm/utils/isNumber.js
function isNumber(n2) {
  return typeof n2 === "number";
}

// node_modules/@splitsoftware/browser-rum-agent/esm/utils/isString.js
function isString(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}

// node_modules/@splitsoftware/browser-rum-agent/esm/utils/validateEvent.js
function validateProperties(properties, log2) {
  if (!isObject(properties)) {
    log2.error("Event `properties` must be a plain object.");
    return;
  }
  var propertiesClone = objectAssign({}, properties);
  Object.keys(propertiesClone).forEach(function(key) {
    var val = propertiesClone[key];
    if (val == void 0 || isString(val) || isNumber(val) || isBoolean(val))
      return;
    log2.warn("Property ".concat(key, " is of invalid type. Setting value to null."));
    propertiesClone[key] = null;
  });
  return propertiesClone;
}
var EVENT_TYPE_REGEX = /^[a-zA-Z0-9][-_.:a-zA-Z0-9]{0,79}$/;
function validateEventTypeId(eventTypeId, log2, item) {
  if (item === void 0) {
    item = "ID";
  }
  if (isString(eventTypeId) && EVENT_TYPE_REGEX.test(eventTypeId))
    return true;
  log2.error("Event type ".concat(item, " must be a string that adheres to the regular expression ").concat(EVENT_TYPE_REGEX.toString(), '. You passed "').concat(eventTypeId, '"'));
  return false;
}
function validateEvent(event, log2) {
  var eventTypeId = event.eventTypeId, value = event.value, properties = event.properties;
  if (!validateEventTypeId(eventTypeId, log2)) {
    return;
  }
  if (value != void 0 && !isNumber(value)) {
    log2.error("Event value must be a number.");
    return;
  }
  if (properties != void 0 && !(properties = validateProperties(properties, log2))) {
    return;
  }
  return { eventTypeId, value, properties };
}

// node_modules/@splitsoftware/browser-rum-agent/esm/utils/queue.js
var queue = [];
function flush(useBeacon) {
  var conf = window.SplitRumAgent.__getConfig();
  if (queue.length && conf.a && conf.i.length && conf.userConsent === CONSENT_GRANTED) {
    var toSend = queue.splice(0, queue.length);
    return sendEvents(toSend, useBeacon);
  }
  return false;
}
function setSchedule() {
  setInterval(flush, window.SplitRumAgent.__getConfig().pushRate * 1e3);
  flush();
}
function track(eventTypeId, value, properties) {
  var conf = window.SplitRumAgent.__getConfig();
  var eventData = validateEvent(isObject(eventTypeId) ? eventTypeId : {
    eventTypeId,
    value,
    properties
  }, conf.log);
  if (!eventData || conf.userConsent === CONSENT_DECLINED)
    return false;
  if (queue.length >= conf.queueSize) {
    if (!flush()) {
      conf.log.warn("Dropping event due to queue size limit.");
      return false;
    }
  }
  eventData.timestamp = Date.now();
  if (conf.prefix)
    eventData.eventTypeId = "".concat(conf.prefix, ".").concat(eventData.eventTypeId);
  var commonProperties = {
    connectionType: getConnectionType(),
    url: getUrl(),
    userAgent
  };
  eventData.properties = objectAssign(commonProperties, conf.p, isObject(eventData.properties) ? eventData.properties : {});
  if (window.SplitRumAgent.onEvent)
    eventData = window.SplitRumAgent.onEvent(eventData);
  if (eventData)
    assignIdentities(eventData, window.SplitRumAgent.__getConfig().i, queue);
  return true;
}

// node_modules/@splitsoftware/browser-rum-agent/esm/utils/isArray.js
function isArray(a2) {
  return Object.prototype.toString.call(a2) === "[object Array]";
}

// node_modules/@splitsoftware/browser-rum-agent/esm/utils/log.js
var INFIX = " splitio => rum-agent: ";
var log = {
  debug: function(m2) {
    console.log("[DEBUG]" + INFIX + m2);
  },
  info: function(m2) {
    console.log("[INFO] " + INFIX + m2);
  },
  warn: function(m2) {
    console.log("[WARN] " + INFIX + m2);
  },
  error: function(m2) {
    console.log("[ERROR]" + INFIX + m2);
  }
};

// node_modules/@splitsoftware/browser-rum-agent/esm/utils/whenLoaded.js
function whenLoaded(callback) {
  if (document.readyState === "complete") {
    setTimeout(callback, 0);
  } else {
    window.addEventListener("load", function() {
      setTimeout(callback, 0);
    });
  }
}
function onPageHideOrVisibilityChange(callback) {
  var PAGE_TERMINATION_EVENT = typeof window.onpagehide !== "undefined" ? "pagehide" : "unload";
  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("visibilitychange", function onVisibilityChange() {
      if (document.visibilityState === "hidden")
        callback();
    });
  }
  window.addEventListener(PAGE_TERMINATION_EVENT, callback);
}

// node_modules/@splitsoftware/browser-rum-agent/esm/utils/validateIdentity.js
function validateIdentity(identity, log2) {
  if (!isObject(identity)) {
    log2.error("Identity must be an object with key and trafficType.");
    return;
  }
  var key = identity.key, trafficType = identity.trafficType;
  if (isNumber(key))
    key = key + "";
  if (!isString(key)) {
    log2.error("Identity Key must be a string or number.");
    return;
  }
  if (!isString(trafficType)) {
    log2.error("Identity Traffic Type must be a string.");
    return;
  }
  return {
    key: key.trim(),
    trafficType: trafficType.trim().toLowerCase()
  };
}
function areEqual(identity1, identity2) {
  return identity1.key === identity2.key && identity1.trafficType === identity2.trafficType;
}

// node_modules/@splitsoftware/browser-rum-agent/esm/utils/isError.js
function isError(o2) {
  return Object.prototype.toString.call(o2) === "[object Error]";
}

// node_modules/@splitsoftware/browser-rum-agent/esm/utils/getErrorData.js
function getErrorData(error) {
  if (isString(error)) {
    return {
      message: error,
      stack: UNAVAILABLE
    };
  } else if (isError(error)) {
    return {
      message: isString(error.message) ? error.message : UNAVAILABLE,
      stack: isString(error.stack) ? error.stack : UNAVAILABLE
    };
  }
  return false;
}

// node_modules/@splitsoftware/browser-rum-agent/esm/metrics/errors.js
function trackError(error, ctx) {
  var errorData = getErrorData(error);
  return errorData ? ctx.track({
    eventTypeId: "error",
    value: null,
    properties: {
      message: errorData.message,
      stack: errorData.stack
    }
  }) : false;
}
function handleCustomErrors(e3, ctx) {
  return trackError(e3 ? e3 : UNAVAILABLE, ctx);
}
function errors() {
  return function onError(ctx) {
    function handleUncaughtErrors(event) {
      trackError(event ? event.error || event.message || UNAVAILABLE : UNAVAILABLE, ctx);
    }
    function handleRejectionsErrors(e3) {
      trackError(e3 ? e3.reason : UNAVAILABLE, ctx);
    }
    var w2 = window;
    var g2 = w2.__error;
    if (g2) {
      w2.removeEventListener("error", g2.l1);
      w2.removeEventListener("unhandledrejection", g2.l2);
      setTimeout(function() {
        g2.e1.forEach(handleUncaughtErrors);
        g2.e2.forEach(handleRejectionsErrors);
        delete w2.__error;
      }, 0);
    }
    w2.addEventListener("error", handleUncaughtErrors);
    w2.addEventListener("unhandledrejection", handleRejectionsErrors);
  };
}

// node_modules/@splitsoftware/browser-rum-agent/esm/utils/validateEventCollectorsOption.js
function validateEventCollectorsOption(config) {
  var eventCollectors = isObject(config) && isObject(config.eventCollectors) ? config.eventCollectors : {};
  return {
    errors: eventCollectors.errors !== false,
    navigationTiming: eventCollectors.navigationTiming !== false,
    webVitals: eventCollectors.webVitals !== false ? eventCollectors.webVitals || true : false
  };
}

// node_modules/@splitsoftware/browser-rum-agent/esm/slim/config.js
var isBrowser = typeof window === "object" && typeof document === "object";
var globalRef = isBrowser ? window : {};
(function(w2, isBrowser2) {
  if (w2.SplitRumAgent)
    return;
  var _config = {
    i: [],
    a: false,
    p: {},
    prefix: DEFAULT_PREFIX,
    url: "https://events.split.io/api",
    pushRate: 30,
    queueSize: 5e3,
    log,
    userConsent: CONSENT_GRANTED,
    eventCollectors: {}
  };
  var _isConfigured = false;
  function calculateAndFlush() {
    if (isBrowser2 && !_isConfigured && _config.a && _config.i.length) {
      _isConfigured = true;
      setTimeout(flush, 0);
    }
  }
  var collectors = [];
  var SplitRumAgent3 = {
    // Initialization params
    setup: function(sdkKey, config) {
      if (isObject(config)) {
        var log_1 = config.log, prefix = config.prefix, url = config.url, pushRate = config.pushRate, queueSize = config.queueSize, userConsent = config.userConsent;
        if (log_1)
          _config.log = log_1;
        if (isString(prefix) && (prefix === "" || validateEventTypeId(prefix, _config.log, "prefix")))
          _config.prefix = prefix;
        if (isString(url))
          _config.url = url;
        if (isNumber(pushRate))
          _config.pushRate = pushRate;
        if (isNumber(queueSize))
          _config.queueSize = queueSize;
        if (isString(userConsent))
          _config.userConsent = userConsent;
        _config.eventCollectors = validateEventCollectorsOption(config);
      }
      if (isString(sdkKey)) {
        _config.a = sdkKey;
        calculateAndFlush();
      } else {
        _config.log.error("SDK key must be a string.");
      }
      return SplitRumAgent3;
    },
    // Configure identities
    addIdentities: function(identities) {
      if (isArray(identities)) {
        identities.forEach(function(identity) {
          return SplitRumAgent3.addIdentity(identity);
        });
      } else {
        _config.log.error("Identities must be an array of objects with key and trafficType.");
      }
    },
    addIdentity: function(identity) {
      var validatedIdentity = validateIdentity(identity, _config.log);
      if (validatedIdentity && !_config.i.some(function(i2) {
        return areEqual(i2, validatedIdentity);
      })) {
        _config.i.push(validatedIdentity);
        calculateAndFlush();
      }
    },
    removeIdentities: function() {
      _config.i = [];
    },
    removeIdentity: function(identity) {
      var validatedIdentity = validateIdentity(identity, _config.log);
      if (validatedIdentity) {
        _config.i = _config.i.filter(function(i2) {
          return !areEqual(i2, validatedIdentity);
        });
      }
    },
    getIdentities: function() {
      return _config.i;
    },
    // Custom error handler.
    trackError: function(e3) {
      return handleCustomErrors(e3, SplitRumAgent3);
    },
    // Track custom events.
    track,
    // Register event collector
    register: function(eventCollector) {
      if (typeof eventCollector !== "function") {
        _config.log.error("register method must be called with an event collector function.");
      } else {
        collectors.push(eventCollector(SplitRumAgent3));
      }
      return SplitRumAgent3;
    },
    // Custom properties
    setProperties: function(properties) {
      objectAssign(_config.p, validateProperties(properties, _config.log));
    },
    getProperties: function() {
      return _config.p;
    },
    removeProperties: function() {
      _config.p = {};
    },
    // User consent
    setUserConsent: function(userConsent) {
      if (!isBoolean(userConsent)) {
        _config.log.warn("setUserConsent: provided param must be a boolean value");
        return false;
      }
      _config.userConsent = userConsent ? CONSENT_GRANTED : CONSENT_DECLINED;
      return true;
    },
    getUserConsent: function() {
      return _config.userConsent;
    },
    // Flush collectors and send events
    flush: function(useBeacon) {
      collectors.forEach(function(collector) {
        if (collector && typeof collector.flush === "function")
          collector.flush();
      });
      return flush(useBeacon);
    },
    // Private members for internal use only.
    // @TODO review how to expose config
    __getConfig: function() {
      return _config;
    },
    __queue: queue,
    __collectors: collectors
  };
  if (isBrowser2) {
    whenLoaded(setSchedule);
    onPageHideOrVisibilityChange(function() {
      SplitRumAgent3.flush(true);
    });
  }
  w2.SplitRumAgent = SplitRumAgent3;
})(globalRef, isBrowser);
var SplitRumAgent = globalRef.SplitRumAgent;

// node_modules/@splitsoftware/browser-rum-agent/esm/utils/getNavEntry.js
function getNavEntry() {
  if (!window.performance)
    return false;
  return performance.getEntriesByType ? (
    // If no entries we'll get undefined.
    performance.getEntriesByType("navigation")[0]
  ) : (
    // lvl2
    performance.timing
  );
}

// node_modules/@splitsoftware/browser-rum-agent/esm/metrics/navigation/simpleMetricFactory.js
function simpleMetricFactory(type, calc) {
  var sent = false;
  return function() {
    var pageNav = getNavEntry();
    if (sent || !pageNav)
      return false;
    var val = calc(pageNav);
    if (!val)
      return false;
    else {
      sent = true;
      return {
        eventTypeId: type,
        value: val
      };
    }
  };
}

// node_modules/@splitsoftware/browser-rum-agent/esm/metrics/navigation/ttdi.js
function calculateTTDI(navEntry) {
  if (navEntry.domInteractive > 0) {
    if (navEntry.fetchStart > 0 && navEntry.fetchStart % 1 === 0)
      return navEntry.domInteractive - navEntry.fetchStart;
    return navEntry.domInteractive;
  }
  return false;
}
var getTTDI = simpleMetricFactory("time.to.dom.interactive", calculateTTDI);

// node_modules/@splitsoftware/browser-rum-agent/esm/metrics/navigation/plt.js
function calculatePLT(navEntry) {
  if (navEntry.duration > 0)
    return navEntry.duration;
  if (navEntry.navigationStart > 0 && navEntry.loadEventEnd > 0)
    return navEntry.loadEventEnd - navEntry.navigationStart;
  return false;
}
var getPLT = simpleMetricFactory("page.load.time", calculatePLT);

// node_modules/@splitsoftware/browser-rum-agent/esm/metrics/navigation/index.js
function navigationTiming() {
  return function onNavigationTimingMetrics(ctx) {
    var getMetrics = function() {
      var ttdi = getTTDI(), plt = getPLT();
      if (ttdi)
        ctx.track(ttdi);
      if (plt)
        ctx.track(plt);
    };
    whenLoaded(getMetrics);
    return {
      flush: getMetrics
    };
  };
}

// node_modules/web-vitals/dist/web-vitals.js
var web_vitals_exports = {};
__export(web_vitals_exports, {
  CLSThresholds: () => L,
  FCPThresholds: () => b,
  FIDThresholds: () => $,
  INPThresholds: () => N,
  LCPThresholds: () => _,
  TTFBThresholds: () => J,
  onCLS: () => w,
  onFCP: () => S,
  onFID: () => ee,
  onINP: () => j,
  onLCP: () => G,
  onTTFB: () => Q
});
var e;
var n;
var t;
var r;
var i;
var o = -1;
var a = function(e3) {
  addEventListener("pageshow", (function(n2) {
    n2.persisted && (o = n2.timeStamp, e3(n2));
  }), true);
};
var c = function() {
  var e3 = self.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (e3 && e3.responseStart > 0 && e3.responseStart < performance.now()) return e3;
};
var u = function() {
  var e3 = c();
  return e3 && e3.activationStart || 0;
};
var f = function(e3, n2) {
  var t2 = c(), r2 = "navigate";
  o >= 0 ? r2 = "back-forward-cache" : t2 && (document.prerendering || u() > 0 ? r2 = "prerender" : document.wasDiscarded ? r2 = "restore" : t2.type && (r2 = t2.type.replace(/_/g, "-")));
  return { name: e3, value: void 0 === n2 ? -1 : n2, rating: "good", delta: 0, entries: [], id: "v4-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: r2 };
};
var s = function(e3, n2, t2) {
  try {
    if (PerformanceObserver.supportedEntryTypes.includes(e3)) {
      var r2 = new PerformanceObserver((function(e4) {
        Promise.resolve().then((function() {
          n2(e4.getEntries());
        }));
      }));
      return r2.observe(Object.assign({ type: e3, buffered: true }, t2 || {})), r2;
    }
  } catch (e4) {
  }
};
var d = function(e3, n2, t2, r2) {
  var i2, o2;
  return function(a2) {
    n2.value >= 0 && (a2 || r2) && ((o2 = n2.value - (i2 || 0)) || void 0 === i2) && (i2 = n2.value, n2.delta = o2, n2.rating = (function(e4, n3) {
      return e4 > n3[1] ? "poor" : e4 > n3[0] ? "needs-improvement" : "good";
    })(n2.value, t2), e3(n2));
  };
};
var l = function(e3) {
  requestAnimationFrame((function() {
    return requestAnimationFrame((function() {
      return e3();
    }));
  }));
};
var p = function(e3) {
  document.addEventListener("visibilitychange", (function() {
    "hidden" === document.visibilityState && e3();
  }));
};
var v = function(e3) {
  var n2 = false;
  return function() {
    n2 || (e3(), n2 = true);
  };
};
var m = -1;
var h = function() {
  return "hidden" !== document.visibilityState || document.prerendering ? 1 / 0 : 0;
};
var g = function(e3) {
  "hidden" === document.visibilityState && m > -1 && (m = "visibilitychange" === e3.type ? e3.timeStamp : 0, T());
};
var y = function() {
  addEventListener("visibilitychange", g, true), addEventListener("prerenderingchange", g, true);
};
var T = function() {
  removeEventListener("visibilitychange", g, true), removeEventListener("prerenderingchange", g, true);
};
var E = function() {
  return m < 0 && (m = h(), y(), a((function() {
    setTimeout((function() {
      m = h(), y();
    }), 0);
  }))), { get firstHiddenTime() {
    return m;
  } };
};
var C = function(e3) {
  document.prerendering ? addEventListener("prerenderingchange", (function() {
    return e3();
  }), true) : e3();
};
var b = [1800, 3e3];
var S = function(e3, n2) {
  n2 = n2 || {}, C((function() {
    var t2, r2 = E(), i2 = f("FCP"), o2 = s("paint", (function(e4) {
      e4.forEach((function(e5) {
        "first-contentful-paint" === e5.name && (o2.disconnect(), e5.startTime < r2.firstHiddenTime && (i2.value = Math.max(e5.startTime - u(), 0), i2.entries.push(e5), t2(true)));
      }));
    }));
    o2 && (t2 = d(e3, i2, b, n2.reportAllChanges), a((function(r3) {
      i2 = f("FCP"), t2 = d(e3, i2, b, n2.reportAllChanges), l((function() {
        i2.value = performance.now() - r3.timeStamp, t2(true);
      }));
    })));
  }));
};
var L = [0.1, 0.25];
var w = function(e3, n2) {
  n2 = n2 || {}, S(v((function() {
    var t2, r2 = f("CLS", 0), i2 = 0, o2 = [], c2 = function(e4) {
      e4.forEach((function(e5) {
        if (!e5.hadRecentInput) {
          var n3 = o2[0], t3 = o2[o2.length - 1];
          i2 && e5.startTime - t3.startTime < 1e3 && e5.startTime - n3.startTime < 5e3 ? (i2 += e5.value, o2.push(e5)) : (i2 = e5.value, o2 = [e5]);
        }
      })), i2 > r2.value && (r2.value = i2, r2.entries = o2, t2());
    }, u2 = s("layout-shift", c2);
    u2 && (t2 = d(e3, r2, L, n2.reportAllChanges), p((function() {
      c2(u2.takeRecords()), t2(true);
    })), a((function() {
      i2 = 0, r2 = f("CLS", 0), t2 = d(e3, r2, L, n2.reportAllChanges), l((function() {
        return t2();
      }));
    })), setTimeout(t2, 0));
  })));
};
var A = 0;
var I = 1 / 0;
var P = 0;
var M = function(e3) {
  e3.forEach((function(e4) {
    e4.interactionId && (I = Math.min(I, e4.interactionId), P = Math.max(P, e4.interactionId), A = P ? (P - I) / 7 + 1 : 0);
  }));
};
var k = function() {
  return e ? A : performance.interactionCount || 0;
};
var F = function() {
  "interactionCount" in performance || e || (e = s("event", M, { type: "event", buffered: true, durationThreshold: 0 }));
};
var D = [];
var x = /* @__PURE__ */ new Map();
var R = 0;
var B = function() {
  var e3 = Math.min(D.length - 1, Math.floor((k() - R) / 50));
  return D[e3];
};
var H = [];
var q = function(e3) {
  if (H.forEach((function(n3) {
    return n3(e3);
  })), e3.interactionId || "first-input" === e3.entryType) {
    var n2 = D[D.length - 1], t2 = x.get(e3.interactionId);
    if (t2 || D.length < 10 || e3.duration > n2.latency) {
      if (t2) e3.duration > t2.latency ? (t2.entries = [e3], t2.latency = e3.duration) : e3.duration === t2.latency && e3.startTime === t2.entries[0].startTime && t2.entries.push(e3);
      else {
        var r2 = { id: e3.interactionId, latency: e3.duration, entries: [e3] };
        x.set(r2.id, r2), D.push(r2);
      }
      D.sort((function(e4, n3) {
        return n3.latency - e4.latency;
      })), D.length > 10 && D.splice(10).forEach((function(e4) {
        return x.delete(e4.id);
      }));
    }
  }
};
var O = function(e3) {
  var n2 = self.requestIdleCallback || self.setTimeout, t2 = -1;
  return e3 = v(e3), "hidden" === document.visibilityState ? e3() : (t2 = n2(e3), p(e3)), t2;
};
var N = [200, 500];
var j = function(e3, n2) {
  "PerformanceEventTiming" in self && "interactionId" in PerformanceEventTiming.prototype && (n2 = n2 || {}, C((function() {
    var t2;
    F();
    var r2, i2 = f("INP"), o2 = function(e4) {
      O((function() {
        e4.forEach(q);
        var n3 = B();
        n3 && n3.latency !== i2.value && (i2.value = n3.latency, i2.entries = n3.entries, r2());
      }));
    }, c2 = s("event", o2, { durationThreshold: null !== (t2 = n2.durationThreshold) && void 0 !== t2 ? t2 : 40 });
    r2 = d(e3, i2, N, n2.reportAllChanges), c2 && (c2.observe({ type: "first-input", buffered: true }), p((function() {
      o2(c2.takeRecords()), r2(true);
    })), a((function() {
      R = k(), D.length = 0, x.clear(), i2 = f("INP"), r2 = d(e3, i2, N, n2.reportAllChanges);
    })));
  })));
};
var _ = [2500, 4e3];
var z = {};
var G = function(e3, n2) {
  n2 = n2 || {}, C((function() {
    var t2, r2 = E(), i2 = f("LCP"), o2 = function(e4) {
      n2.reportAllChanges || (e4 = e4.slice(-1)), e4.forEach((function(e5) {
        e5.startTime < r2.firstHiddenTime && (i2.value = Math.max(e5.startTime - u(), 0), i2.entries = [e5], t2());
      }));
    }, c2 = s("largest-contentful-paint", o2);
    if (c2) {
      t2 = d(e3, i2, _, n2.reportAllChanges);
      var m2 = v((function() {
        z[i2.id] || (o2(c2.takeRecords()), c2.disconnect(), z[i2.id] = true, t2(true));
      }));
      ["keydown", "click"].forEach((function(e4) {
        addEventListener(e4, (function() {
          return O(m2);
        }), { once: true, capture: true });
      })), p(m2), a((function(r3) {
        i2 = f("LCP"), t2 = d(e3, i2, _, n2.reportAllChanges), l((function() {
          i2.value = performance.now() - r3.timeStamp, z[i2.id] = true, t2(true);
        }));
      }));
    }
  }));
};
var J = [800, 1800];
var K = function e2(n2) {
  document.prerendering ? C((function() {
    return e2(n2);
  })) : "complete" !== document.readyState ? addEventListener("load", (function() {
    return e2(n2);
  }), true) : setTimeout(n2, 0);
};
var Q = function(e3, n2) {
  n2 = n2 || {};
  var t2 = f("TTFB"), r2 = d(e3, t2, J, n2.reportAllChanges);
  K((function() {
    var i2 = c();
    i2 && (t2.value = Math.max(i2.responseStart - u(), 0), t2.entries = [i2], r2(true), a((function() {
      t2 = f("TTFB", 0), (r2 = d(e3, t2, J, n2.reportAllChanges))(true);
    })));
  }));
};
var U = { passive: true, capture: true };
var V = /* @__PURE__ */ new Date();
var W = function(e3, i2) {
  n || (n = i2, t = e3, r = /* @__PURE__ */ new Date(), Z(removeEventListener), X());
};
var X = function() {
  if (t >= 0 && t < r - V) {
    var e3 = { entryType: "first-input", name: n.type, target: n.target, cancelable: n.cancelable, startTime: n.timeStamp, processingStart: n.timeStamp + t };
    i.forEach((function(n2) {
      n2(e3);
    })), i = [];
  }
};
var Y = function(e3) {
  if (e3.cancelable) {
    var n2 = (e3.timeStamp > 1e12 ? /* @__PURE__ */ new Date() : performance.now()) - e3.timeStamp;
    "pointerdown" == e3.type ? (function(e4, n3) {
      var t2 = function() {
        W(e4, n3), i2();
      }, r2 = function() {
        i2();
      }, i2 = function() {
        removeEventListener("pointerup", t2, U), removeEventListener("pointercancel", r2, U);
      };
      addEventListener("pointerup", t2, U), addEventListener("pointercancel", r2, U);
    })(n2, e3) : W(n2, e3);
  }
};
var Z = function(e3) {
  ["mousedown", "keydown", "touchstart", "pointerdown"].forEach((function(n2) {
    return e3(n2, Y, U);
  }));
};
var $ = [100, 300];
var ee = function(e3, r2) {
  r2 = r2 || {}, C((function() {
    var o2, c2 = E(), u2 = f("FID"), l2 = function(e4) {
      e4.startTime < c2.firstHiddenTime && (u2.value = e4.processingStart - e4.startTime, u2.entries.push(e4), o2(true));
    }, m2 = function(e4) {
      e4.forEach(l2);
    }, h2 = s("first-input", m2);
    o2 = d(e3, u2, $, r2.reportAllChanges), h2 && (p(v((function() {
      m2(h2.takeRecords()), h2.disconnect();
    }))), a((function() {
      var a2;
      u2 = f("FID"), o2 = d(e3, u2, $, r2.reportAllChanges), i = [], t = -1, n = null, Z(addEventListener), a2 = l2, i.push(a2), X();
    })));
  }));
};

// node_modules/@splitsoftware/browser-rum-agent/esm/metrics/webVitals/index.js
function convertWebVitalsMetricToSplitEvent(_a) {
  var name = _a.name, value = _a.value, rating = _a.rating, navigationType = _a.navigationType;
  return {
    eventTypeId: "webvitals.".concat(name.toLowerCase()),
    value,
    properties: {
      rating,
      navigationType
    }
  };
}
function webVitals(options) {
  var reportOptions = objectAssign({
    onCLS: true,
    onINP: true,
    onLCP: true,
    onFCP: true,
    onTTFB: true,
    onFID: true
  }, isObject(options) && isObject(options.reportOptions) ? options.reportOptions : {});
  return function onWebVitals(ctx) {
    Object.keys(reportOptions).forEach(function(key) {
      if (reportOptions[key] !== false && web_vitals_exports[key]) {
        web_vitals_exports[key](function(metric) {
          ctx.track(convertWebVitalsMetricToSplitEvent(metric));
        }, isObject(reportOptions[key]) ? reportOptions[key] : void 0);
      }
    });
  };
}

// node_modules/@splitsoftware/browser-rum-agent/esm/config.js
var SplitRumAgent2 = (function(SplitRumAgent3) {
  var registerEventCollectors = true;
  var slimSetup = SplitRumAgent3.setup;
  SplitRumAgent3.setup = function setup(sdkKey, config) {
    slimSetup(sdkKey, config);
    if (isBrowser && registerEventCollectors) {
      registerEventCollectors = false;
      var eventCollectors = SplitRumAgent3.__getConfig().eventCollectors;
      if (eventCollectors.errors)
        SplitRumAgent3.register(errors());
      if (eventCollectors.navigationTiming)
        SplitRumAgent3.register(navigationTiming());
      if (eventCollectors.webVitals)
        SplitRumAgent3.register(webVitals(eventCollectors.webVitals === true ? void 0 : eventCollectors.webVitals));
    }
    return SplitRumAgent3;
  };
  return SplitRumAgent3;
})(globalRef.SplitRumAgent);

// node_modules/@splitsoftware/browser-rum-agent/esm/metrics/tti/tti-polyfill.js
var _ttiPolyfill;
function ttiPolyfill() {
  if (!_ttiPolyfill) {
    let l2 = function() {
      l2 = function() {
      };
      h2.Symbol || (h2.Symbol = m2);
    }, m2 = function(a2) {
      return "jscomp_symbol_" + (a2 || "") + n2++;
    }, p2 = function() {
      l2();
      var a2 = h2.Symbol.iterator;
      a2 || (a2 = h2.Symbol.iterator = h2.Symbol("iterator"));
      "function" != typeof Array.prototype[a2] && k2(Array.prototype, a2, { configurable: true, writable: true, value: function() {
        return q2(this);
      } });
      p2 = function() {
      };
    }, q2 = function(a2) {
      var b2 = 0;
      return r2(function() {
        return b2 < a2.length ? { done: false, value: a2[b2++] } : { done: true };
      });
    }, r2 = function(a2) {
      p2();
      a2 = { next: a2 };
      a2[h2.Symbol.iterator] = function() {
        return this;
      };
      return a2;
    }, t2 = function(a2) {
      p2();
      var b2 = a2[Symbol.iterator];
      return b2 ? b2.call(a2) : q2(a2);
    }, u2 = function(a2) {
      if (!(a2 instanceof Array)) {
        a2 = t2(a2);
        for (var b2, c2 = []; !(b2 = a2.next()).done; )
          c2.push(b2.value);
        a2 = c2;
      }
      return a2;
    }, w2 = function(a2, b2) {
      var c2 = XMLHttpRequest.prototype.send, d2 = v2++;
      XMLHttpRequest.prototype.send = function(f2) {
        for (var e3 = [], g2 = 0; g2 < arguments.length; ++g2)
          e3[g2 - 0] = arguments[g2];
        var E2 = this;
        a2(d2);
        this.addEventListener("readystatechange", function() {
          4 === E2.readyState && b2(d2);
        });
        return c2.apply(this, e3);
      };
    }, x2 = function(a2, b2) {
      var c2 = fetch;
      fetch = function(d2) {
        for (var f2 = [], e3 = 0; e3 < arguments.length; ++e3)
          f2[e3 - 0] = arguments[e3];
        return new Promise(function(d3, e4) {
          var g2 = v2++;
          a2(g2);
          c2.apply(null, [].concat(u2(f2))).then(function(a3) {
            b2(g2);
            d3(a3);
          }, function(a3) {
            b2(a3);
            e4(a3);
          });
        });
      };
    }, z2 = function(a2, b2) {
      a2 = t2(a2);
      for (var c2 = a2.next(); !c2.done; c2 = a2.next())
        if (c2 = c2.value, b2.includes(c2.nodeName.toLowerCase()) || z2(c2.children, b2))
          return true;
      return false;
    }, A2 = function(a2) {
      var b2 = new MutationObserver(function(c2) {
        c2 = t2(c2);
        for (var b3 = c2.next(); !b3.done; b3 = c2.next())
          b3 = b3.value, "childList" == b3.type && z2(b3.addedNodes, y2) ? a2(b3) : "attributes" == b3.type && y2.includes(b3.target.tagName.toLowerCase()) && a2(b3);
      });
      b2.observe(document, { attributes: true, childList: true, subtree: true, attributeFilter: ["href", "src"] });
      return b2;
    }, B2 = function(a2, b2) {
      if (2 < a2.length)
        return performance.now();
      var c2 = [];
      b2 = t2(b2);
      for (var d2 = b2.next(); !d2.done; d2 = b2.next())
        d2 = d2.value, c2.push({ timestamp: d2.start, type: "requestStart" }), c2.push({ timestamp: d2.end, type: "requestEnd" });
      b2 = t2(a2);
      for (d2 = b2.next(); !d2.done; d2 = b2.next())
        c2.push({ timestamp: d2.value, type: "requestStart" });
      c2.sort(function(a3, b3) {
        return a3.timestamp - b3.timestamp;
      });
      a2 = a2.length;
      for (b2 = c2.length - 1; 0 <= b2; b2--)
        switch (d2 = c2[b2], d2.type) {
          case "requestStart":
            a2--;
            break;
          case "requestEnd":
            a2++;
            if (2 < a2)
              return d2.timestamp;
            break;
          default:
            throw Error("Internal Error: This should never happen");
        }
      return 0;
    }, C2 = function(a2) {
      a2 = a2 ? a2 : {};
      this.w = !!a2.useMutationObserver;
      this.u = a2.minValue || null;
      a2 = window.__tti && window.__tti.e;
      var b2 = window.__tti && window.__tti.o;
      this.a = a2 ? a2.map(function(a3) {
        return { start: a3.startTime, end: a3.startTime + a3.duration };
      }) : [];
      b2 && b2.disconnect();
      this.b = [];
      this.f = /* @__PURE__ */ new Map();
      this.j = null;
      this.v = -Infinity;
      this.i = false;
      this.h = this.c = this.s = null;
      w2(this.m.bind(this), this.l.bind(this));
      x2(this.m.bind(this), this.l.bind(this));
      D2(this);
      this.w && (this.h = A2(this.B.bind(this)));
    }, F2 = function(a2) {
      a2.i = true;
      var b2 = 0 < a2.a.length ? a2.a[a2.a.length - 1].end : 0, c2 = B2(a2.g, a2.b);
      G2(a2, Math.max(c2 + 5e3, b2));
    }, G2 = function(a2, b2) {
      !a2.i || a2.v > b2 || (clearTimeout(a2.j), a2.j = setTimeout(function() {
        var b3 = performance.timing.navigationStart, d2 = B2(a2.g, a2.b), b3 = (window.a && window.a.A ? 1e3 * window.a.A().C - b3 : 0) || performance.timing.domContentLoadedEventEnd - b3;
        if (a2.u)
          var f2 = a2.u;
        else
          performance.timing.domContentLoadedEventEnd ? (f2 = performance.timing, f2 = f2.domContentLoadedEventEnd - f2.navigationStart) : f2 = null;
        var e3 = performance.now();
        null === f2 && G2(a2, Math.max(d2 + 5e3, e3 + 1e3));
        var g2 = a2.a;
        5e3 > e3 - d2 ? d2 = null : (d2 = g2.length ? g2[g2.length - 1].end : b3, d2 = 5e3 > e3 - d2 ? null : Math.max(d2, f2));
        d2 && (a2.s(d2), clearTimeout(a2.j), a2.i = false, a2.c && a2.c.disconnect(), a2.h && a2.h.disconnect());
        G2(a2, performance.now() + 1e3);
      }, b2 - performance.now()), a2.v = b2);
    }, D2 = function(a2) {
      a2.c = new PerformanceObserver(function(b2) {
        b2 = t2(b2.getEntries());
        for (var c2 = b2.next(); !c2.done; c2 = b2.next())
          if (c2 = c2.value, "resource" === c2.entryType && (a2.b.push({ start: c2.fetchStart, end: c2.responseEnd }), G2(a2, B2(a2.g, a2.b) + 5e3)), "longtask" === c2.entryType) {
            var d2 = c2.startTime + c2.duration;
            a2.a.push({ start: c2.startTime, end: d2 });
            G2(a2, d2 + 5e3);
          }
      });
      a2.c.observe({ entryTypes: ["longtask", "resource"] });
    };
    var h2 = "undefined" != typeof window ? window : "undefined" != typeof global && null != global ? global : this, k2 = "function" == typeof Object.defineProperties ? Object.defineProperty : function(a2, b2, c2) {
      a2 != Array.prototype && a2 != Object.prototype && (a2[b2] = c2.value);
    };
    var n2 = 0;
    var v2 = 0;
    var y2 = "img script iframe link audio video source".split(" ");
    C2.prototype.getFirstConsistentlyInteractive = function() {
      var a2 = this;
      return new Promise(function(b2) {
        a2.s = b2;
        "complete" == document.readyState ? F2(a2) : window.addEventListener("load", function() {
          F2(a2);
        });
      });
    };
    C2.prototype.m = function(a2) {
      this.f.set(a2, performance.now());
    };
    C2.prototype.l = function(a2) {
      this.f.delete(a2);
    };
    C2.prototype.B = function() {
      G2(this, performance.now() + 5e3);
    };
    h2.Object.defineProperties(C2.prototype, { g: { configurable: true, enumerable: true, get: function() {
      return [].concat(u2(this.f.values()));
    } } });
    _ttiPolyfill = { getFirstConsistentlyInteractive: function(a2) {
      a2 = a2 ? a2 : {};
      return "PerformanceLongTaskTiming" in window ? new C2(a2).getFirstConsistentlyInteractive() : Promise.resolve(null);
    } };
  }
  return _ttiPolyfill;
}

// node_modules/@splitsoftware/browser-rum-agent/esm/metrics/tti/index.js
function tti() {
  return function(ctx) {
    if (!("Promise" in window)) {
      log.error("Promise API is not supported. Time-to-Interactive metric will not be collected.");
      return;
    }
    try {
      ttiPolyfill().getFirstConsistentlyInteractive().then(function(tti2) {
        if (typeof tti2 === "number") {
          ctx.track({
            eventTypeId: "time.to.interactive",
            value: tti2
          });
        }
      }).catch(function() {
      });
    } catch (e3) {
      log.error("Failed to collect Time-to-Interactive metric. " + e3);
    }
  };
}

// node_modules/@splitsoftware/browser-rum-agent/esm/metrics/routeChanges/onRouteChange.js
function onRouteChange(callback) {
  var fromUrl = getRoute();
  function handleRouteChange(historyChangeSource) {
    var toUrl = getRoute();
    if (toUrl !== fromUrl) {
      var routeChange_1 = { historyChangeSource, fromUrl, toUrl };
      setTimeout(function() {
        return callback(routeChange_1);
      });
      fromUrl = toUrl;
    }
  }
  if (window.history) {
    ["pushState", "replaceState"].forEach(function(method) {
      if (typeof history[method] === "function") {
        var originalMethod_1 = history[method];
        Object.defineProperty(history, method, {
          value: function() {
            var result = originalMethod_1.apply(this, arguments);
            handleRouteChange(method);
            return result;
          },
          writable: true,
          configurable: true
          // to let other libraries spy history methods
        });
      }
    });
  }
  var handlePopstate = function() {
    return handleRouteChange("popstate");
  };
  window.addEventListener("popstate", handlePopstate);
  return {
    flush: function() {
    },
    // Stop callback from receiving new entries
    disconnect: function() {
      window.removeEventListener("popstate", handlePopstate);
      callback = function() {
      };
    }
  };
}

// node_modules/@splitsoftware/browser-rum-agent/esm/metrics/routeChanges/performanceEntries.js
var ENTRY_TYPES = ["resource", "longtask"];
function performanceEntries(quietWindowMs) {
  if (typeof window === "undefined" || !window.performance || !window.performance.getEntries || !window.PerformanceObserver)
    return;
  var entries = performance.getEntries().filter(function(entry) {
    return ENTRY_TYPES.includes(entry.entryType);
  });
  function addEntry(entry) {
    entries.push(entry);
    entries.sort(function(a2, b2) {
      return a2.startTime - b2.startTime;
    });
  }
  var po;
  try {
    po = new PerformanceObserver(function(list) {
      list.getEntries().forEach(addEntry);
    });
    po.observe({ entryTypes: ENTRY_TYPES });
  } catch (e3) {
    return;
  }
  function popBlock(timestamp) {
    if (entries.length === 0)
      return;
    var endIndex = 0;
    var endTime = entries[endIndex].startTime + entries[endIndex].duration;
    while (endIndex < entries.length - 1 && endTime + quietWindowMs >= entries[endIndex + 1].startTime) {
      endIndex++;
      endTime = Math.max(endTime, entries[endIndex].startTime + entries[endIndex].duration);
    }
    if (timestamp && endIndex === entries.length - 1 && endTime + quietWindowMs >= timestamp)
      return;
    return {
      block: entries.splice(0, endIndex + 1),
      endTime
    };
  }
  return objectAssign(entries, {
    addEntry,
    popBlock,
    disconnect: function() {
      po.disconnect();
    }
  });
}

// node_modules/@splitsoftware/browser-rum-agent/esm/metrics/routeChanges/onRouteChangeTiming.js
var DEFAULT_QUIET_WINDOW_MILLIS = 50;
var DEFAULT_WAIT_WINDOW_MILLIS = 5e3;
var ROUTE_CHANGE_ENTRY_NAME = "routeChange";
function onRouteChangeTiming(callback, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.filter, filter = _a === void 0 ? function() {
    return true;
  } : _a, waitWindowMs = DEFAULT_WAIT_WINDOW_MILLIS, quietWindowMs = DEFAULT_QUIET_WINDOW_MILLIS;
  var entries = performanceEntries(quietWindowMs);
  if (!entries) {
    log.warn("Performance API is not supported. Route change events will be collected without timing values.");
    return onRouteChange(function(routeChangeEntry) {
      if (filter(routeChangeEntry))
        callback(routeChangeEntry);
    });
  }
  var lastEndTime = 0;
  function calculateRouteChangeTimes(timestamp) {
    if (timestamp === void 0) {
      timestamp = performance.now();
    }
    var block;
    while (block = entries.popBlock(timestamp)) {
      var routeChangeEntries = block.block.filter(function(entry) {
        return entry.entryType === ROUTE_CHANGE_ENTRY_NAME;
      });
      if (routeChangeEntries.length) {
        var startTime = block.block[0].startTime;
        var duration = block.endTime - startTime;
        callback(objectAssign(routeChangeEntries[0], {
          startTime,
          duration,
          fromUrl: routeChangeEntries[0].fromUrl,
          toUrl: routeChangeEntries[routeChangeEntries.length - 1].toUrl,
          timeOnRoute: startTime - lastEndTime
        }));
        lastEndTime = block.endTime;
      }
    }
  }
  var timerId;
  function routeChangeListener(routeChangeEntry) {
    if (!filter(routeChangeEntry))
      return;
    objectAssign(routeChangeEntry, {
      entryType: ROUTE_CHANGE_ENTRY_NAME,
      startTime: performance.now(),
      duration: 0
    });
    entries.addEntry(routeChangeEntry);
    clearTimeout(timerId);
    timerId = setTimeout(calculateRouteChangeTimes, waitWindowMs);
  }
  var routeChangeObserver = onRouteChange(routeChangeListener);
  return {
    // Process pending entries
    flush: function() {
      calculateRouteChangeTimes(false);
    },
    // Cleanup resources and process pending entries
    disconnect: function() {
      entries.disconnect();
      routeChangeObserver.disconnect();
      clearTimeout(timerId);
      calculateRouteChangeTimes(false);
    }
  };
}

// node_modules/@splitsoftware/browser-rum-agent/esm/metrics/routeChanges/index.js
function routeChanges(options) {
  if (options === void 0) {
    options = {};
  }
  return function(ctx) {
    function convertToSplitEvent(routeChangeEntry) {
      ctx.track({
        eventTypeId: "route.change",
        value: routeChangeEntry.duration,
        properties: routeChangeEntry
      });
    }
    return {
      flush: onRouteChangeTiming(convertToSplitEvent, options).flush
    };
  };
}
export {
  SplitRumAgent2 as SplitRumAgent,
  routeChanges,
  tti
};

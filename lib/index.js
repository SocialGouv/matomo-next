"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = init;
exports.push = push;
exports["default"] = void 0;

var _router = _interopRequireDefault(require("next/router"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function init(_ref) {
  var url = _ref.url,
      siteId = _ref.siteId,
      _ref$jsTrackerFile = _ref.jsTrackerFile,
      jsTrackerFile = _ref$jsTrackerFile === void 0 ? "matomo.js" : _ref$jsTrackerFile,
      _ref$phpTrackerFile = _ref.phpTrackerFile,
      phpTrackerFile = _ref$phpTrackerFile === void 0 ? "matomo.php" : _ref$phpTrackerFile;
  window._paq = window._paq || [];

  if (!url) {
    console.warn("Matomo disabled, please provide matomo url");
    return;
  }

  var previousPath = ""; // order is important -_- so campaign are detected

  push(["trackPageView"]);
  push(["enableLinkTracking"]);
  push(["setTrackerUrl", "".concat(url, "/").concat(phpTrackerFile)]);
  push(["setSiteId", siteId]);
  /**
   * for intial loading we use the location.pathname
   * as the first url visited.
   * Once user navigate accross the site,
   * we rely on Router.pathname
   */

  var scriptElement = document.createElement("script");
  var refElement = document.getElementsByTagName("script")[0];
  scriptElement.type = "text/javascript";
  scriptElement.async = true;
  scriptElement.defer = true;
  scriptElement.src = "".concat(url, "/").concat(jsTrackerFile);
  refElement.parentNode.insertBefore(scriptElement, refElement);
  previousPath = location.pathname;

  _router["default"].events.on("routeChangeComplete", function (path) {
    // We use only the part of the url without the querystring to ensure piwik is happy
    // It seems that piwik doesn't track well page with querystring
    var _path$split = path.split("?"),
        _path$split2 = _slicedToArray(_path$split, 1),
        pathname = _path$split2[0]; // In order to ensure that the page title had been updated,
    // we delayed pushing the tracking to the next tick.


    setTimeout(function () {
      var q = _router["default"].query.q;

      if (previousPath) {
        push(["setReferrerUrl", "".concat(previousPath)]);
      }

      push(["setCustomUrl", pathname]);
      push(["setDocumentTitle", document.title]);
      push(["deleteCustomVariables", "page"]);
      push(["setGenerationTimeMs", 0]);

      if (/^\/recherche/.test(pathname) || /^\/search/.test(pathname)) {
        push(["trackSiteSearch", q]);
      } else {
        push(["trackPageView"]);
      }

      push(["enableLinkTracking"]);
      previousPath = pathname;
    }, 0);
  });
}

function push(args) {
  window._paq.push(args);
}

var _default = init;
exports["default"] = _default;
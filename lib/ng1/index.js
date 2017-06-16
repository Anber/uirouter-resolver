"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var angular_1 = require("angular");
var angularjs_1 = require("@uirouter/angularjs");
var MODULE_NAME = 'uiRouterResolver';
var module = angular_1.default.module(MODULE_NAME, [angularjs_1.default]);
module.provider('$resolveCache', function $resolveCache() {
    var _this = this;
    var cache = new Set();
    this.flush = function (resolver) {
        if (!resolver.token) {
            cache.forEach(function (cacheEl) {
                if (cacheEl.token === resolver) {
                    cache.delete(cacheEl);
                }
            });
        }
        else {
            if (!cache.has(resolver))
                return;
            cache.delete(resolver);
        }
    };
    this.isCached = function (resolver) { return cache.has(resolver); };
    function markAsCached(resolver) {
        if (cache.has(resolver))
            return;
        cache.add(resolver);
    }
    this.$get = function () { return ({
        markAsCached: markAsCached,
        flush: _this.flush,
        isCached: _this.isCached,
    }); };
});
module.config(['$provide', function ($provide) {
        $provide.decorator('$state', ['$delegate', '$resolveCache', function ($delegate, $resolveCache) {
                // eslint-disable-next-line no-param-reassign
                $delegate.flushCache = function () {
                    var tokens = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        tokens[_i] = arguments[_i];
                    }
                    tokens.forEach(function (token) { return $resolveCache.flush(token); });
                    return $delegate;
                };
                return $delegate;
            }]);
    }]);
module.config(['$transitionsProvider', '$resolveCacheProvider', function ($transitionsProvider, $resolveCacheProvider) {
        'ngInject';
        function flushResolve(resolve) {
            if (angularjs_1.isArray(resolve)) {
                resolve.forEach($resolveCacheProvider.flush);
            }
            else {
                angularjs_1.forEach(resolve, function (v, token) { return $resolveCacheProvider.flush(token); });
            }
        }
        $transitionsProvider.onBefore({}, function (trans) {
            var entering = trans.entering();
            trans.exiting().filter(function (state) { return entering.indexOf(state) === -1; }).forEach(function (state) {
                if (state.resolve) {
                    flushResolve(state.resolve);
                }
                if (state.views) {
                    angularjs_1.values(state.views).forEach(function (view) {
                        if (view && view.resolve) {
                            flushResolve(view.resolve);
                        }
                    });
                }
            });
            var tokens = trans.options().custom.flush;
            if (tokens) {
                tokens.forEach(function (token) { return $resolveCacheProvider.flush(token); });
            }
        });
    }]);
exports.default = MODULE_NAME;
//# sourceMappingURL=index.js.map
import angular from 'angular';
import uiRouter from '@uirouter/angularjs';
var MODULE_NAME = 'uiRouterResolver';
var module = angular.module(MODULE_NAME, [uiRouter]);
module.provider('$resolveCache', function $resolveCache() {
    var _this = this;
    var cache = new Map();
    this.flush = function (token) {
        if (!cache.has(token))
            return;
        cache.get(token)();
        cache.delete(token);
    };
    this.isCached = function (token) { return cache.has(token); };
    function markAsCached($transitions, token) {
        var _this = this;
        if (cache.has(token))
            return;
        var onBeforeHook = $transitions.onBefore({
            to: function (state) { return !state.path
                .reduce(function (acc, el) { return acc.concat(el.resolvables); }, [])
                .map(function (r) { return r.token; })
                .includes(token); },
        }, function () {
            _this.flush(token);
        });
        cache.set(token, onBeforeHook);
    }
    this.$get = ['$transitions', function ($transitions) { return ({
            markAsCached: markAsCached.bind(_this, $transitions),
            flush: _this.flush,
            isCached: _this.isCached,
        }); }];
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
        $transitionsProvider.onBefore({}, function (trans) {
            var tokens = trans.options().custom.flush;
            if (tokens) {
                tokens.forEach(function (token) { return $resolveCacheProvider.flush(token); });
            }
        });
    }]);
export default MODULE_NAME;
//# sourceMappingURL=index.js.map
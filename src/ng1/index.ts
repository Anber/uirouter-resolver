import angular from 'angular';
import uiRouter, { values, isArray, forEach } from '@uirouter/angularjs';

const MODULE_NAME = 'uiRouterResolver';

const module = angular.module(MODULE_NAME, [uiRouter]);

module.provider('$resolveCache', function $resolveCache() {
    const cache = new Set();

    this.flush = (resolver) => {
        if (!resolver.token) {
            cache.forEach((cacheEl) => {
                if (cacheEl.token === resolver) {
                    cache.delete(cacheEl);
                }
            });
        } else {
            if (!cache.has(resolver)) return;
            cache.delete(resolver);
        }
    };

    this.isCached = resolver => cache.has(resolver);

    function markAsCached(resolver) {
        if (cache.has(resolver)) return;
        cache.add(resolver);
    }

    this.$get = () => ({
        markAsCached: markAsCached,
        flush: this.flush,
        isCached: this.isCached,
    });
});

module.config(['$provide', ($provide) => {
    $provide.decorator('$state', ['$delegate', '$resolveCache', ($delegate, $resolveCache) => {
        // eslint-disable-next-line no-param-reassign
        $delegate.flushCache = (...tokens) => {
            tokens.forEach(token => $resolveCache.flush(token));
            return $delegate;
        };

        return $delegate;
    }]);
}]);

module.config(['$transitionsProvider', '$resolveCacheProvider', ($transitionsProvider, $resolveCacheProvider) => {
    'ngInject';

    function flushResolve(resolve) {
        if (isArray(resolve)) {
            resolve.forEach($resolveCacheProvider.flush);
        } else {
            forEach(resolve, (v, token) => $resolveCacheProvider.flush(token));
        }
    }

    $transitionsProvider.onBefore({}, (trans) => {
        const entering = trans.entering();
        trans.exiting().filter(state => entering.indexOf(state) === -1).forEach((state) => {
            if (state.resolve) {
                flushResolve(state.resolve);
            }

            if (state.views) {
                values(state.views).forEach((view : any) => {
                    if (view && view.resolve) {
                        flushResolve(view.resolve);
                    }
                });
            }
        });

        const { custom: { flush: tokens } } = trans.options();
        if (tokens) {
            tokens.forEach(token => $resolveCacheProvider.flush(token));
        }
    });
}]);

export default MODULE_NAME;

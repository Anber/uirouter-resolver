import angular from 'angular';
import uiRouter from '@uirouter/angularjs';

const MODULE_NAME = 'uiRouterResolver';

const module = angular.module(MODULE_NAME, [uiRouter]);

module.provider('$resolveCache', function $resolveCache() {
    const cache = new Map();

    this.flush = (token) => {
        if (!cache.has(token)) return;

        cache.get(token)();
        cache.delete(token);
    };

    this.isCached = token => cache.has(token);

    function markAsCached($transitions, token) {
        if (cache.has(token)) return;

        const onBeforeHook = $transitions.onBefore(
            {
                to: state => !state.path
                    .reduce((acc, el) => [...acc, ...el.resolvables], [])
                    .map(r => r.token)
                    .includes(token),
            },
            () => {
                this.flush(token);
            },
        );

        cache.set(token, onBeforeHook);
    }

    this.$get = ['$transitions', ($transitions) => ({
        markAsCached: markAsCached.bind(this, $transitions),
        flush: this.flush,
        isCached: this.isCached,
    })];
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

    $transitionsProvider.onBefore({}, (trans) => {
        const { custom: { flush: tokens } } = trans.options();
        if (tokens) {
            tokens.forEach(token => $resolveCacheProvider.flush(token));
        }
    });
}]);

export default MODULE_NAME;

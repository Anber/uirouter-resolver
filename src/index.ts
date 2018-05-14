import { Transition, ResolvableLiteral, UIInjector, ResolvePolicy, equals, extend, isPromise, any } from '@uirouter/core';

export type DsMethod = 'many' | 'one';
export type ResolveFn = (...any) => Promise<Object>;
export type OnResolveFn = (any) => any;
export type OnRejectFn = (any) => any;
export type DatasourceCreator<TEntity> = (UIInjector) => IDatasource<TEntity>;
export type Datasource<TEntity> = String | IDatasource<TEntity> | DatasourceCreator<TEntity>;

export class Getter {
    deps: Array<string>;
    fn: (...any) => Object;

    constructor(fn: (...any) => Object, deps: Array<string>) {
        this.fn = fn;
        this.deps = deps;
    }

    static empty : Getter = new Getter(() => ({}), []);
}

interface IResolveCache {
    isCached(literal: ResolvableLiteral): boolean;
    markAsCached(literal: ResolvableLiteral): void;
    flush(literal: ResolvableLiteral): void;
}

export interface IDatasource<TRes> {
    create(args): Promise<TRes>;
    one(args): Promise<TRes>;
    many(args): Promise<Array<TRes>>;
}

export interface IResolverParams {
    memoize?: boolean;
    argsGetter?: Getter;
    cacheDepsGetter?: Getter;
    datasourceMethod?: DsMethod;
    handlers?: Array<[OnResolveFn, OnRejectFn]>;
    skipIfTests?: Array<Getter>;

    token?: String;
    data?: any;
    policy?: ResolvePolicy;
}

export interface ICreateResolver extends ResolvableLiteral {
    as(token: String): ResolvableLiteral;
}

function memoizeResolveFn(
    literal: ResolvableLiteral,
    argsGetter: (...any) => Object,
    cacheDepsGetter: Getter,
    resolveFn: ResolveFn,
) : ResolveFn {
    let lastArgs = null;
    let lastRes = null;

    return ($transition$ : Transition, ...deps : Array<any>) => {
        function continuation(getterArgs : any[]) {
            const cacheDeps = cacheDepsGetter.fn(...getterArgs);
            const args = extend({}, cacheDeps, argsGetter(...deps));

            if (equals(args, lastArgs) && $resolveCache.isCached(literal)) {
                return lastRes;
            }

            lastArgs = args;
            lastRes = resolveFn($transition$, ...deps);
            $resolveCache.markAsCached(literal);

            return lastRes;
        }

        const injector = $transition$.injector();

        const $resolveCache = injector.get<IResolveCache>('$resolveCache');
        const $q = injector.get<PromiseConstructor>('$q');
        try {
            return continuation(cacheDepsGetter.deps.map(d => injector.get(d)));
        } catch (ex) {
            return $q.all(cacheDepsGetter.deps.map(d => injector.getAsync(d))).then(continuation);
        }
    };
}

const defaultParams : IResolverParams = {
    memoize: true,
    argsGetter: Getter.empty,
    cacheDepsGetter: Getter.empty,
    datasourceMethod: 'many',
    handlers: [],
    skipIfTests: [],
};

type GetDatasource<TEntity> = (UIInjector?) => Datasource<TEntity>;

function getOrResolve(injector, token) {
    try {
        return injector.get(token);
    } catch (ex) {
        return injector.getAsync(token);
    }
}

function makeInjectable(target, key, descriptor = Object.getOwnPropertyDescriptor(target, key)) {
    const originalMethod = descriptor.value;

    descriptor.value = function (fn, deps = (fn && fn.$inject) || []) {
        if (Array.isArray(fn)) {
            const annotatedFn = fn.pop();
            return originalMethod.apply(this, [annotatedFn, fn]);
        }

        return originalMethod.apply(this, [fn, deps]);
    };

    return descriptor;
}

export default class Resolver<TEntity> implements ResolvableLiteral {
    private params: IResolverParams;
    private getDatasource: GetDatasource<TEntity>;
    private cachedResolveFn : ResolveFn;

    /**
     * Create a new instance of {Resolver}
     * @param {string|IDatasource} datasource — name of injectable datasource or IDatasource instance
     * @param {IResolverParams} resolvableLiteral used to describe a {Resolvable}
     */
    constructor(datasource : Datasource<TEntity>, resolvableLiteral = {}) {
        if (typeof datasource === 'string') {
            this.getDatasource = (injector : UIInjector) => (
                injector ? injector.get<IDatasource<TEntity>>(datasource) : datasource
            );
        } else if (typeof datasource === 'function') {
            this.getDatasource = (injector : UIInjector) => (injector ? datasource(injector) : datasource);
        } else {
            this.getDatasource = () => datasource;
        }

        this.params = extend({}, defaultParams, resolvableLiteral);
    }

    /**
     * The Dependency Injection token that will be used to inject/access the resolvable.
     * @returns {string}
     */
    get token() : String {
        return this.params.token;
    }

    /**
     * The function that returns the resolved value or a promise for the resolved value.
     * @returns {ResolveFn}
     */
    get resolveFn() : ResolveFn {
        let resolveFn = this.cachedResolveFn;
        if (resolveFn) {
            return resolveFn;
        }

        const skipIfTests = this.params.skipIfTests;
        const handlers = this.params.handlers;
        const argsGetter = this.params.argsGetter.fn;
        const cacheDepsGetter = this.params.cacheDepsGetter;
        const datasourceMethod = this.params.datasourceMethod;

        resolveFn = ($transition$, ...deps) => {
            const injector = $transition$.injector();
            const datasource = this.getDatasource(injector) as IDatasource<TEntity>;
            const args = argsGetter(...deps);
            const result = datasource[datasourceMethod](args) as Promise<any>;
            return handlers.reduce((res, [onResolve, onError]) => res.then(onResolve, onError), result);
        };

        if (this.params.memoize) {
            resolveFn = memoizeResolveFn(this, argsGetter, cacheDepsGetter, resolveFn);
        }

        if (skipIfTests.length) {
            resolveFn = skipIfTests.reduce(
                (res, { deps, fn: testFn }) => ($transition$, ...args) => {
                    const injector = $transition$.injector();
                    const $q = injector.get('$q');
                    const resolvedDeps = deps.map(depName => getOrResolve(injector, depName));
                    if (any(isPromise)(resolvedDeps)) {
                        return $q.all(resolvedDeps)
                            .then(values => testFn(...values))
                            .then(skip => (skip ? undefined : res($transition$, ...args)));
                    } else {
                        return testFn(...resolvedDeps) ? undefined : res($transition$, ...args);
                    }
                },
                resolveFn,
            );
        }

        this.cachedResolveFn = resolveFn;
        return resolveFn;
    }

    /**
     * The Dependency Injection tokens for dependencies of the {resolveFn}.
     * The DI tokens are references to other {Resolvables}, or to global services.
     * @returns {Array<String>}
     */
    get deps() : Array<String> {
        return ['$transition$', ...this.params.argsGetter.deps];
    }

    /**
     * Pre-resolved value.
     * @returns {*}
     */
    get data() : any {
        return this.params.data;
    }

    /**
     * A policy that defines when to invoke the resolve, and whether to wait for async and unwrap the data.
     * @returns {ResolvePolicy}
     */
    get policy() : ResolvePolicy {
        return this.params.policy || { async: 'WAIT', when: 'LAZY' };
    }

    /**
     * Clone current {Resolver} and replace some parameters
     * @param {object} params — replaced parameters
     * @returns {Resolver} new instance of {Resolver}
     */
    clone(params : IResolverParams) : Resolver<TEntity> {
        const ds = this.getDatasource();
        if (!params) return new Resolver(ds, this.params);

        return new Resolver(ds, extend({}, this.params, params));
    }

    /**
     * Set resolve-policy to async:NOWAIT
     * @returns {Resolver} new instance of {Resolver}
     */
    noWait() : Resolver<TEntity> {
        const { when } = this.policy;
        return this.clone({ policy: { when, async: 'NOWAIT' } });
    }

    /**
     * Set resolve-policy to when:EAGER
     * @returns {Resolver} new instance of {Resolver}
     */
    eager() : Resolver<TEntity> {
        const { async } = this.policy;
        return this.clone({ policy: { async, when: 'EAGER' } });
    }

    /**
     * Add response handlers
     * @returns {Resolver} new instance of {Resolver}
     */
    then(onResolve, onReject = undefined) : Resolver<TEntity> {
        const callbacks = this.params.handlers;
        return this.clone({ handlers: [...callbacks, [onResolve, onReject]] });
    }

    /**
     * Add error catcher
     * @returns {Resolver} new instance of {Resolver}
     */
    catch(callback) : Resolver<TEntity> {
        return this.then(undefined, callback);
    }

    /**
     * Skip resolve if {testFn} returns true
     * @returns {Resolver} new instance of {Resolver}
     */
    @makeInjectable
    skipIf(fn, deps) : Resolver<TEntity> {
        const fns = this.params.skipIfTests;
        return this.clone({ skipIfTests: [...fns, { deps, fn }] });
    }

    /**
     * Set resolve-token name
     * @param {string} token name for resolver
     * @returns {Resolver} new instance of {Resolver} with token
     */
    as(token) : Resolver<TEntity> {
        return this.clone({ token });
    }

    /**
     * Set arguments resolver
     * @param {function|Array} fn — arguments creator
     * @param {Array} deps — dependencies for {fn}
     * @returns {Resolver} new instance of {Resolver} with resolve function
     */
    @makeInjectable
    args(fn, deps) : Resolver<TEntity> {
        return this.clone({
            argsGetter: {
                deps,
                fn,
            },
        });
    }

    /**
     * Additional cache dependency (cache will be flushed if it's changed)
     * @returns {Resolver} new instance of {Resolver}
     */
    @makeInjectable
    cacheDeps(fn, deps) : Resolver<TEntity> {
        return this.clone({
            cacheDepsGetter: {
                deps,
                fn,
            },
        });
    }

    /**
     * Disable cache for query
     * @returns {Resolver} new instance of {Resolver}
     */
    disableCache() : Resolver<TEntity> {
        return this.clone({ memoize: false });
    }

    toString() : String {
        return this.getDatasource().toString();
    }

    /**
     * Creates new instance of model
     * @param {function|Array} fn — formData creator
     * @param {Array} deps — dependencies for {fn}
     * @returns {ICreateResolver}
     */
    @makeInjectable
    create(fn, deps) : ICreateResolver {
        const createLiteral = {
            deps: ['$transition$', ...deps],
            resolveFn: ($transition$, ...args) => {
                const datasource = this.getDatasource($transition$.injector()) as IDatasource<TEntity>;
                return datasource.create(fn && fn(...args));
            },
            token: null,
        };

        const setToken = token => extend({}, createLiteral, { token });

        return extend({}, createLiteral, { as: setToken });
    }

    /**
     * Get some elements
     * @returns {Resolver} new instance of {Resolver}
     */
    many() : Resolver<TEntity> {
        return this.clone({ datasourceMethod: 'many' });
    }

    /**
     * Get one element
     * @returns {Resolver} new instance of {Resolver}
     */
    one() : Resolver<TEntity> {
        return this.clone({ datasourceMethod: 'one' });
    }
}

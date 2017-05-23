"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@uirouter/core");
var Getter = (function () {
    function Getter(fn, deps) {
        this.fn = fn;
        this.deps = deps;
    }
    return Getter;
}());
Getter.empty = new Getter(function () { return ({}); }, []);
exports.Getter = Getter;
function memoizeResolveFn(token, argsGetter, cacheDepsGetter, resolveFn) {
    var _this = this;
    var lastArgs = null;
    var lastRes = null;
    return function ($transition$) {
        var deps = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            deps[_i - 1] = arguments[_i];
        }
        return __awaiter(_this, void 0, void 0, function () {
            var injector, $resolveCache, cacheDeps, _a, _b, _c, args;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        injector = $transition$.injector();
                        $resolveCache = injector.get('$resolveCache');
                        _b = (_a = cacheDepsGetter.fn).apply;
                        _c = [cacheDepsGetter];
                        return [4 /*yield*/, Promise.all(cacheDepsGetter.deps.map(function (d) { return injector.getAsync(d); }))];
                    case 1:
                        cacheDeps = _b.apply(_a, _c.concat([_d.sent()]));
                        args = core_1.extend({}, cacheDeps, argsGetter.apply(void 0, deps));
                        if (core_1.equals(args, lastArgs) && $resolveCache.isCached(token)) {
                            return [2 /*return*/, lastRes];
                        }
                        lastArgs = args;
                        lastRes = resolveFn.apply(void 0, [$transition$].concat(deps));
                        $resolveCache.markAsCached(token);
                        return [2 /*return*/, lastRes];
                }
            });
        });
    };
}
var defaultParams = {
    memoize: true,
    argsGetter: Getter.empty,
    cacheDepsGetter: Getter.empty,
    datasourceMethod: 'many',
    postprocessors: [],
    onError: [],
    skipIfTests: [],
};
function makeInjectable(target, key, descriptor) {
    if (descriptor === void 0) { descriptor = Object.getOwnPropertyDescriptor(target, key); }
    var originalMethod = descriptor.value;
    descriptor.value = function (fn, deps) {
        if (deps === void 0) { deps = (fn && fn.$inject) || []; }
        if (Array.isArray(fn)) {
            var annotatedFn = fn.pop();
            return originalMethod.apply(this, [annotatedFn, fn]);
        }
        return originalMethod.apply(this, [fn, deps]);
    };
    return descriptor;
}
var Resolver = (function () {
    /**
     * Create a new instance of {Resolver}
     * @param {string|IDatasource} datasource — name of injectable datasource or IDatasource instance
     * @param {IResolverParams} resolvableLiteral used to describe a {Resolvable}
     */
    function Resolver(datasource, resolvableLiteral) {
        if (resolvableLiteral === void 0) { resolvableLiteral = {}; }
        if (typeof datasource === 'string') {
            this.getDatasource = function (injector) { return (injector ? injector.get(datasource) : datasource); };
        }
        else {
            this.getDatasource = function () { return datasource; };
        }
        this.params = core_1.extend({}, defaultParams, resolvableLiteral);
    }
    Object.defineProperty(Resolver.prototype, "token", {
        /**
         * The Dependency Injection token that will be used to inject/access the resolvable.
         * @returns {string}
         */
        get: function () {
            return this.params.token;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Resolver.prototype, "resolveFn", {
        /**
         * The function that returns the resolved value or a promise for the resolved value.
         * @returns {ResolveFn}
         */
        get: function () {
            var _this = this;
            var resolveFn = this.cachedResolveFn;
            if (resolveFn) {
                return resolveFn;
            }
            var skipIfTests = this.params.skipIfTests;
            var onError = this.params.onError;
            var postprocessors = this.params.postprocessors;
            var token = this.params.token;
            var argsGetter = this.params.argsGetter.fn;
            var cacheDepsGetter = this.params.cacheDepsGetter;
            var datasourceMethod = this.params.datasourceMethod;
            resolveFn = function ($transition$) {
                var deps = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    deps[_i - 1] = arguments[_i];
                }
                var injector = $transition$.injector();
                var datasource = _this.getDatasource(injector);
                var args = argsGetter.apply(void 0, deps);
                var result = datasource[datasourceMethod](args);
                var promise = postprocessors.reduce(function (res, fn) { return res.then(function (data) { return fn(data); }); }, result);
                if (onError.length) {
                    promise = promise.catch(function (error) { return onError.reduce(function (res, fn) { return fn(res); }, error); });
                }
                return promise;
            };
            if (this.params.memoize) {
                resolveFn = memoizeResolveFn(token, argsGetter, cacheDepsGetter, resolveFn);
            }
            if (skipIfTests.length) {
                resolveFn = skipIfTests.reduce(function (res, _a) {
                    var deps = _a.deps, testFn = _a.fn;
                    return function ($transition$) {
                        var args = [];
                        for (var _i = 1; _i < arguments.length; _i++) {
                            args[_i - 1] = arguments[_i];
                        }
                        var injector = $transition$.injector();
                        return Promise.all(deps.map(function (depName) { return injector.getAsync(depName); }))
                            .then(function (values) { return testFn.apply(void 0, values); })
                            .then(function (skip) { return (skip ? undefined : res.apply(void 0, [$transition$].concat(args))); });
                    };
                }, resolveFn);
            }
            this.cachedResolveFn = resolveFn;
            return resolveFn;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Resolver.prototype, "deps", {
        /**
         * The Dependency Injection tokens for dependencies of the {resolveFn}.
         * The DI tokens are references to other {Resolvables}, or to global services.
         * @returns {Array<String>}
         */
        get: function () {
            return ['$transition$'].concat(this.params.argsGetter.deps);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Resolver.prototype, "data", {
        /**
         * Pre-resolved value.
         * @returns {*}
         */
        get: function () {
            return this.params.data;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Resolver.prototype, "policy", {
        /**
         * A policy that defines when to invoke the resolve, and whether to wait for async and unwrap the data.
         * @returns {ResolvePolicy}
         */
        get: function () {
            return this.params.policy || { async: 'WAIT', when: 'LAZY' };
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Clone current {Resolver} and replace some parameters
     * @param {object} params — replaced parameters
     * @returns {Resolver} new instance of {Resolver}
     */
    Resolver.prototype.clone = function (params) {
        var ds = this.getDatasource();
        if (!params)
            return new Resolver(ds, this.params);
        return new Resolver(ds, core_1.extend({}, this.params, params));
    };
    /**
     * Set resolve-policy to async:NOWAIT
     * @returns {Resolver} new instance of {Resolver}
     */
    Resolver.prototype.noWait = function () {
        var when = this.policy.when;
        return this.clone({ policy: { when: when, async: 'NOWAIT' } });
    };
    /**
     * Set resolve-policy to when:EAGER
     * @returns {Resolver} new instance of {Resolver}
     */
    Resolver.prototype.eager = function () {
        var async = this.policy.async;
        return this.clone({ policy: { async: async, when: 'EAGER' } });
    };
    /**
     * Add response postprocessor
     * @returns {Resolver} new instance of {Resolver}
     */
    Resolver.prototype.then = function (callback) {
        var callbacks = this.params.postprocessors;
        return this.clone({ postprocessors: callbacks.concat([callback]) });
    };
    /**
     * Add error catcher
     * @returns {Resolver} new instance of {Resolver}
     */
    Resolver.prototype.catch = function (callback) {
        var callbacks = this.params.onError;
        return this.clone({ onError: callbacks.concat([callback]) });
    };
    /**
     * Skip resolve if {testFn} returns true
     * @returns {Resolver} new instance of {Resolver}
     */
    Resolver.prototype.skipIf = function (fn, deps) {
        var fns = this.params.skipIfTests;
        return this.clone({ skipIfTests: fns.concat([{ deps: deps, fn: fn }]) });
    };
    /**
     * Set resolve-token name
     * @param {string} token name for resolver
     * @returns {Resolver} new instance of {Resolver} with token
     */
    Resolver.prototype.as = function (token) {
        return this.clone({ token: token });
    };
    /**
     * Set arguments resolver
     * @param {function|Array} fn — arguments creator
     * @param {Array} deps — dependencies for {fn}
     * @returns {Resolver} new instance of {Resolver} with resolve function
     */
    Resolver.prototype.args = function (fn, deps) {
        return this.clone({
            argsGetter: {
                deps: deps,
                fn: fn,
            },
        });
    };
    /**
     * Additional cache dependency (cache will be flushed if it's changed)
     * @returns {Resolver} new instance of {Resolver}
     */
    Resolver.prototype.cacheDeps = function (fn, deps) {
        return this.clone({
            cacheDepsGetter: {
                deps: deps,
                fn: fn,
            },
        });
    };
    /**
     * Disable cache for query
     * @returns {Resolver} new instance of {Resolver}
     */
    Resolver.prototype.disableCache = function () {
        return this.clone({ memoize: false });
    };
    Resolver.prototype.toString = function () {
        return this.getDatasource().toString();
    };
    /**
     * Creates new instance of model
     * @param {function|Array} fn — formData creator
     * @param {Array} deps — dependencies for {fn}
     * @returns {ICreateResolver}
     */
    Resolver.prototype.create = function (fn, deps) {
        var _this = this;
        var createLiteral = {
            deps: ['$transition$'].concat(deps),
            resolveFn: function ($transition$) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                var datasource = _this.getDatasource($transition$.injector());
                return datasource.create(fn && fn.apply(void 0, args));
            },
            token: null,
        };
        var setToken = function (token) { return core_1.extend({}, createLiteral, { token: token }); };
        return core_1.extend({}, createLiteral, { as: setToken });
    };
    /**
     * Get some elements
     * @returns {Resolver} new instance of {Resolver}
     */
    Resolver.prototype.many = function () {
        return this.clone({ datasourceMethod: 'many' });
    };
    /**
     * Get one element
     * @returns {Resolver} new instance of {Resolver}
     */
    Resolver.prototype.one = function () {
        return this.clone({ datasourceMethod: 'one' });
    };
    return Resolver;
}());
__decorate([
    makeInjectable,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Resolver)
], Resolver.prototype, "skipIf", null);
__decorate([
    makeInjectable,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Resolver)
], Resolver.prototype, "args", null);
__decorate([
    makeInjectable,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Resolver)
], Resolver.prototype, "cacheDeps", null);
__decorate([
    makeInjectable,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Object)
], Resolver.prototype, "create", null);
exports.default = Resolver;
//# sourceMappingURL=index.js.map
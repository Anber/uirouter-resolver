import { ResolvableLiteral, ResolvePolicy } from '@uirouter/core';
export declare type DsMethod = 'many' | 'one';
export declare type ResolveFn = (...any) => Promise<Object>;
export declare type PostProcessorFn = (any) => any;
export declare type OnErrorFn = (any) => any;
export declare class Getter {
    deps: Array<string>;
    fn: (...any) => Object;
    constructor(fn: (...any) => Object, deps: Array<string>);
    static empty: Getter;
}
export interface IDatasource<TRes> {
    create(args: any): Promise<TRes>;
    one(args: any): Promise<TRes>;
    many(args: any): Promise<Array<TRes>>;
}
export interface IResolverParams {
    memoize?: boolean;
    argsGetter?: Getter;
    cacheDepsGetter?: Getter;
    datasourceMethod?: DsMethod;
    postprocessors?: Array<PostProcessorFn>;
    onError?: Array<OnErrorFn>;
    skipIfTests?: Array<Getter>;
    token?: String;
    data?: any;
    policy?: ResolvePolicy;
}
export interface ICreateResolver extends ResolvableLiteral {
    as(token: String): ResolvableLiteral;
}
export default class Resolver<TEntity> implements ResolvableLiteral {
    private params;
    private getDatasource;
    private cachedResolveFn;
    /**
     * Create a new instance of {Resolver}
     * @param {string|IDatasource} datasource — name of injectable datasource or IDatasource instance
     * @param {IResolverParams} resolvableLiteral used to describe a {Resolvable}
     */
    constructor(datasource: String | IDatasource<TEntity>, resolvableLiteral?: {});
    /**
     * The Dependency Injection token that will be used to inject/access the resolvable.
     * @returns {string}
     */
    token: String;
    /**
     * The function that returns the resolved value or a promise for the resolved value.
     * @returns {ResolveFn}
     */
    resolveFn: ResolveFn;
    /**
     * The Dependency Injection tokens for dependencies of the {resolveFn}.
     * The DI tokens are references to other {Resolvables}, or to global services.
     * @returns {Array<String>}
     */
    deps: Array<String>;
    /**
     * Pre-resolved value.
     * @returns {*}
     */
    data: any;
    /**
     * A policy that defines when to invoke the resolve, and whether to wait for async and unwrap the data.
     * @returns {ResolvePolicy}
     */
    policy: ResolvePolicy;
    /**
     * Clone current {Resolver} and replace some parameters
     * @param {object} params — replaced parameters
     * @returns {Resolver} new instance of {Resolver}
     */
    clone(params: IResolverParams): Resolver<TEntity>;
    /**
     * Set resolve-policy to async:NOWAIT
     * @returns {Resolver} new instance of {Resolver}
     */
    noWait(): Resolver<TEntity>;
    /**
     * Set resolve-policy to when:EAGER
     * @returns {Resolver} new instance of {Resolver}
     */
    eager(): Resolver<TEntity>;
    /**
     * Add response postprocessor
     * @returns {Resolver} new instance of {Resolver}
     */
    then(callback: any): Resolver<TEntity>;
    /**
     * Add error catcher
     * @returns {Resolver} new instance of {Resolver}
     */
    catch(callback: any): Resolver<TEntity>;
    /**
     * Skip resolve if {testFn} returns true
     * @returns {Resolver} new instance of {Resolver}
     */
    skipIf(fn: any, deps: any): Resolver<TEntity>;
    /**
     * Set resolve-token name
     * @param {string} token name for resolver
     * @returns {Resolver} new instance of {Resolver} with token
     */
    as(token: any): Resolver<TEntity>;
    /**
     * Set arguments resolver
     * @param {function|Array} fn — arguments creator
     * @param {Array} deps — dependencies for {fn}
     * @returns {Resolver} new instance of {Resolver} with resolve function
     */
    args(fn: any, deps: any): Resolver<TEntity>;
    /**
     * Additional cache dependency (cache will be flushed if it's changed)
     * @returns {Resolver} new instance of {Resolver}
     */
    cacheDeps(fn: any, deps: any): Resolver<TEntity>;
    /**
     * Disable cache for query
     * @returns {Resolver} new instance of {Resolver}
     */
    disableCache(): Resolver<TEntity>;
    toString(): String;
    /**
     * Creates new instance of model
     * @param {function|Array} fn — formData creator
     * @param {Array} deps — dependencies for {fn}
     * @returns {ICreateResolver}
     */
    create(fn: any, deps: any): ICreateResolver;
    /**
     * Get some elements
     * @returns {Resolver} new instance of {Resolver}
     */
    many(): Resolver<TEntity>;
    /**
     * Get one element
     * @returns {Resolver} new instance of {Resolver}
     */
    one(): Resolver<TEntity>;
}

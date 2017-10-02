import {} from 'jest';
import Resolver from '../src/index';

let instance;
let services;
let model;
let cache;

const injector = () => ({
    get(name) {
        if (services[name]) {
            return services[name];
        }

        return null;
    },
    getAsync(name) {
        if (services[name]) {
            return Promise.resolve(services[name]);
        }

        return Promise.resolve(name);
    },
});

const $transition$ = {
    injector,
};

beforeEach(() => {
    instance = new Resolver('Model');

    model = {
        many() {
            return Promise.resolve([1, 2, 3]);
        },
    };

    cache = new Set();

    services = {
        Model: model,
        $q: Promise,
        $resolveCache: {
            markAsCached: token => cache.add(token),
            isCached: token => cache.has(token),
        },
    };
});

describe('Resolver', () => {
    test('should be properly initialized', () => {
        expect(instance.toString()).toEqual('Model');
        expect(instance.token).toBeUndefined();
        expect(instance.deps).toEqual(['$transition$']);
        expect(instance.data).toBeUndefined();
        expect(instance.policy).toEqual({ async: 'WAIT', when: 'LAZY' });
        expect(instance.resolveFn).toEqual(expect.any(Function));
    });

    test('should set token', () => {
        expect(instance.as('newToken').token).toEqual('newToken');
        expect(instance.token).toBeUndefined();
    });

    test('should clone query', () => {
        const q1 = instance.as('newToken');
        const q2 = q1.clone();
        expect(q1.token).toEqual(q2.token);
        expect(q1).not.toBe(q2);
    });

    test('should change async policy to NOWAIT', () => {
        expect(instance.noWait().policy).toEqual({ async: 'NOWAIT', when: 'LAZY' });
        expect(instance.policy).toEqual({ async: 'WAIT', when: 'LAZY' });
    });

    test('should change when policy to EAGER', () => {
        expect(instance.eager().policy).toEqual({ async: 'WAIT', when: 'EAGER' });
        expect(instance.policy).toEqual({ async: 'WAIT', when: 'LAZY' });
    });

    test('should add dependencies', () => {
        const deps = ['dep1', 'dep2'];
        const result = ['$transition$', 'dep1', 'dep2'];

        expect(instance.args(() => ({}), deps).deps).toEqual(result);
        expect(instance.args([...deps, () => ({})]).deps).toEqual(result);

        const getter = () => ({});
        getter.$inject = deps;
        expect(instance.args(getter).deps).toEqual(result);
    });

    test('should resolve default collection', async () => {
        const resolved = await instance.resolveFn($transition$);
        expect(resolved).toEqual([1, 2, 3]);
    });

    test('should apply postprocessors', async () => {
        const thenFn1 = jest.fn().mockReturnValue('value 1');
        const thenFn2 = jest.fn().mockReturnValue('value 2');
        instance = instance.then(thenFn1).then(thenFn2);
        const resolved = await instance.resolveFn($transition$);
        expect(thenFn1).toHaveBeenCalledWith([1, 2, 3]);
        expect(thenFn2).toHaveBeenCalledWith('value 1');
        expect(resolved).toEqual('value 2');
    });

    test('should catch error', async () => {
        const error = new Error('error');
        model.many = () => Promise.reject(error);

        const catchFn1 = jest.fn().mockReturnValue('value 1');
        const thenFn1 = jest.fn().mockReturnValue('value 2');
        instance = instance.catch(catchFn1).then(thenFn1);
        const resolved = await instance.resolveFn($transition$);
        expect(catchFn1).toHaveBeenCalledWith(error);
        expect(thenFn1).toHaveBeenCalledWith('value 1');
        expect(resolved).toEqual('value 2');
    });

    test('should catch rethrown error', async () => {
        const error1 = new Error('error 1');
        const error2 = new Error('error 2');
        model.many = () => Promise.reject(error1);

        const catchFn1 = jest.fn(() => { throw error2});
        const catchFn2 = jest.fn().mockReturnValue('value');
        instance = instance.catch(catchFn1).catch(catchFn2);
        const resolved = await instance.resolveFn($transition$);
        expect(catchFn1).toHaveBeenCalledWith(error1);
        expect(catchFn2).toHaveBeenCalledWith(error2);
        expect(resolved).toEqual('value');
    });

    test('should skip resolve', async () => {
        model.many = jest.fn();

        instance = instance.skipIf(() => true);
        const resolved = await instance.resolveFn($transition$);
        expect(model.many).not.toHaveBeenCalled();
        expect(resolved).toBeUndefined();
    });

    test('shouldn\'t skip resolve', async () => {
        model.many = jest.fn(model.many);

        instance = instance.skipIf(() => false);
        const resolved = await instance.resolveFn($transition$);
        expect(model.many).toHaveBeenCalled();
        expect(resolved).toEqual([1, 2, 3]);
    });

    test('should wait dependency and then skip resolve', async () => {
        model.many = jest.fn();
        services.testDep = Promise.resolve('value');

        instance = instance.skipIf(testDep => testDep === 'value', ['testDep']);
        const resolved = await instance.resolveFn($transition$);
        expect(model.many).not.toHaveBeenCalled();
        expect(resolved).toBeUndefined();
    });
});


describe('Resolver with cache', () => {
    test('should cache resolve', async () => {
        model.many = jest.fn(model.many);
        let resolved = await instance.resolveFn($transition$);
        expect(model.many).toHaveBeenCalledTimes(1);
        expect(resolved).toEqual([1, 2, 3]);

        resolved = await instance.resolveFn($transition$);
        expect(model.many).toHaveBeenCalledTimes(1);
        expect(resolved).toEqual([1, 2, 3]);
    });

    test('should call resolve with changed arguments', async () => {
        const getter = jest.fn()
            .mockImplementationOnce(() => 'first call')
            .mockImplementationOnce(() => 'first call')
            .mockImplementationOnce(() => 'second call')
            .mockImplementationOnce(() => 'second call'); // FIXME: wrong behaviour

        instance = instance.args(getter, []);

        model.many = jest.fn(model.many);
        let resolved = await instance.resolveFn($transition$);
        expect(model.many).toHaveBeenLastCalledWith('first call');
        expect(resolved).toEqual([1, 2, 3]);

        resolved = await instance.resolveFn($transition$);
        expect(model.many).toHaveBeenLastCalledWith('second call');
        expect(resolved).toEqual([1, 2, 3]);
    });

    test('should disable cache', async () => {
        instance = instance.disableCache();

        model.many = jest.fn(model.many);
        let resolved = await instance.resolveFn($transition$);
        expect(model.many).toHaveBeenCalledTimes(1);
        expect(resolved).toEqual([1, 2, 3]);

        resolved = await instance.resolveFn($transition$);
        expect(model.many).toHaveBeenCalledTimes(2);
        expect(resolved).toEqual([1, 2, 3]);
    });

    test('shouldn\'t use cache because custom cache deps', async () => {
        services.testDep = Promise.resolve('value');

        const getter = jest.fn()
            .mockImplementationOnce(testDep => `first call with ${testDep}`)
            .mockImplementationOnce(testDep => `second call with ${testDep}`);

        instance = instance.cacheDeps(getter, ['testDep']);

        model.many = jest.fn(model.many);
        let resolved = await instance.resolveFn($transition$);
        expect(model.many).toHaveBeenCalledTimes(1);
        expect(resolved).toEqual([1, 2, 3]);

        resolved = await instance.resolveFn($transition$);
        expect(model.many).toHaveBeenCalledTimes(2);
        expect(resolved).toEqual([1, 2, 3]);
    });
});

describe('Datasource', () => {
    const el1 = Symbol('el1');
    const el2 = Symbol('el2');
    const el3 = Symbol('el3');

    class Datasource {
        // eslint-disable-next-line class-methods-use-this
        create(data) {
            return Promise.resolve(data);
        }

        // eslint-disable-next-line class-methods-use-this
        one(args) {
            return Promise.resolve(args);
        }

        // eslint-disable-next-line class-methods-use-this
        many(args) {
            return Promise.resolve([args, args, args]);
        }
    }

    beforeEach(() => {
        instance = new Resolver(new Datasource());
    });

    test('should create new item', async () => {
        instance = instance.create(() => el1).as('el1');

        const resolved = await instance.resolveFn($transition$);
        expect(resolved).toEqual(el1);
    });

    test('should return one item', async () => {
        instance = instance.args(() => el2).one().as('el2');

        const resolved = await instance.resolveFn($transition$);
        expect(resolved).toEqual(el2);
    });

    test('should return three items', async () => {
        instance = instance.args(() => el3).many().as('el3');

        const resolved = await instance.resolveFn($transition$);
        expect(resolved).toEqual([el3, el3, el3]);
    });
});

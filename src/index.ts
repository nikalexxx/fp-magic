const valueSymbol = Symbol('value');

type WrapperObject = Record<string | symbol, unknown>;

function isObject(x: unknown): x is WrapperObject {
    return x === new Object(x);
}

export function isPrimitiveWrapper<T>(x: T): x is T & { valueOf(): T } {
    return isObject(x) && 'valueOf' in x && !isObject(x.valueOf());
}

export function getValueFromWrapper<T>(x: T): T {
    if (isPrimitiveWrapper(x)) {
        if (valueSymbol in x) {
            return (x as any)[valueSymbol];
        }
        return x.valueOf();
    }
    return x;
}

function clearSymbols(object: unknown, symbols: symbol[]): void {
    if (!isObject(object)) {
        return;
    }
    for (const symbol of symbols) {
        if (symbol in object) {
            delete (object as any)[symbol];
        }
    }
    for (const key of Object.keys(object)) {
        const value = object[key];
        clearSymbols(value, symbols);
        if (isObject(value) && valueSymbol in value) {
            object[key] = value[(valueSymbol as any) as string];
        }
    }
}

const tf = (a: any) => typeof a;
type jsType = ReturnType<typeof tf>;

const NO_ARGUMENTS = 'No arguments';
const getExpectedFunction = (type: jsType) => `Expected function, not ${type}`;

const checkArgumentsLength = (argumentsLength: number) => {
    if (argumentsLength === 0) {
        throw new Error(NO_ARGUMENTS);
    }
};

const checkType = (argument: unknown) => {
    const type = typeof argument;
    if (type !== 'function') {
        throw new Error(getExpectedFunction(type));
    }
};

const getWrapper = (key: symbol) => <T>(x: T) => {
    const wf = new Object(x) as any;
    wf[key] = true;
    if (wf !== x && !(valueSymbol in wf)) {
        wf[valueSymbol] = x;
    }
    return wf as WrapperObject & T;
};

const getCheck = (key: symbol) => (x: unknown) => isObject(x) && key in x;

const enum ProxyType {
    Check,
    Wrapper,
}

interface Store {
    [name: string]: StoreItem;
}

interface StoreItem {
    key: symbol;
    [ProxyType.Check]: CheckFunction;
    [ProxyType.Wrapper]: WrapperFunction;
}

export type CheckFunction = (x: unknown) => boolean;
export type WrapperFunction = <T>(x: T) => T & WrapperObject;

export type CheckLabels<L extends string> = Record<L, CheckFunction>;
export type CheckArgument<T, R, L extends string> = (labels: CheckLabels<L>) => (arg: T) => R;

export type WrapperLabels<L extends string> = Record<L, WrapperFunction>;
export type WrapperArgument<T, L extends string> = (labels: WrapperLabels<L>) => T;

/**
 * @example
 * ```ts
 * const squareFunctor = createFunctor<'square'>();
 * const sumWithSquare = squareFunctor(({ square }) => (list: number[]) =>
 *     list.reduce((sum, e) => sum + (square(e) ? e * e : e), 0)
 * );
 * sumWithSquare(({square}) => [1, 2, square(3)]); // 1 + 2 + 3*3 = 12
 * ```
 */
export const createFunctor = <L extends string>() => function<T, R>(f: CheckArgument<T, R, L>) {
    checkArgumentsLength(arguments.length);
    checkType(f);

    const store: Store = {};
    const createStoreItem = (name: string) => {
        const key = Symbol(name);
        store[name] = {
            key,
            [ProxyType.Wrapper]: getWrapper(key),
            [ProxyType.Check]: getCheck(key),
        };
    };
    const getProxy = <PT extends ProxyType>(proxyType: PT) =>
        new Proxy(
            {} as PT extends ProxyType.Check
                ? CheckLabels<L>
                : PT extends ProxyType.Wrapper
                ? WrapperLabels<L>
                : never,
            {
                get(_, name: string) {
                    if (!(name in store)) {
                        if (proxyType === ProxyType.Check) {
                            createStoreItem(name);
                        } else {
                            throw new Error(
                                `The expected names are ${Object.keys(store)
                                    .map((e) => `'${e}'`)
                                    .join(
                                        ', '
                                    )}, but received name is '${String(name)}'`
                            );
                        }
                    }
                    return store[name][proxyType];
                },
            }
        );

    const usageFunction = f(getProxy(ProxyType.Check));

    function resultFunction(argumentFunction: WrapperArgument<T, L>): R {
        checkType(argumentFunction);
        const argument = argumentFunction(getProxy(ProxyType.Wrapper));
        const usage = usageFunction(argument);
        clearSymbols(
            usage,
            Object.values(store).map((e) => e.key)
        );
        return getValueFromWrapper(usage);
    }

    resultFunction.labels = Object.keys(store);

    return resultFunction;
}

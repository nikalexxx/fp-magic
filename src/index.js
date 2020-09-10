(function () {
    const valueSymbol = Symbol('value');

    const clearSymbols = (object, symbols) => {
        if (object !== new Object(object)) {
            return;
        }
        for (const symbol of symbols) {
            if (symbol in object) {
                delete object[symbol];
            }
        }
        for (const key of Object.keys(object)) {
            clearSymbols(object[key], symbols);
            if (object !== new Object(object) && valueSymbol in object[key]) {
                object[key] = object[key][valueSymbol];
            }
        }
    };


    function createFunctor(f) {
        const NO_ARGUMENTS = 'No arguments';
        const getExpectedFunction = type => `Expected function, not ${type}`;
        const getMoreArguments = n => `Need ${n} or more arguments`;
        const checkArgumentsLength = (argumentsLength) => {
            if (argumentsLength === 0) {
                throw new Error(NO_ARGUMENTS);
            }
        };
        const checkType = argument => {
            const type = typeof argument;
            if (type !== 'function') {
                throw new Error(getExpectedFunction(type));
            }
        };
        const checkFunctionLength = minimum => argument => {
            const L = argument.length;
            if (L < minimum) {
                throw new Error(getMoreArguments(minimum));
            }
        };
        const check = name => ({
            'argumentsLength': checkArgumentsLength,
            'type': checkType,
            'functionLength': checkFunctionLength
        }[name]);
        check('argumentsLength')(arguments.length);
        check('type')(f);
        // check('functionLength')(1)(f);

        const store = {};
        const createStoreItem = name => {
            const key = Symbol(name);
            const wrapper = function (x) {
                const wf = new Object(x);
                wf[key] = true;
                if (wf !== x && !(valueSymbol in wf)) {
                    wf[valueSymbol] = x;
                }
                return wf;
            };
            store[name] = {
                key,
                wrapper,
                check: x => x && x[key]
            }
        }
        const getProxy = type => new Proxy({}, {
            get(_, name) {
                if (!(name in store)) {
                    if (type === 'check') {
                        createStoreItem(name);
                    } else {
                        throw new Error(`The expected names are ${Object.keys(store).map(e => `'${e}'`).join(', ')}, but received name is '${name}'`);
                    }
                }
                return store[name][type];
            }
        });
        const usageFunction = f(getProxy('check'));
        function resultFunction(argumentFunction) {
            check('type')(argumentFunction);
            const argument = argumentFunction(getProxy('wrapper'));
            const usage = usageFunction(argument);
            clearSymbols(usage, Object.values(store).map(e => e.key));
            return usage.valueOf();
        };
        resultFunction.labels = Object.keys(store);
        return resultFunction;
    }

    /*
    Usage:

    Example:
    const AND = createFunctor(({a,b, c}) => x => a(x[0]) ? b(x[1]) ? x[0].concat(x[1]) : x[0] : b(x[1]) ? x[1] : []);
    console.log(AND.labels); // ['a', 'b', 'c']
    const a = AND(({a,b}) => [a([1,2,3]), b([4,5,6])]); // [1,2,3,4,5,6]
    const b = AND(({b, c}) => [[1,2,3], b([4,5,6])]); // [4,5,6]
    const c = AND(({a}) => [a([1,2,3]), [4,5,6]]); // [1,2,3]
    const d = AND(() => [[1,2,3], [4,5,6]]); // []

    console.log({a, b, c, d});
    */

    module.exports = {createFunctor};
})();
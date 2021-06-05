# fp-magic

![Latest Stable Version](https://img.shields.io/npm/v/fp-magic.svg)

The power of functional programming — сreate functions with labels that define behavior.

Zero dependencies!

## Install

```shell
npm install fp-magic
```

## Usage

Import
```ts
import {createFunctor} from 'fp-magic';
```

Simple examples
```ts
const FlatWithSet = createFunctor<'set'>()(({set}) => (list: number[][]) =>
    list.map(e => set(e) ? [...new Set(e)] : e).flat()
);

FlatWithSet(({set}) => [[1, 2], [3, 4, 4], set([1, 1, 1, 2])]);
// 1, 2, 3, 4, 4, 1, 2


const squareFunctor = createFunctor<'square'>();
const sumWithSquare = squareFunctor(({ square }) => (list: number[]) =>
    list.reduce((sum, e) => sum + (square(e) ? e * e : e), 0)
);

sumWithSquare(({square}) => [1, 2, square(3)]);
// 1 + 2 + 3*3 = 12


const AND = createFunctor<'a' | 'b'>()(({a, b}) => (x: number[][]) =>
    a(x[0]) ? (b(x[1]) ? x[0].concat(x[1]) : x[0]) : b(x[1]) ? x[1] : []
);

console.log(AND.labels); // ['a', 'b']

AND(({a, b}) => [a([1, 2, 3]), b([4, 5, 6])]); // [1,2,3,4,5,6]
AND((f) => [[1, 2, 3], f.b([4, 5, 6])]); // [4,5,6]
AND(({a}) => [a([1, 2, 3]), [4, 5, 6]]); // [1,2,3]
AND(() => [[1, 2, 3], [4, 5, 6],]); // []
```

Integrate example
```ts
import {mergeWith} from 'lodash';
import {createFunctor} from 'fp-magic';

export const merge = createFunctor<'replace' | 'concat' | 'del'>()(l => (objects: Record<string, unknown>[]) => {
    return mergeWith({}, ...objects, (obj, src) => {
        if (l.replace(src)) {
            return src;
        }
        if (l.concat(src)) {
            return (obj ?? []).concat(src ?? []);
        }
        if (l.del(src)) {
            const result = obj ?? {};
            for (const key in (src ?? {})) {
                if (key in result) {
                    delete result[key];
                }
            }
            return result;
        }
        return undefined;
    });
});


merge(l => [
    {a: [1], b: {e: 1}, c: {d: null}},
    {a: l.concat([2, 3]), b: l.replace({f: 1}), c: del({d: null})}
]); // {a: [1, 2, 3], b: {f: 1}, c: {}}
```

## Attention
Primitive values in wrapper functions can remain in the form of `Object(PrimitiveValue)`.

If it is important for you to check such values, use the function `isPrimitiveWrapper` to check and the function `getValueFromWrapper` to get the primitive value.

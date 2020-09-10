# fp-magic

## Install

```
npm install fp-magic
```

## Usage
```js
import {createFunctor} from 'fp-magic';

const FlatWithSet = createFunctor(({set}) => list =>
    list.map(e => set(e) ? [...new Set(e)] : e).flat()
);

console.log(FlatWithSet(({set}) =>
    [1, 2, [3, 4, 4], set([1, 1, 1, 2])]
)); // 1, 2, 3, 4, 4, 1, 2
```

import { createFunctor } from './index';

test('FlatWithSet', () => {
    const FlatWithSet = createFunctor<'set'>()(
        ({ set }) => (list: number[][]) =>
            list.map((e) => (set(e) ? [...new Set(e)] : e)).flat()
    );
    const list = FlatWithSet(({ set }) => [
        [1, 2],
        [3, 4, 4],
        set([1, 1, 1, 2]),
    ]);

    expect(list).toEqual([1, 2, 3, 4, 4, 1, 2]);
});

test('sumWithSquare', () => {
    const squareFunctor = createFunctor<'square'>();
    const sumWithSquare = squareFunctor(({ square }) => (list: number[]) =>
        list.reduce((sum, e) => sum + (square(e) ? e * e : e), 0)
    );

    expect(sumWithSquare(({ square }) => [1, 2, square(3)])).toBe(12);
});

test('AND', () => {
    const AND = createFunctor<'a' | 'b'>()(({ a, b }) => (x: number[][]) =>
        a(x[0]) ? (b(x[1]) ? x[0].concat(x[1]) : x[0]) : b(x[1]) ? x[1] : []
    );

    expect(AND.labels).toEqual(['a', 'b']);

    expect(AND(({ a, b }) => [a([1, 2, 3]), b([4, 5, 6])])).toEqual([
        1,
        2,
        3,
        4,
        5,
        6,
    ]);
    expect(AND((f) => [[1, 2, 3], f.b([4, 5, 6])])).toEqual([4, 5, 6]);
    expect(AND(({ a }) => [a([1, 2, 3]), [4, 5, 6]])).toEqual([1, 2, 3]);
    expect(
        AND(() => [
            [1, 2, 3],
            [4, 5, 6],
        ])
    ).toEqual([]);
});

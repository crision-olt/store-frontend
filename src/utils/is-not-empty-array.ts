export type NonEmptyArray<T> = [T, ...T[]];

export const isNotEmptyArray = <T>(
  arr: Record<number | string | symbol, unknown> | T[] | number | string | null | undefined,
): arr is NonEmptyArray<T> => {
  return Array.isArray(arr) && arr.length > 0;
};

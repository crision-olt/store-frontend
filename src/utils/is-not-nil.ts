export const isNotNil = <T>(value: T): value is NonNullable<T> => {
  // eslint-disable-next-line sonarjs/different-types-comparison
  return value !== null && value !== undefined;
};

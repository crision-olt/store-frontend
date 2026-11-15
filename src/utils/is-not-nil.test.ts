import { isNotNil } from "@/utils/is-not-nil";

describe("isNotNil", () => {
  test("should return true if value is not null or undefined", () => {
    expect(isNotNil(0)).toBe(true);
    expect(isNotNil("")).toBe(true);
    expect(isNotNil(false)).toBe(true);
    expect(isNotNil([])).toBe(true);
    expect(isNotNil({})).toBe(true);
  });
  test("should return false if value is null or undefined", () => {
    expect(isNotNil(null)).toBe(false);
    expect(isNotNil(undefined)).toBe(false);
  });
});

import { isNotEmptyArray } from "@/utils/is-not-empty-array";

describe("isNotEmptyArray", () => {
  it("should return true for non-empty array", () => {
    expect(isNotEmptyArray([1])).toBe(true);
  });
  it("should return false for empty array", () => {
    expect(isNotEmptyArray([])).toBe(false);
  });
  it("should return false for null", () => {
    expect(isNotEmptyArray(null)).toBe(false);
  });
  it("should return false for undefined", () => {
    expect(isNotEmptyArray(undefined)).toBe(false);
  });
  it("should return false for number", () => {
    expect(isNotEmptyArray(1)).toBe(false);
  });
  it("should return false for string", () => {
    expect(isNotEmptyArray("string")).toBe(false);
  });
  it("should return false for object", () => {
    expect(isNotEmptyArray({})).toBe(false);
  });
});

import { isNil } from "@/utils/is-nil";

describe("is-nil", () => {
  it("should be defined", () => {
    const nullValue = null;
    const undefinedValue = undefined;
    const definedValue = 1;
    const definedValue2 = 0;
    const definedString = "";
    const definedArray: number[] = [];
    const definedObject = {};

    expect(isNil(nullValue)).toBe(true);
    expect(isNil(undefinedValue)).toBe(true);
    expect(isNil(definedValue)).toBe(false);
    expect(isNil(definedValue2)).toBe(false);
    expect(isNil(definedString)).toBe(false);
    expect(isNil(definedArray)).toBe(false);
    expect(isNil(definedObject)).toBe(false);
  });
});

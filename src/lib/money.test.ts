import { describe, expect, it } from "vitest";
import { calculateDeliveryFee, decimalToMinorUnits } from "./money";

describe("decimalToMinorUnits", () => {
  it("converts exact decimal strings without floating-point rounding", () => {
    expect(decimalToMinorUnits("129.95")).toBe(12995);
    expect(decimalToMinorUnits("8")).toBe(800);
    expect(decimalToMinorUnits("0.4")).toBe(40);
  });

  it("rejects malformed, negative, and over-precision values", () => {
    expect(() => decimalToMinorUnits("-1.00")).toThrow();
    expect(() => decimalToMinorUnits("1.234")).toThrow();
    expect(() => decimalToMinorUnits("1e3")).toThrow();
  });
});

describe("calculateDeliveryFee", () => {
  it("waives delivery at or above the configured threshold", () => {
    expect(calculateDeliveryFee(10000, 1200, 10000)).toBe(0);
    expect(calculateDeliveryFee(12000, 1200, 10000)).toBe(0);
  });

  it("charges delivery below threshold or when no threshold is configured", () => {
    expect(calculateDeliveryFee(9999, 1200, 10000)).toBe(1200);
    expect(calculateDeliveryFee(100000, 1200, null)).toBe(1200);
  });
});

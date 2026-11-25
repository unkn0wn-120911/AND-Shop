export function decimalToMinorUnits(value: string): number {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) {
    throw new Error("Amount must be a non-negative decimal with at most 2 places.");
  }

  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function calculateDeliveryFee(
  subtotalMinorUnits: number,
  deliveryFeeMinorUnits: number,
  freeShippingThresholdMinorUnits: number | null,
) {
  if (
    freeShippingThresholdMinorUnits !== null &&
    subtotalMinorUnits >= freeShippingThresholdMinorUnits
  ) {
    return 0;
  }
  return deliveryFeeMinorUnits;
}

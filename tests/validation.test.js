import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

function loadValidation() {
  const context = { window: {} };
  vm.createContext(context);

  const validationCode = readFileSync(
    path.join(process.cwd(), "validation.js"),
    "utf8"
  );
  vm.runInContext(validationCode, context);

  return context.window.MatchmakerValidation;
}

describe("MatchmakerValidation", () => {
  const validation = loadValidation();

  it("returns an error when year is missing", () => {
    const result = validation.validateVehicleInputs({
      yearRaw: "",
      modelRaw: "Camry",
      mileageRaw: "1000"
    });
    expect(result).toEqual({ error: "Please enter a vehicle year." });
  });

  it("returns an error for non-integer year input", () => {
    const result = validation.validateVehicleInputs({
      yearRaw: "20x0",
      modelRaw: "Camry",
      mileageRaw: "1000"
    });
    expect(result).toEqual({ error: "Please enter a valid year." });
  });

  it("returns an error when year is outside supported range", () => {
    const belowRange = validation.validateVehicleInputs({
      yearRaw: String(validation.YEAR_RANGE.min - 1),
      modelRaw: "Camry",
      mileageRaw: "1000"
    });

    const aboveRange = validation.validateVehicleInputs({
      yearRaw: String(validation.YEAR_RANGE.max + 1),
      modelRaw: "Camry",
      mileageRaw: "1000"
    });

    const expectedMessage = `Please enter a year between ${validation.YEAR_RANGE.min} and ${validation.YEAR_RANGE.max}.`;

    expect(belowRange).toEqual({ error: expectedMessage });
    expect(aboveRange).toEqual({ error: expectedMessage });
  });

  it("returns an error when model is not selected", () => {
    const result = validation.validateVehicleInputs({
      yearRaw: "2018",
      modelRaw: "",
      mileageRaw: "1000"
    });
    expect(result).toEqual({ error: "Please select a model." });
  });

  it("returns an error when mileage is missing or invalid", () => {
    const missingMileage = validation.validateVehicleInputs({
      yearRaw: "2018",
      modelRaw: "Camry",
      mileageRaw: ""
    });
    const nonNumericMileage = validation.validateVehicleInputs({
      yearRaw: "2018",
      modelRaw: "Camry",
      mileageRaw: "abc"
    });
    const negativeMileage = validation.validateVehicleInputs({
      yearRaw: "2018",
      modelRaw: "Camry",
      mileageRaw: "-1"
    });

    expect(missingMileage).toEqual({
      error: "Please enter the current mileage."
    });
    expect(nonNumericMileage).toEqual({
      error: "Please enter a valid mileage."
    });
    expect(negativeMileage).toEqual({ error: "Please enter a valid mileage." });
  });

  it("returns parsed values for valid inputs", () => {
    const result = validation.validateVehicleInputs({
      yearRaw: "2018",
      modelRaw: " Camry ",
      mileageRaw: "12000"
    });

    expect(result).toEqual({
      value: {
        year: 2018,
        model: "Camry",
        mileage: 12000
      }
    });
  });
});

import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

function loadVinModule() {
  const context = { window: {} };
  vm.createContext(context);

  const code = readFileSync(
    path.join(process.cwd(), "nhtsa-vin.js"),
    "utf8"
  );
  vm.runInContext(code, context);

  return context.window.NhtsaVin;
}

function cleanDecode(overrides = {}) {
  return {
    Results: [
      {
        VIN: "4T1B11HK5JU000000",
        ErrorCode: "0",
        ErrorText: "",
        ModelYear: "2018",
        Make: "TOYOTA",
        Model: "Camry",
        Trim: "SE",
        BodyClass: "Sedan/Saloon",
        DriveType: "4x2",
        EngineCylinders: "4",
        FuelTypePrimary: "Gasoline",
        ...overrides
      }
    ]
  };
}

describe("NhtsaVin", () => {
  const vin = loadVinModule();

  it("normalizes and validates a 17-character VIN", () => {
    expect(vin.validateVin(" 4t1b11hk5ju000000 ")).toEqual({
      value: "4T1B11HK5JU000000"
    });
  });

  it("rejects malformed VINs and forbidden characters", () => {
    expect(vin.validateVin("123")).toEqual({
      error: "VIN must be exactly 17 characters."
    });

    expect(vin.validateVin("4T1B11HK5JU00000I")).toEqual({
      error:
        "VIN may contain only letters and numbers; I, O, and Q are not valid VIN characters."
    });
  });

  it("auto-looks up only a new valid 17-character VIN", () => {
    expect(vin.shouldAutoLookupVin("4t1b11hk5ju000000", "")).toBe(true);
    expect(vin.shouldAutoLookupVin("4T1B11HK5JU00000", "")).toBe(false);
    expect(vin.shouldAutoLookupVin("4T1B11HK5JU00000I", "")).toBe(false);
    expect(
      vin.shouldAutoLookupVin("4T1B11HK5JU000000", "4t1b11hk5ju000000")
    ).toBe(false);
  });

  it("accepts lookup results only while the requested VIN is still current", () => {
    expect(
      vin.isCurrentLookup("4t1b11hk5ju000000", "4T1B11HK5JU000000")
    ).toBe(true);
    expect(
      vin.isCurrentLookup("4T1B11HK5JU000001", "4T1B11HK5JU000000")
    ).toBe(false);
    expect(vin.isCurrentLookup("", "4T1B11HK5JU000000")).toBe(false);
  });

  it("only treats Toyota decode results as supported for advisor autofill", () => {
    expect(vin.isSupportedMake("TOYOTA")).toBe(true);
    expect(vin.isSupportedMake(" toyota ")).toBe(true);
    expect(vin.isSupportedMake("HONDA")).toBe(false);
    expect(vin.isSupportedMake("")).toBe(false);
  });

  it("parses the vehicle fields needed by Maintenance Matchmaker", () => {
    expect(vin.parseDecodeResponse(cleanDecode())).toEqual({
      value: {
        vin: "4T1B11HK5JU000000",
        year: 2018,
        make: "TOYOTA",
        model: "Camry",
        trim: "SE",
        bodyClass: "Sedan/Saloon",
        driveType: "4x2",
        engineCylinders: "4",
        fuelType: "Gasoline"
      }
    });
  });

  it("surfaces NHTSA decode errors", () => {
    expect(
      vin.parseDecodeResponse(
        cleanDecode({
          ErrorCode: "1",
          ErrorText: "Invalid VIN"
        })
      )
    ).toEqual({ error: "Invalid VIN" });
  });

  it("calls the official vPIC endpoint without an API key", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => cleanDecode()
    }));

    const result = await vin.decodeVin("4T1B11HK5JU000000", fetchMock);

    expect(result.value).toMatchObject({
      year: 2018,
      make: "TOYOTA",
      model: "Camry"
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `${vin.API_BASE}/4T1B11HK5JU000000?format=json`,
      { headers: { Accept: "application/json" } }
    );
  });

  it("normalizes common Toyota model naming variants", () => {
    expect(vin.normalizeModelName("4-Runner")).toBe("4Runner");
    expect(vin.normalizeModelName("RAV 4")).toBe("RAV4");
  });
});

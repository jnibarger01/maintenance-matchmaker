import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

function loadVinModule(overrides = {}) {
  // A bare vm context has only ECMAScript built-ins. The module relies on the
  // host-provided timer and abort globals a browser supplies, so inject them or
  // the timeout path silently no-ops under test.
  const context = {
    window: {},
    AbortController,
    setTimeout,
    clearTimeout,
    ...overrides
  };
  vm.createContext(context);

  const code = readFileSync(path.join(process.cwd(), "nhtsa-vin.js"), "utf8");
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
    expect(vin.isCurrentLookup("4t1b11hk5ju000000", "4T1B11HK5JU000000")).toBe(
      true
    );
    expect(vin.isCurrentLookup("4T1B11HK5JU000001", "4T1B11HK5JU000000")).toBe(
      false
    );
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
      expect.objectContaining({ headers: { Accept: "application/json" } })
    );
  });

  it("passes an abort signal so a request can be cancelled", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => cleanDecode()
    }));

    await vin.decodeVin("4T1B11HK5JU000000", fetchMock);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.signal).toBeDefined();
    expect(init.signal.aborted).toBe(false);
  });

  it("reports a timeout instead of hanging when vPIC never responds", async () => {
    // The module captures setTimeout from its host at load time, so collapse the
    // deadline by swapping the global rather than by waiting the real 10s.
    const immediate = (callback) => setTimeout(callback, 0);
    const impatient = loadVinModule({ setTimeout: immediate });

    // Settles only on abort; a real stalled connection never resolves otherwise.
    const fetchMock = vi.fn(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        })
    );

    const result = await impatient.decodeVin("4T1B11HK5JU000000", fetchMock);

    expect(result.error).toMatch(/did not respond within \d+ seconds/);
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  });

  it("normalizes common Toyota model naming variants", () => {
    expect(vin.normalizeModelName("4-Runner")).toBe("4Runner");
    expect(vin.normalizeModelName("RAV 4")).toBe("RAV4");
  });
});

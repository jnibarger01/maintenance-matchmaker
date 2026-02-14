import { beforeEach, describe, expect, it, vi } from "vitest";
import maintenanceScheduleFixture from "./fixtures/maintenanceSchedule.js";

const cloneFixture = () =>
  JSON.parse(JSON.stringify(maintenanceScheduleFixture));

describe("MatchmakerLogic", () => {
  let logic;

  beforeEach(async () => {
    vi.resetModules();
    globalThis.window = {
      MAINTENANCE_SCHEDULE: cloneFixture()
    };

    await import("../logic.js");
    logic = globalThis.window.MatchmakerLogic;
  });

  it("findNextInterval returns the next defined interval or rounds up", () => {
    expect(logic.findNextInterval(12000)).toBe(15000);
    expect(logic.findNextInterval(15000)).toBe(30000);
    expect(logic.findNextInterval(121000)).toBe(125000);
  });

  it("includes overdue services and filters by look-ahead", () => {
    const recommendations = logic.calculateRecommendations("RAV4", 16000, 5000);

    const highServices = recommendations.high.map((item) => item.service);
    expect(highServices).toContain("Oil & Filter Change");
    expect(highServices).toContain("Tire Rotation");
    expect(highServices).not.toContain("Engine Air Filter Replacement");

    const oilChange = recommendations.high.find(
      (item) => item.service === "Oil & Filter Change"
    );
    expect(oilChange.overdue).toBe(true);
    expect(oilChange.milesUntil).toBe(-11000);
  });

  it("includes model-specific services within the look-ahead window", () => {
    const recommendations = logic.calculateRecommendations("RAV4", 28000, 5000);

    const mediumServices = recommendations.medium.map((item) => item.service);
    expect(mediumServices).toContain("AWD System Inspection");
  });

  it("de-dupes by service name, keeping the earliest interval", () => {
    const recommendations = logic.calculateRecommendations("RAV4", 58000, 5000);

    const brakeInspection = recommendations.medium.find(
      (item) => item.service === "Brake Inspection"
    );

    expect(brakeInspection).toBeDefined();
    expect(brakeInspection.interval).toBe(5000);
  });
});

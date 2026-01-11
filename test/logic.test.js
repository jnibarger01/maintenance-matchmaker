const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadLogic(scheduleOverride) {
  const context = { window: {}, console };
  vm.createContext(context);

  const dataCode = fs.readFileSync(path.join(__dirname, "..", "data.js"), "utf8");
  vm.runInContext(dataCode, context);

  if (scheduleOverride) {
    context.window.MAINTENANCE_SCHEDULE = scheduleOverride;
  }

  const logicCode = fs.readFileSync(path.join(__dirname, "..", "logic.js"), "utf8");
  vm.runInContext(logicCode, context);

  return context.window.MatchmakerLogic;
}

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("returns the next scheduled interval when mileage hits an exact interval", () => {
  const { findNextInterval } = loadLogic();
  assert.strictEqual(findNextInterval(5000), 15000);
});

test("rolls forward when mileage exceeds the highest scheduled interval", () => {
  const { findNextInterval } = loadLogic();
  assert.strictEqual(findNextInterval(121000), 125000);
});

test("derives intervals from the maintenance schedule", () => {
  const scheduleOverride = {
    intervals: {
      10000: [],
      40000: []
    }
  };
  const { findNextInterval } = loadLogic(scheduleOverride);
  assert.strictEqual(findNextInterval(15000), 40000);
});

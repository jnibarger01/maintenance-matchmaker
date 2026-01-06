// logic.js
// Pure logic: calculate recommendations and helper utilities.
// Depends on window.MAINTENANCE_SCHEDULE set by data.js.

(function () {
"use strict";

function assertSchedule() {
if (!window.MAINTENANCE_SCHEDULE) {
throw new Error("MAINTENANCE_SCHEDULE missing. Make sure data.js loads before logic.js.");
}
}

function getIntervalsSorted() {
assertSchedule();
return Object.keys(window.MAINTENANCE_SCHEDULE.intervals)
.map(Number)
.sort((a, b) => a - b);
}

function findNextInterval(mileage) {
const intervals = [5000, 15000, 30000, 45000, 60000, 90000, 100000, 120000];
return intervals.find((i) => mileage < i) || Math.ceil(mileage / 5000) * 5000;
}

function makeServiceKey(service) {
// stable key per service item + interval
return `${service.service}@@${service.interval}`;
}

function calculateRecommendations(model, currentMileage, lookAheadMiles = 5000) {
assertSchedule();

const schedule = window.MAINTENANCE_SCHEDULE;
const recommendations = { critical: [], high: [], medium: [], low: [] };

// base intervals
const intervals = getIntervalsSorted();
intervals.forEach((interval) => {
  if (currentMileage + lookAheadMiles < interval) return;

  const services = schedule.intervals[interval] || [];
  services.forEach((service) => {
    const isOverdue = currentMileage >= interval;
    const milesUntil = interval - currentMileage;

    recommendations[service.priority].push({
      ...service,
      interval,
      due: interval,
      milesUntil,
      overdue: isOverdue
    });
  });
});

// model-specific
const modelBlock = schedule.modelSpecific?.[model];
if (modelBlock) {
  Object.keys(modelBlock).forEach((intervalKey) => {
    const interval = parseInt(intervalKey, 10);
    if (currentMileage + lookAheadMiles < interval) return;

    modelBlock[intervalKey].forEach((service) => {
      const isOverdue = currentMileage >= interval;
      const milesUntil = interval - currentMileage;

      recommendations[service.priority].push({
        ...service,
        interval,
        due: interval,
        milesUntil,
        overdue: isOverdue
      });
    });
  });
}

// de-dupe by service name (keep earliest interval)
Object.keys(recommendations).forEach((priority) => {
  const list = recommendations[priority];
  const map = new Map();
  for (const s of list) {
    if (!map.has(s.service)) map.set(s.service, s);
    else {
      // keep whichever is earlier interval
      const prev = map.get(s.service);
      if (s.interval < prev.interval) map.set(s.service, s);
    }
  }
  recommendations[priority] = Array.from(map.values()).sort((a, b) => a.interval - b.interval);
});

return recommendations;

}

window.MatchmakerLogic = {
findNextInterval,
calculateRecommendations,
makeServiceKey
};
})();
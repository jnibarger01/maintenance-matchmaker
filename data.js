// data.js
// Source of truth for maintenance intervals & model-specific add-ons.
// Exposed as window.MAINTENANCE_SCHEDULE to keep things simple (no bundler needed).

(function () {
"use strict";

const maintenanceSchedule = {
intervals: {
5000: [
{ service: "Oil & Filter Change", priority: "high", price: 79.95, labor_hours: 0.5 },
{ service: "Tire Rotation", priority: "high", price: 29.95, labor_hours: 0.3 },
{ service: "Multi-Point Inspection", priority: "high", price: 0, labor_hours: 0.2 }
],
15000: [
{ service: "Cabin Air Filter", priority: "medium", price: 49.95, labor_hours: 0.2 },
{ service: "Engine Air Filter Inspection", priority: "medium", price: 0, labor_hours: 0.1 }
],
30000: [
{ service: "Engine Air Filter Replacement", priority: "high", price: 59.95, labor_hours: 0.3 },
{ service: "Brake Fluid Inspection", priority: "medium", price: 0, labor_hours: 0.2 },
{ service: "Coolant Level Check", priority: "medium", price: 0, labor_hours: 0.1 }
],
45000: [
{ service: "Brake Pad Inspection", priority: "high", price: 0, labor_hours: 0.3 },
{ service: "Transmission Fluid Check", priority: "medium", price: 0, labor_hours: 0.2 }
],
60000: [
{ service: "Spark Plug Replacement (4-cyl)", priority: "high", price: 249.95, labor_hours: 1.5 },
{ service: "Transmission Fluid Service", priority: "high", price: 199.95, labor_hours: 1.0 },
{ service: "Coolant Flush", priority: "high", price: 149.95, labor_hours: 0.8 },
{ service: "Brake Fluid Flush", priority: "medium", price: 119.95, labor_hours: 0.6 }
],
90000: [
{ service: "Differential Fluid Service (4WD/AWD)", priority: "high", price: 179.95, labor_hours: 0.8 },
{ service: "Transfer Case Fluid (4WD)", priority: "medium", price: 149.95, labor_hours: 0.7 }
],
100000: [
{ service: "Timing Belt Replacement (if equipped)", priority: "critical", price: 899.95, labor_hours: 4.0 },
{ service: "Water Pump Replacement", priority: "high", price: 449.95, labor_hours: 2.0 },
{ service: "Drive Belt Replacement", priority: "medium", price: 149.95, labor_hours: 0.8 }
],
120000: [
{ service: "Spark Plug Replacement (V6)", priority: "high", price: 349.95, labor_hours: 2.0 }
]
},

modelSpecific: {
  RAV4: {
    30000: [{ service: "AWD System Inspection", priority: "medium", price: 0, labor_hours: 0.3 }],
    60000: [{ service: "Rear Differential Service (AWD)", priority: "high", price: 179.95, labor_hours: 0.8 }]
  },

  Prius: {
    30000: [{ service: "Hybrid Battery Cooling System Check", priority: "high", price: 89.95, labor_hours: 0.5 }],
    60000: [{ service: "Hybrid Inverter Coolant Service", priority: "high", price: 249.95, labor_hours: 1.2 }]
  },

  Tacoma: {
    30000: [{ service: "4WD System Inspection", priority: "medium", price: 0, labor_hours: 0.3 }]
  },

  Tundra: {
    60000: [{ service: "Spark Plug Replacement (V8)", priority: "high", price: 449.95, labor_hours: 2.5 }]
  },

  "4Runner": {
    30000: [{ service: "4WD System Inspection", priority: "medium", price: 0, labor_hours: 0.3 }],
    60000: [{ service: "Rear Differential Service", priority: "high", price: 179.95, labor_hours: 0.8 }]
  }
}

};

window.MAINTENANCE_SCHEDULE = maintenanceSchedule;
})();
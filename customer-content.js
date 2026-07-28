// customer-content.js
// Customer-facing explanations keyed by the existing service names.
// This file contains presentation copy only; interval and applicability rules remain in data.js/logic.js.

(function () {
  "use strict";

  const defaultContent = {
    icon: "🔧",
    benefit: "Helps support reliable operation and long-term vehicle care.",
    why: "Preventive maintenance addresses wear, fluid condition, and inspection needs before they become larger concerns.",
    protects: ["Vehicle reliability", "Component life", "Long-term ownership value"],
    neglect: "Delaying maintenance can allow normal wear or degraded fluid condition to continue. It does not guarantee a failure, but it can reduce the opportunity to address concerns early.",
    source: "Service recommendation"
  };

  const byService = {
    "Oil & Filter Change": {
      icon: "🛢️",
      benefit: "Maintains clean lubrication for internal engine components.",
      why: "Engine oil carries heat and contaminants while protecting moving parts. Replacing it at the proper interval restores the oil's protective properties.",
      protects: ["Internal engine components", "Lubrication quality", "Engine longevity"],
      neglect: "Extended oil use can increase contamination and reduce lubrication performance.",
      source: "Toyota scheduled maintenance"
    },
    "Tire Rotation": {
      icon: "🛞",
      benefit: "Promotes more even tire wear across all four positions.",
      why: "Front and rear tires usually wear at different rates. Rotation helps distribute that wear and can help customers get more useful life from the tire set.",
      protects: ["Tire life", "Traction consistency", "Ride quality"],
      neglect: "Uneven wear may shorten tire life and require replacement sooner.",
      source: "Toyota scheduled maintenance"
    },
    "Multi-Point Inspection": {
      icon: "🔎",
      benefit: "Creates an early snapshot of wear, fluid condition, and safety-related items.",
      why: "A structured inspection helps identify visible concerns before they become harder or more expensive to address.",
      protects: ["Safety systems", "Maintenance planning", "Unexpected repair risk"],
      neglect: "Skipping inspections can delay discovery of leaks, wear, or damage.",
      source: "Inspection result"
    },
    "Cabin Air Filter": {
      icon: "🌬️",
      benefit: "Supports clean airflow through the vehicle's climate-control system.",
      why: "The filter captures dust, pollen, and debris before air enters the cabin. A restricted filter can reduce airflow.",
      protects: ["Cabin air quality", "HVAC airflow", "Blower performance"],
      neglect: "A heavily restricted filter may reduce airflow and allow more debris into the HVAC housing.",
      source: "Condition-based recommendation"
    },
    "Engine Air Filter Replacement": {
      icon: "💨",
      benefit: "Helps the engine receive clean, unrestricted intake air.",
      why: "The engine air filter traps airborne debris before it reaches the intake system. Replacement is recommended when the filter is dirty or restricted.",
      protects: ["Engine airflow", "Air-intake components", "Combustion consistency"],
      neglect: "A restricted filter may reduce airflow and can contribute to reduced performance.",
      source: "Condition-based recommendation"
    },
    "Brake Fluid Inspection": {
      icon: "🛑",
      benefit: "Checks the condition of the fluid that transfers braking force hydraulically.",
      why: "Brake fluid can absorb moisture over time. Inspection helps determine whether condition or moisture content supports replacement.",
      protects: ["Hydraulic braking components", "ABS components", "Corrosion protection"],
      neglect: "Degraded or moisture-contaminated fluid may provide less corrosion protection and hydraulic performance.",
      source: "Inspection result"
    },
    "Brake Fluid Flush": {
      icon: "🛑",
      benefit: "Replaces aged brake fluid with fresh fluid for the hydraulic braking system.",
      why: "Brake fluid can absorb moisture over time. Fresh fluid helps maintain hydraulic performance and corrosion protection.",
      protects: ["Brake lines and calipers", "Master cylinder", "ABS hydraulic components"],
      neglect: "Old fluid may contain more moisture and provide less corrosion protection. Replacement does not repair mechanical brake problems.",
      source: "Dealership preventive-maintenance recommendation"
    },
    "Transmission Fluid Service": {
      icon: "⚙️",
      benefit: "Supports lubrication, cooling, and proper transmission operation.",
      why: "Transmission fluid works under heat and load. Correct fluid and procedure help maintain lubrication and operating quality.",
      protects: ["Transmission components", "Lubrication quality", "Shift operation"],
      neglect: "Fluid condition can degrade with heat and use. The exact service procedure should be verified for the vehicle.",
      source: "Verification required"
    },
    "Coolant Flush": {
      icon: "🌡️",
      benefit: "Restores coolant condition and corrosion protection in the engine cooling system.",
      why: "Coolant manages heat and contains corrosion inhibitors that change over time.",
      protects: ["Radiator and water pump", "Engine cooling passages", "Heater core"],
      neglect: "Aged coolant may provide less corrosion protection. Coolant service does not repair an existing overheating problem.",
      source: "Verification required"
    },
    "Hybrid Inverter Coolant Service": {
      icon: "⚡",
      benefit: "Supports heat management for hybrid power electronics.",
      why: "Many hybrid vehicles use a separate coolant circuit for the inverter and related electronics.",
      protects: ["Hybrid inverter", "Power electronics", "Cooling-system reliability"],
      neglect: "Aged coolant may provide less heat-transfer and corrosion protection. Applicability must be verified by model.",
      source: "Verification required"
    },
    "Hybrid Battery Cooling System Check": {
      icon: "🔋",
      benefit: "Helps maintain airflow used to cool the hybrid battery system.",
      why: "Dust, lint, hair, and debris can restrict the battery cooling intake or filter.",
      protects: ["Hybrid battery cooling", "Cooling-fan airflow", "Battery temperature management"],
      neglect: "Restricted airflow may reduce cooling effectiveness. A dirty intake alone does not guarantee battery failure.",
      source: "Condition-based recommendation"
    },
    "Differential Fluid Service (4WD/AWD)": {
      icon: "🛞",
      benefit: "Maintains lubrication for drivetrain gears and bearings.",
      why: "Differentials operate under heat and load. Fresh correct-specification fluid supports wear protection.",
      protects: ["Differential gears", "Bearings", "AWD/4WD drivetrain"],
      neglect: "Old or contaminated lubricant may provide less wear protection.",
      source: "Dealership preventive-maintenance recommendation"
    },
    "Transfer Case Fluid (4WD)": {
      icon: "⚙️",
      benefit: "Maintains lubrication in the transfer case on applicable 4WD vehicles.",
      why: "The transfer case distributes power through the drivetrain and relies on the correct lubricant.",
      protects: ["Transfer-case gears", "Bearings", "4WD operation"],
      neglect: "Degraded lubricant may provide less protection under heat and load.",
      source: "Dealership preventive-maintenance recommendation"
    },
    "Spark Plug Replacement (4-cyl)": sparkPlugContent(),
    "Spark Plug Replacement (V6)": sparkPlugContent(),
    "Spark Plug Replacement (V8)": sparkPlugContent(),
    "Rear Differential Service (AWD)": drivetrainContent(),
    "Rear Differential Service": drivetrainContent(),
    "AWD System Inspection": drivetrainInspectionContent(),
    "4WD System Inspection": drivetrainInspectionContent()
  };

  function sparkPlugContent() {
    return {
      icon: "⚡",
      benefit: "Supports reliable ignition, smooth operation, and emissions performance.",
      why: "Spark-plug electrodes wear with use, which can increase the voltage needed to ignite the air-fuel mixture.",
      protects: ["Ignition performance", "Catalytic converter", "Fuel combustion"],
      neglect: "Worn plugs may contribute to hard starting, misfires, reduced performance, or catalyst stress.",
      source: "Owner's manual interval — verify exact engine"
    };
  }

  function drivetrainContent() {
    return {
      icon: "🛞",
      benefit: "Maintains lubrication for drivetrain gears and bearings.",
      why: "Differential fluid operates under heat and load. Fresh correct-specification fluid supports wear protection.",
      protects: ["Differential gears", "Bearings", "AWD drivetrain"],
      neglect: "Old or contaminated lubricant may provide less wear protection.",
      source: "Dealership preventive-maintenance recommendation"
    };
  }

  function drivetrainInspectionContent() {
    return {
      icon: "🔎",
      benefit: "Checks applicable AWD or 4WD components for leaks, damage, and fluid concerns.",
      why: "Drivetrain systems contain multiple components that can be inspected before symptoms become obvious.",
      protects: ["Differentials", "Transfer components", "Drivetrain reliability"],
      neglect: "Leaks or damage may remain unnoticed without inspection.",
      source: "Inspection result"
    };
  }

  function get(serviceName) {
    return { ...defaultContent, ...(byService[serviceName] || {}) };
  }

  window.CustomerServiceContent = { get };
})();
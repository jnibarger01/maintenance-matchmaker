const maintenanceScheduleFixture = {
  intervals: {
    5000: [
      {
        service: "Oil & Filter Change",
        priority: "high",
        price: 79.95,
        labor_hours: 0.5
      },
      {
        service: "Tire Rotation",
        priority: "high",
        price: 29.95,
        labor_hours: 0.3
      },
      {
        service: "Brake Inspection",
        priority: "medium",
        price: 0,
        labor_hours: 0.2
      }
    ],
    15000: [
      {
        service: "Cabin Air Filter",
        priority: "medium",
        price: 49.95,
        labor_hours: 0.2
      },
      {
        service: "Brake Inspection",
        priority: "medium",
        price: 0,
        labor_hours: 0.2
      }
    ],
    30000: [
      {
        service: "Engine Air Filter Replacement",
        priority: "high",
        price: 59.95,
        labor_hours: 0.3
      }
    ]
  },
  modelSpecific: {
    RAV4: {
      30000: [
        {
          service: "AWD System Inspection",
          priority: "medium",
          price: 0,
          labor_hours: 0.3
        }
      ],
      60000: [
        {
          service: "Brake Inspection",
          priority: "medium",
          price: 0,
          labor_hours: 0.2
        }
      ]
    }
  }
};

export default maintenanceScheduleFixture;

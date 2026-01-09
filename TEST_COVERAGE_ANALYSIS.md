# Test Coverage Analysis - Maintenance Matchmaker

**Date:** 2026-01-09
**Current Status:** No test infrastructure exists

## Executive Summary

The Maintenance Matchmaker codebase currently has **zero test coverage**. This analysis identifies critical areas requiring test coverage and provides actionable recommendations for implementing a comprehensive test suite.

### Key Findings
- ✅ **Well-structured code**: IIFE pattern with clear separation of concerns
- ❌ **No testing framework**: No package.json, Jest, or test runner configured
- ❌ **No test files**: Zero existing tests
- ⚠️ **Complex business logic**: Deduplication and recommendation algorithms untested
- ⚠️ **Edge cases**: Mileage boundaries, model specifics, and data validation unverified

---

## Current Codebase Structure

| File | Lines | Purpose | Test Priority |
|------|-------|---------|---------------|
| **data.js** | 76 | Maintenance schedule data | HIGH |
| **logic.js** | 103 | Business logic (recommendation engine) | CRITICAL |
| **ui.js** | 270 | DOM interactions & rendering | MEDIUM |
| **index.html** | 156 | UI structure & styling | LOW |

---

## Critical Areas Requiring Test Coverage

### 1. Business Logic (logic.js) - CRITICAL PRIORITY

#### 1.1 `findNextInterval(mileage)` - Lines 21-24
**Purpose:** Finds the next service interval based on current mileage

**Critical Test Cases:**
```javascript
// Boundary conditions
- Input: 0 → Expected: 5000
- Input: 4999 → Expected: 5000
- Input: 5000 → Expected: 15000
- Input: 5001 → Expected: 15000
- Input: 120000 → Expected: 125000 (fallback to 5k increment)
- Input: 125000 → Expected: 130000

// Edge cases
- Input: -100 → Expected: 5000 (or error handling)
- Input: 999999 → Expected: 1000000 (ceiling logic)
```

**Identified Issues:**
- ❌ No validation for negative mileage
- ❌ Hardcoded interval array (duplicates data structure)
- ⚠️ Fallback calculation `Math.ceil(mileage / 5000) * 5000` untested for large values

---

#### 1.2 `calculateRecommendations(model, currentMileage, lookAheadMiles)` - Lines 31-95
**Purpose:** Core recommendation engine with complex deduplication logic

**Critical Test Cases:**

**Basic Functionality:**
```javascript
// Standard intervals
- Model: "Camry", Mileage: 30000, LookAhead: 5000
  → Should include 30000 services (Oil, Tire, Engine Air Filter, etc.)
  → Should NOT include 45000 services (outside lookahead)

- Model: "Camry", Mileage: 58000, LookAhead: 5000
  → Should include all services up to 60000
  → Services at 60000 should NOT be marked overdue
  → Services at 30000, 45000 should be marked overdue
```

**Model-Specific Logic:**
```javascript
// RAV4 AWD additions
- Model: "RAV4", Mileage: 30000
  → Should include "AWD System Inspection" (data.js:50)
  → Should merge with base 30000 services

// Prius hybrid services
- Model: "Prius", Mileage: 60000
  → Should include "Hybrid Inverter Coolant Service" (data.js:56)
  → Should include base 60000 services

// Unknown model
- Model: "UnknownModel", Mileage: 30000
  → Should return base services only (no crash)
```

**Deduplication Logic (Lines 79-92):**
```javascript
// Critical deduplication scenario
- If a service appears at multiple intervals, keep the earliest
- Test data structure integrity after deduplication
- Verify services are sorted by interval within priority

// Potential bug to test:
// If "Spark Plug Replacement" appears at both 60000 (4-cyl)
// and 120000 (V6), verify correct behavior
```

**Priority Bucketing:**
```javascript
// Verify correct assignment to priority arrays
- critical → recommendations.critical[]
- high → recommendations.high[]
- medium → recommendations.medium[]
- low → recommendations.low[]

// Edge case: Missing priority field
- Service with priority: undefined → Should default to "low"?
```

**Overdue Calculation:**
```javascript
// Current: 65000, Service due: 60000
- overdue: true
- milesUntil: -5000 (negative)

// Current: 55000, Service due: 60000
- overdue: false
- milesUntil: 5000
```

**Identified Issues:**
- ❌ No validation for invalid model names
- ❌ No handling for missing/null parameters
- ❌ Deduplication logic untested (Lines 83-89)
- ⚠️ No tests for `lookAheadMiles` edge cases (0, negative, very large)

---

#### 1.3 `makeServiceKey(service)` - Lines 26-29
**Purpose:** Creates unique keys for service deduplication

**Test Cases:**
```javascript
// Standard key generation
- Input: { service: "Oil Change", interval: 5000 }
  → Expected: "Oil Change@@5000"

// Special characters
- Input: { service: "Oil & Filter Change", interval: 5000 }
  → Expected: "Oil & Filter Change@@5000"

// Edge cases
- Input: { service: "", interval: 0 }
  → Expected: "@@0"
- Input: { service: null, interval: undefined }
  → Expected: Test error handling
```

---

#### 1.4 `getIntervalsSorted()` - Lines 14-19
**Purpose:** Extracts and sorts maintenance intervals

**Test Cases:**
```javascript
// Verify sorting
- Should return: [5000, 15000, 30000, 45000, 60000, 90000, 100000, 120000]
- Should convert strings to numbers
- Should be in ascending order

// Data integrity
- Should match data.js intervals object keys
- Should not include model-specific intervals
```

---

#### 1.5 `assertSchedule()` - Lines 8-12
**Purpose:** Validates data.js loaded before logic.js

**Test Cases:**
```javascript
// Dependency validation
- window.MAINTENANCE_SCHEDULE exists → No error
- window.MAINTENANCE_SCHEDULE missing → Throw error

// Error message clarity
- Error message should mention data.js and load order
```

---

### 2. Input Validation (ui.js) - HIGH PRIORITY

#### 2.1 `validateInputs()` - Lines 21-38
**Purpose:** Form input validation

**Critical Test Cases:**
```javascript
// Valid inputs
- Year: "2020", Model: "Camry", Mileage: "50000"
  → Returns: { year: "2020", model: "Camry", mileage: 50000 }

// Missing fields
- Year: "", Model: "Camry", Mileage: "50000"
  → Returns: null, alerts user

// Invalid mileage
- Mileage: "abc" → NaN detection
- Mileage: "-1000" → Negative rejection
- Mileage: "500001" → Upper bound (500000) enforcement
- Mileage: "0" → Valid edge case
- Mileage: "500000" → Valid boundary

// Whitespace handling
- Year: "  2020  ", Model: "  Camry  ", Mileage: "  50000  "
  → Should trim and validate correctly
```

**Identified Issues:**
- ✅ Good: Validates range 0-500000
- ✅ Good: Checks for NaN
- ⚠️ No validation for year format (could be "abcd")
- ⚠️ No validation for model name against known models

---

### 3. State Management (ui.js) - MEDIUM PRIORITY

#### 3.1 `toggleService(checkbox)` - Lines 65-82
**Purpose:** Manages service selection state

**Test Cases:**
```javascript
// Add to selection
- Checkbox checked → Service added to state.selected Map
- Item gets "selected" CSS class

// Remove from selection
- Checkbox unchecked → Service removed from state.selected
- Item loses "selected" CSS class

// State consistency
- Multiple toggles on same service → Correct state
- Service key uniqueness (via makeServiceKey)
```

---

#### 3.2 `updateSummary()` - Lines 84-102
**Purpose:** Calculates and displays summary totals

**Test Cases:**
```javascript
// No selections
- state.selected.size === 0
  → Summary bar hidden (no "active" class)

// Single service
- 1 service: $79.95, 0.5h
  → Count: 1, Total: $79.95, Hours: 0.5h

// Multiple services
- 3 services: $79.95 + $29.95 + $0 = $109.90
- Labor: 0.5 + 0.3 + 0.2 = 1.0h
  → Correct totals

// Free services
- Service with price: 0
  → Should contribute 0 to total (no NaN)
```

---

### 4. Data Integrity (data.js) - HIGH PRIORITY

#### 4.1 Schema Validation
**Test Cases:**
```javascript
// Required fields present
- All services have: service, priority, price, labor_hours
- All intervals are valid numbers
- All prices are non-negative
- All labor_hours are non-negative

// Priority values
- Valid priorities: "critical", "high", "medium", "low"
- No typos (e.g., "hight", "medum")

// Model-specific structure
- modelSpecific keys match real Toyota models
- No duplicate services within same interval
```

---

#### 4.2 Data Consistency
**Test Cases:**
```javascript
// Interval coverage
- Verify intervals: 5000, 15000, 30000, 45000, 60000, 90000, 100000, 120000
- No gaps in service schedule

// Pricing sanity
- All prices within reasonable range ($0 - $1000)
- Labor hours within reasonable range (0 - 8h)
- Critical services have higher prices (generally)

// Service name consistency
- No duplicate service names with different details
- Spark plug services for different engines are distinct
```

---

### 5. Rendering & DOM (ui.js) - MEDIUM PRIORITY

#### 5.1 `renderRecommendations(recommendations)` - Lines 104-169
**Purpose:** Renders service recommendations to DOM

**Test Cases (DOM Testing):**
```javascript
// Empty recommendations
- All priorities empty → Show "All caught up!" empty state

// Priority ordering
- Services rendered in order: critical, high, medium, low
- Empty priorities skipped

// Service item rendering
- Overdue services show "OVERDUE" in red
- Due services show "Due in X mi"
- Prices formatted correctly (FREE vs $XX.XX)
- Labor hours displayed

// Data attributes
- Each item has data-service with JSON
- JSON parseable back to object
```

---

#### 5.2 `copyToClipboard(event)` - Lines 171-224
**Purpose:** Exports selected services to clipboard

**Test Cases:**
```javascript
// No selections
- state.selected.size === 0 → Alert user

// Format validation
- Header includes vehicle info
- Services grouped by priority
- Total calculated correctly
- Footer includes attribution

// Clipboard API
- Mock navigator.clipboard.writeText
- Test success callback (button feedback)
- Test error callback (alert user)
```

---

### 6. Edge Cases & Error Scenarios

#### 6.1 Script Load Order
```javascript
// Test execution order dependency
- data.js loaded after logic.js → assertSchedule() throws
- ui.js loaded before logic.js → window.MatchmakerLogic undefined
```

#### 6.2 Browser Compatibility
```javascript
// Clipboard API availability
- navigator.clipboard undefined (older browsers)

// ES6 features
- Map, Set support
- Arrow functions
- Template literals
```

#### 6.3 Extreme Values
```javascript
// Very high mileage
- 1,000,000 miles → findNextInterval fallback
- 999,999 miles → Ceiling calculation

// Very low mileage
- 0 miles → First interval (5000)
- 1 mile → First interval (5000)
```

---

## Recommended Testing Setup

### Phase 1: Framework Setup (Week 1)

**Option A: Jest (Recommended for vanilla JS)**
```bash
# Initialize project
npm init -y

# Install Jest
npm install --save-dev jest

# Install JSDOM for DOM testing
npm install --save-dev jest-environment-jsdom

# Configure package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**jest.config.js:**
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    '*.js',
    '!node_modules/**',
    '!coverage/**'
  ],
  coverageThresholds: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  }
};
```

**Option B: Vitest (Modern, faster)**
- Better ES modules support
- Faster execution
- Similar API to Jest

---

### Phase 2: Test Structure

```
maintenance-matchmaker/
├── data.js
├── logic.js
├── ui.js
├── index.html
├── package.json
├── jest.config.js
├── __tests__/
│   ├── data.test.js
│   ├── logic.test.js
│   ├── ui.test.js
│   └── integration.test.js
└── __mocks__/
    └── browser-mocks.js
```

---

### Phase 3: Test Implementation Priority

**Sprint 1: Critical Business Logic (logic.js)**
- ✅ `findNextInterval()` - 10 test cases
- ✅ `calculateRecommendations()` - 25 test cases
- ✅ `makeServiceKey()` - 5 test cases
- ✅ `getIntervalsSorted()` - 3 test cases
- Target: 90%+ coverage of logic.js

**Sprint 2: Data Validation (data.js)**
- ✅ Schema validation - 10 test cases
- ✅ Data integrity checks - 8 test cases
- ✅ Model-specific data - 6 test cases
- Target: 100% data validation

**Sprint 3: Input Validation (ui.js)**
- ✅ `validateInputs()` - 12 test cases
- ✅ `updateSummary()` - 8 test cases
- ✅ `toggleService()` - 6 test cases
- Target: 80%+ coverage of critical UI functions

**Sprint 4: DOM & Integration**
- ✅ `renderRecommendations()` - 10 test cases
- ✅ `copyToClipboard()` - 6 test cases
- ✅ Integration tests - 8 test cases
- Target: 70%+ overall coverage

---

## Test Coverage Goals

| Component | Current | Target | Critical Areas |
|-----------|---------|--------|----------------|
| **logic.js** | 0% | 90% | Recommendation algorithm, deduplication |
| **data.js** | 0% | 100% | Schema validation, data integrity |
| **ui.js** | 0% | 75% | Input validation, state management |
| **Overall** | 0% | 80% | Business logic + data validation |

---

## Critical Bugs to Test For

### 1. Deduplication Logic (logic.js:83-89)
```javascript
// Potential issue:
// What if two services with same name appear at same interval?
// Current code keeps first one encountered
const prev = map.get(s.service);
if (s.interval < prev.interval) map.set(s.service, s);
```

**Test case:**
```javascript
// Simulate duplicate service at same interval
// Verify behavior is deterministic
```

---

### 2. Negative Miles Until (logic.js:45, 66)
```javascript
// Overdue services have negative milesUntil
const milesUntil = interval - currentMileage; // Can be negative

// Verify UI handles negative values correctly
// Example: Current: 70000, Due: 60000 → milesUntil: -10000
```

---

### 3. Model Name Case Sensitivity (logic.js:58)
```javascript
const modelBlock = schedule.modelSpecific?.[model];

// Bug: "rav4" !== "RAV4"
// Test: Model input "rav4" might not match data.js "RAV4"
// Recommendation: Normalize model names
```

---

### 4. Mileage Upper Bound (ui.js:31)
```javascript
if (mileage > 500000) {
  alert("Please enter a valid mileage");
  return null;
}

// Test: What happens with mileage = 500001?
// Test: findNextInterval(500000) → Should return valid interval
```

---

## Example Test File Structure

### `__tests__/logic.test.js` (Starter)
```javascript
describe('findNextInterval', () => {
  test('returns 5000 for new vehicle (0 miles)', () => {
    expect(MatchmakerLogic.findNextInterval(0)).toBe(5000);
  });

  test('returns 5000 for mileage just under first interval', () => {
    expect(MatchmakerLogic.findNextInterval(4999)).toBe(5000);
  });

  test('returns 15000 for mileage at first interval', () => {
    expect(MatchmakerLogic.findNextInterval(5000)).toBe(15000);
  });

  test('calculates ceiling for mileage beyond last interval', () => {
    expect(MatchmakerLogic.findNextInterval(120000)).toBe(125000);
    expect(MatchmakerLogic.findNextInterval(127500)).toBe(130000);
  });

  test('handles very high mileage', () => {
    expect(MatchmakerLogic.findNextInterval(999999)).toBe(1000000);
  });
});

describe('calculateRecommendations', () => {
  test('returns services due at exact interval', () => {
    const result = MatchmakerLogic.calculateRecommendations('Camry', 30000, 0);
    // Verify 30000 mile services are included
    const allServices = [...result.critical, ...result.high, ...result.medium, ...result.low];
    const thirtyKServices = allServices.filter(s => s.interval === 30000);
    expect(thirtyKServices.length).toBeGreaterThan(0);
  });

  test('marks overdue services correctly', () => {
    const result = MatchmakerLogic.calculateRecommendations('Camry', 35000, 5000);
    const allServices = [...result.critical, ...result.high, ...result.medium, ...result.low];
    const overdueServices = allServices.filter(s => s.interval <= 35000);
    overdueServices.forEach(service => {
      expect(service.overdue).toBe(true);
      expect(service.milesUntil).toBeLessThan(0);
    });
  });

  test('includes model-specific services for RAV4', () => {
    const result = MatchmakerLogic.calculateRecommendations('RAV4', 30000, 0);
    const allServices = [...result.critical, ...result.high, ...result.medium, ...result.low];
    const awdService = allServices.find(s => s.service.includes('AWD'));
    expect(awdService).toBeDefined();
  });

  test('handles unknown model gracefully', () => {
    const result = MatchmakerLogic.calculateRecommendations('UnknownModel', 30000, 0);
    // Should still return base services
    expect(result).toHaveProperty('critical');
    expect(result).toHaveProperty('high');
    expect(result).toHaveProperty('medium');
    expect(result).toHaveProperty('low');
  });
});
```

---

## Quick Wins (Implement First)

1. **Add npm/package.json** - 5 minutes
2. **Install Jest** - 5 minutes
3. **Test `findNextInterval()`** - 30 minutes
4. **Test `makeServiceKey()`** - 15 minutes
5. **Data schema validation** - 45 minutes

**Total Time to 50% coverage: ~4-6 hours**

---

## Long-Term Recommendations

### 1. Continuous Integration
- Add GitHub Actions workflow
- Run tests on every PR
- Enforce coverage thresholds

### 2. Test-Driven Development
- Write tests before adding new features
- Maintain 80%+ coverage

### 3. Code Refactoring Opportunities
- Extract validation logic to separate module
- Normalize model names (case-insensitive)
- Add TypeScript for type safety

### 4. Additional Testing Tools
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **Husky** - Pre-commit hooks
- **Codecov** - Coverage reporting

---

## Summary

The Maintenance Matchmaker codebase is well-structured but **completely untested**. Priority areas:

1. **CRITICAL**: `calculateRecommendations()` business logic (logic.js:31-95)
2. **HIGH**: Input validation (ui.js:21-38)
3. **HIGH**: Data schema validation (data.js)
4. **MEDIUM**: State management (ui.js)
5. **MEDIUM**: DOM rendering (ui.js)

**Recommended first steps:**
1. Set up Jest testing framework
2. Write tests for `findNextInterval()` and `makeServiceKey()` (easy wins)
3. Test `calculateRecommendations()` with focus on deduplication logic
4. Add data validation tests
5. Implement CI/CD with coverage reporting

**Estimated effort:** 20-30 hours to reach 80% test coverage across all critical paths.

// validation.js
// Input validation helpers for vehicle year/model/mileage.

(function () {
"use strict";

const YEAR_RANGE = {
min: 1984,
max: 2026
};

function parseYearInput(yearRaw) {
const trimmed = yearRaw.trim();

if (!trimmed) {
  return { error: "Please enter a vehicle year." };
}

const yearNumber = Number(trimmed);
if (!Number.isInteger(yearNumber)) {
  return { error: "Please enter a valid year." };
}

if (yearNumber < YEAR_RANGE.min || yearNumber > YEAR_RANGE.max) {
  return { error: `Please enter a year between ${YEAR_RANGE.min} and ${YEAR_RANGE.max}.` };
}

return { value: yearNumber };
}

function validateVehicleInputs({ yearRaw, modelRaw, mileageRaw }) {
const yearResult = parseYearInput(yearRaw);
if (yearResult.error) {
  return { error: yearResult.error };
}

const model = modelRaw.trim();
if (!model) {
  return { error: "Please select a model." };
}

const mileageText = mileageRaw.trim();
if (mileageText === "") {
  return { error: "Please enter the current mileage." };
}

const mileage = parseInt(mileageText, 10);
if (Number.isNaN(mileage) || mileage < 0 || mileage > 500000) {
  return { error: "Please enter a valid mileage." };
}

return {
  value: {
    year: yearResult.value,
    model,
    mileage
  }
};
}

const api = {
YEAR_RANGE,
parseYearInput,
validateVehicleInputs
};

if (typeof window !== "undefined") {
window.MatchmakerValidation = api;
}

if (typeof module !== "undefined" && module.exports) {
module.exports = api;
}
})();

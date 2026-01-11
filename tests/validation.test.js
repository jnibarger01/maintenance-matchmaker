const assert = require("assert");
const { validateVehicleInputs, YEAR_RANGE } = require("../validation");

function expectError(result, message) {
assert.strictEqual(result.error, message);
assert.strictEqual(result.value, undefined);
}

function expectValue(result, value) {
assert.deepStrictEqual(result.value, value);
assert.strictEqual(result.error, undefined);
}

expectError(
validateVehicleInputs({ yearRaw: "", modelRaw: "Camry", mileageRaw: "1000" }),
"Please enter a vehicle year."
);

expectError(
validateVehicleInputs({ yearRaw: "20x0", modelRaw: "Camry", mileageRaw: "1000" }),
"Please enter a valid year."
);

expectError(
validateVehicleInputs({
  yearRaw: String(YEAR_RANGE.min - 1),
  modelRaw: "Camry",
  mileageRaw: "1000"
}),
`Please enter a year between ${YEAR_RANGE.min} and ${YEAR_RANGE.max}.`
);

expectError(
validateVehicleInputs({
  yearRaw: String(YEAR_RANGE.max + 1),
  modelRaw: "Camry",
  mileageRaw: "1000"
}),
`Please enter a year between ${YEAR_RANGE.min} and ${YEAR_RANGE.max}.`
);

expectError(
validateVehicleInputs({ yearRaw: "2018", modelRaw: "", mileageRaw: "1000" }),
"Please select a model."
);

expectError(
validateVehicleInputs({ yearRaw: "2018", modelRaw: "Camry", mileageRaw: "" }),
"Please enter the current mileage."
);

expectError(
validateVehicleInputs({ yearRaw: "2018", modelRaw: "Camry", mileageRaw: "abc" }),
"Please enter a valid mileage."
);

expectError(
validateVehicleInputs({ yearRaw: "2018", modelRaw: "Camry", mileageRaw: "-1" }),
"Please enter a valid mileage."
);

expectValue(
validateVehicleInputs({ yearRaw: "2018", modelRaw: "Camry", mileageRaw: "12000" }),
{ year: 2018, model: "Camry", mileage: 12000 }
);

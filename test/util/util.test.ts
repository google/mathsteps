import { appendToArrayInObject } from "../../lib/util/Util";
import assert = require("assert");

describe("appendToArrayInObject", function () {
  it("creates empty array", function () {
    const object = {};
    appendToArrayInObject(object, "key", "value");
    assert.deepEqual(object, { key: ["value"] });
  });
  it("appends to array if it exists", function () {
    const object = { key: ["old_value"] };
    appendToArrayInObject(object, "key", "new_value");
    assert.deepEqual(object, { key: ["old_value", "new_value"] });
  });
});

const test = require("node:test");
const assert = require("node:assert/strict");

const { getPagination } = require("../src/utils/catalogValidation");

test("phân trang sử dụng giá trị mặc định", () => {
  assert.deepEqual(getPagination({}), {
    page: 1,
    limit: 12,
    skip: 0,
  });
});

test("phân trang tính skip chính xác", () => {
  assert.deepEqual(getPagination({ page: "3", limit: "10" }), {
    page: 3,
    limit: 10,
    skip: 20,
  });
});

test("từ chối page và limit không hợp lệ", () => {
  assert.equal(getPagination({ page: "-1" }), null);
  assert.equal(getPagination({ page: "2abc" }), null);
  assert.equal(getPagination({ page: "0" }), null);
  assert.equal(getPagination({ limit: "0" }), null);
  assert.equal(getPagination({ limit: "101" }), null);
  assert.equal(getPagination({ limit: "abc" }), null);
});

test("từ chối giá trị phân trang vượt giới hạn an toàn", () => {
  assert.equal(getPagination({ page: "9007199254740991", limit: "100" }), null);
});

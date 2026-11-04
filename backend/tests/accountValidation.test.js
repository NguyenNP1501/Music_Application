const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isObject,
  normalizeEmail,
  validatePassword,
  normalizeText,
  normalizeAvatarUrl,
  parseBirthDate,
} = require("../src/utils/accountValidation");

test("body phải là object JSON", () => {
  assert.equal(isObject({ email: "a@b.com" }), true);
  assert.equal(isObject(null), false);
  assert.equal(isObject([]), false);
});

test("email được chuẩn hóa và kiểm tra giới hạn", () => {
  assert.equal(normalizeEmail(" Test@Example.com "), "test@example.com");
  assert.equal(normalizeEmail("not-an-email"), null);
  assert.equal(normalizeEmail(123), null);
  assert.equal(normalizeEmail("a".repeat(250) + "@b.com"), null);
});

test("mật khẩu phải từ 8 đến 72 byte UTF-8", () => {
  assert.equal(validatePassword("12345678"), true);
  assert.equal(validatePassword("1234567"), false);
  assert.equal(validatePassword("a".repeat(73)), false);
  assert.equal(validatePassword(12345678), false);
});

test("họ tên và nickname được chuẩn hóa an toàn", () => {
  assert.deepEqual(normalizeText("  Nguyen Van A  ", { required: true }), {
    valid: true,
    value: "Nguyen Van A",
  });
  assert.equal(normalizeText("   ", { required: true }).valid, false);
  assert.equal(normalizeText("x".repeat(256), { required: true }).valid, false);
  assert.deepEqual(normalizeText("  ", { nullable: true }), {
    valid: true,
    value: null,
  });
  assert.equal(normalizeText({}).valid, false);
});

test("avatar chỉ nhận URL HTTP/HTTPS hoặc chuỗi rỗng", () => {
  assert.equal(normalizeAvatarUrl("https://example.com/a.png").valid, true);
  assert.equal(normalizeAvatarUrl("javascript:alert(1)").valid, false);
  assert.equal(normalizeAvatarUrl("not a url").valid, false);
  assert.deepEqual(normalizeAvatarUrl("  "), { valid: true, value: "" });
});

test("ngày sinh phải đúng YYYY-MM-DD, tồn tại và không ở tương lai", () => {
  assert.equal(parseBirthDate("2000-02-29").valid, true);
  assert.equal(parseBirthDate("2001-02-29").valid, false);
  assert.equal(parseBirthDate("2000-13-01").valid, false);
  assert.equal(parseBirthDate("01/01/2000").valid, false);
  assert.equal(parseBirthDate("2999-01-01").valid, false);
  assert.equal(parseBirthDate(undefined, { optional: true }).valid, true);
});

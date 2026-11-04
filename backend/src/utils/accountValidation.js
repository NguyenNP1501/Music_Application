const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeEmail(value) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 255 && EMAIL_PATTERN.test(email) ? email : null;
}

function validatePassword(value) {
  return (
    typeof value === "string" &&
    value.length >= 8 &&
    Buffer.byteLength(value, "utf8") <= 72
  );
}

function normalizeText(
  value,
  { required = false, max = 255, nullable = false } = {},
) {
  if (value === undefined) return { valid: !required, value: undefined };
  if (value === null && nullable) return { valid: true, value: null };
  if (typeof value !== "string") return { valid: false };
  const text = value.trim();
  if (!text && nullable) return { valid: true, value: null };
  if (!text && !required) return { valid: true, value: "" };
  return { valid: text.length > 0 && text.length <= max, value: text };
}

function normalizeAvatarUrl(value) {
  if (value === undefined) return { valid: true, value: undefined };
  if (typeof value !== "string") return { valid: false };
  const url = value.trim();
  if (!url) return { valid: true, value: "" };
  if (url.length > 255) return { valid: false };
  try {
    const parsed = new URL(url);
    return { valid: ["http:", "https:"].includes(parsed.protocol), value: url };
  } catch {
    return { valid: false };
  }
}

function parseBirthDate(value, { optional = false } = {}) {
  if (value === undefined || value === null || value === "") {
    return optional ? { valid: true, value: undefined } : { valid: false };
  }
  if (typeof value !== "string" || !DATE_PATTERN.test(value))
    return { valid: false };
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return { valid: false };
  }
  const today = new Date();
  const todayText = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
  if (value > todayText) return { valid: false };
  return { valid: true, value: date };
}

module.exports = {
  isObject,
  normalizeEmail,
  validatePassword,
  normalizeText,
  normalizeAvatarUrl,
  parseBirthDate,
};

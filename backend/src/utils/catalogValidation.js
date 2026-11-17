function getPagination(query = {}) {
  const parse = (value, fallback) => {
    if (value === undefined) return fallback;
    if (typeof value !== "string" || !/^\d+$/.test(value)) return null;

    const number = Number(value);
    return Number.isSafeInteger(number) ? number : null;
  };

  const page = parse(query.page, 1);
  const limit = parse(query.limit, 12);

  if (page === null || limit === null || page < 1 || limit < 1 || limit > 100) {
    return null;
  }

  const skip = (page - 1) * limit;

  if (!Number.isSafeInteger(skip)) return null;

  return { page, limit, skip };
}

module.exports = { getPagination };

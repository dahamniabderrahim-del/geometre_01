const HAS_TIMEZONE_SUFFIX = /(Z|[+-]\d{2}:\d{2})$/;

export function parseDatabaseTimestamp(value: string) {
  const normalized = HAS_TIMEZONE_SUFFIX.test(value) ? value : `${value}Z`;
  const parsed = new Date(normalized);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return new Date(value);
}


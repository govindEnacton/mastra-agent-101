// Sample file used to exercise the audit route. It deliberately contains
// several type-safety problems so the report has something to find.

export function parseUser(input: string): any {
  return JSON.parse(input);
}

export function getLabel(user: any) {
  if (!user) {
    return "unknown";
  }
  return user.profile.displayName;
}

export function average(values) {
  const total = values.reduce((sum: number, value: number) => sum + value, 0);
  return total / values.length;
}

export function retry(times: number) {
  let lastError;
  for (let attempt = 0; attempt < times; attempt += 1) {
    try {
      return fetchData(attempt);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function fetchData(attempt: number) {
  return { attempt, ok: true };
}

export const unsafeCast = <string>process.env.NODE_ENV;

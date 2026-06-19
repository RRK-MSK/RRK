export const AUTH_COOKIE_NAME = "ppk-crm-session";
export const AUTH_COOKIE_VALUE = "authenticated";

export const DEMO_LOGIN = "admin";
export const DEMO_PASSWORD = "ppk2026";

export function isValidCredentials(login: string, password: string) {
  return login === DEMO_LOGIN && password === DEMO_PASSWORD;
}

export const AUTH_COOKIE_NAME = "ppk-crm-session";
export const AUTH_COOKIE_VALUE = "authenticated";

export const DEMO_LOGIN = "РРК";
export const DEMO_PASSWORD = "8989123";

export function isValidCredentials(login: string, password: string) {
  return login === DEMO_LOGIN && password === DEMO_PASSWORD;
}

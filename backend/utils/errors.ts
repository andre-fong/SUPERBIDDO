export class BusinessError extends Error {
  path: string;
  status: number;
  message: string;
  detail: string;
  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.status = status;
    this.message = message;
    detail && (this.detail = detail);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const accountNotFound = () =>
  new BusinessError(
    404,
    "account not found",
    "account with specified accountUid not found"
  );

export const sessionNotFound = () =>
  new BusinessError(404, "session not found", "no active session");

export const forbidden = () =>
  new BusinessError(
    403,
    "not authenticated with targeted account",
    "this action requires authentication with targeted account"
  );

export const unauthorized = () =>
  new BusinessError(
    401,
    "not authenticated",
    "this action requires authentication with targeted account"
  );

export const invalidLogin = () =>
  new BusinessError(
    401,
    "invalid login credentials",
    "the username or password entered is incorrect"
  );

export class ServerError extends Error {
  path: string;
  status: number;
  message: string;
  detail: string;
  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.status = status;
    this.message = message;
    detail && (this.detail = detail);
    Error.captureStackTrace(this, this.constructor);
  }
}

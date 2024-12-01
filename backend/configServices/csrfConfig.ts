import { doubleCsrf, DoubleCsrfConfigOptions } from "csrf-csrf";
import { RequestHandler } from "express";
import { BusinessError } from "../utils/errors";

const doubleCsrfOptions: DoubleCsrfConfigOptions = {
  getSecret: () => {
    return process.env.CSRF_SECRET;
  },
  getSessionIdentifier: (req) => {
    return req.session.id;
  },
  cookieOptions: {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
    secure: process.env.NODE_ENV === "development" ? false : true,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours, reset on activity,
  },
  cookieName: "csrfToken",
};
export const {
  invalidCsrfTokenError, // This is just for convenience if you plan on making your own middleware.
  generateToken, // Use this in your routes to provide a CSRF hash + token cookie and token.
  validateRequest, // Also a convenience if you plan on making your own middleware.
  doubleCsrfProtection, // This is the default CSRF protection middleware.
} = doubleCsrf(doubleCsrfOptions);

export const csrfRoute: RequestHandler = (req, res) => {
  if (!req.session.accountId) {
    throw new BusinessError(
      401,
      "unauthorized",
      "must be logged in to get a csrf token"
    );
  }
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken(req, res);
  }

  res.json({ csrfToken: req.session.csrfToken });
};

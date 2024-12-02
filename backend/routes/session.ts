import express from "express";
import { pool } from "../configServices/dbConfig.js";
import bcrypt from "bcrypt";
import camelize from "camelize";
import {
  sessionNotFound,
  invalidLogin,
  BusinessError,
} from "../utils/errors.js";
import {
  doubleCsrfProtection,
  generateToken,
} from "../configServices/csrfConfig.js";
export const router = express.Router();

export async function findEmail(email: string) {
  const account = camelize(
    await pool.query<AccountDb>(
      `SELECT *
      FROM account
      WHERE email=$1`,
      [email]
    )
  ).rows[0];

  return account;
}

router.get("/", async (req, res, next) => {
  if (!req.session.accountId) {
    throw sessionNotFound();
  }

  const accountRecord = camelize(
    await pool.query<
      Omit<AccountDb, "passhash"> & {
        address_formatted: string;
        latitude: number;
        longitude: number;
      }
    >(
      ` SELECT account_id, email, username, 
        address_formatted, latitude, longitude
        FROM account
        WHERE account_id=$1`,
      [req.session.accountId]
    )
  ).rows[0];

  const account:
    | Account
    | ((Account & {
        address: Address;
      }) & { csrfToken?: string }) = {
    accountId: accountRecord.accountId,
    email: accountRecord.email,
    username: accountRecord.username,
    ...(accountRecord.addressFormatted
      ? {
          address: {
            addressFormatted: accountRecord.addressFormatted,
            latitude: accountRecord.latitude,
            longitude: accountRecord.longitude,
          },
        }
      : {}),
  };

  res.json(account);
});

router.post("/", async (req, res, next) => {
  const sessionInput: Omit<AccountInput, "username"> = req.body;
  const { email, password } = sessionInput;

  const accountRecord = await findEmail(email);
  // no account with email
  if (!accountRecord) {
    throw invalidLogin();
  }

  // account created with OAuth - cannot login with password
  if (!accountRecord.passhash) {
    throw new BusinessError(
      409,
      "OAuth account",
      "Account created with OAuth - cannot login with password"
    );
  }

  // wrong password
  if (!(await bcrypt.compare(password, accountRecord.passhash))) {
    throw invalidLogin();
  }

  req.session.accountId = accountRecord.accountId;
  req.session.csrfToken = generateToken(req, res);

  const account:
    | Account
    | (Account & {
        address: Address;
      }) = {
    accountId: accountRecord.accountId,
    email: accountRecord.email,
    username: accountRecord.username,
    ...(accountRecord.addressFormatted
      ? {
          address: {
            addressFormatted: accountRecord.addressFormatted,
            latitude: accountRecord.latitude,
            longitude: accountRecord.longitude,
          },
        }
      : {}),
  };

  res.status(201).json(account);
});

// protect delete route with double csrf protection
router.delete("/", doubleCsrfProtection, async (req, res, next) => {
  if (!req.session.accountId) {
    throw sessionNotFound();
  }
  req.session.destroy(() => {
    res
      .clearCookie("connect.sid", {
        path: "/",
      })
      .clearCookie("csrfToken", {
        path: "/",
      })
      .sendStatus(204);
  });
});

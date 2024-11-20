import express from "express";
import { pool } from "../configServices/dbConfig.js";
import bcrypt from "bcrypt";
import camelize from "camelize";
import { sessionNotFound, invalidLogin } from "../utils/errors.js";
export const router = express.Router();
import { sendEmail } from "../utils/email.js";

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
  //OAuth user
  if (req.user) {
    res.json(req.user);
    return;
  }

  if (!req.session.accountId) {
    throw sessionNotFound();
  }

  const accountRecord = camelize(
    await pool.query<Omit<AccountDb, "passhash">>(
      `SELECT account_id, email, username
      FROM account
      WHERE account_id=$1`,
      [req.session.accountId]
    )
  ).rows[0];

  const account: Account = accountRecord;

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

  await sendEmail(email, 'Welcome to Our Service', 'Thank you for signing up!', '<h1>Welcome to Our Service</h1><p>Thank you for signing up!</p>');

  // wrong password
  if (!(await bcrypt.compare(password, accountRecord.passhash))) {
    throw invalidLogin();
  }

  req.session.accountId = accountRecord.accountId;

  const account: Account = {
    accountId: accountRecord.accountId,
    email: accountRecord.email,
    username: accountRecord.username,
  };

  res.status(201).json(account);
});

router.delete("/", async (req, res, next) => {
  if (!req.session.accountId && !req.user) {
    throw sessionNotFound();
  }
  req.session.destroy(() => {
    res
      .clearCookie("connect.sid", {
        path: "/",
      })
      .sendStatus(204);
  });
});

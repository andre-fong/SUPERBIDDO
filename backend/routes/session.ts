import express from "express";
import { pool } from "../configServices/dbConfig.js";
import bcrypt from "bcrypt";
import camelize from "camelize";
import { sessionNotFound, invalidLogin } from "../utils/errors.js";
import crypto from "crypto";

export const router = express.Router();

router.get("/", async (req, res, next) => {
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

  const accountRecord = camelize(
    await pool.query<AccountDb>(
      `SELECT *
      FROM account
      WHERE email=$1`,
      [email]
    )
  ).rows[0];

  // no account with email
  if (!accountRecord) {
    throw invalidLogin();
  }

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
  if (!req.session.accountId) {
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

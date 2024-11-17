import express from "express";
import { pool } from "../configServices/dbConfig.js";
import bcrypt from "bcrypt";
import camelize from "camelize";
import { sessionNotFound, invalidLogin } from "../utils/errors.js";
export const router = express.Router();

router.get("/", async (req, res, next) => {
  if (!req.session.accountId) {
    throw sessionNotFound();
  }
  req.session.touch();
  res.json(req.session);
});

router.post("/", async (req, res, next) => {
  const sessionInput: Omit<AccountInput, "username"> = req.body;
  const { email, password } = sessionInput;

  const account = camelize(
    await pool.query<AccountDb>(
      `SELECT *
      FROM account
      WHERE email=$1`,
      [email]
    )
  ).rows[0];

  // no account with email
  if (!account) {
    throw invalidLogin();
  }

  // wrong password
  if (!(await bcrypt.compare(password, account.passhash))) {
    throw invalidLogin();
  }

  req.session.accountId = account.accountId;
  res.status(201).json(req.session);
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
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
  req.session.touch();
  res.json(req.session);
});

router.post("/", async (req, res, next) => {
  const sessionInput: Omit<AccountInput, "username"> = req.body;
  const { email, password } = sessionInput;

  console.log(email)
  const account = await findEmail(email);
  // no account with email
  if (!account) {
    throw invalidLogin();
  }

  //await sendEmail(email, 'Welcome to Our Service', 'Thank you for signing up!', '<h1>Welcome to Our Service</h1><p>Thank you for signing up!</p>');

  // wrong password
  if (!(await bcrypt.compare(password, account.passhash))) {
    throw invalidLogin();
  }

  req.session.accountId = account.accountId;
  res.status(201).json(req.session);
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
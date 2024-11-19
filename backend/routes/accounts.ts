import express from "express";
import { pool } from "../configServices/dbConfig.js";
import camelize from "camelize";
import bcrypt from "bcrypt";
import { BusinessError, sessionNotFound } from "../utils/errors.js";

export const router = express.Router();

export async function createAccount(email: string, passhash: string, username: string) {
  const accountRecord = camelize(
    await pool
      .query<AccountDb>(
        `INSERT INTO account (email, passhash, username)
       VALUES ($1, $2, $3)
       RETURNING *`,
        [email, passhash, username]
      )
      .catch((err) => {
        switch (err.constraint) {
          case "account_email_un":
            throw new BusinessError(
              409,
              "Email in use",
              `Email ${email} is already in use`
            );
          case "account_username_un":
            throw new BusinessError(
              409,
              "Username already in use",
              `Username ${username} is already in use`
            );
          default:
            throw err;
        }
      })
  ).rows[0];

  const account: Account = {
    accountId: accountRecord.accountId,
    email: accountRecord.email,
    username: accountRecord.username,
  };

  return account
}


router.post("/", async (req, res) => {
  const accountInput: AccountInput = req.body;
  const { email, password, username } = accountInput;
  const passhash = await bcrypt.hash(password, 10);
  const account = await createAccount(email, passhash, username);
  
  res.status(201).json(account);
});

import express from "express";
import { pool } from "../configServices/dbConfig.js";
import bcrypt from "bcrypt";
import camelize from "camelize";
import { sessionNotFound, invalidLogin } from "../utils/errors.js";
import crypto from "crypto";

export const router = express.Router();

router.get("/", async (req, res, next) => {
  if (!req.session.accountUid) {
    throw sessionNotFound();
  }
  req.session.touch();
  res.json(req.session);
});

router.post("/", async (req, res, next) => {
  // TEMP just make a new session with a random accountUid
  console.log("creating new session");
  req.session.accountUid = crypto.randomUUID();
  res.status(201).json(req.session);
  //   const { username, password } = req.body;
  //   const account = camelize(
  //     await pool.query(
  //       `SELECT account_uid, username, passhash
  //       FROM account
  //       WHERE username=$1`,
  //       [username]
  //     )
  //   ).rows[0];

  //   // no user with username
  //   if (!account) {
  //     next(invalidLogin);
  //     return;
  //   }

  //   // valid username, password
  //   if (await bcrypt.compare(password, account.passhash)) {
  //     req.session.accountUid = account.accountUid;
  //     res.status(201).json(req.session);
  //   }

  //   // wrong password
  //   else {
  //     next(invalidLogin);
  //     return;
  //   }
  // });

  // router.delete("/", async (req, res, next) => {
  //   const accountUid = req.session.accountUid;

  //   // not signed in
  //   if (!accountUid) {
  //     next(sessionNotFound);
  //     return;
  //   }
  //   req.session.destroy(() => {
  //     res
  //       .clearCookie("connect.sid", {
  //         path: "/",
  //       })
  //       .sendStatus(204);
  //   });
});

import express from "express";
import { pool } from "../configServices/dbConfig.js";
import camelize from "camelize";
import bcrypt from "bcrypt";
import { BusinessError, ServerError, unauthorized } from "../utils/errors.js";
import { doubleCsrfProtection } from "../configServices/csrfConfig.js";

export const router = express.Router();

export async function createAccount(
  email: string,
  passhash: string,
  username: string
) {
  const accountRecord = camelize(
    await pool
      .query<AccountDb>(
        ` INSERT INTO account (email, passhash, username)
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

  return account;
}

router.post("/", async (req, res) => {
  const accountInput: AccountInput = req.body;
  const { email, password, username } = accountInput;
  const passhash = await bcrypt.hash(password, 10);
  const account = await createAccount(email, passhash, username);

  res.status(201).json(account);
});

router.put("/:accountId/address", doubleCsrfProtection, async (req, res) => {
  const { accountId } = req.params;
  const { sessionToken } = req.query;

  if (req.session.accountId !== accountId) {
    throw unauthorized();
  }

  const { placeId } = req.body;

  const fields = "formatted_address,geometry";
  const gmapsResponse = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&sessiontoken=${sessionToken}&key=${process.env.GOOGLE_MAPS_API_KEY_BACKEND}`,
    {
      method: "GET",
    }
  );
  const gmapsJson = await gmapsResponse.json();
  if (gmapsJson.status !== "OK") {
    if (gmapsJson.status === "INVALID_REQUEST") {
      throw new BusinessError(400, "Invalid place ID");
    }
    throw new ServerError(500, "Error fetching address");
  }
  const { formatted_address: addressFormatted, geometry } =
    gmapsJson.result as {
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
      status: "OK";
    };

  const accountRecord = camelize(
    await pool.query<{
      address_formatted: string;
      latitude: number;
      longitude: number;
    }>(
      ` UPDATE account
        SET address_formatted=$1, latitude=$2, longitude=$3
        WHERE account_id=$4
        RETURNING address_formatted, latitude, longitude`,
      [
        addressFormatted,
        geometry.location.lat,
        geometry.location.lng,
        accountId,
      ]
    )
  ).rows[0];

  // account should exist if session is valid
  if (!accountRecord) {
    throw new ServerError(500, "Error updating address");
  }

  res.json(accountRecord);
});

import * as dotenv from "dotenv";
import Pool from "pg-pool";

// load dev environment variables
if (process.env.NODE_ENV === "development") {
  dotenv.config({ path: "../.env.development" });
}

export const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
});

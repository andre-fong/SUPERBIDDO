import * as dotenv from "dotenv";

// load dev environment variables
if (process.env.NODE_ENV === "development") {
  dotenv.config({ path: "../.env.development" });
}

export const corsConfig = {
  credentials: true,
  origin: [process.env.FRONTEND_URL],
};

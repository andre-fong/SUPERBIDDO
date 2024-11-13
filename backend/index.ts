import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import * as OpenApiValidator from "express-openapi-validator";
import helmet from "helmet";
import { sessionConfig } from "./configServices/sessionConfig.js";
import { corsConfig } from "./configServices/corsConfig.js";
import session from "express-session";
import { BusinessError } from "./utils/errors.js";
import { HttpError } from "express-openapi-validator/dist/framework/types.js";
import { router as sessionRouter } from "./routes/session.js";
import { router as biddingRouter } from "./routes/bidding.js";

const PORT = process.env.PORT || 3001;
const app = express();

const server = http.createServer(app);

app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json());
app.use(cors(corsConfig));
app.use(cookieParser());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

console.log(sessionConfig);
app.use(session(sessionConfig));

// app.use(
//   OpenApiValidator.middleware({
//     apiSpec: "./openapi.yaml",
//     validateRequests: true, // (default)
//     validateResponses: false, // false by default
//   })
// );

app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!" });
});

app.use("/api/v1/session", sessionRouter);
app.use("/api/v1/bid", biddingRouter);

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  // if multiple errors (from openapi validator) return those errors.
  // if one error (my custom errors) return array with just that error
  console.log("-----\nError: \n" + err + "\n-----");
  // BusinessError is a class for my custom errors
  if (err instanceof BusinessError) {
    console.log("err instanceof BusinessError");
    err.path = req.originalUrl;
    const errors = [err];
    res.status(err.status).json(errors);
  }
  // HttpError is a class from openapi validator. All schema validation errors are of this type
  else if (err instanceof HttpError) {
    console.log("err instanceof OpenApiValidator.HttpError");
    const errors = err.errors.map((error) => ({
      path: req.originalUrl,
      message: `${error.path} not valid`,
      detail: `${error.message}`,
    }));
    res.status(err.status).json(errors);
  }
  // other errors are unknown system errors
  else {
    console.log("err is unknown system error");
    throw err;
    res.status(500).json({
      path: req.originalUrl,
      message: "unknown server error",
      detail: "request caused an unknown error on the server",
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

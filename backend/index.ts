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
import { BusinessError, ServerError } from "./utils/errors.js";
import { HttpError } from "express-openapi-validator/dist/framework/types.js";
import passport from "passport";
import { router as sessionRouter } from "./routes/session.js";
import { router as accountRouter } from "./routes/accounts.js";
import { router as auctionRouter } from "./routes/auctions.js";
import { router as bidRouter } from "./routes/bids.js";
import { router as oauthRouter } from "./routes/oauth.js";
import { router as watchersRouter } from "./routes/watchers.js";
import { router as imageRouter } from "./routes/images.js";
import { router as geminiUploadRouter } from "./routes/geminiUpload.js";
import { Server } from "socket.io";
import {
  csrfRoute,
  doubleCsrfProtection,
} from "./configServices/csrfConfig.js";
import createHttpError from "http-errors";

const PORT = process.env.PORT || 3001;
const app = express();

const server = http.createServer(app);

app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json());
app.use(cors(corsConfig));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());

app.use(
  OpenApiValidator.middleware({
    apiSpec: "./openapi.yaml",
    validateRequests: true, // (default)
    validateResponses: true, // false by default
  })
);

app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!" });
});
app.get("/api/v1/csrfToken", csrfRoute);
// allow session and oauth to be accessed without csrf token (delete is explicitly protected)
app.use("/api/v1/session", sessionRouter);
app.use("/api/v1/oauth", oauthRouter);
// allow post accounts to be accessed without csrf token (modifying an account with put is explicitly protected)
app.use("/api/v1/accounts", accountRouter);
app.use(doubleCsrfProtection);
app.use("/api/v1/auctions", auctionRouter);
app.use("/api/v1/auctions/:auctionId/bids/", bidRouter);
app.use("/api/v1/auctions/:auctionId/watchers", watchersRouter);
app.use("/api/v1/images", imageRouter);
app.use("/api/v1/images/:imageUrl/geminiDetails", geminiUploadRouter);

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
  } else if (err instanceof ServerError) {
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
  // err form csrf-csrf
  else if (
    err instanceof createHttpError.HttpError &&
    err.code === "EBADCSRFTOKEN"
  ) {
    res.status(err.status).json([
      {
        path: req.originalUrl,
        message: "invalid csrf token",
        detail: "Get /api/v_/csrfToken first to get a csrf token.",
      },
    ]);
  }
  // other errors are unknown system errors
  else {
    console.log("err is unknown system error");
    console.log(err);
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

export const io = new Server(server, {
  cors: corsConfig,
});

//I believe this is where we put the groups of the user or whatever
io.use(async (socket, next) => {
  next();
});

io.on("connection", async (socket) => {
  socket.use((event, next) => {
    console.log("received event", event);
    next();
  });

  socket.on("disconnecting", () => {
    console.log("disconnecting", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.log("connect_error:", err.message); // prints the message associated with the error
  });

  socket.on("join", (accountId: string) => {
    socket.join(accountId);
  });
});

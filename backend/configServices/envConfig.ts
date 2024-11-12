import { readFileSync } from "fs";

if (process.env.NODE_ENV === "production") {
  const secretFiles = process.env.SECRET_FILES.split(",");
  // read secret files and set environment variables.
  // use synch since this initialization must be done before the app starts
  for (const file of secretFiles) {
    const filePath = process.env[`${file}_FILE`];
    const fileContents = readFileSync(filePath, "utf8");
    process.env[file] = fileContents;
  }
}

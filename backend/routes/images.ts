import multer from "multer";
import { bucket } from "../configServices/gcsConfig";
import express from "express";
import { BusinessError } from "../utils/errors";

export const router = express.Router();

router.post("/", async (req, res) => {
  uploadHandler.single("image")(req, res, (err) => {
    if (err) {
      switch (err.code) {
        case "LIMIT_FILE_SIZE":
          throw new BusinessError(
            400,
            "file too large",
            "image must be less than 5mb"
          );
        case "LIMIT_FILE_COUNT":
          throw new BusinessError(
            400,
            "too many files",
            "only 1 image allowed"
          );
        case "LIMIT_UNEXPECTED_FILE":
          throw new BusinessError(
            400,
            "invalid field name",
            `image field name must be "image" and must contain 1 image`
          );
        default:
          // some other multer error
          throw err;
      }
    }
    // upload successful
    const fileExtension = req.file.mimetype.split("/")[1];
    const blob = bucket.file(`${crypto.randomUUID()}.${fileExtension}`);
    // add current time to metadata - image will be deleted after 1 day unless auction is created
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
        customTime: new Date().toISOString(),
      },
    });
    blobStream.on("error", (err) => {
      // some GCS error
      throw err;
    });
    blobStream.on("finish", async () => {
      res.status(201).json({ imageUrl: generateImageLink(blob.name) });
    });
    blobStream.end(req.file.buffer);
  });
});

const uploadHandler = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // max 5mb
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new BusinessError(400, "invalid file type", "only images allowed"));
    }
  },
});

export function generateImageLink(name: string) {
  return name
    ? `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${name}`
    : null;
}
export function generateImageName(link: string) {
  const name = link.split(
    `https://storage.googleapis.com/${process.env.GCS_BUCKET}/`
  )[1];
  return name ? name : null;
}

export function preserveImage(name: string) {
  const blob = bucket.file(name);
  const metadata = blob.metadata;
  delete metadata.customTime;
  return blob.setMetadata(metadata);
}

export function deleteImage(name: string) {
  return bucket.file(name).delete();
}

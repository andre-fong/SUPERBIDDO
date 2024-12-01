import multer from "multer";
import { bucket } from "../configServices/gcsConfig";
import express from "express";
import { BusinessError, unauthorized } from "../utils/errors";
import crypto from "crypto";
export const router = express.Router();

router.post("/", async (req, res, next) => {
  if (!req.session.accountId) {
    throw new BusinessError(401, "unauthorized", "must be logged in");
  }
  uploadHandler.single("image")(req, res, (err) => {
    try {
      if (err) {
        switch (err.code) {
          case "LIMIT_FILE_SIZE":
            next(
              new BusinessError(
                400,
                "file too large",
                "image must be less than 5mb"
              )
            );
            break;
          case "LIMIT_FILE_COUNT":
            next(
              new BusinessError(400, "too many files", "only 1 image allowed")
            );
            break;
          case "LIMIT_UNEXPECTED_FILE":
            next(
              new BusinessError(
                400,
                "invalid field name",
                `image field name must be "image" and must contain 1 image`
              )
            );
            break;
          default:
            // some other multer error
            next(err);
        }
        return;
      }
      if (
        !req.file ||
        !req.file.mimetype ||
        !req.file.mimetype.startsWith("image/")
      ) {
        next(
          new BusinessError(400, "invalid file type", "only images allowed")
        );
        return;
      }

      // upload successful
      const fileExtension = req.file.mimetype.split("/")[1];
      const blob = bucket.file(
        `${req.session.accountId}_${crypto.randomUUID()}.${fileExtension}`
      );
      // add current time to metadata - image will be deleted after 1 day unless auction is created
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: req.file.mimetype,
          customTime: new Date().toISOString(),
        },
      });
      blobStream.on("error", (err) => {
        // some GCS error
        next(err);
      });
      blobStream.on("finish", async () => {
        res.status(201).json({ imageUrl: generateImageLink(blob.name) });
      });
      blobStream.end(req.file.buffer);
    } catch (err) {
      next(err);
    }
  });
});

const uploadHandler = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // max 5mb
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

export async function preserveImage(imageUrl: string, accountId: string) {
  const name = generateImageName(imageUrl);
  const imageOwnerId = name.split("_")[0];
  if (imageOwnerId !== accountId) {
    throw unauthorized();
  }
  const blob = bucket.file(name);
  const [metadata] = await blob.getMetadata();
  // not allowed to remove customTime
  // could workaround by reuploading the image without date in metadata
  // as suggested in docs, but this would incur unnecessary storage costs
  // google won't accept dates past around here
  // remember to update this in 200 years
  const neverDate = new Date("2250-01-02T03:04:05.006Z").toISOString();
  if (metadata.customTime === neverDate) {
    throw new BusinessError(
      409,
      "Image already used",
      "Image has already been assigned to a card/bundle."
    );
  }
  metadata.customTime = neverDate;
  await blob.setMetadata(metadata);
}

export async function deleteImage(imageUrl: string, accountId: string) {
  const imageOwnerId = imageUrl.split("_")[0];
  if (imageOwnerId !== accountId) {
    throw unauthorized();
  }
  const name = generateImageName(imageUrl);
  await bucket.file(name).delete();
}

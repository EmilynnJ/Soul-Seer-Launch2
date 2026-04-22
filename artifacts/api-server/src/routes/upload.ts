import { Router, type IRouter, type Response } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { v2 as cloudinary } from "cloudinary";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

const router: IRouter = Router();

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

function getBackblazeConfig() {
  const endpoint = process.env.BACKBLAZE_BUCKET_ENDPOINT;
  const keyId = process.env.BACKBLAZE_KEY_ID;
  const appKey = process.env.BACKBLAZE_APP_ID;
  if (!endpoint || !keyId || !appKey) return null;
  return { endpoint, keyId, appKey };
}

router.post("/upload/avatar-signature", requireAuth(), async (req, res: Response) => {
  const cfg = getCloudinaryConfig();
  if (!cfg) return res.status(503).json({ error: "Cloudinary not configured" });

  cloudinary.config({ cloud_name: cfg.cloudName, api_key: cfg.apiKey, api_secret: cfg.apiSecret });

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "soulseer/avatars";
  const paramsToSign = { timestamp, folder };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, cfg.apiSecret);

  res.json({
    signature,
    timestamp,
    folder,
    cloudName: cfg.cloudName,
    apiKey: cfg.apiKey,
  });
});

router.post("/upload/file-url", requireAuth(), async (req, res: Response) => {
  const cfg = getBackblazeConfig();
  if (!cfg) return res.status(503).json({ error: "Backblaze not configured" });

  const { fileName, contentType } = req.body as { fileName?: string; contentType?: string };
  if (!fileName || !contentType) return res.status(400).json({ error: "fileName and contentType required" });

  const url = new URL(cfg.endpoint);
  const bucket = url.pathname.replace("/", "").split("/")[0] || "soulseer";
  const region = "us-east-005";

  const s3 = new S3Client({
    region,
    endpoint: `https://${url.hostname}`,
    credentials: { accessKeyId: cfg.keyId, secretAccessKey: cfg.appKey },
    forcePathStyle: true,
  });

  const key = `uploads/${randomUUID()}/${fileName}`;
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  const signedUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });

  res.json({ uploadUrl: signedUrl, fileUrl: `${cfg.endpoint}/${key}` });
});

export default router;

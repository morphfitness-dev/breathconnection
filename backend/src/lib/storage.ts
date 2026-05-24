import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import fs from 'fs';

const USE_S3 = !!(process.env.S3_BUCKET && process.env.AWS_REGION);

const s3 = USE_S3
  ? new S3Client({
      region: process.env.AWS_REGION!,
      credentials: process.env.AWS_ACCESS_KEY_ID
        ? { accessKeyId: process.env.AWS_ACCESS_KEY_ID!, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! }
        : undefined, // falls back to IAM role / env chain
      endpoint: process.env.S3_ENDPOINT, // set for Cloudflare R2, MinIO, etc.
      forcePathStyle: !!process.env.S3_ENDPOINT,
    })
  : null;

const LOCAL_DIR = path.join(process.cwd(), 'uploads');
if (!USE_S3 && !fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });

export async function uploadVideo(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (USE_S3) {
    await s3!.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000',
      }),
    );
    // If CDN_BASE is set (CloudFront / R2 custom domain) use it directly
    if (process.env.CDN_BASE) return `${process.env.CDN_BASE}/${key}`;
    return `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  // Local fallback — serve via /uploads static route
  const dest = path.join(LOCAL_DIR, key.replace(/\//g, '_'));
  fs.writeFileSync(dest, buffer);
  const filename = path.basename(dest);
  return `/uploads/${filename}`;
}

export async function presignUpload(key: string, contentType: string): Promise<string> {
  if (!USE_S3 || !s3) throw new Error('S3 not configured — use direct upload endpoint in dev');
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import { randomUUID } from 'crypto';

const s3 = new S3Client({
  region: config.AWS_REGION,
  ...(config.AWS_ACCESS_KEY_ID && {
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY!,
    },
  }),
});

export interface PresignedUploadResult {
  uploadUrl: string;
  s3Key: string;
  publicUrl: string;
}

export async function getPresignedUploadUrl(
  folder: string,
  contentType: string,
  extension: string
): Promise<PresignedUploadResult> {
  const s3Key = `${folder}/${randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: config.AWS_S3_BUCKET,
    Key: s3Key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 }); // 10 min

  const publicUrl = `https://${config.AWS_S3_BUCKET}.s3.${config.AWS_REGION}.amazonaws.com/${s3Key}`;

  return { uploadUrl, s3Key, publicUrl };
}

export async function deleteS3Object(s3Key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({ Bucket: config.AWS_S3_BUCKET, Key: s3Key })
  );
}

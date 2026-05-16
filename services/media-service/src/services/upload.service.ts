import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { ValidationError } from '@wedding-os/shared-errors';

const s3 = new S3Client({
  region: config.AWS_REGION,
  credentials: { accessKeyId: config.AWS_ACCESS_KEY_ID, secretAccessKey: config.AWS_SECRET_ACCESS_KEY },
  ...(config.S3_ENDPOINT && { endpoint: config.S3_ENDPOINT, forcePathStyle: true }),
});

export type MediaType = 'avatar' | 'portfolio' | 'kyc' | 'review' | 'vendor_cover' | 'chat';
export type AllowedMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';

const ALLOWED_MIMES: Record<MediaType, AllowedMime[]> = {
  avatar: ['image/jpeg', 'image/png', 'image/webp'],
  portfolio: ['image/jpeg', 'image/png', 'image/webp'],
  kyc: ['image/jpeg', 'image/png', 'application/pdf'],
  review: ['image/jpeg', 'image/png', 'image/webp'],
  vendor_cover: ['image/jpeg', 'image/png', 'image/webp'],
  chat: ['image/jpeg', 'image/png', 'image/webp'],
};

export const uploadService = {
  async getPresignedUploadUrl(userId: string, mediaType: MediaType, mimeType: string, fileName: string) {
    const allowed = ALLOWED_MIMES[mediaType];
    if (!allowed.includes(mimeType as AllowedMime)) {
      throw new ValidationError(`File type ${mimeType} not allowed for ${mediaType}`, 'mimeType');
    }

    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `${mediaType}/${userId}/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: key,
      ContentType: mimeType,
      Metadata: { userId, mediaType, originalName: encodeURIComponent(fileName) },
    });

    try {
      const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
      return {
        uploadUrl: url,
        key,
        publicUrl: `https://${config.S3_BUCKET}.s3.${config.AWS_REGION}.amazonaws.com/${key}`,
        expiresIn: 300,
      };
    } catch (err) {
      // Dev mode: return a mock URL if S3 not configured
      if (config.NODE_ENV === 'development') {
        return {
          uploadUrl: `http://localhost:${config.PORT}/media/mock-upload/${key}`,
          key,
          publicUrl: `http://localhost:${config.PORT}/media/files/${key}`,
          expiresIn: 300,
          mock: true,
        };
      }
      throw err;
    }
  },

  async deleteMedia(key: string): Promise<void> {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: config.S3_BUCKET, Key: key }));
    } catch (err) {
      if (config.NODE_ENV !== 'development') throw err;
    }
  },

  async getPresignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: config.S3_BUCKET, Key: key });
    try {
      return await getSignedUrl(s3, command, { expiresIn: 3600 });
    } catch {
      return `http://localhost:${config.PORT}/media/files/${key}`;
    }
  },
};

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// ── Mocks ────────────────────────────────────────────────────
const mockSend = jest.fn().mockResolvedValue({});

jest.mock('@aws-sdk/client-s3', () => {
  const PutObjectCommand = jest.fn();
  const DeleteObjectCommand = jest.fn();
  const GetObjectCommand = jest.fn();
  const S3Client = jest.fn().mockImplementation(() => ({
    send: mockSend,
  }));
  return { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

jest.mock('../../src/config', () => ({
  config: {
    NODE_ENV: 'test',
    PORT: 4012,
    AWS_REGION: 'ap-south-1',
    AWS_ACCESS_KEY_ID: 'test-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret',
    S3_BUCKET: 'weddingos-test-media',
    S3_ENDPOINT: undefined,
  },
}));

// Import after mocks are set up
import { uploadService } from '../../src/services/upload.service';
import { config } from '../../src/config';

const mockGetSignedUrl = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;

beforeEach(() => {
  mockSend.mockReset().mockResolvedValue({});
  jest.clearAllMocks();
  mockGetSignedUrl.mockResolvedValue('https://s3.example.com/presigned-url');
});

// ── getPresignedUploadUrl ────────────────────────────────────

describe('uploadService.getPresignedUploadUrl', () => {
  it('generates presigned URL for valid avatar jpeg', async () => {
    const result = await uploadService.getPresignedUploadUrl('user-1', 'avatar', 'image/jpeg', 'photo.jpg');

    expect(result.uploadUrl).toBe('https://s3.example.com/presigned-url');
    expect(result.key).toBe('avatar/user-1/mock-uuid-1234.jpg');
    expect(result.expiresIn).toBe(300);
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
  });

  it('generates presigned URL for valid kyc pdf', async () => {
    const result = await uploadService.getPresignedUploadUrl('user-2', 'kyc', 'application/pdf', 'doc.pdf');

    expect(result.uploadUrl).toBe('https://s3.example.com/presigned-url');
    expect(result.key).toBe('kyc/user-2/mock-uuid-1234.pdf');
  });

  it('rejects invalid mime for avatar (pdf not allowed)', async () => {
    await expect(
      uploadService.getPresignedUploadUrl('user-1', 'avatar', 'application/pdf', 'doc.pdf')
    ).rejects.toThrow('File type application/pdf not allowed for avatar');

    await expect(
      uploadService.getPresignedUploadUrl('user-1', 'avatar', 'application/pdf', 'doc.pdf')
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects unsupported mime type entirely', async () => {
    await expect(
      uploadService.getPresignedUploadUrl('user-1', 'portfolio', 'video/mp4', 'clip.mp4')
    ).rejects.toThrow('File type video/mp4 not allowed for portfolio');
  });

  it('generates correct S3 key format: mediaType/userId/uuid.ext', async () => {
    (uuidv4 as jest.Mock).mockReturnValueOnce('unique-id-5678');

    const result = await uploadService.getPresignedUploadUrl('u42', 'review', 'image/png', 'screenshot.png');

    expect(result.key).toBe('review/u42/unique-id-5678.png');
  });

  it('includes metadata in the PutObjectCommand', async () => {
    await uploadService.getPresignedUploadUrl('user-1', 'avatar', 'image/jpeg', 'my photo.jpg');

    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: 'weddingos-test-media',
      Key: 'avatar/user-1/mock-uuid-1234.jpg',
      ContentType: 'image/jpeg',
      Metadata: {
        userId: 'user-1',
        mediaType: 'avatar',
        originalName: 'my%20photo.jpg',
      },
    });
  });

  it('builds correct publicUrl from bucket and region', async () => {
    const result = await uploadService.getPresignedUploadUrl('user-1', 'avatar', 'image/jpeg', 'a.jpg');

    expect(result.publicUrl).toBe(
      `https://weddingos-test-media.s3.ap-south-1.amazonaws.com/avatar/user-1/mock-uuid-1234.jpg`
    );
  });

  it('falls back to mock URL in development mode when S3 errors', async () => {
    mockGetSignedUrl.mockRejectedValueOnce(new Error('S3 not configured'));
    (config as any).NODE_ENV = 'development';

    const result = await uploadService.getPresignedUploadUrl('user-1', 'avatar', 'image/jpeg', 'a.jpg');

    expect((result as any).mock).toBe(true);
    expect(result.uploadUrl).toContain('mock-upload');
    expect(result.key).toBe('avatar/user-1/mock-uuid-1234.jpg');

    // Restore
    (config as any).NODE_ENV = 'test';
  });

  it('throws in non-development mode when S3 errors', async () => {
    mockGetSignedUrl.mockRejectedValueOnce(new Error('S3 failure'));
    (config as any).NODE_ENV = 'production';

    await expect(
      uploadService.getPresignedUploadUrl('user-1', 'avatar', 'image/jpeg', 'a.jpg')
    ).rejects.toThrow('S3 failure');

    (config as any).NODE_ENV = 'test';
  });
});

// ── deleteMedia ──────────────────────────────────────────────

describe('uploadService.deleteMedia', () => {
  it('calls S3 DeleteObjectCommand', async () => {
    
    mockSend.mockResolvedValueOnce({});

    await uploadService.deleteMedia('avatar/user-1/abc.jpg');

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(DeleteObjectCommand).toHaveBeenCalledTimes(1);
  });

  it('uses correct bucket and key', async () => {
    
    mockSend.mockResolvedValueOnce({});

    await uploadService.deleteMedia('portfolio/user-5/img.png');

    expect(DeleteObjectCommand).toHaveBeenCalledWith({
      Bucket: 'weddingos-test-media',
      Key: 'portfolio/user-5/img.png',
    });
  });

  it('swallows errors in development mode', async () => {
    
    mockSend.mockRejectedValueOnce(new Error('NoSuchKey'));
    (config as any).NODE_ENV = 'development';

    await expect(uploadService.deleteMedia('missing/key.jpg')).resolves.toBeUndefined();

    (config as any).NODE_ENV = 'test';
  });

  it('throws errors in non-development mode', async () => {
    
    mockSend.mockRejectedValueOnce(new Error('AccessDenied'));
    (config as any).NODE_ENV = 'production';

    await expect(uploadService.deleteMedia('some/key.jpg')).rejects.toThrow('AccessDenied');

    (config as any).NODE_ENV = 'test';
  });
});

// ── getPresignedDownloadUrl ──────────────────────────────────

describe('uploadService.getPresignedDownloadUrl', () => {
  it('generates a presigned download URL', async () => {
    mockGetSignedUrl.mockResolvedValueOnce('https://s3.example.com/download-url');

    const url = await uploadService.getPresignedDownloadUrl('avatar/user-1/abc.jpg');

    expect(url).toBe('https://s3.example.com/download-url');
    expect(GetObjectCommand).toHaveBeenCalledWith({
      Bucket: 'weddingos-test-media',
      Key: 'avatar/user-1/abc.jpg',
    });
  });

  it('returns localhost fallback URL when S3 fails', async () => {
    mockGetSignedUrl.mockRejectedValueOnce(new Error('network error'));

    const url = await uploadService.getPresignedDownloadUrl('review/user-3/pic.png');

    expect(url).toBe('http://localhost:4012/media/files/review/user-3/pic.png');
  });
});

// ── ALLOWED_MIMES ────────────────────────────────────────────

describe('ALLOWED_MIMES validation', () => {
  const imageOnlyTypes: Array<'avatar' | 'portfolio' | 'review' | 'vendor_cover' | 'chat'> = [
    'avatar', 'portfolio', 'review', 'vendor_cover', 'chat',
  ];

  it.each(imageOnlyTypes)('%s allows jpeg, png, webp but not pdf', async (mediaType) => {
    // Valid types should not throw
    for (const mime of ['image/jpeg', 'image/png', 'image/webp']) {
      await expect(
        uploadService.getPresignedUploadUrl('u1', mediaType, mime, 'f.jpg')
      ).resolves.toBeDefined();
    }

    // PDF should throw
    await expect(
      uploadService.getPresignedUploadUrl('u1', mediaType, 'application/pdf', 'f.pdf')
    ).rejects.toThrow(/not allowed/);
  });

  it('kyc allows jpeg, png, and pdf but not webp', async () => {
    for (const mime of ['image/jpeg', 'image/png', 'application/pdf']) {
      await expect(
        uploadService.getPresignedUploadUrl('u1', 'kyc', mime, 'f.jpg')
      ).resolves.toBeDefined();
    }

    await expect(
      uploadService.getPresignedUploadUrl('u1', 'kyc', 'image/webp', 'f.webp')
    ).rejects.toThrow(/not allowed/);
  });
});

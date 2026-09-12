import { env } from '@/lib/server/env';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const s3ClientSingleton = () =>
  new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY,
      secretAccessKey: env.S3_SECRET_KEY,
    },
    // AWS SDK 默认校验和会让 SeaweedFS 等兼容实现拒写
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });

declare const globalThis: {
  s3Global?: ReturnType<typeof s3ClientSingleton>;
} & typeof global;

const s3Client = globalThis.s3Global ?? s3ClientSingleton();

if (env.NODE_ENV !== 'production') {
  globalThis.s3Global = s3Client;
}

function isS3NotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error
    && (error.name === 'NoSuchKey' || error.name === 'NotFound');
}

/** 写入对象。 */
export async function putS3Object(input: {
  key: string;
  body: Uint8Array;
  contentType: string;
}): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );
}

/** 读取对象；不存在时返回 null。 */
export async function getS3Object(
  key: string,
): Promise<{ body: Uint8Array; contentType: string } | null> {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
      }),
    );
    const body = await response.Body?.transformToByteArray();
    if (!body) return null;
    return {
      body,
      contentType: response.ContentType || 'application/octet-stream',
    };
  } catch (error: unknown) {
    if (isS3NotFound(error)) return null;
    throw error;
  }
}

/** 删除对象；本来就不存在时忽略。 */
export async function deleteS3Object(key: string): Promise<void> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
      }),
    );
  } catch (error: unknown) {
    if (isS3NotFound(error)) return;
    throw error;
  }
}

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";
import type { StorageProvider } from "./types";

export class S3StorageProvider implements StorageProvider {
  readonly name = "S3_COMPATIBLE";
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: env.storageRegion,
      endpoint: env.storageEndpoint,
      credentials: {
        accessKeyId: env.storageAccessKey,
        secretAccessKey: env.storageSecretKey,
      },
      forcePathStyle: true,
    });
  }

  async put(key: string, data: Buffer, contentType: string): Promise<{ storageKey: string; url: string }> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: env.storageBucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      })
    );
    return { storageKey: key, url: this.getPublicUrl(key) };
  }

  getPublicUrl(key: string): string {
    if (env.storagePublicBaseUrl) return `${env.storagePublicBaseUrl.replace(/\/$/, "")}/${key}`;
    return `${env.storageEndpoint.replace(/\/$/, "")}/${env.storageBucket}/${key}`;
  }
}

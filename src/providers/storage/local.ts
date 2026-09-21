import path from "node:path";
import fs from "node:fs/promises";
import { env } from "@/lib/env";
import type { StorageProvider } from "./types";

const STORAGE_ROOT = path.join(process.cwd(), "storage");

export class LocalStorageProvider implements StorageProvider {
  readonly name = "LOCAL_FS";

  async put(key: string, data: Buffer, _contentType: string): Promise<{ storageKey: string; url: string }> {
    const fullPath = path.join(STORAGE_ROOT, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
    return { storageKey: key, url: this.getPublicUrl(key) };
  }

  getPublicUrl(key: string): string {
    return `${env.appBaseUrl}/api/storage/${key}`;
  }

  getLocalPath(key: string): string {
    return path.join(STORAGE_ROOT, key);
  }
}

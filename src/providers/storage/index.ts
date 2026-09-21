import { isStorageConfigured } from "@/lib/env";
import { LocalStorageProvider } from "./local";
import { S3StorageProvider } from "./s3";
import type { StorageProvider } from "./types";

let instance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!instance) {
    instance = isStorageConfigured() ? new S3StorageProvider() : new LocalStorageProvider();
  }
  return instance;
}

export type { StorageProvider } from "./types";

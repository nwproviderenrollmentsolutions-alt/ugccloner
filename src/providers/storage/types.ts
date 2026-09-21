export interface StorageProvider {
  readonly name: string;
  put(key: string, data: Buffer, contentType: string): Promise<{ storageKey: string; url: string }>;
  getPublicUrl(key: string): string;
  getLocalPath?(key: string): string | null;
}

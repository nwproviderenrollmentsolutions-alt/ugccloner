import type { Prisma } from "@prisma/client";

/** Narrow cast helper for writing typed structures into a Prisma Json column. */
export function toJson<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

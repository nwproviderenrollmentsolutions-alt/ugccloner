import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSearchProvider } from "@/providers/search";
import { buildResearchQueries } from "@/prompts/viral-research";
import { logger } from "@/lib/logger";

const QUERIES_PER_JOB = 4;

export async function researchProject(projectId: string) {
  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });

  await db.project.update({ where: { id: projectId }, data: { status: "RESEARCHING", errorMessage: null } });

  const search = getSearchProvider();
  const queries = buildResearchQueries(project.product, project.product, project.platform).slice(0, QUERIES_PER_JOB);

  const job = await db.researchJob.create({
    data: {
      projectId,
      query: { product: project.product, platform: project.platform, timePeriod: "last 90 days", searchQueries: queries },
      status: "PENDING",
      provider: search.name,
      isMock: search.isMock,
    },
  });

  const start = Date.now();
  try {
    const seen = new Set<string>();
    const rows: Prisma.ViralVideoCreateManyInput[] = [];

    for (const query of queries) {
      const results = await search.search(query);
      for (const r of results) {
        if (seen.has(r.externalId)) continue;
        seen.add(r.externalId);
        rows.push({
          projectId,
          researchJobId: job.id,
          externalId: r.externalId,
          platform: r.platform,
          title: r.title,
          channel: r.channel,
          url: r.url,
          publishedAt: r.publishedAt ? new Date(r.publishedAt) : null,
          durationSeconds: r.durationSeconds,
          viewCount: r.viewCount,
          engagementMetrics: r.engagementMetrics ?? undefined,
          thumbnailUrl: r.thumbnailUrl,
          description: r.description,
          searchQuery: query,
        });
      }
    }

    if (rows.length > 0) {
      await db.viralVideo.createMany({ data: rows });
    }

    await db.researchJob.update({ where: { id: job.id }, data: { status: "COMPLETED", completedAt: new Date() } });

    logger.info("research_complete", {
      projectId,
      jobId: job.id,
      provider: search.name,
      operation: "research",
      status: "ok",
      durationMs: Date.now() - start,
    });

    return db.researchJob.findUniqueOrThrow({ where: { id: job.id }, include: { viralVideos: true } });
  } catch (error) {
    await db.researchJob.update({ where: { id: job.id }, data: { status: "FAILED" } });
    await db.project.update({
      where: { id: projectId },
      data: { status: "ERROR", errorMessage: error instanceof Error ? error.message : "Research failed" },
    });
    logger.error("research_failed", {
      projectId,
      jobId: job.id,
      provider: search.name,
      operation: "research",
      status: "error",
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

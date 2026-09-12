import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Production Health Check Endpoint for Indian Pixel OS.
 * Returns basic service and database readiness without exposing internal secrets.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const isFastPing = searchParams.get("ping") === "fast" || searchParams.get("keepalive") === "true";

  // Fast keep-alive response for UptimeRobot / Render pinger to prevent cold starts
  if (isFastPing) {
    return NextResponse.json(
      {
        status: "active",
        service: "indian-pixel-os",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }

  try {
    // Non-blocking database readiness ping
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        service: "indian-pixel-os",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "degraded",
        service: "indian-pixel-os",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      {
        status: 200, // Return 200 for health pinger to prevent Render container teardown
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}

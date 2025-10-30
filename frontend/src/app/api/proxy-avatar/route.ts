import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const src = req.nextUrl.searchParams.get("src");
    if (!src) {
      return new NextResponse("Missing src", { status: 400 });
    }

    // Optional: restrict to backend host for safety
    const allowedOrigin = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    if (!src.startsWith(allowedOrigin)) {
      return new NextResponse("Forbidden host", { status: 403 });
    }

    // Forward cookies to backend for authenticated images
    const cookie = req.headers.get("cookie") || "";
    const res = await fetch(src, {
      headers: { cookie },
      // We want the raw bytes
      cache: "no-store",
    });

    if (!res.ok) {
      return new NextResponse("Upstream error", { status: res.status });
    }

    // Validate that the response is an image; otherwise return 404 so client can fall back
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    if (!contentType.startsWith("image/")) {
      return new NextResponse("Not an image", { status: 404 });
    }
    const arrayBuffer = await res.arrayBuffer();
    const headers: Record<string, string> = { "content-type": contentType };
    const contentLength = res.headers.get("content-length");
    if (contentLength) headers["content-length"] = contentLength;
    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers,
    });
  } catch (e) {
    return new NextResponse("Proxy error", { status: 500 });
  }
}

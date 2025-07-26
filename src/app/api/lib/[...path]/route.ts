import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const params = await context.params;
    const filePath = join(process.cwd(), "lib", ...params.path);
    const fileContent = await readFile(filePath, "utf-8");

    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }
}

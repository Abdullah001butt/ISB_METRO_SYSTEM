import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

export function handleApiError(err: unknown) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const fields = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return NextResponse.json(
        { error: `A record with this ${fields} already exists` },
        { status: 409 }
      );
    }
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    if (err.code === "P2003") {
      return NextResponse.json({ error: "Referenced record does not exist" }, { status: 400 });
    }
  }

  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

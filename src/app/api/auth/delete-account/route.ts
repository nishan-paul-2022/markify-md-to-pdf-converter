import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { rm } from "fs/promises";
import { join } from "path";

export async function DELETE(): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 1. Delete files from disk (the entire user directory)
    try {
      const userUploadsDir = join(process.cwd(), "public", "uploads", userId);
      await rm(userUploadsDir, { recursive: true, force: true });
      console.log(`✅ Deleted all files for user: ${userId}`);
    } catch (error) {
      console.error(`❌ Error deleting user directory: ${userId}`, error);
      // Continue even if disk cleanup fails
    }

    // 2. Delete user and all related data from database
    // Prisma cascading takes care of Account, Session, and File models due to 'onDelete: Cascade'
    await prisma.user.delete({
      where: { id: userId }
    });

    console.log(`✅ Permanently deleted account and all data for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Account and all associated data permanently deleted"
    });
  } catch (error: unknown) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account permanently" },
      { status: 500 }
    );
  }
}

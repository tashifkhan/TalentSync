import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// PATCH - Set a config as the active one
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        // Verify config belongs to user
        const config = await prisma.llmConfig.findUnique({ where: { id } });
        if (!config || config.userId !== user.id) {
            return NextResponse.json({ success: false, message: "Config not found" }, { status: 404 });
        }

        // Deactivate all, then activate this one (atomic transaction)
        await prisma.$transaction([
            prisma.llmConfig.updateMany({
                where: { userId: user.id },
                data: { isActive: false },
            }),
            prisma.llmConfig.update({
                where: { id },
                data: { isActive: true },
            }),
        ]);

        return NextResponse.json({ success: true, message: `"${config.label}" is now active` });
    } catch (error) {
        console.error("Error activating LLM config:", error);
        return NextResponse.json({ success: false, message: "Internal Error" }, { status: 500 });
    }
}

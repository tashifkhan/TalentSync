import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

// PUT - Update a specific config
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const { label, provider, model, apiKey, apiBase } = await request.json();

        if (!provider || !model) {
            return NextResponse.json({ success: false, message: "Provider and Model are required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        // Verify config belongs to user
        const existing = await prisma.llmConfig.findUnique({ where: { id } });
        if (!existing || existing.userId !== user.id) {
            return NextResponse.json({ success: false, message: "Config not found" }, { status: 404 });
        }

        // If label is changing, check for duplicates
        if (label && label.trim() !== existing.label) {
            const duplicate = await prisma.llmConfig.findUnique({
                where: { userId_label: { userId: user.id, label: label.trim() } },
            });
            if (duplicate) {
                return NextResponse.json({ success: false, message: "A config with this label already exists" }, { status: 409 });
            }
        }

        const updateData: any = {
            provider,
            model,
            apiBase: apiBase || null,
        };

        if (label && typeof label === "string" && label.trim() !== "") {
            updateData.label = label.trim();
        }

        if (apiKey && typeof apiKey === "string" && apiKey.trim() !== "") {
            updateData.encryptedKey = encrypt(apiKey);
        }

        const config = await prisma.llmConfig.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            message: "Configuration updated",
            config: {
                id: config.id,
                label: config.label,
                provider: config.provider,
                model: config.model,
                apiBase: config.apiBase,
                hasApiKey: !!config.encryptedKey,
                isActive: config.isActive,
                createdAt: config.createdAt,
                updatedAt: config.updatedAt,
            },
        });
    } catch (error) {
        console.error("Error updating LLM config:", error);
        return NextResponse.json({ success: false, message: "Internal Error" }, { status: 500 });
    }
}

// DELETE - Remove a specific config
export async function DELETE(
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
        const existing = await prisma.llmConfig.findUnique({ where: { id } });
        if (!existing || existing.userId !== user.id) {
            return NextResponse.json({ success: false, message: "Config not found" }, { status: 404 });
        }

        const wasActive = existing.isActive;

        await prisma.llmConfig.delete({ where: { id } });

        // If deleted config was active, activate the most recently updated one
        if (wasActive) {
            const nextConfig = await prisma.llmConfig.findFirst({
                where: { userId: user.id },
                orderBy: { updatedAt: "desc" },
            });
            if (nextConfig) {
                await prisma.llmConfig.update({
                    where: { id: nextConfig.id },
                    data: { isActive: true },
                });
            }
        }

        return NextResponse.json({ success: true, message: "Configuration deleted" });
    } catch (error) {
        console.error("Error deleting LLM config:", error);
        return NextResponse.json({ success: false, message: "Internal Error" }, { status: 500 });
    }
}

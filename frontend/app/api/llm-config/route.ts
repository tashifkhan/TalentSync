import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

// GET - Retrieve ALL configs for the user
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                llmConfigs: {
                    orderBy: [
                        { isActive: "desc" },
                        { updatedAt: "desc" },
                    ],
                },
            },
        });

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const configs = user.llmConfigs.map((c) => ({
            id: c.id,
            label: c.label,
            provider: c.provider,
            model: c.model,
            apiBase: c.apiBase,
            hasApiKey: !!c.encryptedKey,
            isActive: c.isActive,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        }));

        return NextResponse.json({ success: true, configs });
    } catch (error) {
        console.error("Error fetching LLM configs:", error);
        return NextResponse.json({ success: false, message: "Internal Error" }, { status: 500 });
    }
}

// POST - Create a NEW config
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { label, provider, model, apiKey, apiBase } = await request.json();

        if (!provider || !model) {
            return NextResponse.json({ success: false, message: "Provider and Model are required" }, { status: 400 });
        }

        if (!label || typeof label !== "string" || label.trim() === "") {
            return NextResponse.json({ success: false, message: "Label is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        // Check if label already exists for this user
        const existing = await prisma.llmConfig.findUnique({
            where: { userId_label: { userId: user.id, label: label.trim() } },
        });
        if (existing) {
            return NextResponse.json({ success: false, message: "A config with this label already exists" }, { status: 409 });
        }

        // Check if this is the user's first config -- if so, make it active
        const configCount = await prisma.llmConfig.count({ where: { userId: user.id } });
        const shouldBeActive = configCount === 0;

        const createData: any = {
            userId: user.id,
            label: label.trim(),
            provider,
            model,
            apiBase: apiBase || null,
            isActive: shouldBeActive,
        };

        if (apiKey && typeof apiKey === "string" && apiKey.trim() !== "") {
            createData.encryptedKey = encrypt(apiKey);
        }

        const config = await prisma.llmConfig.create({ data: createData });

        return NextResponse.json({
            success: true,
            message: "Configuration created",
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
        console.error("Error creating LLM config:", error);
        return NextResponse.json({ success: false, message: "Internal Error" }, { status: 500 });
    }
}

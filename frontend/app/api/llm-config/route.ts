import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

// GET - Retrieve config
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { llmConfig: true }
        });

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const config = user.llmConfig;
        
        return NextResponse.json({
            success: true,
            config: config ? {
                provider: config.provider,
                model: config.model,
                apiBase: config.apiBase,
                hasApiKey: !!config.encryptedKey // Tell UI if key exists
            } : null
        });

    } catch (error) {
        console.error("Error fetching LLM config:", error);
        return NextResponse.json({ success: false, message: "Internal Error" }, { status: 500 });
    }
}

// PUT - Update config
export async function PUT(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { provider, model, apiKey, apiBase } = await request.json();

        // Validation
        if (!provider || !model) {
            return NextResponse.json({ success: false, message: "Provider and Model are required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        // Prepare update data
        const updateData: any = {
            provider,
            model,
            apiBase: apiBase || null,
        };

        // Only update key if provided
        if (apiKey && typeof apiKey === 'string' && apiKey.trim() !== "") {
            updateData.encryptedKey = encrypt(apiKey);
        }

        // Upsert
        await prisma.llmConfig.upsert({
            where: { userId: user.id },
            update: updateData,
            create: {
                userId: user.id,
                ...updateData
            }
        });

        return NextResponse.json({ success: true, message: "Configuration saved" });

    } catch (error) {
        console.error("Error saving LLM config:", error);
        return NextResponse.json({ success: false, message: "Internal Error" }, { status: 500 });
    }
}

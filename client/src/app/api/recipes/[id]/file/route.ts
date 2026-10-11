
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { ObjectId } from "mongodb";


import connectDB from "@/src/lib/mongoose";
import { getRecipeBucket } from "@/src/lib/gridfs";
import { getRecipeByIdService } from "@/src/services/recipe.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;

        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid recipe ID",
                },
                { status: 400 }
            );
        }

        await connectDB();

        const recipe = await getRecipeByIdService(id);

        if (!recipe) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Recipe not found",
                },
                { status: 404 }
            );
        }

        const bucket = getRecipeBucket();

        const downloadStream = bucket.openDownloadStream(
            recipe.gridFsId
        );

        const disposition =
            request.nextUrl.searchParams.get("download") === "1"
                ? "attachment"
                : "inline";

        const safeFileName = recipe.fileName.replace(
            /[\r\n"]/g,
            "_"
        );

        const webStream = Readable.toWeb(
            downloadStream
        ) as ReadableStream<Uint8Array>;

        return new NextResponse(webStream, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Length": String(recipe.fileSize),
                "Content-Disposition":
                    `${disposition}; filename="${safeFileName}"`,
                "X-Content-Type-Options": "nosniff",
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error) {
        console.error("Error streaming recipe PDF:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to load recipe PDF",
            },
            { status: 500 }
        );
    }
}

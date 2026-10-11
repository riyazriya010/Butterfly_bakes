
import { NextRequest, NextResponse } from "next/server";

import {
    createRecipeService,
    getRecipeListService,
    deleteRecipesService,
} from "@/src/services/admin.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 15 * 1024 * 1024;

function errorResponse(error: string, status: number) {
    return NextResponse.json(
        {
            success: false,
            error,
        },
        { status }
    );
}

// GET /api/admin/recipes?page=1&limit=10&search=cake
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        const pageValue = Number(
            searchParams.get("page") ?? 1
        );

        const limitValue = Number(
            searchParams.get("limit") ?? 10
        );

        const search = searchParams.get("search") ?? "";

        if (
            !Number.isInteger(pageValue) ||
            pageValue < 1
        ) {
            return errorResponse(
                "Page must be a positive integer",
                400
            );
        }

        if (
            !Number.isInteger(limitValue) ||
            limitValue < 1 ||
            limitValue > 50
        ) {
            return errorResponse(
                "Limit must be between 1 and 50",
                400
            );
        }

        if (search.length > 120) {
            return errorResponse(
                "Search cannot exceed 120 characters",
                400
            );
        }

        const result = await getRecipeListService({
            page: pageValue,
            limit: limitValue,
            search,
        });

        return NextResponse.json({
            success: true,
            message: "Recipes fetched successfully",
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        console.error("Error fetching recipes:", error);

        return errorResponse(
            "Failed to fetch recipes",
            500
        );
    }
}

// POST /api/admin/recipes
// multipart/form-data: title, description, file
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const titleValue = formData.get("title");
        const descriptionValue =
            formData.get("description") ?? "";
        const fileValue = formData.get("file");

        if (
            typeof titleValue !== "string" ||
            !titleValue.trim()
        ) {
            return errorResponse(
                "Recipe title is required",
                400
            );
        }

        if (typeof descriptionValue !== "string") {
            return errorResponse(
                "Description must be a string",
                400
            );
        }

        if (descriptionValue.length > 500) {
            return errorResponse(
                "Description cannot exceed 500 characters",
                400
            );
        }

        if (
            !(fileValue instanceof File) ||
            fileValue.size === 0
        ) {
            return errorResponse(
                "A PDF file is required",
                400
            );
        }

        if (fileValue.size > MAX_FILE_SIZE) {
            return errorResponse(
                "PDF size must not exceed 15 MB",
                400
            );
        }

        const fileName = fileValue.name.trim();

        if (!fileName.toLowerCase().endsWith(".pdf")) {
            return errorResponse(
                "Only PDF files are allowed",
                400
            );
        }

        // Verify both the declared MIME type and PDF signature.
        if (
            fileValue.type !== "application/pdf" &&
            fileValue.type !== ""
        ) {
            return errorResponse(
                "Invalid PDF content type",
                400
            );
        }

        const buffer = Buffer.from(
            await fileValue.arrayBuffer()
        );

        const recipe = await createRecipeService({
            title: titleValue.trim(),
            description: descriptionValue.trim(),
            fileName,
            fileSize: buffer.length,
            buffer,
        });

        return NextResponse.json(
            {
                success: true,
                message: "Recipe uploaded successfully",
                data: {
                    _id: recipe._id.toString(),
                    title: recipe.title,
                    description: recipe.description,
                    fileName: recipe.fileName,
                    fileSize: recipe.fileSize,
                    createdAt: recipe.createdAt,
                    fileUrl: `/api/admin/recipes/${recipe._id}/file`,
                },
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        const code =
            error instanceof Error ? error.message : "";

        const messages: Record<string, string> = {
            RECIPE_TITLE_REQUIRED: "Recipe title is required",
            RECIPE_TITLE_TOO_LONG: "Title cannot exceed 120 characters",
            RECIPE_DESCRIPTION_TOO_LONG:
                "Description cannot exceed 500 characters",
            EMPTY_PDF: "The selected PDF is empty",
            PDF_TOO_LARGE: "PDF size must not exceed 15 MB",
            INVALID_PDF: "The uploaded file is not a valid PDF",
        };

        if (messages[code]) {
            return errorResponse(messages[code], 400);
        }

        console.error("Error uploading recipe:", error);

        return errorResponse(
            "Failed to upload recipe",
            500
        );
    }
}

// DELETE /api/admin/recipes
// JSON body: { "ids": ["mongo-id-1", "mongo-id-2"] }
export async function DELETE(request: NextRequest) {
    try {
        let body: unknown;

        try {
            body = await request.json();
        } catch {
            return errorResponse(
                "A valid JSON request body is required",
                400
            );
        }

        if (
            !body ||
            typeof body !== "object" ||
            !("ids" in body) ||
            !Array.isArray(body.ids)
        ) {
            return errorResponse(
                "ids must be an array",
                400
            );
        }

        const ids = body.ids;

        if (
            ids.length === 0 ||
            ids.length > 100 ||
            !ids.every(
                (id: unknown) =>
                    typeof id === "string" &&
                    id.length > 0
            )
        ) {
            return errorResponse(
                "Provide between 1 and 100 valid ID strings",
                400
            );
        }

        const result = await deleteRecipesService(ids);

        return NextResponse.json({
            success: result.failedIds.length === 0,
            message:
                result.failedIds.length === 0
                    ? "Recipes deleted successfully"
                    : "Some recipes could not be deleted",
            ...result,
        }, {
            status:
                result.failedIds.length > 0 ? 500 : 200,
        });
    } catch (error) {
        console.error("Error deleting recipes:", error);

        return errorResponse(
            "Failed to delete recipes",
            500
        );
    }
}

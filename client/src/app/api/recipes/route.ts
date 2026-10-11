
import { getRecipeListService } from "@/src/services/recipe.service";
import { NextRequest, NextResponse } from "next/server";

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
import { createVariant, getVariantList } from "@/src/services/admin.service";
import { NextRequest, NextResponse } from "next/server";



export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            cakeId,
            cakeName,
            weight,
            price,
            available,
        } = body;

        // -----------------------------
        // Cake ID validation
        // -----------------------------

        if (!cakeId?.trim()) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Cake is required",
                },
                { status: 400 }
            );
        }

        // -----------------------------
        // Cake name validation
        // -----------------------------

        if (!cakeName?.trim()) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Cake name is required",
                },
                { status: 400 }
            );
        }

        // -----------------------------
        // Weight validation
        // -----------------------------

        const weightValue = Number(weight);

        if (
            weight === undefined ||
            weight === null ||
            weight === "" ||
            !Number.isFinite(weightValue)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Valid weight is required",
                },
                { status: 400 }
            );
        }

        if (weightValue < 0.5) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Minimum cake weight is 0.5 Kg",
                },
                { status: 400 }
            );
        }

        // Only allow 0.1 Kg increments
        if (
            Math.round(weightValue * 10) / 10 !==
            weightValue
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Weight must be in 0.1 Kg increments",
                },
                { status: 400 }
            );
        }

        // -----------------------------
        // Price validation
        // -----------------------------

        const priceValue = Number(price);

        if (
            price === undefined ||
            price === null ||
            price === "" ||
            !Number.isFinite(priceValue) ||
            priceValue <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Valid price greater than ₹0 is required",
                },
                { status: 400 }
            );
        }

        // -----------------------------
        // Available validation
        // -----------------------------

        if (
            available !== undefined &&
            typeof available !== "boolean"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Available must be a boolean",
                },
                { status: 400 }
            );
        }

        // -----------------------------
        // Variant data
        // -----------------------------

        const variantData = {
            cakeId: cakeId.trim(),
            cakeName: cakeName.trim(),
            weight: weightValue,
            price: priceValue,
            available: available ?? true,
        };

        const variant = await createVariant(
            variantData
        );

        return NextResponse.json(
            {
                success: true,
                message: "Cake variant created successfully",
                data: variant,
            },
            { status: 201 }
        );
    } catch (error: any) {
        // Duplicate variant
        if (
            error.message === "DUPLICATE_VARIANT" ||
            error.code === 11000
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "This cake already has a variant with the same weight",
                },
                { status: 409 }
            );
        }

        console.error(
            "Error creating cake variant:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error: "Internal Server Error",
            },
            { status: 500 }
        );
    }
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(
      parseInt(searchParams.get("page") || "1", 10),
      1
    );

    const limit = Math.max(
      parseInt(searchParams.get("limit") || "8", 10),
      1
    );

    const search = searchParams.get("search")?.trim() || "";

    const result = await getVariantList({
      page,
      limit,
      search,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Failed to fetch variants:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch variant items",
      },
      { status: 500 }
    );
  }
}
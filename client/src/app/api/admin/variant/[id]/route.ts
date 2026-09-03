import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { deleteVariant, toggleVariantAvailability, updateVariant } from "@/src/services/admin.service";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;

        // Validate variant ID
        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid variant ID",
                },
                { status: 400 }
            );
        }

        const body = await request.json();

        console.log("body", body);

        if (!body || Object.keys(body).length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "No update data provided",
                },
                { status: 400 }
            );
        }

        // -----------------------------
        // Weight validation
        // -----------------------------

        let weight: number | undefined;

        if (body.weight !== undefined) {
            weight = Number(body.weight);

            if (
                body.weight === "" ||
                body.weight === null ||
                !Number.isFinite(weight)
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Valid weight is required",
                    },
                    { status: 400 }
                );
            }

            if (weight < 0.5) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Minimum cake weight is 0.5 Kg",
                    },
                    { status: 400 }
                );
            }

            if (Math.round(weight * 10) / 10 !== weight) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "Weight must be in 0.1 Kg increments",
                    },
                    { status: 400 }
                );
            }
        }

        // -----------------------------
        // Price validation
        // -----------------------------

        let price: number | undefined;

        if (body.price !== undefined) {
            price = Number(body.price);

            if (
                body.price === "" ||
                body.price === null ||
                !Number.isFinite(price)
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Valid price is required",
                    },
                    { status: 400 }
                );
            }

            if (price <= 0) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Price must be greater than ₹0",
                    },
                    { status: 400 }
                );
            }
        }

        // -----------------------------
        // Available validation
        // -----------------------------

        if (
            body.available !== undefined &&
            typeof body.available !== "boolean"
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
        // Only allow these fields
        // -----------------------------

        const updateData: {
            weight?: number;
            price?: number;
            available?: boolean;
        } = {};

        if (weight !== undefined) {
            updateData.weight = weight;
        }

        if (price !== undefined) {
            updateData.price = price;
        }

        if (body.available !== undefined) {
            updateData.available = body.available;
        }

        // -----------------------------
        // Update variant
        // -----------------------------

        const updatedVariant = await updateVariant(
            id,
            updateData
        );

        if (!updatedVariant) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Variant not found",
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Cake variant updated successfully",
                data: updatedVariant,
            },
            { status: 200 }
        );
    } catch (error: any) {
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

        console.error("Error updating cake variant:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Internal Server Error",
            },
            { status: 500 }
        );
    }
}



// PATCH /api/admin/variant/[id]
export async function PATCH(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;

        // -----------------------------
        // Validate ID
        // -----------------------------

        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid variant ID",
                },
                { status: 400 }
            );
        }

        // -----------------------------
        // Toggle availability
        // -----------------------------

        const updatedVariant =
            await toggleVariantAvailability(id);

        if (!updatedVariant) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Variant not found",
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: updatedVariant.available
                    ? "Variant enabled successfully"
                    : "Variant disabled successfully",
                data: updatedVariant,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error(
            "Error toggling variant availability:",
            error
        );

        if (error.message === "MINIMUM_ONE_VARIANT_REQUIRED") {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Cannot make unavailable this variant. The cake must have at least one available variant.",
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: "Internal Server Error",
            },
            { status: 500 }
        );
    }
}



export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;

        // -----------------------------
        // Validate ID
        // -----------------------------

        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid variant ID",
                },
                { status: 400 }
            );
        }

        // -----------------------------
        // Delete variant
        // -----------------------------

        const deletedVariant = await deleteVariant(id);

        if (!deletedVariant) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Variant not found",
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Cake variant deleted successfully",
                data: deletedVariant,
            },
            { status: 200 }
        );
    } catch (error: any) {
        // -----------------------------
        // At least one variant required
        // -----------------------------

        if (error.message === "MINIMUM_ONE_VARIANT_REQUIRED") {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Cannot delete this variant. The cake must have at least one variant.",
                },
                { status: 409 }
            );
        }

        console.error(
            "Error deleting cake variant:",
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
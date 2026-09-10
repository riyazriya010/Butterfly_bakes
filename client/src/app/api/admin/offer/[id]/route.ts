import {
    checkAndUpdateeOfferService,
    deleteOfferService,
    getOfferByIdService,
    updateOfferService,
    updateOfferStatusService,
} from "@/src/services/admin.service";

import {
    NextRequest,
    NextResponse,
} from "next/server";

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

// --------------------------------------------------
// GET SINGLE
// --------------------------------------------------

export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;

        const offer =
            await getOfferByIdService(id);

        if (!offer) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Offer not found.",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json({
            success: true,
            data: offer,
        });
    } catch (error: any) {
        console.error(
            "GET /api/admin/offer/:id error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    "Failed to fetch offer.",
            },
            {
                status: 500,
            }
        );
    }
}

// --------------------------------------------------
// PUT - UPDATE OFFER
// --------------------------------------------------

export async function PUT(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;

        const body = await request.json();

        const {
            title,
            discountType,
            discountValue,
            startDate,
            endDate,
            isActive,
        } = body;

        const data = {
            title: String(title || "").trim(),

            discountType,

            discountValue:
                Number(discountValue),

            startDate:
                new Date(startDate),

            endDate:
                new Date(endDate),

            // isActive:
            //     isActive !== false,
        };

        const updatedOffer =
            await updateOfferService(
                id,
                data
            );

             await checkAndUpdateeOfferService()

        return NextResponse.json({
            success: true,
            message:
                "Offer updated successfully.",
            data: updatedOffer,
        });
    } catch (error: any) {
        console.error(
            "PUT /api/admin/offer/:id error:",
            error
        );

        if (
            error?.message ===
            "DUPLICATE_OFFER"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "An offer with this title already exists.",
                },
                {
                    status: 409,
                }
            );
        }

        if (
            error?.message ===
            "OFFER_NOT_FOUND"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Offer not found.",
                },
                {
                    status: 404,
                }
            );
        }

        const validationMessages: Record<
            string,
            string
        > = {
            TITLE_REQUIRED:
                "Offer title is required.",

            INVALID_DISCOUNT_TYPE:
                "Invalid discount type.",

            INVALID_DISCOUNT_VALUE:
                "Discount value must be greater than 0.",

            PERCENTAGE_CANNOT_EXCEED_100:
                "Percentage discount cannot exceed 100%.",

            INVALID_START_DATE:
                "Please provide a valid start date.",

            INVALID_END_DATE:
                "Please provide a valid end date.",

            END_DATE_MUST_BE_AFTER_START_DATE:
                "End date must be after start date.",
        };

        const message =
            validationMessages[
                error?.message
            ];

        if (message) {
            return NextResponse.json(
                {
                    success: false,
                    error: message,
                },
                {
                    status: 400,
                }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error:
                    "Failed to update offer.",
            },
            {
                status: 500,
            }
        );
    }
}

// --------------------------------------------------
// PATCH - ACTIVE / INACTIVE
// --------------------------------------------------

export async function PATCH(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;

        const body = await request.json();

        if (
            typeof body.isActive !==
            "boolean"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "isActive must be a boolean.",
                },
                {
                    status: 400,
                }
            );
        }

        const updatedOffer =
            await updateOfferStatusService(
                id,
                body.isActive
            );

             await checkAndUpdateeOfferService()

        return NextResponse.json({
            success: true,
            message:
                body.isActive
                    ? "Offer activated successfully."
                    : "Offer deactivated successfully.",
            data: updatedOffer,
        });
    } catch (error: any) {
        console.error(
            "PATCH /api/admin/offer/:id error:",
            error
        );

        if (
            error?.message ===
            "OFFER_NOT_FOUND"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Offer not found.",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error:
                    "Failed to update offer status.",
            },
            {
                status: 500,
            }
        );
    }
}

// --------------------------------------------------
// DELETE
// --------------------------------------------------

export async function DELETE(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;

        await deleteOfferService(id);

        return NextResponse.json({
            success: true,
            message:
                "Offer deleted successfully.",
        });
    } catch (error: any) {
        console.error(
            "DELETE /api/admin/offer/:id error:",
            error
        );

        if (
            error?.message ===
            "OFFER_NOT_FOUND"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Offer not found.",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error:
                    "Failed to delete offer.",
            },
            {
                status: 500,
            }
        );
    }
}
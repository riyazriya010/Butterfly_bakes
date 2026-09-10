import {
    checkAndUpdateeOfferService,
    createOfferService,
    getOffersService,
} from "@/src/services/admin.service";

import {
    NextRequest,
    NextResponse,
} from "next/server";

// --------------------------------------------------
// GET
// --------------------------------------------------

export async function GET(
    request: NextRequest
) {
    try {
        const { searchParams } =
            new URL(request.url);

        const pageParam =
            Number(searchParams.get("page") || 1);

        const limitParam =
            Number(searchParams.get("limit") || 5);

        const search =
            searchParams.get("search") || "";

        const page = Math.max(
            Number.isFinite(pageParam)
                ? pageParam
                : 1,
            1
        );

        const limit = Math.min(
            Math.max(
                Number.isFinite(limitParam)
                    ? limitParam
                    : 5,
                1
            ),
            100
        );

        const result =
            await getOffersService(
                page,
                limit,
                search
            );

            await checkAndUpdateeOfferService()

        return NextResponse.json({
            success: true,
            data: result.offers,
            pagination: result.pagination,
        });
    } catch (error: any) {
        console.error(
            "GET /api/admin/offer error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Failed to fetch offers.",
                error:
                    error?.message ||
                    "INTERNAL_SERVER_ERROR",
            },
            {
                status: 500,
            }
        );
    }
}

// --------------------------------------------------
// POST
// --------------------------------------------------

export async function POST(
    request: NextRequest
) {
    try {
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

            isActive:
                isActive !== false,
        };

        const createdOffer =
            await createOfferService(data);

        return NextResponse.json(
            {
                success: true,
                message:
                    "Offer created successfully.",
                data: createdOffer,
            },
            {
                status: 201,
            }
        );
    } catch (error: any) {
        console.error(
            "POST /api/admin/offer error:",
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
                    "Failed to create offer.",
            },
            {
                status: 500,
            }
        );
    }
}
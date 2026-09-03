import { NextRequest, NextResponse } from "next/server";
import { createMenu, getMenuList } from "@/src/services/admin.service";

interface CreateMenuData {
    name: string;
    flavour: string;
    weight: number;
    price: number;
    description?: string;
    available?: boolean;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            name,
            flavour,
            weight,
            price,
            description,
            image,
            available,
        } = body;

        // --------------------------------------------------
        // NAME
        // --------------------------------------------------

        if (
            typeof name !== "string" ||
            !name.trim()
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Menu name is required",
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------
        // FLAVOUR
        // --------------------------------------------------

        if (
            typeof flavour !== "string" ||
            !flavour.trim()
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Flavour is required",
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------
        // WEIGHT
        // --------------------------------------------------

        if (
            weight === undefined ||
            weight === null ||
            weight === ""
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Weight is required",
                },
                { status: 400 }
            );
        }

        const weightValue = Number(weight);

        if (!Number.isFinite(weightValue)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Weight must be a valid number",
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

        if (
            Math.round(weightValue * 10) / 10 !==
            weightValue
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Weight must be in 0.1 Kg increments",
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------
        // PRICE
        // --------------------------------------------------

        if (
            price === undefined ||
            price === null ||
            price === ""
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Price is required",
                },
                { status: 400 }
            );
        }

        const priceValue = Number(price);

        if (!Number.isFinite(priceValue)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Price must be a valid number",
                },
                { status: 400 }
            );
        }

        if (priceValue <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Price must be greater than ₹0",
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------
        // DESCRIPTION
        // --------------------------------------------------

        if (
            typeof description !== "string" ||
            !description.trim()
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Description is required",
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------
        // AVAILABLE
        // --------------------------------------------------

        if (
            available !== undefined &&
            typeof available !== "boolean"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Available must be a boolean",
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------
        // IMAGE
        // --------------------------------------------------

        if (
            image !== undefined &&
            typeof image !== "string"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Image must be a string",
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------
        // CLEAN DATA
        // --------------------------------------------------

        const menuData: CreateMenuData = {
            name: name.trim(),
            flavour: flavour.trim(),

            // IMPORTANT:
            // Both are numbers here.
            weight: weightValue,
            price: priceValue,

            description: description.trim(),

            available:
                available ?? true,
        };

        // --------------------------------------------------
        // SERVICE
        // --------------------------------------------------

        const menu = await createMenu(menuData);

        return NextResponse.json(
            {
                success: true,
                message:
                    "Menu item created successfully",
                data: menu,
            },
            { status: 201 }
        );
    } catch (error: any) {
        // --------------------------------------------------
        // DUPLICATE MENU
        // --------------------------------------------------

        if (
            error?.message ===
            "DUPLICATE_MENU"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "A menu with the same name and flavour already exists",
                },
                { status: 409 }
            );
        }

        // --------------------------------------------------
        // DUPLICATE VARIANT
        // --------------------------------------------------

        if (
            error?.message ===
            "DUPLICATE_VARIANT"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "A variant with the same weight already exists",
                },
                { status: 409 }
            );
        }

        // --------------------------------------------------
        // MONGODB DUPLICATE KEY
        // --------------------------------------------------

        if (error?.code === 11000) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "This menu or variant already exists",
                },
                { status: 409 }
            );
        }

        console.error(
            "Error creating menu:",
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

    const result = await getMenuList({
      page,
      limit,
      search,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Failed to fetch menu:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch menu items",
      },
      { status: 500 }
    );
  }
}
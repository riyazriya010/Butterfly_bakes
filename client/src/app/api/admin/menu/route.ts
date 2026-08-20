import { createMenu, getMenuList } from "@/src/services/admin.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      flavour,
      price,
      weight,
      description,
      image,
      available,
    } = body;

    // Basic validation
    if (!name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Menu name is required",
        },
        { status: 400 }
      );
    }

    if (!flavour?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Flavour is required",
        },
        { status: 400 }
      );
    }

    if (price === undefined || Number(price) <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid price is required",
        },
        { status: 400 }
      );
    }

    if (!weight?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Weight is required",
        },
        { status: 400 }
      );
    }

    if (!description?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Description is required",
        },
        { status: 400 }
      );
    }

    const menuData = {
      name: name.trim(),
      flavour: flavour.trim(),
      price: Number(price),
      weight: weight.trim(),
      description: description.trim(),
      image: image?.trim() || "",
      available: available ?? true,
    };

    const menu = await createMenu(menuData);

    return NextResponse.json(
      {
        success: true,
        message: "Menu item created successfully",
        data: menu,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "DUPLICATE_MENU") {
      return NextResponse.json(
        {
          success: false,
          error:
            "A menu item with the same name, flavour and weight already exists",
        },
        { status: 409 }
      );
    }

    // MongoDB duplicate key protection
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A menu item with the same name, flavour and weight already exists",
        },
        { status: 409 }
      );
    }

    console.error("Error creating menu:", error);

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
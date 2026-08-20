import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { checkMenuAvailability } from "@/src/services/menu.services";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    console.log('idzd', id)

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid menu item ID",
        },
        { status: 400 }
      );
    }

    const menu = await checkMenuAvailability(id);

    
    if (!menu) {
      return NextResponse.json(
        {
          success: false,
          error: "Menu item not found",
        },
        { status: 404 }
      );
    }
    
    
    if (!menu.available) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          error: "This cake is currently not available",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        available: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking menu availability:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check menu availability",
      },
      { status: 500 }
    );
  }
}
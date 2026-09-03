import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getSingleCakeDetails } from "@/src/services/menu.services";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // --------------------------------
    // Validate cake ID
    // --------------------------------

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid cake ID",
        },
        { status: 400 }
      );
    }

    // --------------------------------
    // Get cake details
    // --------------------------------

    const result = await getSingleCakeDetails(id);
     console.log('result', result)

    // --------------------------------
    // Cake not found
    // --------------------------------

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: "Cake not found",
        },
        { status: 404 }
      );
    }

    // --------------------------------
    // Success
    // --------------------------------

    return NextResponse.json(
      {
        success: true,
        data: {
          cake: result,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting cake:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch cake",
      },
      { status: 500 }
    );
  }
}
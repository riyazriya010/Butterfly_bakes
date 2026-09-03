import { NextResponse } from "next/server";
import { getMenuFilterOptions } from "@/src/services/menu.services";

export async function GET() {
  try {
    const filters = await getMenuFilterOptions();

    return NextResponse.json(
      {
        success: true,
        data: filters,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Error fetching menu filter options:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch menu filter options",
      },
      { status: 500 }
    );
  }
}
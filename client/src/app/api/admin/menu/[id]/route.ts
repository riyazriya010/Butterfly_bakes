import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { deleteMenu, updateMenu, updateMenuAvailability } from "@/src/services/admin.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/menu/[id]
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid menu item ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No update data provided",
        },
        { status: 400 }
      );
    }

    const updatedMenu = await updateMenu(id, body);

    if (!updatedMenu) {
      return NextResponse.json(
        {
          success: false,
          error: "Menu item not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Menu item updated successfully",
        data: updatedMenu,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating menu:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}



// DELETE /api/admin/menu/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid menu item ID",
        },
        { status: 400 }
      );
    }

    const deletedMenu = await deleteMenu(id);

    if (!deletedMenu) {
      return NextResponse.json(
        {
          success: false,
          error: "Menu item not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Menu item deleted successfully",
        data: deletedMenu,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting menu item:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}



export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid menu item ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const { available } = body;

    // Validate available
    if (typeof available !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "available must be true or false",
        },
        { status: 400 }
      );
    }

    const result = await updateMenuAvailability(
      id,
      available
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Menu item not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Menu item ${
          available ? "enabled" : "disabled"
        } successfully`,
        data: {
          id,
          available,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Error updating menu availability:",
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
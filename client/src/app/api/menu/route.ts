import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/mongoose";
import { createMenu, getMenu } from "@/src/services/menu.services";

// POST /api/menu
export async function POST(request: NextRequest) {
    try {

        const body = await request.json();

        const menu = await createMenu(body);

        return NextResponse.json(menu, { status: 201 });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                error: String(error),
            },
            {
                status: 500,
            }
        );
    }
}


// GET /api/menu
export async function GET() {
    try {

        const menu = await getMenu()

        return NextResponse.json(menu, { status: 200 });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                error: String(error),
            },
            {
                status: 500,
            }
        );
    }
}
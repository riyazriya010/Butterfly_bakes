import { NextRequest, NextResponse } from "next/server";
import { getMenu } from "@/src/services/menu.services";


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
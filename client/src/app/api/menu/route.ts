import { getMenuWithVariants } from "@/src/services/menu.services";
import { NextRequest, NextResponse } from "next/server";


// GET /api/menu

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const pageParam = Number(searchParams.get("page") || 1);
    const limitParam = Number(searchParams.get("limit") || 8);
    const search = searchParams.get("search") || undefined;

    const page = Number.isFinite(pageParam) && pageParam > 0
      ? Math.floor(pageParam)
      : 1;

    const limit = Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(Math.floor(limitParam), 50)
      : 8;

    const result = await getMenuWithVariants(
      page,
      limit,
      search
    );

    return NextResponse.json(
      {
        success: true,
        data: result.items,
        pagination: result.pagination,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching menu:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch menu",
      },
      { status: 500 }
    );
  }
}
// export async function GET() {
//     try {

//         const menu = await getMenu()

//         return NextResponse.json(menu, { status: 200 });
//     } catch (error) {
//         console.error(error);

//         return NextResponse.json(
//             {
//                 success: false,
//                 error: String(error),
//             },
//             {
//                 status: 500,
//             }
//         );
//     }
// }
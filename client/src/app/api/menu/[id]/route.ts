import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { checkMenuAvailability } from "@/src/services/menu.services";

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
          available: false,
          error: "Invalid menu item ID",
          reason: "INVALID_CAKE_ID",
        },
        { status: 400 }
      );
    }

    // --------------------------------
    // Get variant ID
    // --------------------------------

    const variantId =
      request.nextUrl.searchParams.get("variantId");

      const isOfferParam =
      request.nextUrl.searchParams.get("isOffer")

      const isOffer = isOfferParam === "true";

      console.log('isOffer', isOffer)

    if (!variantId) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          error: "Variant ID is required",
          reason: "VARIANT_ID_REQUIRED",
        },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(variantId)) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          error: "Invalid variant ID",
          reason: "INVALID_VARIANT_ID",
        },
        { status: 400 }
      );
    }

    // --------------------------------
    // Check cake + variant availability
    // --------------------------------

    const result = await checkMenuAvailability(
      id,
      variantId,
      isOffer
    )as any

    // --------------------------------
    // Cake / menu item not found
    // --------------------------------

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          error: "Menu item not found",
          reason: "CAKE_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // --------------------------------
    // Cake unavailable
    // --------------------------------

    if (!result.cakeAvailable) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          error: "This cake is currently not available",
          reason: "CAKE_UNAVAILABLE",
        },
        { status: 409 }
      );
    }

    // --------------------------------
    // Variant unavailable
    // --------------------------------

    if (!result.variantAvailable) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          error: "This cake size is currently not available",
          reason: "VARIANT_UNAVAILABLE",
        },
        { status: 409 }
      );
    }

    // --------------------------------
    // OFFER APPLIED BUT OFFER NOT AVAILABLE
    // --------------------------------

    const offer = result.cake.offer;

    if(isOffer) {
      const isOfferValid =
  offer &&
  typeof offer === "object" &&
  Object.keys(offer).length > 0;

    if (!isOfferValid) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          error: "The offer is closed",
          reason: "OFFER_CLOSED",
        },
        { status: 400 }
      );
    }
    }


    // --------------------------------
    // Everything available
    // --------------------------------

    return NextResponse.json(
      {
        success: true,
        available: true,
        data: {
          cake: result.cake,
          variant: result.variant,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Error checking menu availability:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        available: false,
        error: "Failed to check menu availability",
        reason: "AVAILABILITY_CHECK_FAILED",
      },
      { status: 500 }
    );
  }
}








// import { NextRequest, NextResponse } from "next/server";
// import { ObjectId } from "mongodb";
// import { checkMenuAvailability } from "@/src/services/menu.services";

// type RouteParams = {
//   params: Promise<{
//     id: string;
//   }>;
// };

// export async function GET(
//   request: NextRequest,
//   { params }: RouteParams
// ) {
//   try {
//     const { id } = await params;

//     // --------------------------------
//     // Validate cake ID
//     // --------------------------------

//     if (!ObjectId.isValid(id)) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Invalid menu item ID",
//         },
//         { status: 400 }
//       );
//     }

//     // --------------------------------
//     // Get variant ID
//     // --------------------------------

//     const variantId =
//       request.nextUrl.searchParams.get("variantId");

//     if (!variantId) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Variant ID is required",
//         },
//         { status: 400 }
//       );
//     }

//     if (!ObjectId.isValid(variantId)) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Invalid variant ID",
//         },
//         { status: 400 }
//       );
//     }

//     // --------------------------------
//     // Check cake + variant availability
//     // --------------------------------

//     const result = await checkMenuAvailability(
//       id,
//       variantId
//     );

//     // --------------------------------
//     // Cake not found
//     // --------------------------------

//     if (!result) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Menu item not found",
//         },
//         { status: 404 }
//       );
//     }

//     // --------------------------------
//     // Cake unavailable
//     // --------------------------------

//     if (!result.cakeAvailable) {
//       return NextResponse.json(
//         {
//           success: false,
//           available: false,
//           error: "This cake is currently not available",
//         },
//         { status: 409 }
//       );
//     }

//     // --------------------------------
//     // Variant unavailable
//     // --------------------------------

//     if (!result.variantAvailable) {
//       return NextResponse.json(
//         {
//           success: false,
//           available: false,
//           error: "This cake size is currently not available",
//         },
//         { status: 409 }
//       );
//     }

//     // --------------------------------
//     // Everything available
//     // --------------------------------

//     return NextResponse.json(
//       {
//         success: true,
//         available: true,
//         data: {
//           cake: result.cake,
//           variant: result.variant,
//         },
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error(
//       "Error checking menu availability:",
//       error
//     );

//     return NextResponse.json(
//       {
//         success: false,
//         error: "Failed to check menu availability",
//       },
//       { status: 500 }
//     );
//   }
// }





// import { NextRequest, NextResponse } from "next/server";
// import { ObjectId } from "mongodb";
// import { checkMenuAvailability } from "@/src/services/menu.services";

// type RouteParams = {
//   params: Promise<{
//     id: string;
//   }>;
// };

// export async function GET(
//   _request: NextRequest,
//   { params }: RouteParams
// ) {
//   try {
//     const { id } = await params;

//     if (!ObjectId.isValid(id)) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Invalid menu item ID",
//         },
//         { status: 400 }
//       );
//     }

//     const menu = await checkMenuAvailability(id);
//     console.log('menu', menu)

    
//     if (!menu) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Menu item not found",
//         },
//         { status: 404 }
//       );
//     }
    
    
//     if (!menu.available) {
//       return NextResponse.json(
//         {
//           success: false,
//           available: false,
//           error: "This cake is currently not available",
//         },
//         { status: 409 }
//       );
//     }

//     return NextResponse.json(
//       {
//         success: true,
//         available: true,
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error checking menu availability:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         error: "Failed to check menu availability",
//       },
//       { status: 500 }
//     );
//   }
// }
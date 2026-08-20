import { getAdmin } from "@/src/services/admin.service";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signJWT, verifyJWT } from "@/src/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, state } = await request.json();

    // =========================
    // LOGOUT
    // =========================
    if (state === "logout") {
      const response = NextResponse.json(
        {
          success: true,
          message: "Logged out successfully",
        },
        { status: 200 }
      );

      response.cookies.set({
        name: "admin_token",
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });

      return response;
    }

    // =========================
    // LOGIN
    // =========================
    if (state === "login") {
      if (!email || !password) {
        return NextResponse.json(
          {
            success: false,
            error: "Email and password are required",
          },
          { status: 400 }
        );
      }

      const normalizedEmail = email.trim().toLowerCase();

      const admin = await getAdmin();

      if (!admin || admin.email !== normalizedEmail) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid email or password",
          },
          { status: 401 }
        );
      }

      if (!admin.is_active) {
        return NextResponse.json(
          {
            success: false,
            error: "Admin account is inactive",
          },
          { status: 403 }
        );
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        admin.password
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid email or password",
          },
          { status: 401 }
        );
      }

      // Generate JWT
      const token = await signJWT({
        id: admin.id,
        email: admin.email,
        role: "admin",
      });

      // Remove password from response
      const { password: _, ...adminData } = admin;

      const response = NextResponse.json(
        {
          success: true,
          data: adminData,
        },
        { status: 200 }
      );

      // Set JWT in HttpOnly cookie
      response.cookies.set({
        name: "admin_token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });

      return response;
    }

    // =========================
    // INVALID STATE
    // =========================
    return NextResponse.json(
      {
        success: false,
        error: "Invalid state",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin authentication error:", error);

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
        const token = request.cookies.get("admin_token")?.value;

        if (!token) {
            return NextResponse.json(
                { authenticated: false },
                { status: 401 }
            );
        }

        const payload = await verifyJWT(token);

        if (!payload) {
            return NextResponse.json(
                { authenticated: false },
                { status: 401 }
            );
        }

        return NextResponse.json({
            authenticated: true,
            data: payload,
        });

    } catch {
        return NextResponse.json(
            { authenticated: false },
            { status: 401 }
        );
    }
}



// export async function GET(request: NextRequest) {
//   try {
//     const token = request.cookies.get("admin_token")?.value;

//     if (!token) {
//       return NextResponse.json(
//         { authenticated: false },
//         { status: 401 }
//       );
//     }

//     const payload = await verifyJWT(token);

//     if (!payload) {
//       return NextResponse.json(
//         { authenticated: false },
//         { status: 401 }
//       );
//     }

//     return NextResponse.json({
//       authenticated: true,
//       data: payload,
//     });
//   } catch {
//     return NextResponse.json(
//       { authenticated: false },
//       { status: 401 }
//     );
//   }
// }
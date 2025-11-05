import { auth0 } from "@/lib/auth0";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
      const req = new NextRequest(request.url, {
      headers: request.headers,
    });
    const session = await auth0.getSession(req);
    return NextResponse.json(session || {});
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
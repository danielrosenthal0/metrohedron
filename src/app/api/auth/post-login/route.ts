import { auth0 } from "@/lib/auth0";
// import { PagesRouterRequest } from "@auth0/nextjs-auth0/types";
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
      const req = new NextRequest(request.url, {
      headers: request.headers,
    });
    const session = await auth0.getSession(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sub, email, name } = session.user;

    let user = await prisma.user.findUnique({ where: { auth0Id: sub } });
    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email } });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          auth0Id: sub,
          email: email ?? "",
          name,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Post-login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
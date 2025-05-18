// src/pages/api/auth/post-login.ts
import { auth0 } from "@/lib/auth0";

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

  const session = await auth0.getSession(req);
  if (!session || !session.user) {
    return res.status(401).end();
  }
  const { sub, email, name } = session.user;

  // Check if user exists by auth0Id or email
  let user = await prisma.user.findUnique({ where: { auth0Id: sub } });
  if (!user && email) {
    user = await prisma.user.findUnique({ where: { email } });
  }
  if (!user) {
    // Create user
    user = await prisma.user.create({
      data: {
        auth0Id: sub,
        email: email ?? "",
        name,
      },
    });
  }
  // Respond with success
  res.status(200).json({ ok: true });
}
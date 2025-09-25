import { auth0 } from "@/lib/auth0";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await auth0.getSession(req);
  res.status(200).json(session || {});
}

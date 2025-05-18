import { auth0 } from "@/lib/auth0";

export default async function handler(req, res) {
  const session = await auth0.getSession(req);
  res.status(200).json(session || {});
}

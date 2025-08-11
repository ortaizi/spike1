import { getServerSession } from "next-auth"
import { unifiedAuthOptions as authOptions } from "./unified-auth"

export { authOptions }

export async function getAuthSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getAuthSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}
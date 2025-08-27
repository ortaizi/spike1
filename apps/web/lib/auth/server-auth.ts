import { getServerSession } from "next-auth"
import { unifiedAuthOptions } from "./unified-auth"

// Export as authOptions for backward compatibility
export const authOptions = unifiedAuthOptions

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
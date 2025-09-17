import NextAuth from 'next-auth';
import { unifiedAuthOptions } from '../../../../lib/auth/unified-auth';

const handler = NextAuth(unifiedAuthOptions);

export { handler as GET, handler as POST };

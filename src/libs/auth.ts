// Third-party Imports
import CredentialProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'
import type { NextAuthOptions } from 'next-auth'
import type { Adapter } from 'next-auth/adapters'

// Local Imports
import { users } from '@/app/api/login/users'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,

  secret: process.env.NEXTAUTH_SECRET,

  // ** Configure one or more authentication providers
  // ** Please refer to https://next-auth.js.org/configuration/options#providers for more `providers` options
  providers: [
    CredentialProvider({
      // ** The name to display on the sign in form (e.g. 'Sign in with...')
      // ** For more details on Credentials Provider, visit https://next-auth.js.org/providers/credentials
      name: 'Credentials',
      type: 'credentials',

      /*
       * As we are using our own Sign-in page, we do not need to change
       * username or password attributes manually in following credentials object.
       */
      credentials: {},
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }

        try {
          const user = users.find(u => u.email === email && u.password === password)

          if (user) {
            const { password: _, ...filteredUserData } = user

            return {
              ...filteredUserData,
              id: filteredUserData.id.toString()
            }
          } else {
            throw new Error(
              JSON.stringify({
                message: ['Email or Password is invalid']
              })
            )
          }
        } catch (e: any) {
          throw new Error(e.message)
        }
      }
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    })

    // ** ...add more providers here
  ],

  // ** Please refer to https://next-auth.js.org/configuration/options#session for more `session` options
  session: {
    /*
     * Choose how you want to save the user session.
     * The default is `jwt`, an encrypted JWT (JWE) stored in the session cookie.
     * If you use an `adapter` however, NextAuth default it to `database` instead.
     * You can still force a JWT session by explicitly defining `jwt`.
     * When using `database`, the session cookie will only contain a `sessionToken` value,
     * which is used to look up the session in the database.
     * If you use a custom credentials provider, user accounts will not be persisted in a database by NextAuth.js (even if one is configured).
     * The option to use JSON Web Tokens for session tokens must be enabled to use a custom credentials provider.
     */
    strategy: 'jwt',

    // ** Seconds - How long until an idle session expires and is no longer valid
    maxAge: 30 * 24 * 60 * 60 // ** 30 days
  },

  // ** Please refer to https://next-auth.js.org/configuration/options#pages for more `pages` options
  pages: {
    signIn: '/login'
  },

  // ** Please refer to https://next-auth.js.org/configuration/options#callbacks for more `callbacks` options
  callbacks: {
    /*
     * While using `jwt` as a strategy, `jwt()` callback will be called before
     * the `session()` callback. So we have to add custom parameters in `token`
     * via `jwt()` callback to make them accessible in the `session()` callback
     */
    async jwt({ token, user, account }) {
      if (user) {
        /*
         * For adding custom parameters to user in session, we first need to add those parameters
         * in token which then will be available in the `session()` callback
         */
        token.id = user.id
        token.name = user.name
        token.email = user.email
        
        // SECURITY: For OAuth providers, user data doesn't include tenantId/roles/permissions
        // These must be provisioned in the database via User model after first login
        // Until provisioned, OAuth users have NO access (empty arrays)
        const isOAuthLogin = account?.provider && account.provider !== 'credentials'
        
        if (isOAuthLogin) {
          // OAuth users: fetch from database User model (TODO: implement database lookup)
          // For now, OAuth users have no access until admin provisions them
          token.tenantId = (user as any).tenantId || null
          token.branchId = (user as any).branchId || null
          token.permissions = (user as any).permissions || []
          token.roles = (user as any).roles || []
        } else {
          // Credentials login: use data from credentials provider
          token.tenantId = (user as any).tenantId || 'tenant-demo-001' // Fallback for demo only
          token.branchId = (user as any).branchId || null
          token.permissions = (user as any).permissions || []
          token.roles = (user as any).roles || []
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // ** Add custom params to user in session which are added in `jwt()` callback via `token` parameter
        ;(session.user as any).id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).branchId = token.branchId;
        (session.user as any).permissions = token.permissions;
        (session.user as any).roles = token.roles
      }

      return session
    }
  }
}

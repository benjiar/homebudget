import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { supabase } from "../../../../lib/supabase";

const handler = NextAuth({
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'email') {
        return true;
      }

      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error checking existing user:', fetchError);
            return false;
          }

          if (!existingUser) {
            const { error: insertError } = await supabase.from('users').insert([
              {
                email: user.email,
                name: user.name,
                provider: account.provider,
                provider_id: profile?.sub || (profile as any)?.id || '',
              },
            ]);

            if (insertError) {
              console.error('Error creating user:', insertError);
              return false;
            }
          }

          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST }; 
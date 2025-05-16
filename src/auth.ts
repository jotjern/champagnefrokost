import { NextAuthOptions } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization:
        "https://accounts.spotify.com/authorize?scope=user-read-email+user-read-playback-state+user-modify-playback-state",
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    jwt: async ({ token, account }) => {
      if (account && account.access_token) {
        token.accessToken = account.access_token ?? null;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.accessToken = token.accessToken;

      return session;
    },
  },
};

import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        const apiBase = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
        const res = await fetch(`${apiBase}/auth/social-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            provider: account?.provider,
            provider_id: account?.providerAccountId,
          }),
        });
        const data = await res.json();
        if (data.token) {
          // Gán token và userID thật từ Backend vào user object của NextAuth
          (user as any).accessToken = data.token;
          (user as any).id = data.user_id;
          return true;
        }
      } catch (error) {
        console.error("Lỗi đồng bộ Auth với Backend:", error);
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Chuyển accessToken từ user object sang JWT token của NextAuth
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      // Đẩy accessToken ra session để Client-side có thể truy cập
      if (session.user) {
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "your_secret_key",
})

export { handler as GET, handler as POST }

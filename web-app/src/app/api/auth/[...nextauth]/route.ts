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
          (user as any).accessToken = data.token;
          (user as any).id = data.user_id;
          (user as any).subscription_plan = data.subscription_plan || "free";
          (user as any).subscription_status = data.subscription_status || "active";
          (user as any).plan_expires_at =
            Object.prototype.hasOwnProperty.call(data, "plan_expires_at")
              ? data.plan_expires_at
              : null;
          return true;
        }
      } catch (error) {
        console.error("Lỗi đồng bộ Auth với Backend:", error);
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.id = (user as any).id;
        token.subscription_plan = (user as any).subscription_plan;
        token.subscription_status = (user as any).subscription_status;
        token.plan_expires_at = (user as any).plan_expires_at ?? null;
      }

      // LUÔN LUÔN lấy thông tin mới nhất từ Backend để đảm bảo Real-time
      if (token.accessToken) {
        try {
          const apiBase = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
          const res = await fetch(`${apiBase}/health-profiles`, {
            headers: { "Authorization": `Bearer ${token.accessToken}` },
            cache: 'no-store'
          });
          const data = await res.json();
          console.log(`[Auth] Fresh Profile for ${token.id}:`, data);
          if (data && data.subscription_plan) {
             token.subscription_plan = data.subscription_plan;
             token.subscription_status = data.subscription_status;
          }
          if (data && Object.prototype.hasOwnProperty.call(data, 'plan_expires_at')) {
            token.plan_expires_at = data.plan_expires_at ?? null;
          }
        } catch (e) {
          // Fallback về dữ liệu cũ trong token nếu fetch lỗi
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).id = token.id;
        (session.user as any).subscription_plan = token.subscription_plan;
        (session.user as any).subscription_status = token.subscription_status;
        (session.user as any).plan_expires_at = token.plan_expires_at ?? null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "your_secret_key",
})

export { handler as GET, handler as POST }

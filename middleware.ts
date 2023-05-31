import { authMiddleware } from "@clerk/nextjs"
export default authMiddleware({
  publicRoutes: ["/", "/((?!static|.*\\..*|_next|favicon.ico).*)", "/api/chat", "/api/query"],
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}

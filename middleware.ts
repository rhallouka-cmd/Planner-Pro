import { auth } from './auth';

export const middleware = auth((req) => {
  // If user is not authenticated and trying to access protected route
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') || 
                     req.nextUrl.pathname.startsWith('/signup');
  
  // If not authenticated and not on auth pages, redirect to login
  if (!req.auth && !isAuthPage) {
    const newUrl = new URL('/login', req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
  
  // If authenticated and on auth pages, redirect to home
  if (req.auth && isAuthPage) {
    const newUrl = new URL('/', req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

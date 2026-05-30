import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * V8 API HARDENING MIDDLEWARE
 * Production-grade Edge Rate Limiting using Upstash Redis.
 */

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let ratelimit: Ratelimit | null = null;

if (redisUrl && redisToken) {
  const redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });

  // Allow 100 requests per 60 seconds per IP
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "60 s"),
    analytics: true,
  });
} else {
  console.warn("WARNING: Upstash Redis keys are missing. API Rate Limiting is currently DISABLED in production.");
}

export async function middleware(req: NextRequest) {
  const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';
  const path = req.nextUrl.pathname;

  // 1. Distributed Rate Limiting
  if (path.startsWith('/api/') && ratelimit) {
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);
    
    if (!success) {
      console.warn(`[Security] Upstash Rate limit exceeded for IP: ${ip} on path ${path}`);
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          } 
        }
      );
    }
  }

  // 2. Strict Security Headers
  const res = NextResponse.next();
  
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

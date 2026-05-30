/**
 * 🔒 AUTH INFRASTRUCTURE CHECK
 * 
 * Scans the codebase for violations of the SENTINEL_OS V.25 Auth Integration Rules.
 * This script is triggered during build to prevent regressions.
 */

const fs = require('fs');
const path = require('path');

const FORBIDDEN_PATTERNS = [
  { 
    regex: /supabase\.auth\.(getSession|getUser)/g, 
    message: "Direct auth status calls are banned. Use useAuth() instead.",
    exceptions: [
      "src/hooks/useAuth.tsx", 
      "src/middleware.ts", 
      "src/utils/supabase/server.ts", 
      "src/app/home/page.tsx",
      "src/actions/profile.ts",
      "src/app/api",
      "src/rpc/modules/profile.ts"
    ]
  },
  {
    regex: /router\.(push|replace)\(['"]\/(home|onboarding)['"]\)/g,
    message: "Manual routing to /home or /onboarding is banned. useAuth handles this automatically.",
    exceptions: ["src/hooks/useAuth.tsx"]
  }
];

const PROTECTED_PAGES = [
  'src/app/home/page.tsx',
  'src/app/chat/page.tsx',
  'src/app/communities/page.tsx',
  'src/app/matches/page.tsx'
];

let violations = 0;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        scanDir(fullPath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // 1. Pattern Check
      FORBIDDEN_PATTERNS.forEach(({ regex, message, exceptions }) => {
        const normalizedPath = fullPath.replace(/\\/g, '/');
        if (exceptions.some(ex => normalizedPath.includes(ex))) return;
        
        if (regex.test(content)) {
          console.error(`\x1b[31m[AUTH VIOLATION]\x1b[0m ${fullPath}: ${message}`);
          violations++;
        }
      });

      // 2. Page Guard Check
      if (PROTECTED_PAGES.some(p => fullPath.includes(p))) {
        if (!content.includes('<ProtectedRoute>')) {
          console.error(`\x1b[31m[GUARD VIOLATION]\x1b[0m ${fullPath}: Page must be wrapped in <ProtectedRoute>.`);
          violations++;
        }
      }
    }
  }
}

console.log("🔍 Running Auth Infrastructure Check...");
scanDir(path.join(__dirname, '../src'));

if (violations > 0) {
  console.error(`\n\x1b[31mFAILED:\x1b[0m Found ${violations} auth violations. Build aborted.`);
  process.exit(1);
} else {
  console.log("\n\x1b[32mPASSED:\x1b[0m Auth infrastructure is secure.");
  process.exit(0);
}

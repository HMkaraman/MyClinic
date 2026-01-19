# MyClinic - Test 2FA Setup Flow End-to-End

## Status: TESTED ✅

**Last tested:** 2026-01-19

---

## Background

The 2FA setup flow fix has been implemented and pushed (commit `61b4871`). The API now correctly returns the `setupToken` in the 403 response.

---

## Prerequisites

Ensure both servers are running:
- **API**: http://localhost:4000 (NestJS)
- **Web**: http://localhost:3000 (Next.js)
- **Redis**: Running for session/token storage
- **Authenticator app** ready (Google Authenticator, Authy, etc.)

---

## API Test Results

### 1. API Response Verification ✅ PASSED

The API correctly returns:
```json
{
  "statusCode": 403,
  "code": "2FA_SETUP_REQUIRED",
  "message": "Two-factor authentication must be enabled for your role.",
  "setupToken": "eyJ..."
}
```

### 2. 2FA Setup Endpoint ✅ PASSED

`POST /api/v1/auth/2fa/setup-required` with setup token returns:
```json
{
  "qrCode": "data:image/png;base64,...",
  "secret": "JJYEGNIGGEFXQSKP"
}
```

### 3. 2FA Verification Endpoint ✅ PASSED

`POST /api/v1/auth/2fa/verify-setup` with setup token and TOTP code returns:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 900,
  "user": {
    "id": "...",
    "email": "admin@myclinic.com",
    "twoFactorEnabled": true
  }
}
```

### 4. Post-Setup Login ✅ PASSED

- Without 2FA code: `{ "requires2FA": true }`
- With valid TOTP code: Returns full auth tokens (status 200)

### 5. Invalid 2FA Code ✅ PASSED

Returns proper error (status 401):
```json
{
  "message": "Invalid 2FA code",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

## Browser Flow Testing (Manual)

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Go to http://localhost:3000/en/auth/login | Login page displays | ⬜ |
| 2 | Enter `admin@myclinic.com` / `Admin123!` and submit | Form submits without error | ⬜ |
| 3 | Wait for redirect | Redirects to `/en/auth/2fa-setup` | ⬜ |
| 4 | Check 2FA setup page | QR code displays with secret key below | ⬜ |
| 5 | Scan QR code with authenticator app | App shows "MyClinic" entry | ⬜ |
| 6 | Click "Continue to verification" | Shows code input form | ⬜ |
| 7 | Enter 6-digit code from authenticator | Form accepts code | ⬜ |
| 8 | Submit verification | Redirects to `/dashboard` | ⬜ |
| 9 | Check user is logged in | Dashboard shows user info | ⬜ |

---

## Edge Cases to Test

| Test | How to Test | Expected | Status |
|------|-------------|----------|--------|
| Invalid 2FA code | Enter wrong 6 digits | Error: "Invalid verification code" | ✅ API tested |
| Expired setup token | Wait 10+ minutes before verifying | Error about expired token | ⬜ |
| Direct access to `/auth/2fa-setup` | Visit without logging in first | Redirect to `/auth/login` | ⬜ |
| Re-login after setup | Logout and login again | Should prompt for 2FA code, not setup | ✅ API tested |

---

## Post-Setup Login Flow

After 2FA is enabled, test the normal 2FA login:

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Logout from dashboard | Redirects to login | ⬜ |
| 2 | Login with `admin@myclinic.com` / `Admin123!` | Shows 2FA code prompt | ✅ API tested |
| 3 | Enter code from authenticator | Successfully logs in | ✅ API tested |

---

## Key Files in the Flow

| Component | File |
|-----------|------|
| Login page | `apps/web/src/app/[locale]/auth/login/page.tsx` |
| 2FA Setup page | `apps/web/src/app/[locale]/auth/2fa-setup/page.tsx` |
| Auth store | `apps/web/src/stores/auth-store.ts` |
| API client | `apps/web/src/lib/api.ts` |
| Auth service | `apps/api/src/modules/auth/auth.service.ts` |
| Auth controller | `apps/api/src/modules/auth/auth.controller.ts` |
| Setup token guard | `apps/api/src/modules/auth/guards/setup-token.guard.ts` |

---

## Utility Commands

### Reset Admin 2FA (for re-testing)
```bash
cd apps/api && node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.update({
  where: { email: 'admin@myclinic.com' },
  data: { twoFactorEnabled: false, twoFactorSecret: null }
}).then(() => console.log('Reset complete')).finally(() => prisma.\$disconnect());
"
```

---

## Summary

| Category | Tests | Passed |
|----------|-------|--------|
| API Tests | 5 | 5 ✅ |
| Browser Tests | 9 | Pending manual testing |
| Edge Cases | 4 | 2 ✅ (API level) |

**API-level testing is complete. Browser flow requires manual testing.**

# Kemet Luxury Travel - Cybersecurity Audit & Security Checklist

This document details the security layers implemented inside Kemet Luxury Travel in compliance with **OWASP Top 10 Standards**.

## 1. Authentication & JWT Session Controls

- [x] **Secure JWT Cookie Storage**: The refresh token is saved inside a secure, `HttpOnly`, `SameSite=Strict` cookie, completely blocking XSS access.
- [x] **Token Rotation**: The `AuthController` rotates the refresh token on every new refresh trigger. Replaying old tokens instantly invalidates all sessions of that user.
- [x] **Argon2 Password Hashing**: Passwords are saved as high-entropy Argon2 hashes, mitigating GPU-parallel brute-force cracking attempts.

---

## 2. Inbound Validation & SQL Injection Defenses

- [x] **Zod Request Enforcers**: All public API request body, parameter, and query variables are safe-parsed by Zod schemas at the router level.
- [x] **SQL Injection Protections**: Raw SQL queries are avoided. The Prisma query engines execute parameterized, prepared SQL statements natively.
- [x] **File Upload Verification**: Vendor brochures and avatar uploads are checked for valid mime-types (JPEG/PNG) and size limits.

---

## 3. Network Protection & Traffic Engineering

- [x] **Helmet Security Headers**: Dynamic Content Security Policy (CSP), HSTS, and X-Content-Type headers are applied on every server response.
- [x] **Rate Throttling**: Standard 15-minute window rate limit of 100 requests per IP address prevents bot scraping and DDoS exhaustion.
- [x] **Admin RBAC Verification**: Secured controller functions verify if `req.user.role === 'ADMIN'` before exposing system monitoring channels.

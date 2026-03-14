# MedConnect Pro

MedConnect Pro is a Next.js 16 patient portal and healthcare interoperability demo built with Supabase, TypeScript, Tailwind CSS, Vitest, and Playwright.

## Features

- Supabase Auth with sign in, registration, forgot password, reset password, and MFA challenge/enrollment
- Protected patient portal with dashboard, profile, records, appointments, lab results, prescriptions, secure messaging, documents, billing, notifications, and consent management
- Real document uploads to Supabase Storage with signed URL access
- FHIR-style API routes for Patient, Condition, Observation, AllergyIntolerance, MedicationRequest, DiagnosticReport, Appointment, Immunization, and DocumentReference
- Audit logging for PHI-heavy views such as records, labs, and documents
- Responsive layout with mobile drawer navigation and route-level loading states

## Local development

```bash
npm install
npm run dev -- --port 3000
```

Open `http://127.0.0.1:3000`.

## Verification

```bash
npm run lint
npm run type-check
npm run test:run
npm run build
npm run test:e2e
```

## Environment variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
```

The current code path does not require the service role key at runtime, but the variable is still reserved for future admin workflows.
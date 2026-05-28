<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

## Project conventions

### After every change

1. Run `npx tsc --noEmit` — fix all errors before committing.
2. Commit with a descriptive message and push to `main`.

### Help page (`src/app/hjalp/page.tsx`)

Keep it in sync with the app. When a feature is added, changed or removed, update the relevant section. When a completely new feature is added, add a new `<section>` with the same structure as the existing ones.

### Database schema (`supabase/schema.sql`)

Every new or changed RPC or table must be reflected in `supabase/schema.sql`. When a new RPC is added, remind the user to run the SQL in the Supabase SQL editor and follow with `NOTIFY pgrst, 'reload schema';`.

### Tests (`src/test/`, Vitest + React Testing Library)

- When adding a new component or a significant behavior change, add or update tests in `src/test/`.
- Test file naming: `ComponentName.test.tsx`.
- Run `npm test` to verify before committing.
- Keep tests focused on user-visible behavior (what the component does, not implementation details).

### Accessibility

- Always include `aria-label`, `role`, `aria-expanded`, and keyboard handlers (`onKeyDown`) on interactive elements.
- Use `role="alert"` on confirmation prompts so screen readers announce them.
- Mark decorative elements with `aria-hidden="true"`.
- **Flag before implementing** any change that adds visible buttons or controls directly on list items (e.g. per-item action buttons) — this affects layout and the user wants to approve that first.

### Dark mode

Every new UI element must include `dark:` Tailwind classes. Reference palette:

- Page background: CSS var `#1c1c1e` (set via `.dark` class on `<html>`)
- Cards / panels: `dark:bg-zinc-800`, borders `dark:border-zinc-700`
- Primary text: `dark:text-[#f0ead6]`
- Body text: `dark:text-[#e8e2d6]`, secondary `dark:text-zinc-400`, muted `dark:text-zinc-500`
- Inputs: `dark:bg-zinc-800 dark:border-zinc-600 dark:text-[#f0ead6] dark:placeholder-zinc-500`
- Blue links/buttons: `dark:text-blue-400`
- Hover backgrounds: `dark:hover:bg-zinc-700`

### Supabase patterns

- All mutations go through `"use server"` actions in `src/app/actions.ts` calling SECURITY DEFINER RPCs.
- `cookies()` is async — always `await` it.
- Browser client hardcodes `flowType: "pkce"`. For `resetPasswordForEmail` use a separate client with `flowType: "implicit"`.
- Always apply the `isDevMode` guard in server pages/components that call Supabase.

### Route protection (`src/proxy.ts`)

Public paths (no auth required): `/login`, `/auth`, `/glomt-losenord`, `/hjalp`, `/bjud-in`. Add new public paths here when needed.

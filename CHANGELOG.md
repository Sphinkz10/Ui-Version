# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Documentation: Created standard `CHANGELOG.md` and `CONTRIBUTING.md` templates.

### Changed
- **Security (SEC-003)**: Prevented timing attacks on Cron metadata syncing by relying on `crypto.timingSafeEqual()`.
- **Compliance (COMP-001)**: Prevented potential PII leak (LGPD/GDPR) by stripping injury data from `console.log()` outputs in `HealthTab.tsx`.
- **Performance (PERF-002)**: Set `sourcemap: false` for production build inside `vite.config.ts`.
- **Performance (PERF-003)**: Adjusted Google Fonts import in `index.html` to leverage `display=swap`, improving initial text render and mitigating FOIT.
- **Accessibility (A11-003)**: Provided "Skip to main content" (`#main-content`) routing inside `App.tsx` layout to assist screen-readers and keyboard-only users.
- **Accessibility (A11-004)**: Tagged icon buttons throughout auth and error boundaries with localized descriptive `aria-label`, specifically in `LoginPage.tsx` and `ErrorBoundary.tsx`.
- **Quality (QW-003)**: Connected `<FormCenter>` submission hooks to React's Context store, deprecating hardcoded string fallbacks in `useFormSubmissions.ts`.

### Fixed
- Minor TS compiler parsing issue tied to un-escaped regex patterns within JSDoc comments.

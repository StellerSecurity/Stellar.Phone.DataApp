# 2026 framework upgrade

This project has been aligned to Angular 22, Ionic 9 and Capacitor 8.5.

## Required local toolchain

- Node.js: 24 LTS recommended (Angular 22 also supports Node 22.22.3+ and Node 26+)
- Xcode: 26.0+ for Capacitor 8 iOS
- iOS deployment target: 15.0+
- Android Studio: Otter 2025.2.1+
- Android compile/target SDK: 36
- Android minimum SDK: 24

## First install after upgrade

The old package-lock.json was intentionally removed because it encoded Angular 17 / Capacitor 5 packages. Run `npm install` once to generate a fresh lockfile, commit it, then use `npm ci` on subsequent installs and in CI.

## Build

- Web + SSR: `npm run build`
- Run SSR: `npm run serve:ssr`
- Native web bundle: `npm run build:mobile`
- Sync iOS: `npm run cap:sync:ios`
- Sync Android: `npm run cap:sync:android`

The existing CryptoJS 4.2.0 encryption format is deliberately retained so previously-created Stellar Secret links remain decryptable.


## Angular 22 / Ionic 9 code migration

- Root bootstrap migrated from `AppModule` to `bootstrapApplication`.
- `IonicModule` removed; Ionic components/providers now use `@ionic/angular`.
- ngx-translate v18 migrated from `TranslateModule`/`setDefaultLang` to provider-based configuration, `TranslatePipe`, and `setFallbackLang`.
- SSR migrated from deprecated `CommonEngine` to `AngularNodeAppEngine` and server routes.
- Angular build/serve/test targets migrated to `@angular/build`.
- Dynamic secret routes use `RenderMode.Server`; build-time prerendering is disabled.
- Existing CryptoJS payload format is intentionally unchanged for old secret-link compatibility.

## Angular 22 browser target

This project intentionally ships a project-local `.browserslistrc` with:

```text
baseline widely available on 2026-05-07
```

That is Angular 22's official Baseline date. Do not broaden this to legacy
browser ranges such as `Chrome >= 79`, `Safari >= 14`, or `iOS >= 14`.
`@angular/build` currently uses esbuild 0.28, which intentionally cannot lower
destructuring for those legacy targets and will fail the build. A local config
also prevents an old Browserslist file in a parent directory from affecting
this project.

If your shell has a `BROWSERSLIST` environment variable set, unset it before
running the Angular build because it can override the project configuration.

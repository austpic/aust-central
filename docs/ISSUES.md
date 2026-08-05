# Issues

An audit of `aust_track` (Flutter app at repo root `aust-central/`). Every issue is grounded in a specific file and line. Severity legend: **P0** will break production / lose data; **P1** is a significant security or functional issue; **P2** is a maintainability / code-quality issue; **P3** is cosmetic or nice-to-have.

---

## P0 — Critical (fix before shipping)

### 1. Release APK has no `INTERNET` permission → Firebase Auth will silently fail

`android/app/src/main/AndroidManifest.xml:1-4` only declares `android.permission.CAMERA`. `INTERNET` is only declared in the debug and profile manifests (`android/app/src/debug/AndroidManifest.xml:6`, `android/app/src/profile/AndroidManifest.xml:6`).

A signed release build (`flutter build apk --release`) will install an APK without `INTERNET`, so every `_auth.signInWithEmailAndPassword(...)` call will fail with a network error. **No release-quality app can ship from this state.**

Fix: add `<uses-permission android:name="android.permission.INTERNET"/>` to `android/app/src/main/AndroidManifest.xml` (and drop it from the per-flavor files, which become redundant).

### 2. Release builds are signed with the debug keystore

`android/app/build.gradle.kts:30-34`:

```kotlin
buildTypes {
    release {
        signingConfig = signingConfigs.getByName("debug")
    }
}
```

The debug keystore is universally known and not secret. Any release APK signed with it is trivially impersonatable by anyone — the Play Store rejects it outright, and sideloaded "releases" are not really authentic. A real `signingConfig` with a proper upload key is required before any release.

### 3. `applicationId` is the placeholder `com.example.aust_track`

`android/app/build.gradle.kts:9,23` and `android/app/src/main/kotlin/com/example/aust_track/MainActivity.kt:1` all still use the `com.example.*` namespace. Google Play rejects `com.example.*` and never lets you publish. Even before that, it collides with any other Flutter sample that ships with the same id, breaking parallel installs.

---

## P1 — Significant security or functional

### 4. Plaintext password stored in `SharedPreferences`

`lib/login_page.dart:34-35, 64-65` — when "Remember Me" is checked, the raw password is written to disk via `prefs.setString('saved_password', password)`. There is no encryption (Keychain / Keystore / `flutter_secure_storage`), no expiry, and the value is also readable by any process running as the same UID on rooted devices. `AuthService.signIn` itself also stores nothing about the password post-login, so the entire burden is on `SharedPreferences` + a key the attacker only needs `dumpsys` to find.

At minimum: don't store the password; store a Firebase ID token (or refresh token) with an expiry, and gate "Remember Me" on token validity.

### 5. `userName` in the dashboard is hardcoded

`lib/screens/home_page.dart:74`: `const userName = 'Farhana';`. The greeting `"Good Morning, Farhana"` is shown to every signed-in user regardless of who they actually are. This is the user-facing label; once data starts flowing, this needs to come from `AuthService.currentUser?.displayName` (already populated by `AuthService.register` via `updateDisplayName`).

### 6. No `authStateChanges` observer — every cold start forces a re-login

`lib/main.dart:17-25` builds a `MaterialApp` whose `home` is `SplashScreen` unconditionally. There is no `StreamBuilder<User?>` wrapping the home, so a user who signs in, kills the app, and relaunches is dropped back at the splash → welcome → login flow even though `FirebaseAuth.instance.currentUser` is still valid. This is both a UX regression and a correctness gap (the "logged in" state is never persisted by the app — only "Remember Me" creds are).

`AuthService.authStateChanges` already exists (`lib/services/auth_service.dart:10`); it just isn't wired up.

### 7. iOS app cannot boot — `GoogleService-Info.plist` missing

`ios/Runner/GoogleService-Info.plist` does not exist. `lib/main.dart:8` calls `Firebase.initializeApp()` with no `FirebaseOptions`, so on iOS the call throws at startup. `ios/Runner/Info.plist:9-10` shows `CFBundleDisplayName` is `"Aust Track"`, which suggests iOS is meant to ship but the config was never added. Don't expect to be able to build iOS.

### 8. Web build will crash — no Firebase web config

`pubspec.lock` resolves `firebase_auth_web 6.2.6` and `firebase_core_web 3.10.0`, so Flutter is happy to build for the web target. But there is no injected web Firebase config in `web/index.html`, so `Firebase.initializeApp()` will throw at runtime. Either delete the web platform folder or add real config.

---

## P2 — Code quality / maintainability

### 9. Three different "brand greens" with no source of truth

- `lib/theme/app_colors.dart:8` defines `darkGreen = Color(0xFF1B4332)` (and mint tokens).
- `lib/splash_screen.dart:36`, `lib/welcome_screen.dart:17,35,42,51`, `lib/login_page.dart:104,121,133,153,174,180,188,199,232`, `lib/register_page.dart:76,93,108,172,199` all hardcode `Color(0xff407362)`, which is a **different green**.
- `lib/widgets/custom_cards.dart:203` hardcodes a third green gradient `[Color(0xFF2C8E6C), Color(0xFF339974)]` for the notice board.

An agent touching one file in good faith will diverge further. Migrate the pre-login flow to `AppColors.darkGreen` (or pick one of the other two greens as the canonical brand color and add it to `app_colors.dart`).

### 10. `WaveClipper` duplicated across three files

`lib/welcome_screen.dart:73-100`, `lib/login_page.dart:252-271`, `lib/register_page.dart:219-238`. The latter two are byte-for-byte identical (the welcome version has different curve geometry). Extract once into `lib/widgets/wave_clipper.dart`.

### 11. `_showSnackBar` and form-validation logic duplicated in login/register

`lib/login_page.dart:100-108` and `lib/register_page.dart:72-80` define the same `_showSnackBar(String message)` method. The trim / empty-check / loading-state scaffolding (`_isLoading`, `_emailController.dispose()`, mounted checks) is also duplicated. Worth extracting into a small `BaseAuthFormState` mixin or a helper widget.

### 12. 10 stub screen files hardcode `PlaceholderScreen`-style bodies by hand

`lib/screens/blood_bank_screen.dart`, `book_exchange_screen.dart`, `cgpa_calculator_screen.dart`, `class_reminder_screen.dart`, `lab_report_screen.dart`, `notice_board_screen.dart`, `notifications_screen.dart`, `profile_screen.dart`, `todo_list_screen.dart`, `transportation_screen.dart` all return ~20-line `Scaffold(appBar: AppBar(title: Text(...)), body: Center(child: Text('This is the real X page!')))`. A reusable `PlaceholderScreen` widget already exists at `lib/screens/placeholder_screen.dart` (1604 bytes, with the proper scaffold + icon + "coming soon" copy). These ten files should be one-liners calling it, or be removed.

### 13. Four declared dependencies are unused

`pubspec.yaml` declares: `cupertino_icons`, `qr_flutter`, `mobile_scanner`, `google_fonts`, `dropdown_search`, plus `firebase_auth`, `firebase_core`, `shared_preferences`. `grep` shows **only** `flutter_svg` is actually imported (`lib/screens/home_page.dart:2`); `qr_flutter`, `mobile_scanner`, `google_fonts`, `dropdown_search` are not referenced anywhere in `lib/`. `mobile_scanner` also forces the `CAMERA` permission into the manifest for no current consumer.

Also: `firebase-analytics` is declared at `android/app/build.gradle.kts:43` but the corresponding `firebase_analytics` Dart package is not in `pubspec.yaml`, so nothing calls it.

Either wire them up or drop them — leaving unused deps bloats the binary and confuses new contributors.

### 14. No password strength / email-shape validation client-side

`lib/register_page.dart:31-50` only checks length >= 6 and that the two password fields match. `lib/login_page.dart:47-54` only checks empty strings. Firebase will reject malformed emails server-side, but doing it client-side gives a faster / clearer error. More importantly, allowing any 6-character password (no digits / case / symbol requirement) is a weak policy for an academic-records app.

### 15. Android app label is `aust_track`, iOS app label is `Aust Track`

`android/app/src/main/AndroidManifest.xml:7`: `android:label="aust_track"`. `ios/Runner/Info.plist:9-10`: `CFBundleDisplayName = "Aust Track"`. Pick one and apply to both.

### 16. Hardcoded dummy data on the dashboard

`lib/screens/home_page.dart:131-258`: every card's chip text is a literal string — `'3 due today'`, `'Next Class: 02:30 pm'`, `'Current: 3.72'`, `'1 Draft Saved'`, `'2 requests nearby'`, `'14 listings'`, the notice board message `'Mid-term routine released for section B.'`. None of this is wired to any data source. Looks finished in a screenshot but is meaningless at runtime.

---

## P3 — Cosmetic / nice-to-have

### 17. `test/widget_test.dart` is the unmodified Flutter scaffold counter test

`test/widget_test.dart:14-29` calls `tester.pumpWidget(const MyApp())` (which expects a counter at text `'0'` and an `Icons.add` button — neither exists) and then calls `find.text('0')`, `find.byIcon(Icons.add)`, etc. `flutter test` will fail on the first `expect`. Treat any red `flutter test` output as pre-existing noise, not a regression you caused.

### 18. `README.md` is the boilerplate template

`README.md:1-3`: title `# aust_track`, body `"A new Flutter project."`, then a `Learn Flutter` link dump. Doesn't mention AUST, Firebase, what screens exist, or how to run it.

### 19. `pubspec.yaml` description is also the template

`pubspec.yaml:2`: `description: "A new Flutter project."`.

### 20. Dead commented code in `splash_screen.dart`

`lib/splash_screen.dart:44-52` has a 9-line commented-out `Text("AUSTrack", ...)` block. Remove it.

### 21. Stale "adjust the relative path" comments

`lib/login_page.dart:1` and `lib/register_page.dart:1`:

```dart
import 'screens/home_page.dart'; // adjust the relative path to wherever you place button_page's home_page.dart
```

The path is correct (`screens/home_page.dart` exists), so the comments are wrong. Either rewrite as a clean `package:aust_track/screens/home_page.dart` import or drop the comment.

### 22. Icon-only buttons lack `Semantics` / `Tooltip`

`lib/screens/home_page.dart:103-117` — the notification `InkWell` wraps a 50×50 SVG with no `tooltip`, no `Semantics(label: ...)`. Same story for the user-profile card's leading icon. Screen-reader users get nothing.

### 23. `AuthService` is not injectable for testing

`lib/services/auth_service.dart:4`: `final FirebaseAuth _auth = FirebaseAuth.instance;` — `FirebaseAuth.instance` is read at construction time, and `AuthService` is instantiated directly in `LoginScreen` / `RegisterPage` (`new AuthService()`). There is no constructor injection, no interface, no factory. Writing a unit test for `_login()` requires mocking the entire Firebase plugin.

### 24. No CI / no GitHub workflows

`.github/` does not exist. There is no `flutter analyze` / `flutter test` gate on PRs. Combined with #17, broken tests can land silently.

### 25. `google-services.json` is tracked in git

`android/app/google-services.json` is committed. This is technically fine for Firebase (the API key inside is not a secret per Firebase's docs), but it does bake in the production project id (`austrack-d8397`) and a non-rotation-resistant API key. If the project ever needs dev/staging/prod separation, this file will need to come out of the repo and be injected per-build.

### 26. Hardcoded 3-second splash timer

`lib/splash_screen.dart:21`: `Timer(Duration(seconds: 3), ...)`. Not user-configurable, not aware of network warm-up, can't be skipped. For a cold-start, 3 s is also a long time to gate behind a logo.

### 27. "Hello AUSTIAN!!" greeting

`lib/welcome_screen.dart:41` — informal / typo-adjacent. "Hello AUSTian!!" or "Hello, AUSTian" would read better; either way the capitalization of the university name should be consistent with how the rest of the app refers to it.

### 28. `README.md` vs AGENTS.md duplication / drift

`AGENTS.md` now documents the project accurately. `README.md` is still the default template. New contributors reading the README first will get a misleading picture of what the project is.

---

## Already correct (kept for confidence)

These were checked and are fine; left here so a future reader knows they don't need to re-check.

- `android/local.properties` is correctly gitignored via `android/.gitignore:6` (`/local.properties`). It is **not** tracked in git. (Earlier notes in some agents said otherwise — they were wrong.)
- `google-services.json` `project_id` matches the dep set in `android/build.gradle.kts` (`com.google.gms.google-services` v4.4.4) and `android/settings.gradle.kts` (AGP 8.11.1, Kotlin 2.2.20).
- `MaterialApp` in `main.dart` does declare `fontFamily: 'SpaceGrotesk'` and the five `.ttf` weights are present in `assets/fonts/` and registered in `pubspec.yaml`, so the bundled font actually loads.
- All five asset folders referenced by `pubspec.yaml` (`assets/images/`, `assets/icons/`, `assets/fonts/`) exist and contain the files the code uses (`assets/icons/notification.svg`, `assets/icons/profile_icon.svg`, `assets/images/app-logo.png`, `assets/images/bus_expanded.png`).

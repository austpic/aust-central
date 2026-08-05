# Dashboard Wiring Plan

Status: approved, in execution.

## Decisions recorded
- **Transportation**: recover all 4 files
- **User Profile**: drop the card entirely (remove from dashboard)
- **To-do List**: recover as static mock
- **Class Reminder**: static mock (salvage `Routine` widget from old `home_screen.dart`)
- **Lost & Found**: re-add to dashboard + wire its search/filter
- **QR**: re-add as card, collapsed to one scanner screen
- **Notice Board / CGPA / Lab Report / Blood Bank / Book Exchange / Notifications**: leave as stubs

## Universal color re-token map (apply to every recovered file)

| Old literal | Replace with |
|---|---|
| `0xff407362` / `0xFF3E6F63` / `0xFF3E6F5E` / `0xFF45735D` | `AppColors.darkGreen` |
| `0xFF5A8C7E` (button fills) | `AppColors.darkGreen` |
| `0xFF67A185` (accent pills) | `AppColors.mintChip` |
| `0xFFB7CED3` (page bg) | `AppColors.scaffoldBackground` |
| `0xFFF0F7F5` / `0XFFC9F2D9` (pale green boxes) | `AppColors.mintSection` |
| `0xff2D4F44` / `Colors.black87` (titles) | `AppColors.textDark` |
| `Colors.white70` / `Colors.white60` (subtitles) | `AppColors.subtitleGrey` |

Every recovered file must start with `import '../theme/app_colors.dart';`.

## Pre-flight
1. Work on a branch: `feature/wire-dashboard-sections`
2. `flutter pub get` then `flutter analyze` — confirm clean baseline before changes.

## Phase 1 — Transportation (recover 4-file flow)

### Step 1.1 — Recover from git
```bash
git show 4cb9e1d:lib/bus_page.dart            > lib/screens/bus_page.dart
git show 4cb9e1d:lib/schedule_page.dart       > lib/screens/schedule_page.dart
git show 4cb9e1d:lib/bus_selection_page.dart  > lib/screens/bus_selection_page.dart
git show 4cb9e1d:lib/receipt_page.dart        > lib/screens/receipt_page.dart
```

### Step 1.2 — Fix cross-imports
- `bus_page.dart`: `import 'schedule_page.dart';` ✓ (same folder)
- `schedule_page.dart`: `import 'bus_selection_page.dart';` ✓
- `bus_selection_page.dart`: `import 'receipt_page.dart';` ✓

### Step 1.3 — Delete the Transportation stub
Remove `lib/screens/transportation_screen.dart` (replaced by `BusPage`).

### Step 1.4 — Color re-token
Apply the universal map to all 4 files.

### Step 1.5 — Drop the duplicate hero image in `bus_page.dart`
The dashboard's `TransportationCard` already shows `bus_expanded.png` with parallax. Remove the top `Image.asset('assets/images/bus_expanded.png', ...)` block from `BusPage`.

### Step 1.6 — Simplify AppBars
Replace each old custom `PreferredSize(...)` AppBar with plain `AppBar(title: Text(...), backgroundColor: AppColors.scaffoldBackground, ...)`.

### Step 1.7 — Wire the dashboard card
In `lib/screens/home_page.dart` around line 155, change the `TransportationCard.onTap` push target from `TransportationScreen()` to `BusPage()`. Add `import 'bus_page.dart';` to `home_page.dart`.

**Verify:** `flutter analyze` clean; tap Transportation card → BusPage → pick From/To → SchedulePage → pick time → BusSelectionPage → Select → ReceiptPage.

## Phase 2 — To-do List (recover as static mock)

### Step 2.1 — Recover
```bash
git show 4cb9e1d:lib/missing_notes_page.dart > lib/screens/todo_list_screen.dart
```
Rename `MissingNotesPage` → `TodoListScreen`.

### Step 2.2 — Color re-token
`0xFF3E6F5E` and `0xff407362` → `AppColors.darkGreen`; grey `shade200/300` → `mintChip`/`scaffoldBackground`.

### Step 2.3 — Drop the logo-leading AppBar

### Step 2.4 — Add a `// TODO:` comment above `home_page.dart:132`
Note `'3 due today'` is fabricated and the page is a static mock.

**Verify:** tap To-do List card → see the notes list with date strip.

## Phase 3 — Class Reminder (static mock, salvage Routine widget)

### Step 3.1 — Extract the `Routine` widget from old home
The class lives at `4cb9e1d:lib/home_screen.dart` lines 693-810.

Create `lib/widgets/routine_card.dart` containing the `Routine` widget, re-tokened to `AppColors.*`.

### Step 3.2 — Build the static mock in `lib/screens/class_reminder_screen.dart`
Hardcode a list of ~5 classes salvaged from old `home_screen.dart:627-683` (EEE Theory, EEE Lab, DLD Lab, HUM Theory, Math Quiz). Render a `ListView` of `Routine(...)` cards. Top of screen: a "Next Class" hero card.

### Step 3.3 — Color re-token the salvaged `Routine` widget and the new screen.

### Step 3.4 — Add TODO that no persistence exists.

**Verify:** tap Class Reminder card → see today's routine list.

## Phase 4 — Lost & Found (re-add card + wire search/filter)

### Step 4.1 — Recover
```bash
git show 4cb9e1d:lib/lost_found_screen.dart > lib/screens/lost_found_screen.dart
```
Rename `LostFoundPage` → `LostFoundScreen`.

### Step 4.2 — Color re-token
`0xff407362` → `darkGreen`; `0XFFC9F2D9` → `mintChip`; `0xff2D4F44` → `textDark`.

### Step 4.3 — Wire the search + filter (currently fake)
- Convert the 5 hardcoded `const ItemCard(...)` literals into a `List<Map<String,String>> _allItems` field.
- Add `String _search = ''` and `String _selectedCategory = 'All'` state fields.
- Implement filter function.
- Wire search `onChanged` and category `ChoiceChip.onSelected` to `setState`.
- Render `_filtered.map(...)` instead of the `const` list.

### Step 4.4 — Add a `category` field to each item map.

### Step 4.5 — Add the dashboard card
In Community section after Blood Bank + Book Exchange row, add a second row with Lost & Found + QR Scanner cards.

**Verify:** tap Lost & Found card → list shows; type in search → list filters; tap a category chip → list filters.

## Phase 5 — QR Scanner (re-add, collapsed to one screen)

### Step 5.1 — Recover only the scanner
```bash
git show 4cb9e1d:lib/scan_qr_code_screen.dart > lib/screens/scan_qr_code_screen.dart
```
Do NOT recover `qr_screen.dart`.

### Step 5.2 — Color re-token
`0xff407362` → `darkGreen`.

### Step 5.3 — Verify `mobile_scanner` dep is in `pubspec.yaml:14` (it is).

### Step 5.4 — Card was already added in Step 4.5.

**Verify:** tap QR Scanner card → camera opens → scan a QR code → `rawValue` displays.

## Phase 6 — Remove the User Profile card

### Step 6.1 — In `lib/screens/home_page.dart`, delete the `DashboardRowCard` for User Profile (approximately lines 208-228).

### Step 6.2 — Remove `import 'profile_screen.dart';` from `home_page.dart`.

### Step 6.3 — Leave `lib/screens/profile_screen.dart` as-is or delete it.

**Verify:** dashboard renders; Academic section shows CGPA + Lab Report only; no Profile card.

## Phase 7 — Final verification

1. `flutter analyze` — must be clean.
2. `flutter run` (Android) — walk every card.
3. Confirm no green-color divergence: every screen should use `AppColors.*` tokens.

## Non-goals
- 6 greenfield stubs stay as stubs.
- No backend / Firestore / data persistence is added.
- `qr_flutter` stays declared-but-unused.
- Auth-state observer not addressed.
- Hardcoded data stays hardcoded (flagged with TODOs).

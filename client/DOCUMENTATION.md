# AUST Central — Full App Documentation

> React + TypeScript + Tailwind CSS v4 rebuild of the Flutter app `aust-central`.
> This document describes **every feature and UI detail** so it can be used as a spec
> for a redesigned, higher-quality UI that still matches the current theme.

---

## 1. Overview

AUST Central is a **student portal** for Ahsanullah University of Science & Technology (AUST). It bundles:

| Area | What it does |
|------|--------------|
| Auth | Splash → Welcome → Login/Register (mock, no backend) |
| Productivity | To-do list, Class reminders, Notice board, Notifications |
| Transport | Pick a route → pick a time → pick a bus → booking receipt |
| Academic | CGPA calculator + What-If simulator + History timeline, Lab-report cover page maker |
| Community | Blood bank + donor status + blood request form, Book exchange marketplace + chat, Lost & found |
| Profile | User profile + sign out |

All data is **mock/static** (no real Firebase). State is local React state + React Context.

---

## 2. Tech Stack & Architecture

- **Build**: Vite 8 + TypeScript + React 18 + React Router 7
- **Styling**: Tailwind CSS v4 (CSS-first `@theme` config), Space Grotesk font
- **Icons**: `lucide-react`
- **Pattern**: strict MVVM, one ViewModel hook per View

```
src/
  App.tsx                  Router + provider wiring
  main.tsx                 ReactDOM root
  index.css                Design tokens (colors, shadows, font)
  views/     (28)          Presentational screens (JSX only)
  viewmodels/ (28 + 2 ctx) useXViewModel() hooks + CgpaContext, BloodBankContext
  models/    (11)          TypeScript interfaces + value types
  data/      (10)          Static/mock content
  utils/     (2)           Pure helpers (blood eligibility, date formatting)
  components/ (31)         Reusable UI widgets
```

**Key architectural facts**

- Each View imports exactly one `useXViewModel()` hook and delegates all state/actions.
- `CgpaProvider` wraps `/cgpa`, `/cgpa/whatif`, `/cgpa/history` — shared calculator state.
- `BloodBankProvider` wraps `/blood-bank`, `/blood-bank/request` — the request form feeds the list.
- Dashboard screens render inside `AppLayout` (fixed sidebar on desktop, top bar + bottom nav on mobile).
- Sub-pages navigate back with `history.back()`; cross-feature navigation uses router links.

---

## 3. Design System

### 3.1 Color palette (all hex values — from `src/index.css`)

| Token | Hex | Used for |
|-------|-----|----------|
| `scaffold` | `#e9edea` | App background |
| `darkgreen` / `textdark` | `#1b4332` | Headings, primary dark text, solid buttons, transport cards |
| `primary` | `#407362` | Brand green — main buttons, auth wave header, to-do header, CGPA gradient |
| `secondary` | `#579d83` | Secondary gradient stop |
| `mintchip` | `#c2ded0` | Chips, badges, icon swatches, avatar fills |
| `mintsection` | `#c9e1d5` | Section backgrounds, receipt footer, chat banner |
| `lightaccent` | `#beeddc` | Accent fills, toggle "on" track |
| `subtlegrey` | `#6b8578` | Secondary text, muted labels |
| `danger` | `#b5392b` | Destructive actions, critical badges |
| `success` | `#2f8f6a` | Task "today" color, eligibility green |
| `warning` | `#d89030` | Urgent badges, star rating |
| `bloodsoft` | `#e9a8a8` | Soft red surface |
| `ink` | `#1c1c1c` | Book-exchange text |
| `cgpadark` | `#1b1b1b` | CGPA heading text |
| `cgpamedium` | `#4a4a4a` | CGPA secondary text |
| `cgpalight` | `#7a7a7a` | CGPA muted text/placeholders |
| `border` | `#b5b5b5` | Neutral borders, toggle "off" track |
| `cgpasuccess` | `#2e7d5b` | Achievable/positive stat colors |
| `cgpaerror` | `#d64545` | Form error text |
| `cgpawarning` | `#e8a838` | Warning stat accents |
| `noticestart` / `noticeend` | `#2c8e6c` / `#339974` | Pinned-notice gradient |
| `labprimary` | `#407362` | Lab report accents |
| `labsecondary` | `#beeddc` | To-do progress fill |
| `labgradlight` | `#8cd4b8` | Lab section divider gradient |
| `labtext` | `#2c3e35` | Lab form labels/text |
| `labbackground` | `#f4f7f6` | Lab report page background |
| `labgrey` | `#616161` | Muted text |
| `amberwash` | `#fce7cf` | Urgent badge bg |
| `redwash` | `#f6d6d2` | Critical badge bg |

### 3.2 Recurring visual language

- **Card radii**: `12–14px` (small inputs/chips), `16–20px` (cards), `22–24px` (hero/header cards), `28–30px` (pill buttons)
- **Chip buttons**: rounded-full, active = `bg-darkgreen text-white`, inactive = `bg-mintchip text-textdark`
- **Primary solid buttons**: rounded `14px`–`30px`, `bg-primary` (or `bg-darkgreen`), bold white text, height `48–55px`
- **Header cards / heroes**: `linear-gradient(135deg, #407362 0%, #579d83 100%)` with white text; used on Class Reminder, CGPA screens, What-If, History
- **Solid darkgreen cards**: Transport location card, Bus selection, Receipt header, Book Exchange hero
- **Cards**: white background, subtle shadow `0 4px 12px rgba(0,0,0,0.1)`
- **Typography**: Space Grotesk everywhere; view headers `18–28px` bold/extrabold; body `13–16px`
- **Icons**: lucide, `18–28px`, often inside `40px` mint-chip rounded `10–12px` swatches

---

## 4. Navigation & Routing

### 4.1 Route map

| Path | Screen |
|------|--------|
| `/splash` | Splash (3s → `/welcome`) |
| `/welcome` | Welcome |
| `/login` | Login |
| `/register` | Register |
| `/` | redirect → `/home` |
| `/home` | Dashboard |
| `/todo` | To-do List |
| `/class-reminder` | Class Reminder |
| `/transport` | Bus (choose from/to) |
| `/transport/schedule` | Choose Schedule |
| `/transport/buses` | Available Buses |
| `/transport/receipt` | Booking Receipt |
| `/notice-board` | Notice Board |
| `/notifications` | Notifications (stub) |
| `/lab-report` | Cover Page Maker |
| `/profile` | User Profile |
| `/book-exchange` | Book Exchange |
| `/book-exchange/post` | Post a Book |
| `/book-exchange/notifications` | Book Notifications |
| `/book-exchange/profile` | Book Profile |
| `/book-exchange/seller/:id` | Seller Profile |
| `/book-exchange/chat/:id` | In-App Chat |
| `/book-exchange/:id` | Listing Detail |
| `/lost-found` | Lost & Found |
| `/cgpa` | CGPA Calculator |
| `/cgpa/whatif` | What-If Calculator |
| `/cgpa/history` | CGPA History |
| `/blood-bank` | Blood Bank |
| `/blood-bank/request` | Send Blood Request |

### 4.2 Transport flow state (router state = source of truth)

1. **BusView** stores `selectedFrom`, `selectedTo`
2. **ScheduleView** receives `{fromLocation, toLocation}` → user picks a time
3. **BusSelectionView** receives `+ selectedTime` → user picks a bus (or views route/contact)
4. **ReceiptView** receives `{busName, driverNumber, route[]}` → renders the ticket

### 4.3 Shell (AppLayout)

- **Desktop (≥lg)**: fixed left sidebar `w-[260px]`, white, brand block "AUST Central / Student Portal", 11 nav items (active = darkgreen pill, inactive = hover mint)
- **Top bar**: sticky, `bg-scaffold/95` + blur, shows the page title
- **Mobile (<lg)**: `BottomNav` — fixed bottom bar, horizontally scrollable icon+label items
- Content wrapper: `max-w-4xl` centered, `px-5 py-6`

Sidebar items (11): Home, To-do List, Class Reminder, Transport, Notice Board, CGPA Calculator, Lab Report, Blood Bank, Book Exchange, Lost & Found, User Profile.

---

## 5. Screens & Features

### 5.1 Splash (`/splash`)
- Full-screen `bg-primary`, centered app logo (`app-logo.png`, height 150px)
- Auto-navigates to `/welcome` after **3 seconds**

### 5.2 Welcome (`/welcome`)
- Green **wave header** (420px tall, custom SVG bezier `WaveHeader`)
- Large "Welcome" (40px black), "Hello AUSTIAN!!" (20px) in brand green
- Bottom-right **circular FAB** (64px, `ArrowRight` icon) → `/login`

### 5.3 Login (`/login`)
- Wave header (220px), title "Sign in" (30px bold)
- **Email** field (hint `demo@email.com`), **Password** field (obscured)
- **Remember Me** checkbox + **Forgot Password?** link
- Full-width **Login** button (55px, radius 15, green); spinner while loading
- Validation: "Please fill in all fields."
- Forgot password: requires email → toast "Password reset email sent to \<email>."
- Bottom link: "Don't have an Account? **Registration**" → `/register`
- Success → `/home` (replace)

### 5.4 Register (`/register`)
- Wave header (170px), title "Register" (30px black)
- Fields: **Full Name**, **Email**, **Password**, **Confirm Password**
- Validations (toasts): empty → "Please fill in all fields."; mismatch → "Passwords do not match."; <6 chars → "Password must be at least 6 characters."
- Success toast "Account created successfully!" → `/home`
- Bottom link: "Already have an account? **Login**"

### 5.5 Home / Dashboard (`/home`)
- **Top bar**: live date/time (e.g. "Friday, 6:24 pm") + greeting ("Morning/Afternoon/Evening/Night, Rahman") + notification bell (SVG, 50px)
- **Trio row** (responsive): two stacked centered cards + transport card side-by-side:
  - **To-do List** card, chip "3 due today" → `/todo`
  - **Class Reminder** card, chip "Next Class: 02:30 pm" → `/class-reminder`
  - **Transport** card: bus image (`bus_expanded.png`) that **pans horizontally on page scroll** (dx clamped −40→0), title "Transport", fake search bar "Where to go" → `/transport`
- **Notice Board** card (green gradient, "Mid-term routine released for section B.") → `/notice-board`
- **Academic section**: grid with
  - **CGPA Calculator** icon card, chip "Current: 3.72" → `/cgpa`
  - **Lab Report Generator** icon card, chip "1 Draft Saved" → `/lab-report`
  - **User Profile** row card, trailing "View details" → `/profile`
- **Community section**:
  - **Blood Bank** icon card, chip "2 requests nearby" → `/blood-bank`
  - **Book Exchange** icon card, chip "14 listings" → `/book-exchange`
  - **Lost & Found** row card, trailing "5 items" → `/lost-found`

Icon cards = mint chip `40px` swatch + bold title + green chip text.

### 5.6 To-do List (`/todo`)
- **Header** (darkgreen rounded card): back arrow, "To-Do List" (26px bold), delete-all trash icon; subtitle "X of Y completed"; **progress bar** (lightaccent fill on white/30 track)
- **Filter chips** (pills): All / Today / Later / Completed
- **Task tiles** (white cards, soft green shadow):
  - Circular checkbox (2px border; filled success green + white check when done)
  - Title (strikethrough + faded when done), optional note (2-line clamp), category chip (Today = success green, Later = primary green), optional due-date chip
  - Delete (trash, danger) icon per tile
- **Add Task** pill button (green, `+` made from rotated check icon) — centered
- **Add/Edit dialog** (sheet):
  - Title (required), Note (optional)
  - **When?** segmented: Today / Later
  - **Set due date** row (calendar icon; tap = today; clearable)
  - Buttons: Delete (only when editing, danger outline) / Add Task or Save Changes (green)
- **Confirm dialogs**: "Delete task?" and "Clear all tasks?" (danger)
- **Empty states**: contextual messages per filter (e.g. "All done! 🎉", "Your list is empty. Tap Add Task to get started!")
- Filters: today/later by category, completed by `isDone`

### 5.7 Class Reminder (`/class-reminder`)
- **Header** (green gradient card): alarm icon + "Reminder Settings" + "X of Y Active"
- **Add Course** outline button (plus icon)
- **Reminder cards** (white, colored border/shadow by active state):
  - Bell icon in tinted square, course name, "Weekday • Class time"
  - **Toggle switch** (on = lightaccent track + green thumb)
  - When active: "Remind before" row with a `N min` **select** (5/10/15/30)
  - Assessment reminders listed under a divider (type + date time)
- **Save Settings** button (green, full width) → green success banner "Settings saved successfully!"
- **Add Course dialog**: Course Name (required), Weekday select (Sat–Fri), Class Time (time input)
- **Assessment dialog** (tap a card): Assessment Type segmented (Quiz / Mid / Lab Mid), Date + Time inputs, Save Reminder

### 5.8 Notice Board (`/notice-board`)
- Search bar (white, rounded 15px, magnifier icon)
- **Category filter chips** with icons: All / Academic / Exam / Event / General
- **Notice cards**:
  - **Pinned**: full-bleed green gradient card (`#2c8e6c → #339974`), "PINNED" white pill + date, bold title, body; body truncated at 160 chars with expand
  - **Normal**: white card, category pill (mint), date, title, body truncated at 110 chars; "Read more" chevron footer; tap to expand/collapse
- Search filters by title/body; empty state via `EmptyState`

### 5.9 Notifications (`/notifications`)
- Stub: mint rounded square with bell, "Notifications" title, one-line message from the ViewModel

### 5.10 Transport flow

**BusView `/transport`**
- Back arrow + "Transport" title
- **Darkgreen location card**: two pins joined by a vertical dashed line; **From / To** pill selects (mint bg, white text, chevron) over the 12 bus stops: Mirpur, Ansar Camp, Technical, Kalyanpur, Shyamoli, Ring Road, Shia Mashjid, Mohammadpur, Asadgate, Manik Mia, Khamar Bari, Farmgate
- Select both then proceed (next step automatically)

**ScheduleView `/transport/schedule`**
- Shows chosen From/To (read-only pills)
- "Choose Schedule" title
- **Schedule rows**: clock icon + time + green **Select** pill button
  - Times: 06:00 am / 08:30 am / 01:30 pm / 03:30 pm / 06:30 pm

**BusSelectionView `/transport/buses`**
- "Available Buses:" title
- **Bus rows**: darkgreen rounded square with bus name + three stacked pill buttons:
  - **Select** (→ receipt), **Full Route** (dialog: "Farmgate → Bijoy Sarani → Mohakhali → Aust"), **Contact** (dialog: phone icon + bus name + driver number)
- Buses: Meghna-1, Jamuna-2, Padma-1

**ReceiptView `/transport/receipt`**
- White ticket card, darkgreen header (bus icon + bus name + "Booking Confirmed")
- **Dotted perforation divider** (mint dots)
- Receipt rows (icon + label + value): From, To, Time of Arrival, Driver Number
- **Route panel** (mintsection): "Route" + arrow-joined stops
- Footer band (mintsection): "Please be present timely at your location!"

### 5.11 CGPA Calculator (`/cgpa`)
- **Header**: back button (white card), "CGPA Calculator", calculator icon chip
- **Header card** (green gradient): school icon + "Current Semester · N Courses • X Credits"
- "Select Grades" + **course rows** (`CourseCard`): course name, credits, **grade dropdown** (A+ … F)
- Seed courses: Data Structures, Database Systems, Digital Logic Design, Discrete Mathematics, English Composition, Physics Lab (1.5 cr), all 3.0 cr default grade A
- **Calculate GPA** primary button
- **Results** (grid of `StatCard`s): Semester GPA, Cumulative CGPA, Total Credits, Courses
- Bottom buttons: **What-If Calculator**, **History**

**Grade points**: A+ 4.0 · A 3.75 · A- 3.5 · B+ 3.25 · B 3.0 · B- 2.75 · C 2.5 · D 2.0 · F 0.0

### 5.12 What-If Calculator (`/cgpa/whatif`)
- Header card (green gradient, centered): brain icon + "Plan Your Future CGPA" + supporting copy
- **Target CGPA** input (number, crosshair icon, placeholder "e.g. 3.80")
- **Simulate** primary button (Enter also works)
- **Results** (`StatCard` grid): Current CGPA, Required GPA (green/red by achievability), Completed Cr., Remaining Cr.
- **InfoCard** verdict: "Achievable!" (green, check) or "Not Achievable" (red, alert) + message

### 5.13 CGPA History (`/cgpa/history`)
- Header card: chart icon + "Academic Journey" + "N Semesters Completed"
- **Timeline** with colored nodes per semester:
  - Color scale: ≥3.75 success green · ≥3.5 primary · ≥3.0 secondary · ≥2.5 warning · else error
  - Icons: Trophy / Star / ThumbsUp / MoveHorizontal / TrendingDown
- **Semester cards**: name + credits chip + "Semester GPA" and "Cumulative CGPA" big numbers
- History data: Spring 2023 (3.85/3.85/18) · Summer 2023 (3.72/3.78/15) · Fall 2023 (3.9/3.82/18) · Spring 2024 (3.65/3.78/16) · Summer 2024 (3.5/3.72/12)

### 5.14 Lab Report Cover Page Maker (`/lab-report`)
- Distinct page bg `#f4f7f6`; **top bar** (solid primary): back + centered "Cover Page Maker"
- **Course Details** card (white, green gradient top divider): Course Number, Course Name, Assignment Number, Date of Performance (date), Date of Submission (date), Submitted To
- **Student Details** card: Name, ID, Group, Section
- All fields: icon + rounded input, red border + inline message when missing
- **Preview Cover Page** button → **wide dialog** with an A4-ratio (210/297) HTML mirror:
  - AUST logo centered
  - Black bar: "Ahsanullah University of Science & Technology"
  - "Department of Computer Science & Engineering"
  - Labeled rows (Course No, Course Name, Assignment No, Date of Performance, Date of Submission, Submitted To)
  - "Submitted by -" + rows (Name, Id, Group, Section)
- Validation requires every field.

### 5.15 Blood Bank (`/blood-bank`)
- **My Donor Status** card:
  - Title + subtitle (available / not listed)
  - **Availability toggle** switch
  - Blood-group pill (mint, chevron) → **grid dialog** of 8 groups
  - "Last donated" button (calendar) → **date dialog**
  - **Eligibility progress bar** (90-day window) + status text ("Eligible to donate now" / "N days until eligible") + relative time ("Donated X days ago"); disabled/dimmed when unavailable
- **Send Request CTA** banner
- **My Requests** section (own requests with Copy Contact + Cancel)
- **Active Requests Nearby** section — seed feed:
  - Nazia Rahman A+ Square Hospital (critical, 6h, 2 units)
  - Rakib Hasan O- AUST Medical Center (urgent, 24h, 1)
  - Tasnim Akter B+ United Hospital (routine, 72h, 3)
  - Imran Chowdhury AB+ Lab Aid (urgent, 48h, 2)
- **Request cards** (`BloodRequestCard`): initials avatar, patient name, group badge, hospital + location, units, urgency badge (Routine mint / Urgent amber / Critical red), required-by date; actions **Help / Copy Contact** (+ Cancel for own)
- **Copy** → toast, **Help** → toast

### 5.16 Send Blood Request (`/blood-bank/request`)
- Sections: **Patient** (name), **Required blood** (8 group pills, error if none), **Where** (Hospital/Center required, Location optional), **Details** (Units — digits only, max 2; Required-by date, error if none; Urgency pills Routine/Urgent/Critical), **Contact** (phone), **Notes** (optional)
- **Send Request** green button → adds to list (provider state), toast, back

### 5.17 Book Exchange (`/book-exchange`)
- **Top bar**: back + "Book Exchange" (24px extrabold) + bell icon button (→ notifications) + user icon button (→ profile)
- **Hero banner** (darkgreen, decorative white/5 circles): "Give Your Old / Textbooks New Life" + white **Post a Book** pill
- **Tabs** (pills): Browse / My Listings / Saved
- **Search bar**: "Search by title, author, course..."
- **Filter chips** (pills): Department / Course Code / Semester / Free/Swap
- **Book cards** (`BookCard`): mint cover placeholder (book icon), title, course + semester, condition, price tag ("Swap / Free" or "300 BDT"), seller + rating star; actions: bookmark toggle, share (copies link), message, open seller
- Seed listings:
  1. Organic Chemistry: Structure & Function · CHEM 201 · Chemistry · Fall 2025 · Like New · Swap/Free
  2. Same book · Spring 2025 · 300 BDT — both by Shahidul Islam Arman (4.9★)

### 5.18 Post a Book (`/book-exchange/post`)
- Top bar: back + centered "POST A BOOK" (extrabold, letter-spaced)
- **Photo row** (horizontal scroll): Cover thumbnail (100×116, dashed upload tile with camera when empty) + additional-image tiles + add tile; remove ✕ on filled tiles (image previews via FileReader data URLs)
- Fields: **Book Title**, **Course Code** (uppercase; shows green "Matched" chip when it equals CHEM 201), **Condition** segmented (pills), **Price Type** segmented, **Description** textarea
- **Contact via In-App Chat** toggle switch with hint "Recommended for safety"
- Bottom bar: **Save Draft** (outline) + **Post Listing** (solid)

### 5.19 Listing Detail (`/book-exchange/:id`)
- Header: back + course code title
- Mint **cover placeholder** (220px tall, book icon)
- Title (20px extrabold), "course • condition", price tag (green bold)
- Seller row (mint avatar with star + name) → seller profile
- **Message Seller** full-width green pill → chat

### 5.20 Seller Profile (`/book-exchange/seller/:id`)
- Header: back + seller name
- Centered avatar (initial), name, star rating
- **Message** full-width green pill → chat
- "Exchange History" + empty-state box "No past exchanges yet"

### 5.21 In-App Chat (`/book-exchange/chat/:id`)
- **App bar** (white): back, avatar initial, name + subtitle, phone icon
- **Book banner** (mintsection, when context book exists): darkgreen book thumb, title + "course • tag", **View Detail** button
- **Message bubbles**: me = darkgreen right, them = mint left, rounded 2xl with one clipped corner; timestamp under each
- **Quick replies** chips: "Still available?", "Meet at library?", "Take a swap?" (taps fill the draft)
- **Input bar** (white): add (+), rounded input (mint tint) with smile icon, circular green **Send** button; Enter also sends
- Seed thread: swap negotiation about the Botany/Chemistry textbook, 9:42 AM / 9:44 AM

### 5.22 Book Notifications (`/book-exchange/notifications`)
- Back + "Notifications" title
- List of mint-avatar notification rows (bell icon, title bold, body): "New message — Shahidul Islam Arman replied to you"; "Listing saved — Someone bookmarked your CHEM 201 book"

### 5.23 Book Profile (`/book-exchange/profile`)
- Back + "My Profile"
- Centered avatar initial + name + star rating
- **Menu tiles** (white cards): My Listings, Saved Books, Exchange History, Settings (each with chevron)

### 5.24 Lost & Found (`/lost-found`)
- Back + "Lost & Found"
- **Search bar** ("Search items...")
- **Category chips** (horizontal scroll): All, Bags, Bottle, ID Card, Umbrella, Electronics, Mobile, Charger, Others
- **Item cards** (`ItemCard`): mint icon swatch (per category), item name, meta "Black • 7A06", date
- Items: Backpack (27 Feb 2025, Black, 7A06), Bottle (25 Jan 2025, Blue, 4C02), ID Card (15 Apr 2024, N/A, N/A), Umbrella (15 Apr 2024, Grey, N/A), Charger (10 Mar 2025, White, Library)
- Empty state "No items match your search."

### 5.25 User Profile (`/profile`)
- Back + "User Profile"
- Centered avatar initial, name (22px bold), email
- **Details card** (white, divided rows): Name, Email (icon + label + value)
- **Sign Out** button (danger outline, log-out icon) → `/login`

---

## 6. Component Catalog

| Component | Purpose |
|-----------|---------|
| `AppLayout` | Shell: sidebar + top bar + outlet + bottom nav; title map per route |
| `Sidebar` | 11-item desktop nav (`NAV_ITEMS` shared with BottomNav) |
| `BottomNav` | Mobile fixed bottom nav, scrollable |
| `WaveHeader` | Custom SVG wave (`welcome` / `auth` variants) |
| `Field` | Labeled input / textarea with optional icon, error state |
| `Dialog` / `ConfirmDialog` | Modal + confirm sheet (`wide` prop for A4 preview) |
| `Toast` / `ToastProvider` | Global toast messages |
| `DashboardCenteredCard` / `IconCard` / `RowCard` / `Section` | Home dashboard cards |
| `TransportationCard` | Bus image pan card (scrollOffset → translateX) |
| `NoticeBoardCard` | Gradient home notice card |
| `NoticeCard` | Notice list item (pinned gradient vs white, expand) |
| `TaskTile` | To-do row |
| `ReminderCard` | Class reminder row with toggle + select + assessments |
| `CourseCard` | CGPA course + grade dropdown |
| `GradeDropdown` | Grade select |
| `StatCard` / `InfoCard` | CGPA result tiles / verdict banner |
| `MyStatusCard` | Donor status + eligibility progress |
| `BloodRequestCard` | Blood request row with badges + actions |
| `SendRequestCta` | Blood request CTA banner |
| `SectionLabel` | Section heading with count |
| `BookCard` | Book listing card with actions |
| `ItemCard` | Lost & found item row |
| `FilterChip` / `EmptyState` | Notice filters / empty placeholder |
| `IconSwatch` | 40px mint icon box |
| `ActionButtons` | Primary / Secondary CGPA buttons |
| `AppIcons` | Custom SVGs (NotificationBell, etc.) |

---

## 7. Behaviors & Interactions

- **Toasts** (bottom snackbar, green `#407362`): used for login/register errors & success, forgot-password, contact copied, help sent, draft saved, listing posted.
- **To-do delete flows**: trash on tile → confirm dialog; delete inside edit sheet deletes immediately.
- **Dialogs** use a shared `Dialog` (title, close, body, optional wide) and `ConfirmDialog` (danger variant).
- **Toggle switches** appear in: Class Reminder, My Donor Status, Post a Book (contact via chat).
- **Scroll pan** on the Home transport card (window scroll).
- **Router state** carries the transport flow across 4 screens.
- **Shared context**: CGPA state flows calculator ↔ what-if ↔ history; blood request form feeds the blood-bank list.
- **Copy actions** (share/copy listing, copy contact) use `navigator.clipboard`.
- **All data is static**: seed arrays live in `src/data/`; nothing persists across reloads.

---

## 8. Known Limitations / Loose Ends

- `useHomeViewModel` scroll pan is wired to `window.scrollY` (correct now); the transport card needs a taller-than-viewport image to visibly pan.
- Book cover images don't exist (`book_placeholder.png` missing in Flutter) — mint placeholder is used.
- Notifications page is a stub (single message).
- Sign-out returns to `/login` without clearing mock session state.
- "3 due today", "Next Class: 02:30 pm", "1 Draft Saved", "2 requests nearby", "14 listings" are hardcoded chips, not computed.
- Book Exchange search input is present but not wired to a ViewModel filter.
- Seller/listing/chat pages work for the seeded `seller_001`/books; other ids show "not found".
- No real backend, no persistence, no image upload to a server (client-side data URLs only).

# AUST Central - Bug & Feature List (Mobile App & Web)

---

# PART 1: MOBILE APPLICATION ISSUES

---

## 1. Homepage

- Transport container component is not supported on certain mobile device models.
- App bar design is inconsistent across different pages; requires a unified and well-designed app bar uniformly applied.

## 2. Book Exchange Page / Book Page

- Notification feature is not functional: button renders and navigates to notification page, but the page does not work.
- Profile feature is not functional: button renders and navigates to profile page, but the page does not work.
- Post Listing fails with error "Unexpected error: Transaction API error: Unable to start a transaction in the given time" (likely a backend DB transaction timeout/lock issue).
- Search function returns no results / does not execute.
- Buyer feature is not functional: button navigates to buyer profile, but the page does not work.
- Clicking containers on the Book Page's profile fails to navigate to the respective target pages.
- Change UI color scheme (Dark Green UI requested).

## 3. Transportation Page

- Page displays static content instead of dynamic live data (API integration / data-binding missing).
- Change UI color scheme (Dark Green UI requested).

## 4. CGPA Calculator Page

- When CGPA is 0 or uncalculated, calculation fails and displays "CGPA calculation is not authorized."

## 5. Blood Bank Page

- Incorrect symbol displayed in the required blood option.
- Clicking contact number and location causes text to misalign instead of staying in position.
- Text overflows container when typing in notes option (text displays above the box instead of staying inside).
- Change UI color scheme.

## 6. Notice Board Page

- Admin panel is missing options to create, edit, or delete messages on the notice board.
- Lack of clear difference or distinction between "Call" and "I Can Help" options.

## 7. To-Do List Page

- No notification or reminder triggered when a task reaches its deadline.
- Clearing or deleting completed tasks improperly affects/deletes all tasks instead of just completed ones.
- Missing prioritization criteria/categories for tasks (Types of Tasks).
- Navigation issue: trouble with in-built navigation back buttons on mobile devices.

## 8. Lab Report Generator Page

- Creating a new report after completing one completely overwrites the previously saved report text.
- Repeatedly tapping "Save" creates multiple duplicate draft copies in the Drafts folder instead of updating the single file.
- Missing template options for different departments, courses, and cover page types.
- Missing additional history section to keep track of generated lab reports.
- Navigation issue: trouble with in-built navigation back buttons on mobile devices.

---

# PART 2: WEB APPLICATION ISSUES

---

## 1. Homepage & General Web UI

- Landing page layout elements are overlapping and require layout adjustment.
- Entire web UI needs to be enhanced to meet professional standards across all pages.

## 2. Cover Page Maker

- Missing download option after generating a cover page.
- Cover page maker UI needs an update.
- An unexpected overlay box appears above the container upon clicking to enter text.

## 3. Blood Bank

- Alignment needs to be fixed for the "Send blood request" component.

## 4. Book Page

- Clicking containers on the Book Page's profile fails to navigate to the respective target pages.

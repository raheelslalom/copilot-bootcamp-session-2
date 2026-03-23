# UI Guidelines — TODO App

## Component Library

Use **Material UI (MUI v5)** as the sole component library. Do not mix in other UI frameworks (e.g. Bootstrap, Ant Design). Import components from `@mui/material` and icons from `@mui/icons-material`.

---

## Color Palette

| Role | Color | MUI Token |
|---|---|---|
| Primary (actions, links) | Indigo | `primary.main` → `#3F51B5` |
| Secondary (badges, accents) | Amber | `secondary.main` → `#FFC107` |
| Success / Complete | Green | `success.main` → `#4CAF50` |
| Error / Overdue | Red | `error.main` → `#F44336` |
| Background | Light grey | `background.default` → `#F5F5F5` |
| Surface (cards) | White | `background.paper` → `#FFFFFF` |

Define these values in a single MUI `createTheme()` call in `src/theme.js` and wrap the app in `<ThemeProvider>`.

---

## Typography

- Font family: **Roboto** (loaded via MUI's default theme — no additional import needed).
- Page title (`<h1>`): `variant="h4"`, `fontWeight: 600`.
- Section headings (`<h2>`): `variant="h6"`, `fontWeight: 500`.
- Body text: `variant="body1"`.
- Helper/meta text (dates, counts): `variant="caption"`, colour `text.secondary`.

---

## Layout

- Maximum content width: **800 px**, centred with `<Container maxWidth="sm">`.
- Top-level page padding: `py: 4` (32 px top and bottom).
- Spacing unit: use MUI's `sx` prop with theme spacing (multiples of 8 px). Do not use hard-coded pixel values in `sx`.

---

## Task Cards

- Each task is rendered as an `<Card>` with `elevation={1}` and `borderRadius: 2`.
- Card padding: `p: 2` inside a `<CardContent>`.
- Completed tasks: apply `sx={{ opacity: 0.6 }}` to the card and `textDecoration: 'line-through'` to the task name.
- Overdue tasks: render a `<Chip label="Overdue" color="error" size="small" />` next to the task name.
- Priority badge: render a `<Chip size="small" />` with colours mapped as:
  - High → `color="error"`
  - Medium → `color="warning"`
  - Low → `color="success"`

---

## Buttons

- Primary action button (e.g. "Add Task"): `<Button variant="contained" color="primary">`.
- Destructive action button (e.g. "Delete", "Clear completed"): `<Button variant="outlined" color="error">`.
- Secondary/cancel action: `<Button variant="text" color="inherit">`.
- All icon-only buttons must use `<IconButton>` with an `aria-label` attribute.

---

## Forms & Inputs

- All text inputs use `<TextField variant="outlined" fullWidth />`.
- Date picker uses `<TextField type="date" />` with `InputLabelProps={{ shrink: true }}`.
- Priority selector uses `<Select>` inside a `<FormControl fullWidth>`.
- Inline validation errors display via the `error` and `helperText` props on `<TextField>` — do not use browser `alert()`.

---

## Sorting & Filtering Controls

- Sort and filter controls sit in a `<Paper elevation={0} variant="outlined">` toolbar above the task list.
- Use `<ToggleButtonGroup exclusive>` for status filters (All / Active / Completed).
- Use `<Select>` for sort order selection.

---

## Accessibility

- All interactive elements must be keyboard-navigable (tab order, Enter/Space activation).
- Colour contrast must meet **WCAG 2.1 AA** (minimum 4.5:1 for normal text, 3:1 for large text).
- All images and icons that convey meaning must have descriptive `alt` text or `aria-label`.
- Form inputs must have visible `<label>` elements linked via `htmlFor` / `id`.
- Use semantic HTML elements (`<main>`, `<header>`, `<ul>`, `<li>`) alongside MUI components.

---

## Responsive Design

- The layout must be usable on screens as narrow as **360 px** (mobile).
- Use MUI's `sx` responsive breakpoints (`xs`, `sm`) rather than custom media queries.
- On mobile, action buttons stack vertically; on desktop they are inline.

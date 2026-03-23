# Functional Requirements — TODO App

## Current Capabilities
The app already supports:
- **FR-001** Add a task (text name only)
- **FR-002** List all tasks (sorted by creation date, newest first)
- **FR-003** Delete a task

---

## New Requirements

### Task Management

**FR-004 — Edit a task name**
A user can update the name of an existing task inline. Clicking an "Edit" button next to a task replaces the task name with an editable text field. Saving stores the updated name; pressing Escape cancels without changes.

**FR-005 — Add a due date to a task**
When creating or editing a task, a user can optionally select a due date. The due date is displayed alongside the task name. Tasks with no due date show "No due date".

**FR-006 — Mark a task as complete**
A user can check a checkbox next to a task to mark it as done. Completed tasks are visually distinguished (e.g. strikethrough text). Checking again toggles the task back to incomplete.

**FR-007 — Task priority**
A user can assign a priority level (High, Medium, Low) to a task at creation or edit time. Priority is shown as a colour-coded badge on the task card.

---

### Sorting & Filtering

**FR-008 — Sort tasks**
A user can sort the task list by:
- Creation date (newest first — default)
- Due date (soonest first)
- Priority (High → Medium → Low)
- Alphabetical (A → Z)

**FR-009 — Filter tasks by status**
A user can filter the task list to show:
- All tasks (default)
- Active (incomplete) tasks only
- Completed tasks only

**FR-010 — Filter tasks by priority**
A user can filter the task list by one or more priority levels (High, Medium, Low).

---

### User Experience

**FR-011 — Task count summary**
The header displays a live count of total tasks and the number of incomplete tasks (e.g. "3 of 7 remaining").

**FR-012 — Empty-state message**
When no tasks match the current filter, a friendly message is shown (e.g. "No tasks found. Add one above!").

**FR-013 — Overdue indicator**
Tasks whose due date has passed and that are not yet completed are highlighted with an "Overdue" badge.

**FR-014 — Bulk delete completed tasks**
A "Clear completed" button deletes all tasks marked as complete in a single action. The button is only visible when at least one completed task exists.

---

### Data Persistence

**FR-015 — Persistent storage**
Task data must survive a server restart. The in-memory SQLite database should be replaced with a file-based SQLite database so that tasks are not lost between sessions.

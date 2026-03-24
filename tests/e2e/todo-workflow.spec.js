const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');

// Unique prefix to isolate E2E-created tasks
const PREFIX = `[E2E-${Date.now()}]`;
const taskName = (label) => `${PREFIX} ${label}`;

test.describe('TODO App — critical user journeys', () => {
  let todoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  test('1 — page loads with title and task count', async () => {
    await expect(todoPage.heading).toBeVisible();
    await expect(todoPage.taskCountSummary).toBeVisible();
  });

  test('2 — user can add a new task', async () => {
    const name = taskName('Add Task');
    await todoPage.addTask(name, { priority: 'High' });
    await todoPage.expectTaskVisible(name);
    // Cleanup
    await todoPage.getDeleteButton(name).click();
  });

  test('3 — user can delete a task', async () => {
    const name = taskName('Delete Me');
    await todoPage.addTask(name);
    await todoPage.expectTaskVisible(name);

    await todoPage.getDeleteButton(name).click();
    await todoPage.expectTaskNotVisible(name);
  });

  test('4 — user can mark a task as complete and see strikethrough', async () => {
    const name = taskName('Complete Me');
    await todoPage.addTask(name);

    const checkbox = todoPage.getCheckbox(name);
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    // Task name should have line-through style applied (card has opacity 0.6 when completed)
    const card = todoPage.getTaskCard(name);
    await expect(card).toHaveCSS('opacity', '0.6');

    // Cleanup
    await todoPage.getDeleteButton(name).click();
  });

  test('5 — user can edit a task name inline', async () => {
    const originalName = taskName('Original Name');
    const updatedName = taskName('Updated Name');
    await todoPage.addTask(originalName);

    await todoPage.getEditButton(originalName).click();
    const editInput = todoPage.getEditNameInput();
    await editInput.fill(updatedName);
    await todoPage.getSaveEditButton().click();

    await todoPage.expectTaskVisible(updatedName);
    await todoPage.expectTaskNotVisible(originalName);

    // Cleanup
    await todoPage.getDeleteButton(updatedName).click();
  });

  test('6 — status filter shows only active or completed tasks', async () => {
    const activeName = taskName('Active Task');
    const completedName = taskName('Completed Task');
    await todoPage.addTask(activeName);
    await todoPage.addTask(completedName);
    await todoPage.getCheckbox(completedName).check();

    // Filter: Active
    await todoPage.filterActive.click();
    await todoPage.expectTaskVisible(activeName);
    await todoPage.expectTaskNotVisible(completedName);

    // Filter: Completed
    await todoPage.filterCompleted.click();
    await todoPage.expectTaskVisible(completedName);
    await todoPage.expectTaskNotVisible(activeName);

    // Reset filter
    await todoPage.filterAll.click();

    // Cleanup
    await todoPage.getDeleteButton(activeName).click();
    await todoPage.getDeleteButton(completedName).click();
  });

  test('7 — "Clear completed" button removes all completed tasks', async () => {
    const done1 = taskName('Done Task 1');
    const done2 = taskName('Done Task 2');
    const active = taskName('Keep This');

    await todoPage.addTask(done1);
    await todoPage.addTask(done2);
    await todoPage.addTask(active);

    await todoPage.getCheckbox(done1).check();
    await todoPage.getCheckbox(done2).check();

    await expect(todoPage.clearCompletedButton).toBeVisible();
    await todoPage.clearCompletedButton.click();

    await todoPage.expectTaskNotVisible(done1);
    await todoPage.expectTaskNotVisible(done2);
    await todoPage.expectTaskVisible(active);

    // Cleanup
    await todoPage.getDeleteButton(active).click();
  });

  test('8 — empty state message shown when no tasks match filter', async () => {
    const name = taskName('Only Active');
    await todoPage.addTask(name);

    // Filter to completed — nothing matches
    await todoPage.filterCompleted.click();
    await todoPage.expectEmptyState();

    // Reset
    await todoPage.filterAll.click();
    await todoPage.getDeleteButton(name).click();
  });
});

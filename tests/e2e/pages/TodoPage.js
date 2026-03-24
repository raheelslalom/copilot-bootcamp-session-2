const { expect } = require('@playwright/test');

/**
 * Page Object Model for the TODO App.
 * Encapsulates all locators and interactions for the main task list page.
 */
class TodoPage {
  constructor(page) {
    this.page = page;

    // Header
    this.heading = page.getByRole('heading', { name: /to do app/i });
    this.taskCountSummary = page.getByText(/\d+ of \d+ remaining/i);

    // Add task form
    this.taskNameInput = page.getByLabel(/task name/i);
    this.dueDateInput = page.getByLabel(/due date/i);
    this.prioritySelect = page.getByLabel(/^priority$/i).first();
    this.addTaskButton = page.getByRole('button', { name: /add task/i });

    // Toolbar
    this.filterAll = page.getByRole('button', { name: /^all$/i });
    this.filterActive = page.getByRole('button', { name: /^active$/i });
    this.filterCompleted = page.getByRole('button', { name: /^completed$/i });
    this.sortSelect = page.getByLabel(/sort by/i);

    // Actions
    this.clearCompletedButton = page.getByRole('button', { name: /clear completed/i });
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async addTask(name, { dueDate, priority } = {}) {
    await this.taskNameInput.fill(name);
    if (dueDate) await this.dueDateInput.fill(dueDate);
    if (priority) {
      await this.prioritySelect.click();
      await this.page.getByRole('option', { name: priority }).click();
    }
    await this.addTaskButton.click();
  }

  getTaskCard(name) {
    return this.page.getByRole('listitem').filter({ hasText: name });
  }

  getDeleteButton(name) {
    return this.getTaskCard(name).getByRole('button', { name: new RegExp(`delete task ${name}`, 'i') });
  }

  getEditButton(name) {
    return this.getTaskCard(name).getByRole('button', { name: new RegExp(`edit task ${name}`, 'i') });
  }

  getCheckbox(name) {
    return this.getTaskCard(name).getByRole('checkbox');
  }

  getSaveEditButton() {
    return this.page.getByRole('button', { name: /save edit/i });
  }

  getCancelEditButton() {
    return this.page.getByRole('button', { name: /cancel edit/i });
  }

  getEditNameInput() {
    return this.page.getByLabel(/task name/i).last();
  }

  async deleteAllTasksNamedWith(namePattern) {
    const deleteButtons = this.page.getByRole('button', {
      name: new RegExp(`delete task ${namePattern}`, 'i'),
    });
    const count = await deleteButtons.count();
    for (let i = 0; i < count; i++) {
      await deleteButtons.first().click();
      await this.page.waitForTimeout(200);
    }
  }

  async expectTaskVisible(name) {
    await expect(this.getTaskCard(name)).toBeVisible();
  }

  async expectTaskNotVisible(name) {
    await expect(this.page.getByText(name, { exact: true })).not.toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.page.getByText(/no tasks found/i)).toBeVisible();
  }
}

module.exports = { TodoPage };

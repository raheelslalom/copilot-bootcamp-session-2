import React, { act } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import App from '../App';

const MOCK_TASKS = [
  {
    id: 1,
    name: 'Test Task 1',
    completed: 0,
    priority: 'High',
    due_date: null,
    created_at: '2023-01-02T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Test Task 2',
    completed: 1,
    priority: 'Low',
    due_date: '2020-01-01',
    created_at: '2023-01-01T00:00:00.000Z',
  },
];

const server = setupServer(
  rest.get('/api/items', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(MOCK_TASKS));
  }),

  rest.post('/api/items', (req, res, ctx) => {
    const { name, priority = 'Medium', due_date } = req.body;
    if (!name || name.trim() === '') {
      return res(ctx.status(400), ctx.json({ error: 'Item name is required' }));
    }
    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        name,
        completed: 0,
        priority,
        due_date: due_date || null,
        created_at: new Date().toISOString(),
      })
    );
  }),

  // Must be before the parameterised /api/items/:id handler so MSW matches it first
  rest.delete('/api/items/completed', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Completed items deleted', count: 1 }));
  }),

  rest.delete('/api/items/:id', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Item deleted successfully', id: Number(req.params.id) }));
  }),

  rest.patch('/api/items/:id/complete', (req, res, ctx) => {
    const task = MOCK_TASKS.find((t) => t.id === Number(req.params.id));
    if (!task) return res(ctx.status(404), ctx.json({ error: 'Item not found' }));
    return res(ctx.status(200), ctx.json({ ...task, completed: task.completed ? 0 : 1 }));
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const renderApp = () =>
  render(
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  );

describe('App Component', () => {
  describe('Initial render', () => {
    test('renders the page title', async () => {
      await act(async () => {
        renderApp();
      });
      expect(screen.getByRole('heading', { name: /to do app/i })).toBeInTheDocument();
    });

    test('displays task count summary', async () => {
      await act(async () => {
        renderApp();
      });
      await waitFor(() => {
        expect(screen.getByText(/1 of 2 remaining/i)).toBeInTheDocument();
      });
    });

    test('loads and displays tasks', async () => {
      await act(async () => {
        renderApp();
      });
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
        expect(screen.getByText('Test Task 2')).toBeInTheDocument();
      });
    });

    test('shows loading indicator while fetching', async () => {
      renderApp();
      expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
    });
  });

  describe('Task display', () => {
    test('shows priority chip on each task', async () => {
      await act(async () => {
        renderApp();
      });
      await waitFor(() => {
        expect(screen.getByText('High')).toBeInTheDocument();
        expect(screen.getByText('Low')).toBeInTheDocument();
      });
    });

    test('shows "No due date" for tasks without a due date', async () => {
      await act(async () => {
        renderApp();
      });
      await waitFor(() => {
        expect(screen.getByText('No due date')).toBeInTheDocument();
      });
    });

    test('shows Overdue chip for past-due incomplete tasks', async () => {
      await act(async () => {
        renderApp();
      });
      // Task 2 is completed so no Overdue chip; set up a scenario with overdue incomplete task
      server.use(
        rest.get('/api/items', (req, res, ctx) =>
          res(
            ctx.status(200),
            ctx.json([
              {
                id: 5,
                name: 'Overdue Task',
                completed: 0,
                priority: 'High',
                due_date: '2020-01-01',
                created_at: '2020-01-01T00:00:00.000Z',
              },
            ])
          )
        )
      );
      await act(async () => {
        renderApp();
      });
      await waitFor(() => {
        expect(screen.getByText('Overdue')).toBeInTheDocument();
      });
    });

    test('shows "Clear completed" button when completed tasks exist', async () => {
      await act(async () => {
        renderApp();
      });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear completed/i })).toBeInTheDocument();
      });
    });
  });

  describe('Add task', () => {
    test('adds a new task', async () => {
      const user = userEvent.setup();
      await act(async () => {
        renderApp();
      });
      await waitFor(() => expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument());

      await user.type(screen.getByLabelText(/task name/i), 'New Test Task');
      await user.click(screen.getByRole('button', { name: /add task/i }));

      await waitFor(() => {
        expect(screen.getByText('New Test Task')).toBeInTheDocument();
      });
    });

    test('does not add a task when name is empty', async () => {
      const user = userEvent.setup();
      await act(async () => {
        renderApp();
      });
      await waitFor(() => expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument());

      const initialTaskCount = screen.getAllByRole('checkbox').length;
      await user.click(screen.getByRole('button', { name: /add task/i }));

      expect(screen.getAllByRole('checkbox')).toHaveLength(initialTaskCount);
    });
  });

  describe('Delete task', () => {
    test('removes a task when delete button is clicked', async () => {
      const user = userEvent.setup();
      await act(async () => {
        renderApp();
      });
      await waitFor(() => expect(screen.getByText('Test Task 1')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: /delete task test task 1/i }));

      await waitFor(() => {
        expect(screen.queryByText('Test Task 1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Toggle completion', () => {
    test('toggles task completion when checkbox is clicked', async () => {
      const user = userEvent.setup();
      await act(async () => {
        renderApp();
      });
      await waitFor(() => expect(screen.getByText('Test Task 1')).toBeInTheDocument());

      const checkbox = screen.getByRole('checkbox', { name: /mark "test task 1" as complete/i });
      await user.click(checkbox);

      await waitFor(() => {
        expect(checkbox).toBeChecked();
      });
    });
  });

  describe('Filtering', () => {
    test('filters to show only active tasks', async () => {
      const user = userEvent.setup();
      await act(async () => {
        renderApp();
      });
      await waitFor(() => expect(screen.getByText('Test Task 1')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: /active/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
        expect(screen.queryByText('Test Task 2')).not.toBeInTheDocument();
      });
    });

    test('filters to show only completed tasks', async () => {
      const user = userEvent.setup();
      await act(async () => {
        renderApp();
      });
      await waitFor(() => expect(screen.getByText('Test Task 2')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: /^completed$/i }));

      await waitFor(() => {
        expect(screen.queryByText('Test Task 1')).not.toBeInTheDocument();
        expect(screen.getByText('Test Task 2')).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    test('shows empty-state message when no tasks match filter', async () => {
      server.use(
        rest.get('/api/items', (req, res, ctx) => res(ctx.status(200), ctx.json([])))
      );
      await act(async () => {
        renderApp();
      });
      await waitFor(() => {
        expect(screen.getByText(/no tasks found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    test('shows error message when fetch fails', async () => {
      server.use(
        rest.get('/api/items', (req, res, ctx) => res(ctx.status(500)))
      );
      await act(async () => {
        renderApp();
      });
      await waitFor(() => {
        expect(screen.getByText(/failed to load tasks/i)).toBeInTheDocument();
      });
    });
  });

  describe('Clear completed', () => {
    test('removes all completed tasks when "Clear completed" is clicked', async () => {
      const user = userEvent.setup();
      await act(async () => {
        renderApp();
      });
      await waitFor(() => expect(screen.getByText('Test Task 2')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: /clear completed/i }));

      await waitFor(() => {
        expect(screen.queryByText('Test Task 2')).not.toBeInTheDocument();
      });
    });
  });
});
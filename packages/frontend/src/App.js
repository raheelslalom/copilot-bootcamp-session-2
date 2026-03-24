import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

const PRIORITIES = ['High', 'Medium', 'Low'];

const PRIORITY_CHIP_COLOR = {
  High: 'error',
  Medium: 'warning',
  Low: 'success',
};

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

const isOverdue = (task) => {
  if (!task.due_date || task.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.due_date) < today;
};

const sortTasks = (tasks, sortOrder) => {
  const sorted = [...tasks];
  switch (sortOrder) {
    case 'dueDate':
      return sorted.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      });
    case 'priority':
      return sorted.sort(
        (a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
      );
    case 'alphabetical':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'createdAt':
    default:
      return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
};

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [sortOrder, setSortOrder] = useState('createdAt');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilters, setPriorityFilters] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingDueDate, setEditingDueDate] = useState('');
  const [editingPriority, setEditingPriority] = useState('Medium');

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/items');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          priority: newPriority,
          due_date: newDueDate || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to add task');
      const task = await res.json();
      setTasks((prev) => [task, ...prev]);
      setNewName('');
      setNewDueDate('');
      setNewPriority('Medium');
      setError(null);
    } catch (err) {
      setError('Failed to add task. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete task. Please try again.');
    }
  };

  const handleToggleComplete = async (id) => {
    try {
      const res = await fetch(`/api/items/${id}/complete`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to update task');
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setError(null);
    } catch (err) {
      setError('Failed to update task. Please try again.');
    }
  };

  const handleEditStart = (task) => {
    setEditingId(task.id);
    setEditingName(task.name);
    setEditingDueDate(task.due_date || '');
    setEditingPriority(task.priority || 'Medium');
  };

  const handleEditSave = async (id) => {
    if (!editingName.trim()) return;
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingName.trim(),
          priority: editingPriority,
          due_date: editingDueDate || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditingId(null);
      setError(null);
    } catch (err) {
      setError('Failed to update task. Please try again.');
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const handleClearCompleted = async () => {
    try {
      const res = await fetch('/api/items/completed', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear completed tasks');
      setTasks((prev) => prev.filter((t) => !t.completed));
      setError(null);
    } catch (err) {
      setError('Failed to clear completed tasks. Please try again.');
    }
  };

  const handlePriorityFilterToggle = (priority) => {
    setPriorityFilters((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );
  };

  const getFilteredSortedTasks = () => {
    let filtered = [...tasks];
    if (statusFilter === 'active') {
      filtered = filtered.filter((t) => !t.completed);
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter((t) => t.completed);
    }
    if (priorityFilters.length > 0) {
      filtered = filtered.filter((t) => priorityFilters.includes(t.priority));
    }
    return sortTasks(filtered, sortOrder);
  };

  const displayedTasks = getFilteredSortedTasks();
  const totalCount = tasks.length;
  const remainingCount = tasks.filter((t) => !t.completed).length;
  const hasCompleted = tasks.some((t) => t.completed);

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <header>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          To Do App
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {remainingCount} of {totalCount} remaining
        </Typography>
      </header>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light' }} role="alert">
          <Typography color="error.contrastText">{error}</Typography>
        </Paper>
      )}

      {/* Add Task Form */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Typography variant="h6" fontWeight={500} gutterBottom>
          Add New Task
        </Typography>
        <Box
          component="form"
          onSubmit={handleAddTask}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label="Task name"
            variant="outlined"
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            id="new-task-name"
            inputProps={{ 'aria-label': 'Task name' }}
          />
          <TextField
            label="Due date"
            type="date"
            variant="outlined"
            fullWidth
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            id="new-task-due-date"
          />
          <FormControl fullWidth>
            <InputLabel id="new-task-priority-label" htmlFor="new-task-priority">
              Priority
            </InputLabel>
            <Select
              labelId="new-task-priority-label"
              inputProps={{ id: 'new-task-priority' }}
              value={newPriority}
              label="Priority"
              onChange={(e) => setNewPriority(e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button type="submit" variant="contained" color="primary">
            Add Task
          </Button>
        </Box>
      </Paper>

      {/* Sort & Filter toolbar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            alignItems: { sm: 'center' },
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Status
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={statusFilter}
              onChange={(_, val) => {
                if (val) setStatusFilter(val);
              }}
              size="small"
              aria-label="filter by status"
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="active">Active</ToggleButton>
              <ToggleButton value="completed">Completed</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="sort-label" htmlFor="sort-select">
              Sort by
            </InputLabel>
            <Select
              labelId="sort-label"
              inputProps={{ id: 'sort-select' }}
              value={sortOrder}
              label="Sort by"
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <MenuItem value="createdAt">Date created</MenuItem>
              <MenuItem value="dueDate">Due date</MenuItem>
              <MenuItem value="priority">Priority</MenuItem>
              <MenuItem value="alphabetical">Alphabetical</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Priority filter
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {PRIORITIES.map((p) => (
              <Chip
                key={p}
                label={p}
                color={priorityFilters.includes(p) ? PRIORITY_CHIP_COLOR[p] : 'default'}
                onClick={() => handlePriorityFilterToggle(p)}
                variant={priorityFilters.includes(p) ? 'filled' : 'outlined'}
                size="small"
              />
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Task list */}
      <main>
        {loading && <Typography>Loading tasks...</Typography>}
        {!loading && displayedTasks.length === 0 && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            No tasks found. Add one above!
          </Typography>
        )}

        <Box
          component="ul"
          sx={{ listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 1 }}
        >
          {displayedTasks.map((task) => {
            const overdue = isOverdue(task);
            const isEditing = editingId === task.id;
            return (
              <Box component="li" key={task.id}>
                <Card elevation={1} sx={{ borderRadius: 2, ...(task.completed && { opacity: 0.6 }) }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    {isEditing ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <TextField
                          variant="outlined"
                          fullWidth
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          label="Task name"
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') handleEditCancel();
                          }}
                          autoFocus
                        />
                        <TextField
                          label="Due date"
                          type="date"
                          variant="outlined"
                          fullWidth
                          value={editingDueDate}
                          onChange={(e) => setEditingDueDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                        <FormControl fullWidth>
                          <InputLabel>Priority</InputLabel>
                          <Select
                            value={editingPriority}
                            label="Priority"
                            onChange={(e) => setEditingPriority(e.target.value)}
                          >
                            {PRIORITIES.map((p) => (
                              <MenuItem key={p} value={p}>
                                {p}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            aria-label="save edit"
                            color="primary"
                            onClick={() => handleEditSave(task.id)}
                          >
                            <SaveIcon />
                          </IconButton>
                          <IconButton aria-label="cancel edit" onClick={handleEditCancel}>
                            <CancelIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Checkbox
                          checked={!!task.completed}
                          onChange={() => handleToggleComplete(task.id)}
                          inputProps={{
                            'aria-label': `Mark "${task.name}" as ${task.completed ? 'incomplete' : 'complete'}`,
                          }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body1"
                            sx={{ ...(task.completed && { textDecoration: 'line-through' }) }}
                          >
                            {task.name}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 0.5,
                              mt: 0.5,
                              alignItems: 'center',
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              {task.due_date ? task.due_date : 'No due date'}
                            </Typography>
                            {overdue && <Chip label="Overdue" color="error" size="small" />}
                            <Chip
                              label={task.priority || 'Medium'}
                              color={PRIORITY_CHIP_COLOR[task.priority] || 'default'}
                              size="small"
                            />
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexShrink: 0 }}>
                          <IconButton
                            aria-label={`edit task ${task.name}`}
                            onClick={() => handleEditStart(task)}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            aria-label={`delete task ${task.name}`}
                            color="error"
                            onClick={() => handleDelete(task.id)}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>

        {hasCompleted && (
          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Button variant="outlined" color="error" onClick={handleClearCompleted}>
              Clear completed
            </Button>
          </Box>
        )}
      </main>
    </Container>
  );
};

export default App;
const request = require('supertest');
const { app, db } = require('../../src/app');

afterAll(() => {
  if (db) db.close();
});

// Helper to create a fresh item and return its body
const createItem = async (overrides = {}) => {
  const payload = { name: 'Integration Test Task', priority: 'Medium', ...overrides };
  const res = await request(app)
    .post('/api/items')
    .send(payload)
    .set('Accept', 'application/json');
  expect(res.status).toBe(201);
  return res.body;
};

// Helper to delete an item by id (cleanup)
const deleteItem = async (id) => {
  await request(app).delete(`/api/items/${id}`);
};

describe('Integration — TODO API', () => {
  describe('GET /api/items', () => {
    it('returns 200 and an array of items', async () => {
      const res = await request(app).get('/api/items');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns items with all required fields', async () => {
      const item = await createItem();
      const res = await request(app).get('/api/items');
      const found = res.body.find((t) => t.id === item.id);
      expect(found).toBeDefined();
      expect(found).toHaveProperty('id');
      expect(found).toHaveProperty('name');
      expect(found).toHaveProperty('completed');
      expect(found).toHaveProperty('priority');
      expect(found).toHaveProperty('created_at');
      await deleteItem(item.id);
    });
  });

  describe('POST /api/items', () => {
    it('creates a new item with default priority', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ name: 'New Task' })
        .set('Accept', 'application/json');
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New Task');
      expect(res.body.priority).toBe('Medium');
      expect(res.body.completed).toBe(0);
      await deleteItem(res.body.id);
    });

    it('creates a new item with explicit priority and due date', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ name: 'High Priority Task', priority: 'High', due_date: '2030-12-31' })
        .set('Accept', 'application/json');
      expect(res.status).toBe(201);
      expect(res.body.priority).toBe('High');
      expect(res.body.due_date).toBe('2030-12-31');
      await deleteItem(res.body.id);
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({})
        .set('Accept', 'application/json');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when priority is invalid', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ name: 'Task', priority: 'Urgent' })
        .set('Accept', 'application/json');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/items/:id', () => {
    let item;
    beforeEach(async () => {
      item = await createItem({ name: 'Original Name', priority: 'Low' });
    });
    afterEach(async () => {
      await deleteItem(item.id);
    });

    it('updates the task name', async () => {
      const res = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: 'Updated Name' })
        .set('Accept', 'application/json');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
    });

    it('updates priority and due date', async () => {
      const res = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ priority: 'High', due_date: '2030-06-15' })
        .set('Accept', 'application/json');
      expect(res.status).toBe(200);
      expect(res.body.priority).toBe('High');
      expect(res.body.due_date).toBe('2030-06-15');
    });

    it('returns 404 for non-existent id', async () => {
      const res = await request(app)
        .put('/api/items/999999')
        .send({ name: 'Ghost' })
        .set('Accept', 'application/json');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/items/:id/complete', () => {
    let item;
    beforeEach(async () => {
      item = await createItem({ name: 'Task to complete' });
    });
    afterEach(async () => {
      await deleteItem(item.id);
    });

    it('toggles task from incomplete to complete', async () => {
      const res = await request(app).patch(`/api/items/${item.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(1);
    });

    it('toggles task back to incomplete on second call', async () => {
      await request(app).patch(`/api/items/${item.id}/complete`);
      const res = await request(app).patch(`/api/items/${item.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(0);
    });

    it('returns 404 for non-existent id', async () => {
      const res = await request(app).patch('/api/items/999999/complete');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('deletes an item by id', async () => {
      const item = await createItem({ name: 'Task to delete' });
      const res = await request(app).delete(`/api/items/${item.id}`);
      expect(res.status).toBe(200);

      const getRes = await request(app).get('/api/items');
      expect(getRes.body.find((t) => t.id === item.id)).toBeUndefined();
    });

    it('returns 404 for non-existent id', async () => {
      const res = await request(app).delete('/api/items/999999');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/items/completed', () => {
    it('bulk-deletes all completed tasks', async () => {
      const task1 = await createItem({ name: 'Completed A' });
      const task2 = await createItem({ name: 'Completed B' });
      const task3 = await createItem({ name: 'Active task' });

      // Mark task1 and task2 as complete
      await request(app).patch(`/api/items/${task1.id}/complete`);
      await request(app).patch(`/api/items/${task2.id}/complete`);

      const res = await request(app).delete('/api/items/completed');
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);

      const getRes = await request(app).get('/api/items');
      expect(getRes.body.find((t) => t.id === task1.id)).toBeUndefined();
      expect(getRes.body.find((t) => t.id === task2.id)).toBeUndefined();
      expect(getRes.body.find((t) => t.id === task3.id)).toBeDefined();

      await deleteItem(task3.id);
    });
  });

  describe('GET / (health check)', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
    });
  });
});

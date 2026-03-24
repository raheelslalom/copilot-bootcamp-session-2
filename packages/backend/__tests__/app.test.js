const request = require('supertest');
const { app, db } = require('../src/app');

// Close the database connection after all tests
afterAll(() => {
  if (db) {
    db.close();
  }
});

// Test helpers
const createItem = async (name = 'Temp Item to Delete') => {
  const response = await request(app)
    .post('/api/items')
    .send({ name })
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  return response.body;
};

describe('API Endpoints', () => {
  describe('GET /api/items', () => {
    it('should return all items', async () => {
      const response = await request(app).get('/api/items');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check if items have the expected structure
      const item = response.body[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('created_at');
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const newItem = { name: 'Test Item' };
      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newItem.name);
      expect(response.body).toHaveProperty('created_at');
      expect(response.body.completed).toBe(0);
      expect(response.body.priority).toBe('Medium');

      // Cleanup
      await request(app).delete(`/api/items/${response.body.id}`);
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete an existing item', async () => {
      const item = await createItem('Item To Be Deleted');

      const deleteResponse = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({ message: 'Item deleted successfully', id: item.id });

      const deleteAgain = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteAgain.status).toBe(404);
      expect(deleteAgain.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 404 when item does not exist', async () => {
      const response = await request(app).delete('/api/items/999999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app).delete('/api/items/abc');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid item ID is required');
    });
  });

  describe('PUT /api/items/:id', () => {
    let item;

    beforeEach(async () => {
      item = await createItem('Original Name');
    });

    afterEach(async () => {
      await request(app).delete(`/api/items/${item.id}`);
    });

    it('should update the item name', async () => {
      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: 'Updated Name' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
    });

    it('should update priority and due date', async () => {
      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ priority: 'High', due_date: '2030-12-31' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.priority).toBe('High');
      expect(response.body.due_date).toBe('2030-12-31');
    });

    it('should return 404 for a non-existent item', async () => {
      const response = await request(app)
        .put('/api/items/999999')
        .send({ name: 'Ghost' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 if priority is invalid', async () => {
      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ priority: 'Urgent' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Priority must be High, Medium, or Low');
    });
  });

  describe('PATCH /api/items/:id/complete', () => {
    let item;

    beforeEach(async () => {
      item = await createItem('Task to Toggle');
    });

    afterEach(async () => {
      await request(app).delete(`/api/items/${item.id}`);
    });

    it('should mark an incomplete task as complete', async () => {
      const response = await request(app).patch(`/api/items/${item.id}/complete`);

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(1);
    });

    it('should toggle a completed task back to incomplete', async () => {
      await request(app).patch(`/api/items/${item.id}/complete`);
      const response = await request(app).patch(`/api/items/${item.id}/complete`);

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(0);
    });

    it('should return 404 for a non-existent item', async () => {
      const response = await request(app).patch('/api/items/999999/complete');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });
  });

  describe('DELETE /api/items/completed', () => {
    it('should delete all completed items', async () => {
      const item1 = await createItem('Completed Task A');
      const item2 = await createItem('Completed Task B');
      const item3 = await createItem('Active Task');

      await request(app).patch(`/api/items/${item1.id}/complete`);
      await request(app).patch(`/api/items/${item2.id}/complete`);

      const response = await request(app).delete('/api/items/completed');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 2);

      // Active task should remain
      const remaining = await request(app).get('/api/items');
      const ids = remaining.body.map((t) => t.id);
      expect(ids).not.toContain(item1.id);
      expect(ids).not.toContain(item2.id);
      expect(ids).toContain(item3.id);

      // Cleanup
      await request(app).delete(`/api/items/${item3.id}`);
    });
  });
});
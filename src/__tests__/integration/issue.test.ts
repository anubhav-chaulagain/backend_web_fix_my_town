import request from 'supertest';
import app from '../../app';
import { UserModel } from '../../models/user.model';
import { IssueModel } from '../../models/issue.model';
import bcrypt from 'bcrypt';

describe('Issue Routes Integration Tests', () => {

    // ─── Test Data ───────────────────────────────────────────────────────────────

    const citizenData = {
        email: 'issue.citizen@test.com',
        password: 'password123',
    };

    const authorityData = {
        email: 'issue.authority@test.com',
        password: 'password123',
    };

    const validIssue = {
        title: 'Broken Streetlight on Main Road',
        category: 'Broken Streetlight',
        location: 'Main Road, Near Bus Stop 12',
        description: 'The streetlight has been broken for over a week and causes safety hazards at night.',
    };

    let citizenToken: string;
    let authorityToken: string;
    let citizenId: string;
    let authorityId: string;
    let createdIssueId: string;
    let secondIssueId: string;

    // ─── Hooks ───────────────────────────────────────────────────────────────────

    beforeAll(async () => {
        // Clean up
        await UserModel.deleteMany({
            email: { $in: [citizenData.email, authorityData.email] },
        });
        await IssueModel.deleteMany({ title: { $regex: 'Broken Streetlight on Main Road|Pothole on Test Road|Garbage near Test Park', $options: 'i' } });

        // Seed citizen
        const hashedCitizen = await bcrypt.hash(citizenData.password, 10);
        const citizen = await UserModel.create({
            fullname: 'Issue Test Citizen',
            email: citizenData.email,
            password: hashedCitizen,
            role: 'citizen',
        });
        citizenId = citizen._id.toString();

        // Seed authority
        const hashedAuthority = await bcrypt.hash(authorityData.password, 10);
        const authority = await UserModel.create({
            fullname: 'Issue Test Authority',
            email: authorityData.email,
            password: hashedAuthority,
            role: 'authority',
            department: 'Roads Department',
            employeeId: 'EMP-ISSUE-TEST-01',
            phoneNumber: '9800000055',
        });
        authorityId = authority._id.toString();

        // Login both
        const citizenLogin = await request(app)
            .post('/api/auth/login')
            .send(citizenData);
        citizenToken = citizenLogin.body.token;

        const authorityLogin = await request(app)
            .post('/api/auth/login')
            .send(authorityData);
        authorityToken = authorityLogin.body.token;
    });

    afterAll(async () => {
        await UserModel.deleteMany({
            email: { $in: [citizenData.email, authorityData.email] },
        });
        await IssueModel.deleteMany({
            reportedBy: { $in: [citizenId, authorityId] }
        });
    });

    // ─── POST /api/issues ─────────────────────────────────────────────────────────

    describe('POST /api/issues', () => {

        test('should create a new issue successfully', async () => {
            const res = await request(app)
                .post('/api/issues')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send(validIssue);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Issue reported successfully');
            expect(res.body.data).toBeDefined();
            expect(res.body.data.title).toBe(validIssue.title);
            expect(res.body.data.category).toBe(validIssue.category);
            expect(res.body.data.status).toBe('pending');
            expect(res.body.data.priority).toBe('medium');
            expect(res.body.data.reportedBy).toBeDefined();

            createdIssueId = res.body.data._id;
        });

        test('should create a second issue for filter/search tests', async () => {
            const res = await request(app)
                .post('/api/issues')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({
                    title: 'Pothole on Test Road',
                    category: 'Pothole',
                    location: 'Test Road near Junction 5',
                    description: 'Large pothole that damages vehicles passing through.',
                });

            expect(res.status).toBe(201);
            expect(res.body.data).toBeDefined();
            secondIssueId = res.body.data._id;
        });

        test('should return 400 when title is too short', async () => {
            const res = await request(app)
                .post('/api/issues')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({ ...validIssue, title: 'Hi' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 400 when category is invalid', async () => {
            const res = await request(app)
                .post('/api/issues')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({ ...validIssue, category: 'InvalidCategory' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 400 when description is too short', async () => {
            const res = await request(app)
                .post('/api/issues')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({ ...validIssue, description: 'Too short' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 400 when required fields are missing', async () => {
            const res = await request(app)
                .post('/api/issues')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({ title: 'Some Issue Title Here' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 401 without token', async () => {
            const res = await request(app)
                .post('/api/issues')
                .send(validIssue);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
        });
    });

    // ─── GET /api/issues ──────────────────────────────────────────────────────────

    describe('GET /api/issues', () => {

        test('should return all issues with pagination', async () => {
            const res = await request(app)
                .get('/api/issues')
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Issues retrieved successfully');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination).toHaveProperty('page');
            expect(res.body.pagination).toHaveProperty('totalItems');
        });

        test('should filter issues by status', async () => {
            const res = await request(app)
                .get('/api/issues?status=pending')
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.every((i: any) => i.status === 'pending')).toBe(true);
        });

        test('should filter issues by category', async () => {
            const res = await request(app)
                .get('/api/issues?category=Pothole')
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.every((i: any) => i.category === 'Pothole')).toBe(true);
        });

        test('should support pagination params', async () => {
            const res = await request(app)
                .get('/api/issues?page=1&size=1')
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeLessThanOrEqual(1);
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.size).toBe(1);
        });

        test('should support search query', async () => {
            const res = await request(app)
                .get('/api/issues?search=Pothole')
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });

        test('should return 401 without token', async () => {
            const res = await request(app).get('/api/issues');
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
        });
    });

    // ─── GET /api/issues/my-issues ────────────────────────────────────────────────

    describe('GET /api/issues/my-issues', () => {

        test('should return only the logged-in citizen issues', async () => {
            const res = await request(app)
                .get('/api/issues/my-issues')
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.pagination).toBeDefined();
        });

        test('should return 401 without token', async () => {
            const res = await request(app).get('/api/issues/my-issues');
            expect(res.status).toBe(401);
        });
    });

    // ─── GET /api/issues/my-recent ────────────────────────────────────────────────

    describe('GET /api/issues/my-recent', () => {

        test('should return recent issues for citizen', async () => {
            const res = await request(app)
                .get('/api/issues/my-recent')
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeLessThanOrEqual(5);
        });

        test('should return 401 without token', async () => {
            const res = await request(app).get('/api/issues/my-recent');
            expect(res.status).toBe(401);
        });
    });

    // ─── GET /api/issues/unassigned ───────────────────────────────────────────────

    describe('GET /api/issues/unassigned', () => {

        test('should return unassigned issues with default limit of 5', async () => {
            const res = await request(app)
                .get('/api/issues/unassigned')
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Unassigned issues fetched successfully');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeLessThanOrEqual(5);
        });

        test('should respect custom limit param', async () => {
            const res = await request(app)
                .get('/api/issues/unassigned?limit=2')
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeLessThanOrEqual(2);
        });

        test('should return 401 without token', async () => {
            const res = await request(app).get('/api/issues/unassigned');
            expect(res.status).toBe(401);
        });
    });

    // ─── GET /api/issues/:id ──────────────────────────────────────────────────────

    describe('GET /api/issues/:id', () => {

        test('should return a single issue by id', async () => {
            const res = await request(app)
                .get(`/api/issues/${createdIssueId}`)
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Issue fetched successfully');
            expect(res.body.data._id).toBe(createdIssueId);
            expect(res.body.data.title).toBe(validIssue.title);
            expect(res.body.data.reportedBy).toBeDefined();
        });

        test('should return 404 for non-existent issue id', async () => {
            const res = await request(app)
                .get('/api/issues/000000000000000000000000')
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return error for invalid id format', async () => {
            const res = await request(app)
                .get('/api/issues/notanid')
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 401 without token', async () => {
            const res = await request(app).get(`/api/issues/${createdIssueId}`);
            expect(res.status).toBe(401);
        });
    });

    // ─── PUT /api/issues/:id ──────────────────────────────────────────────────────

    describe('PUT /api/issues/:id', () => {

        test('should update issue title successfully', async () => {
            const res = await request(app)
                .put(`/api/issues/${createdIssueId}`)
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({ title: 'Updated Broken Streetlight Title' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Issue updated successfully');
            expect(res.body.data.title).toBe('Updated Broken Streetlight Title');
        });

        test('should return 404 for non-existent issue', async () => {
            const res = await request(app)
                .put('/api/issues/000000000000000000000000')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({ title: 'Ghost Update Title Here' });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 401 without token', async () => {
            const res = await request(app)
                .put(`/api/issues/${createdIssueId}`)
                .send({ title: 'No Auth Update Title Here' });

            expect(res.status).toBe(401);
        });
    });

    // ─── PATCH /api/issues/:id/assign ─────────────────────────────────────────────

    describe('PATCH /api/issues/:id/assign', () => {

        test('should assign an issue to an authority user', async () => {
            const res = await request(app)
                .patch(`/api/issues/${createdIssueId}/assign`)
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({ assignedTo: authorityId });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Issue assigned successfully');
            expect(res.body.data.status).toBe('in-progress');
            expect(res.body.data.assignedTo).toBeDefined();
        });

        test('should return 400 when assignedTo is missing', async () => {
            const res = await request(app)
                .patch(`/api/issues/${createdIssueId}/assign`)
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('message', 'assignedTo is required');
        });

        test('should return 404 for non-existent issue', async () => {
            const res = await request(app)
                .patch('/api/issues/000000000000000000000000/assign')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({ assignedTo: authorityId });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 401 without token', async () => {
            const res = await request(app)
                .patch(`/api/issues/${createdIssueId}/assign`)
                .send({ assignedTo: authorityId });

            expect(res.status).toBe(401);
        });
    });

    // ─── GET /api/issues/my-assigned ─────────────────────────────────────────────

    describe('GET /api/issues/my-assigned', () => {

        test('should return issues assigned to the authority user', async () => {
            const res = await request(app)
                .get('/api/issues/my-assigned')
                .set('Authorization', `Bearer ${authorityToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Assigned issues retrieved successfully');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.pagination).toBeDefined();
        });

        test('should support status filter on my-assigned', async () => {
            const res = await request(app)
                .get('/api/issues/my-assigned?status=in-progress')
                .set('Authorization', `Bearer ${authorityToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });

        test('should return 401 without token', async () => {
            const res = await request(app).get('/api/issues/my-assigned');
            expect(res.status).toBe(401);
        });
    });

    // ─── PATCH /api/issues/:id/status ─────────────────────────────────────────────

    describe('PATCH /api/issues/:id/status', () => {

        test('should update issue status to in-progress', async () => {
            const res = await request(app)
                .patch(`/api/issues/${secondIssueId}/status`)
                .set('Authorization', `Bearer ${authorityToken}`)
                .send({ status: 'in-progress' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Issue status updated successfully');
            expect(res.body.data.status).toBe('in-progress');
        });

        test('should update issue status to rejected with remarks', async () => {
            const res = await request(app)
                .patch(`/api/issues/${secondIssueId}/status`)
                .set('Authorization', `Bearer ${authorityToken}`)
                .send({ status: 'rejected', remarks: 'Duplicate report already handled' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data.status).toBe('rejected');
            expect(res.body.data.remarks).toBe('Duplicate report already handled');
        });

        test('should return 400 when status is missing', async () => {
            const res = await request(app)
                .patch(`/api/issues/${createdIssueId}/status`)
                .set('Authorization', `Bearer ${authorityToken}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('message', 'Status is required');
        });

        test('should return 404 for non-existent issue', async () => {
            const res = await request(app)
                .patch('/api/issues/000000000000000000000000/status')
                .set('Authorization', `Bearer ${authorityToken}`)
                .send({ status: 'in-progress' });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 401 without token', async () => {
            const res = await request(app)
                .patch(`/api/issues/${createdIssueId}/status`)
                .send({ status: 'in-progress' });

            expect(res.status).toBe(401);
        });
    });

    // ─── PATCH /api/issues/:id/resolve ────────────────────────────────────────────

    describe('PATCH /api/issues/:id/resolve', () => {

        test('should resolve an issue with remarks', async () => {
            const res = await request(app)
                .patch(`/api/issues/${createdIssueId}/resolve`)
                .set('Authorization', `Bearer ${authorityToken}`)
                .send({ remarks: 'Streetlight has been repaired and tested.' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Issue resolved successfully');
            expect(res.body.data.status).toBe('resolved');
            expect(res.body.data.resolvedAt).toBeDefined();
        });

        test('should resolve an issue without remarks', async () => {
            // Create a fresh issue to resolve
            const create = await request(app)
                .post('/api/issues')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({
                    title: 'Garbage near Test Park Area',
                    category: 'Garbage',
                    location: 'Test Park near Gate Number 3',
                    description: 'Garbage has been piling up for several days near the gate.',
                });
            const freshId = create.body.data._id;

            const res = await request(app)
                .patch(`/api/issues/${freshId}/resolve`)
                .set('Authorization', `Bearer ${authorityToken}`)
                .send({});

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data.status).toBe('resolved');
        });

        test('should return 404 for non-existent issue', async () => {
            const res = await request(app)
                .patch('/api/issues/000000000000000000000000/resolve')
                .set('Authorization', `Bearer ${authorityToken}`)
                .send({ remarks: 'Fixed' });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 401 without token', async () => {
            const res = await request(app)
                .patch(`/api/issues/${createdIssueId}/resolve`)
                .send({ remarks: 'Fixed' });

            expect(res.status).toBe(401);
        });
    });

    // ─── DELETE /api/issues/:id ───────────────────────────────────────────────────

    describe('DELETE /api/issues/:id', () => {

        test('should return 404 for non-existent issue', async () => {
            const res = await request(app)
                .delete('/api/issues/000000000000000000000000')
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should delete an issue successfully', async () => {
            const res = await request(app)
                .delete(`/api/issues/${secondIssueId}`)
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Issue deleted successfully');
        });

        test('deleted issue should no longer be fetchable', async () => {
            const res = await request(app)
                .get(`/api/issues/${secondIssueId}`)
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 401 without token', async () => {
            const res = await request(app)
                .delete(`/api/issues/${createdIssueId}`);

            expect(res.status).toBe(401);
        });
    });
});
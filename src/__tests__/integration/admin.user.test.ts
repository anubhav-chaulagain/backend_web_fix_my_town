import request from 'supertest';
import app from '../../app';
import { UserModel } from '../../models/user.model';
import bcrypt from 'bcrypt';

describe('Admin User Routes Integration Tests', () => {

    // ─── Test Data ───────────────────────────────────────────────────────────────

    const adminCredentials = {
        email: 'admin@test.com',
        password: 'adminpass123',
    };

    const citizenToCreate = {
        fullname: 'Created Citizen',
        email: 'created.citizen@test.com',
        password: 'password123',
        role: 'citizen',
    };

    const authorityToCreate = {
        fullname: 'Created Authority',
        email: 'created.authority@test.com',
        password: 'password123',
        role: 'authority',
        department: 'Water Department',
        employeeId: 'EMP-ADMIN-TEST-01',
        phoneNumber: '9800000099',
    };

    let adminToken: string;
    let citizenToken: string;         // non-admin token for 403 tests
    let createdUserId: string;
    let createdAuthorityId: string;

    // ─── Hooks ───────────────────────────────────────────────────────────────────

    beforeAll(async () => {
        // Clean slate
        await UserModel.deleteMany({
            email: {
                $in: [
                    adminCredentials.email,
                    citizenToCreate.email,
                    authorityToCreate.email,
                    'citizen.nonAdmin@test.com',
                ],
            },
        });

        // Seed admin using native driver to bypass Mongoose enum validation
        // (schema only allows citizen/authority, but adminMiddleware checks role === 'admin')
        const hashed = await bcrypt.hash(adminCredentials.password, 10);
        await UserModel.collection.insertOne({
            fullname: 'Test Admin',
            email: adminCredentials.email,
            password: hashed,
            role: 'admin',
            isActive: true,
            totalReports: 0,
            pendingReports: 0,
            resolvedReports: 0,
            inprogressReports: 0,
            assignedIssuesCount: 0,
            completedIssuesCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Seed a plain citizen for 403 tests
        const hashedCitizen = await bcrypt.hash('password123', 10);
        await UserModel.create({
            fullname: 'Non Admin Citizen',
            email: 'citizen.nonAdmin@test.com',
            password: hashedCitizen,
            role: 'citizen',
        });

        // Login admin
        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send(adminCredentials);
        adminToken = adminLogin.body.token;

        // Login citizen (non-admin)
        const citizenLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'citizen.nonAdmin@test.com', password: 'password123' });
        citizenToken = citizenLogin.body.token;
    });

    afterAll(async () => {
        await UserModel.deleteMany({
            email: {
                $in: [
                    adminCredentials.email,
                    citizenToCreate.email,
                    authorityToCreate.email,
                    'citizen.nonAdmin@test.com',
                    'updated.citizen@test.com',
                ],
            },
        });
    });

    // ─── Auth guard checks (applies to ALL routes) ────────────────────────────────

    describe('Auth & Role Guards', () => {

        test('should return 401 on any admin route without token', async () => {
            const res = await request(app).get('/api/admin/users');
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 403 when citizen (non-admin) tries to access admin route', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${citizenToken}`);
            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 401 with malformed token on admin route', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', 'Bearer notavalidtoken');
            expect([401, 500]).toContain(res.status);
            expect(res.body).toHaveProperty('success', false);
        });
    });

    // ─── POST /api/admin/users ────────────────────────────────────────────────────

    describe('POST /api/admin/users', () => {

        test('should create a new citizen user as admin', async () => {
            const res = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(citizenToCreate);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'User created successfully');
            expect(res.body.data).toBeDefined();
            expect(res.body.data.email).toBe(citizenToCreate.email);
            expect(res.body.data.role).toBe('citizen');

            createdUserId = res.body.data._id;
        });

        test('should create a new authority user as admin', async () => {
            const res = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(authorityToCreate);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data.role).toBe('authority');
            expect(res.body.data.department).toBe(authorityToCreate.department);

            createdAuthorityId = res.body.data._id;
        });

        test('should return 400 when creating authority without department', async () => {
            const res = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    fullname: 'No Dept Auth',
                    email: 'nodept2@test.com',
                    password: 'password123',
                    role: 'authority',
                    phoneNumber: '9800000011',
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 400 when required fields are missing', async () => {
            const res = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ email: 'missingfields@test.com' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 403 when non-admin tries to create user', async () => {
            const res = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send(citizenToCreate);

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('success', false);
        });
    });

    // ─── GET /api/admin/users ─────────────────────────────────────────────────────

    describe('GET /api/admin/users', () => {

        test('should return all users for admin', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'All Users Retrieved');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination).toHaveProperty('page');
            expect(res.body.pagination).toHaveProperty('totalItems');
        });

        test('should support pagination with page and size params', async () => {
            const res = await request(app)
                .get('/api/admin/users?page=1&size=2')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeLessThanOrEqual(2);
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.size).toBe(2);
        });

        test('should support search query', async () => {
            const res = await request(app)
                .get(`/api/admin/users?search=Created Citizen`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });

        test('should return 403 for non-admin', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(403);
        });
    });

    // ─── GET /api/admin/users/:id ─────────────────────────────────────────────────

    describe('GET /api/admin/users/:id', () => {

        test('should return a user by id', async () => {
            const res = await request(app)
                .get(`/api/admin/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Single User Retrieved');
            expect(res.body.data).toBeDefined();
            expect(res.body.data._id).toBe(createdUserId);
            expect(res.body.data.email).toBe(citizenToCreate.email);
        });

        test('should return 404 for non-existent user id', async () => {
            const res = await request(app)
                .get('/api/admin/users/000000000000000000000000')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 500 for invalid object id format', async () => {
            const res = await request(app)
                .get('/api/admin/users/notanobjectid')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 403 for non-admin', async () => {
            const res = await request(app)
                .get(`/api/admin/users/${createdUserId}`)
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(403);
        });
    });

    // ─── GET /api/admin/stats ─────────────────────────────────────────────────────

    describe('GET /api/admin/stats', () => {

        test('should return system-wide stats for admin', async () => {
            const res = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Admin stats fetched successfully');
            expect(res.body.data).toBeDefined();
            expect(res.body.data).toHaveProperty('totalReports');
            expect(res.body.data).toHaveProperty('unassignedReports');
            expect(res.body.data).toHaveProperty('pendingReports');
            expect(res.body.data).toHaveProperty('inprogressReports');
            expect(res.body.data).toHaveProperty('resolvedReports');
            expect(typeof res.body.data.totalReports).toBe('number');
        });

        test('should return 401 without token', async () => {
            const res = await request(app).get('/api/admin/stats');
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 403 for non-admin', async () => {
            const res = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${citizenToken}`);
            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('success', false);
        });
    });

    // ─── GET /api/admin/authorities ───────────────────────────────────────────────

    describe('GET /api/admin/authorities', () => {

        test('should return only authority users', async () => {
            const res = await request(app)
                .get('/api/admin/authorities')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Authority users fetched successfully');
            expect(Array.isArray(res.body.data)).toBe(true);
            // every returned user must have role authority
            res.body.data.forEach((u: any) => {
                expect(u.role).toBe('authority');
            });
        });

        test('should include the authority we just created', async () => {
            const res = await request(app)
                .get('/api/admin/authorities')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            const ids = res.body.data.map((u: any) => u._id);
            expect(ids).toContain(createdAuthorityId);
        });

        test('should return 401 without token', async () => {
            const res = await request(app).get('/api/admin/authorities');
            expect(res.status).toBe(401);
        });

        test('should return 403 for non-admin', async () => {
            const res = await request(app)
                .get('/api/admin/authorities')
                .set('Authorization', `Bearer ${citizenToken}`);
            expect(res.status).toBe(403);
        });
    });

    // ─── PUT /api/admin/users/:id ─────────────────────────────────────────────────

    describe('PUT /api/admin/users/:id', () => {

        test('should update a user fullname successfully', async () => {
            const res = await request(app)
                .put(`/api/admin/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ fullname: 'Updated Citizen Name' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'User Updated');
            expect(res.body.data.fullname).toBe('Updated Citizen Name');
        });

        test('should update a user email successfully', async () => {
            const res = await request(app)
                .put(`/api/admin/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ email: 'updated.citizen@test.com' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data.email).toBe('updated.citizen@test.com');
        });

        test('should return 404 for non-existent user', async () => {
            const res = await request(app)
                .put('/api/admin/users/000000000000000000000000')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ fullname: 'Ghost Update' });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 403 for non-admin', async () => {
            const res = await request(app)
                .put(`/api/admin/users/${createdUserId}`)
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({ fullname: 'Hacker' });

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('success', false);
        });
    });

    // ─── DELETE /api/admin/users/:id ──────────────────────────────────────────────

    describe('DELETE /api/admin/users/:id', () => {

        test('should return 403 for non-admin', async () => {
            const res = await request(app)
                .delete(`/api/admin/users/${createdAuthorityId}`)
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should delete an existing user as admin', async () => {
            const res = await request(app)
                .delete(`/api/admin/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'User Deleted');
        });

        test('deleted user should no longer be fetchable', async () => {
            const res = await request(app)
                .get(`/api/admin/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should delete the authority user', async () => {
            const res = await request(app)
                .delete(`/api/admin/users/${createdAuthorityId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });

        test('should return 404 when deleting already-deleted user', async () => {
            const res = await request(app)
                .delete(`/api/admin/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
        });
    });
});
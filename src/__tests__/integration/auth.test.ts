import request from 'supertest';
import app from '../../app';
import { UserModel } from '../../models/user.model';

describe('Auth Routes Integration Tests', () => {

    // ─── Test Data ───────────────────────────────────────────────────────────────

    const citizenUser = {
        fullname: 'Test Citizen',
        email: 'citizen@test.com',
        password: 'password123',
        role: 'citizen',
    };

    const authorityUser = {
        fullname: 'Test Authority',
        email: 'authority@test.com',
        password: 'password123',
        role: 'authority' as const,
        department: 'Roads Department',
        employeeId: 'EMP-TEST-001',
        phoneNumber: '9800000001',
    };

    let citizenToken: string;
    let authorityToken: string;

    // ─── Hooks ───────────────────────────────────────────────────────────────────

    beforeAll(async () => {
        await UserModel.deleteMany({
            email: { $in: [citizenUser.email, authorityUser.email] },
        });
    });

    afterAll(async () => {
        await UserModel.deleteMany({
            email: { $in: [citizenUser.email, authorityUser.email] },
        });
    });

    // ─── POST /api/auth/register ──────────────────────────────────────────────────

    describe('POST /api/auth/register', () => {

        test('should register a new citizen user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(citizenUser);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'User Created');
            expect(res.body.data).toBeDefined();
            expect(res.body.data.email).toBe(citizenUser.email);
            expect(res.body.data.role).toBe('citizen');
        });

        test('should not register with a duplicate email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(citizenUser);

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body.message).toBeDefined();
        });

        test('should not register with missing fullname', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'new@test.com', password: 'password123' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should not register with invalid email format', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ ...citizenUser, email: 'not-an-email', fullname: 'Another User' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should not register with password shorter than 3 characters', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ ...citizenUser, email: 'short@test.com', password: 'ab', fullname: 'Short Pass' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should not register with missing password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ fullname: 'No Pass', email: 'nopass@test.com' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });
    });

    // ─── POST /api/auth/register-authority ───────────────────────────────────────

    describe('POST /api/auth/register-authority', () => {

        test('should register a new authority user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register-authority')
                .send(authorityUser);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Authority user created successfully');
            expect(res.body.data).toBeDefined();
            expect(res.body.data.role).toBe('authority');
            expect(res.body.data.department).toBe(authorityUser.department);
        });

        test('should not register authority with duplicate email', async () => {
            const res = await request(app)
                .post('/api/auth/register-authority')
                .send(authorityUser);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should not register authority without department', async () => {
            const res = await request(app)
                .post('/api/auth/register-authority')
                .send({
                    fullname: 'No Dept',
                    email: 'nodept@test.com',
                    password: 'password123',
                    role: 'authority',
                    phoneNumber: '9800000002',
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should not register authority without phoneNumber', async () => {
            const res = await request(app)
                .post('/api/auth/register-authority')
                .send({
                    fullname: 'No Phone',
                    email: 'nophone@test.com',
                    password: 'password123',
                    role: 'authority',
                    department: 'Roads',
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should not register authority with role other than authority', async () => {
            const res = await request(app)
                .post('/api/auth/register-authority')
                .send({
                    ...authorityUser,
                    email: 'wrongrole@test.com',
                    role: 'citizen', // must be 'authority'
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });
    });

    // ─── POST /api/auth/login ─────────────────────────────────────────────────────

    describe('POST /api/auth/login', () => {

        test('should login citizen user and return token', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: citizenUser.email, password: citizenUser.password });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Login successful');
            expect(res.body.token).toBeDefined();
            expect(res.body.data).toBeDefined();
            expect(res.body.data.email).toBe(citizenUser.email);

            citizenToken = res.body.token; // save for protected route tests
        });

        test('should login authority user and return token', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: authorityUser.email, password: authorityUser.password });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.token).toBeDefined();

            authorityToken = res.body.token;
        });

        test('should not login with wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: citizenUser.email, password: 'wrongpassword' });

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should not login with non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'ghost@test.com', password: 'password123' });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should not login with missing email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ password: 'password123' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should not login with missing password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: citizenUser.email });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should not login with invalid email format', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'not-an-email', password: 'password123' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });
    });

    // ─── GET /api/auth/report-stats ───────────────────────────────────────────────

    describe('GET /api/auth/report-stats', () => {

        test('should return report stats for authenticated citizen', async () => {
            const res = await request(app)
                .get('/api/auth/report-stats')
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toBeDefined();
            expect(res.body.data).toHaveProperty('totalReports');
            expect(res.body.data).toHaveProperty('pendingReports');
            expect(res.body.data).toHaveProperty('resolvedReports');
            expect(res.body.data).toHaveProperty('inprogressReports');
            expect(typeof res.body.data.totalReports).toBe('number');
        });

        test('should return 401 without token', async () => {
            const res = await request(app)
                .get('/api/auth/report-stats');

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 401 or 500 with malformed token', async () => {
            const res = await request(app)
                .get('/api/auth/report-stats')
                .set('Authorization', 'Bearer invalidtoken123');

            expect([401, 500]).toContain(res.status);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 401 with no Bearer prefix', async () => {
            const res = await request(app)
                .get('/api/auth/report-stats')
                .set('Authorization', citizenToken); // missing "Bearer "

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
        });
    });

    // ─── GET /api/auth/authority-stats ───────────────────────────────────────────

    describe('GET /api/auth/authority-stats', () => {

        test('should return authority stats for authenticated authority user', async () => {
            const res = await request(app)
                .get('/api/auth/authority-stats')
                .set('Authorization', `Bearer ${authorityToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toBeDefined();
            expect(res.body.data).toHaveProperty('assignedIssues');
            expect(res.body.data).toHaveProperty('completedIssues');
            expect(res.body.data).toHaveProperty('department');
        });

        test('should return 403 for citizen user (authority-only route)', async () => {
            const res = await request(app)
                .get('/api/auth/authority-stats')
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 401 without token', async () => {
            const res = await request(app)
                .get('/api/auth/authority-stats');

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
        });
    });

    // ─── POST /api/auth/request-password-reset ────────────────────────────────────

    describe('POST /api/auth/request-password-reset', () => {

        test('should return 200 for existing email', async () => {
            const res = await request(app)
                .post('/api/auth/request-password-reset')
                .send({ email: citizenUser.email });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Password reset email sent');
        });

        test('should return 404 for non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/request-password-reset')
                .send({ email: 'ghost@nowhere.com' });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 400 when email is missing from body', async () => {
            const res = await request(app)
                .post('/api/auth/request-password-reset')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('message', 'Email is required');
        });
    });

    // ─── POST /api/auth/reset-password/:token ────────────────────────────────────

    describe('POST /api/auth/reset-password/:token', () => {

        test('should return 400 or 404 for invalid/expired token', async () => {
            const res = await request(app)
                .post('/api/auth/reset-password/thisisaninvalidtoken')
                .send({ newPassword: 'newpassword123' });

            expect([400, 404]).toContain(res.status);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should return 400 when newPassword is missing', async () => {
            const res = await request(app)
                .post('/api/auth/reset-password/sometoken')
                .send({});

            // Service will either throw on missing password or fail token lookup first
            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.body).toHaveProperty('success', false);
        });
    });

});
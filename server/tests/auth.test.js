const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../index');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const authService = require('../services/authService');

// Test database
const MONGODB_URI = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/placementdb_test';

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await StudentProfile.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new student successfully', async () => {
      const userData = {
        name: { first: 'John', last: 'Doe' },
        email: 'john.doe@test.com',
        password: 'password123',
        role: 'student',
        rollNo: 'STU001',
        program: 'Computer Science',
        batch: '2024'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.role).toBe(userData.role);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      // Check if student profile was created
      const studentProfile = await StudentProfile.findOne({ userId: response.body.data.user._id });
      expect(studentProfile).toBeTruthy();
      expect(studentProfile.rollNo).toBe(userData.rollNo);
    });

    it('should register a trainer successfully', async () => {
      const userData = {
        name: { first: 'Jane', last: 'Smith' },
        email: 'jane.smith@test.com',
        password: 'password123',
        role: 'trainer'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('trainer');
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        name: { first: 'John', last: 'Doe' },
        email: 'john.doe@test.com',
        password: 'password123',
        role: 'student',
        rollNo: 'STU001',
        program: 'Computer Science',
        batch: '2024'
      };

      // Register first user
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return validation error for invalid data', async () => {
      const userData = {
        name: { first: 'John' }, // Missing last name
        email: 'invalid-email', // Invalid email
        password: '123', // Too short password
        role: 'student'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      // Register a student through the actual auth route, then approve the created profile
      const userData = {
        name: { first: 'John', last: 'Doe' },
        email: 'john.doe@test.com',
        password: 'password123',
        role: 'student',
        rollNo: 'STU001',
        program: 'Computer Science',
        batch: '2024',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      testUser = response.body.data.user;

      const studentProfile = await StudentProfile.findOne({ userId: testUser._id });
      if (studentProfile) {
        studentProfile.approvalStatus = 'approved';
        await studentProfile.save();
      }
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'john.doe@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return error for invalid email', async () => {
      const loginData = {
        email: 'wrong@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should return error for invalid password', async () => {
      const loginData = {
        email: 'john.doe@test.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email or password');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let accessToken;
    let fixtureEmail;

    beforeEach(async () => {
      // Create an approved student user directly and generate a JWT via authService
      const uniqueSuffix = Date.now();
      fixtureEmail = `john.doe+${uniqueSuffix}@test.com`;

      const user = await User.create({
        name: { first: 'John', last: 'Doe' },
        email: fixtureEmail,
        passwordHash: 'password123',
        role: 'student',
      });

      await StudentProfile.create({
        userId: user._id,
        rollNo: 'STU001',
        program: 'Computer Science',
        batch: '2024',
        approvalStatus: 'approved',
      });

      accessToken = authService.generateAccessToken(user._id);
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(fixtureEmail);
      expect(response.body.data.role).toBe('student');
      expect(response.body.data.studentProfile).toBeDefined();
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Access denied. No token provided.');
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Invalid token.');
    });
  });
});

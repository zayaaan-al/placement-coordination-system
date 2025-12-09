const matchingService = require('../services/matchingService');
const StudentProfile = require('../models/StudentProfile');
const JobPosting = require('../models/JobPosting');
const User = require('../models/User');
const mongoose = require('mongoose');

// Test database
const MONGODB_URI = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/placementdb_test';

describe('Matching Service', () => {
  let testStudent, testJob, testUser;

  beforeAll(async () => {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await StudentProfile.deleteMany({});
    await JobPosting.deleteMany({});

    // Create test user
    testUser = await User.create({
      name: { first: 'John', last: 'Doe' },
      email: 'john.doe@test.com',
      passwordHash: 'hashedpassword',
      role: 'student'
    });

    // Create test student profile
    testStudent = await StudentProfile.create({
      userId: testUser._id,
      rollNo: 'STU001',
      program: 'Computer Science',
      batch: '2024',
      skills: [
        { name: 'JavaScript', level: 85 },
        { name: 'React', level: 80 },
        { name: 'Node.js', level: 75 },
        { name: 'Python', level: 70 }
      ],
      tests: [
        { title: 'Test 1', date: new Date(), score: 85, maxScore: 100 },
        { title: 'Test 2', date: new Date(), score: 90, maxScore: 100 }
      ],
      trainerRemarks: [
        { trainerId: new mongoose.Types.ObjectId(), date: new Date(), remark: 'Good work', rating: 4 },
        { trainerId: new mongoose.Types.ObjectId(), date: new Date(), remark: 'Excellent', rating: 5 }
      ],
      placementStatus: 'approved',
      placementEligible: true,
      aggregateScore: 87
    });

    // Create test job
    testJob = await JobPosting.create({
      coordinatorId: new mongoose.Types.ObjectId(),
      title: 'Frontend Developer',
      description: 'Frontend development role',
      company: { name: 'Test Company' },
      requiredSkills: [
        { name: 'JavaScript', minLevel: 80 },
        { name: 'React', minLevel: 75 }
      ],
      minAggregateScore: 80,
      positions: 2,
      location: 'Test City',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'open'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('calculateMatchScore', () => {
    it('should calculate correct match score for well-matched student', async () => {
      const studentData = testStudent.toObject();
      const jobData = testJob.toObject();
      
      const result = matchingService.calculateMatchScore(
        studentData,
        jobData,
        matchingService.DEFAULT_WEIGHTS,
        true
      );

      expect(result.totalScore).toBeGreaterThan(80);
      expect(result.explanation).toBeDefined();
      expect(result.explanation.skillScore).toBeDefined();
      expect(result.explanation.testScore).toBeDefined();
      expect(result.explanation.trainerScore).toBeDefined();
    });

    it('should return lower score for poorly matched student', async () => {
      // Create a student with low skills
      const poorStudent = {
        ...testStudent.toObject(),
        skills: [
          { name: 'PHP', level: 30 },
          { name: 'WordPress', level: 40 }
        ],
        aggregateScore: 45
      };

      const result = matchingService.calculateMatchScore(
        poorStudent,
        testJob.toObject(),
        matchingService.DEFAULT_WEIGHTS
      );

      expect(result.totalScore).toBeLessThan(50);
    });

    it('should handle student with no skills', async () => {
      const noSkillsStudent = {
        ...testStudent.toObject(),
        skills: [],
        aggregateScore: 60
      };

      const result = matchingService.calculateMatchScore(
        noSkillsStudent,
        testJob.toObject(),
        matchingService.DEFAULT_WEIGHTS
      );

      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    it('should apply custom weights correctly', async () => {
      const customWeights = { skills: 0.8, tests: 0.1, trainer: 0.1 };
      
      const result = matchingService.calculateMatchScore(
        testStudent.toObject(),
        testJob.toObject(),
        customWeights,
        true
      );

      expect(result.explanation.weights).toEqual(customWeights);
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateSkillMatchScore', () => {
    it('should return 100 for job with no required skills', () => {
      const score = matchingService.calculateSkillMatchScore(
        testStudent.toObject(),
        []
      );
      expect(score).toBe(100);
    });

    it('should return 0 for student with no skills', () => {
      const score = matchingService.calculateSkillMatchScore(
        { skills: [] },
        testJob.requiredSkills
      );
      expect(score).toBe(0);
    });

    it('should calculate partial matches correctly', () => {
      const student = {
        skills: [
          { name: 'JavaScript', level: 85 }, // Exceeds requirement (80)
          { name: 'Python', level: 60 }      // Below React requirement (75)
        ]
      };

      const requiredSkills = [
        { name: 'JavaScript', minLevel: 80 },
        { name: 'React', minLevel: 75 }
      ];

      const score = matchingService.calculateSkillMatchScore(student, requiredSkills);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
    });
  });

  describe('findCandidatesForJob', () => {
    it('should find eligible candidates for job', async () => {
      const candidates = await matchingService.findCandidatesForJob(testJob._id, {
        limit: 10,
        includeExplanation: true
      });

      expect(Array.isArray(candidates)).toBe(true);
      expect(candidates.length).toBeGreaterThan(0);
      
      const candidate = candidates[0];
      expect(candidate.student).toBeDefined();
      expect(candidate.matchScore).toBeGreaterThanOrEqual(0);
      expect(candidate.matchScore).toBeLessThanOrEqual(100);
      expect(candidate.explanation).toBeDefined();
    });

    it('should return empty array for job with very high requirements', async () => {
      // Create job with impossible requirements
      const impossibleJob = await JobPosting.create({
        coordinatorId: new mongoose.Types.ObjectId(),
        title: 'Impossible Job',
        description: 'Job with impossible requirements',
        company: { name: 'Test Company' },
        requiredSkills: [
          { name: 'JavaScript', minLevel: 99 },
          { name: 'React', minLevel: 99 }
        ],
        minAggregateScore: 99,
        positions: 1,
        location: 'Test City',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'open'
      });

      const candidates = await matchingService.findCandidatesForJob(impossibleJob._id);
      expect(candidates.length).toBe(0);
    });

    it('should respect limit parameter', async () => {
      // Create multiple students
      for (let i = 0; i < 5; i++) {
        const user = await User.create({
          name: { first: `Student${i}`, last: 'Test' },
          email: `student${i}@test.com`,
          passwordHash: 'hashedpassword',
          role: 'student'
        });

        await StudentProfile.create({
          userId: user._id,
          rollNo: `STU00${i}`,
          program: 'Computer Science',
          batch: '2024',
          skills: [
            { name: 'JavaScript', level: 80 + i },
            { name: 'React', level: 75 + i }
          ],
          aggregateScore: 80 + i,
          placementStatus: 'approved',
          placementEligible: true
        });
      }

      const candidates = await matchingService.findCandidatesForJob(testJob._id, {
        limit: 3
      });

      expect(candidates.length).toBeLessThanOrEqual(3);
    });
  });

  describe('explainMatchScore', () => {
    it('should provide detailed explanation for match score', async () => {
      const explanation = await matchingService.explainMatchScore(
        testUser._id,
        testJob._id
      );

      expect(explanation.totalScore).toBeDefined();
      expect(explanation.explanation).toBeDefined();
      expect(explanation.explanation.skillScore).toBeDefined();
      expect(explanation.explanation.testScore).toBeDefined();
      expect(explanation.explanation.trainerScore).toBeDefined();
      expect(explanation.explanation.weights).toBeDefined();
    });

    it('should throw error for non-existent student', async () => {
      const fakeStudentId = new mongoose.Types.ObjectId();
      
      await expect(
        matchingService.explainMatchScore(fakeStudentId, testJob._id)
      ).rejects.toThrow('Student not found');
    });

    it('should throw error for non-existent job', async () => {
      const fakeJobId = new mongoose.Types.ObjectId();
      
      await expect(
        matchingService.explainMatchScore(testUser._id, fakeJobId)
      ).rejects.toThrow('Job not found');
    });
  });
});

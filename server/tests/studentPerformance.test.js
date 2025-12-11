const request = require('supertest')
const mongoose = require('mongoose')
const { app } = require('../index')
const User = require('../models/User')
const StudentProfile = require('../models/StudentProfile')
const StudentEvaluation = require('../models/StudentEvaluation')
const authService = require('../services/authService')

const MONGODB_URI = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/placementdb_test'

describe('Student performance endpoints', () => {
  let studentUser
  let studentToken
  let studentProfile

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
    }
  })

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      StudentProfile.deleteMany({}),
      StudentEvaluation.deleteMany({}),
    ])

    // Create student user + profile manually to avoid going through full registration
    studentUser = await User.create({
      name: { first: 'Perf', last: 'Student' },
      email: 'perf.student@test.com',
      passwordHash: 'Password123!',
      role: 'student',
      isActive: true,
    })

    studentProfile = await StudentProfile.create({
      userId: studentUser._id,
      rollNo: 'PERF001',
      program: 'CS',
      batch: '2025',
      approvalStatus: 'approved',
      placementStatus: 'approved',
      placementEligible: true,
    })

    // Directly generate JWT using authService to avoid login constraints
    studentToken = authService.generateAccessToken(studentUser._id)
    expect(studentToken).toBeDefined()
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  it('denies access to /students/me/performance for non-students', async () => {
    const trainer = await User.create({
      name: { first: 'T', last: 'Rainer' },
      email: 'trainer@test.com',
      passwordHash: 'Password123!',
      role: 'trainer',
      isActive: true,
    })

    const trainerToken = authService.generateAccessToken(trainer._id)

    const res = await request(app)
      .get('/api/v1/students/me/performance')
      .set('Authorization', `Bearer ${trainerToken}`)

    expect(res.status).toBe(403)
  })

  it('returns grouped performance data only for the authenticated student', async () => {
    // Create a second student evaluation to ensure filtering by studentUserId
    const otherUser = await User.create({
      name: { first: 'Other', last: 'Student' },
      email: 'other.student@test.com',
      passwordHash: 'Password123!',
      role: 'student',
      isActive: true,
    })

    await StudentProfile.create({
      userId: otherUser._id,
      rollNo: 'PERF002',
      program: 'CS',
      batch: '2025',
    })

    const now = new Date()

    await StudentEvaluation.create({
      studentProfileId: studentProfile._id,
      studentUserId: studentUser._id,
      trainerId: new mongoose.Types.ObjectId(),
      type: 'aptitude',
      frequency: 'weekly',
      recordedDate: now,
      periodStart: now,
      periodEnd: now,
      periodLabel: 'Week of test',
      score: 20,
      maxScore: 25,
    })

    const otherProfile = await StudentProfile.findOne({ userId: otherUser._id })

    await StudentEvaluation.create({
      studentProfileId: otherProfile._id,
      studentUserId: otherUser._id,
      trainerId: new mongoose.Types.ObjectId(),
      type: 'aptitude',
      frequency: 'weekly',
      recordedDate: now,
      periodStart: now,
      periodEnd: now,
      periodLabel: 'Week of other',
      score: 5,
      maxScore: 25,
    })

    const res = await request(app)
      .get('/api/v1/students/me/performance')
      .set('Authorization', `Bearer ${studentToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    const { evaluations, groupedByYearMonth } = res.body.data

    // Only one evaluation (belonging to the authenticated student) should be visible
    expect(evaluations).toHaveLength(1)
    expect(String(evaluations[0].studentUserId)).toBe(String(studentUser._id))

    // Grouped structure should contain at least one month bucket
    const years = Object.values(groupedByYearMonth || {})
    expect(years.length).toBeGreaterThan(0)
  })

  it('returns hero metrics for the latest month in /students/me/performance/latest', async () => {
    const now = new Date()

    await StudentEvaluation.create({
      studentProfileId: (await StudentProfile.findOne({ userId: studentUser._id }))._id,
      studentUserId: studentUser._id,
      trainerId: new mongoose.Types.ObjectId(),
      type: 'aptitude',
      frequency: 'weekly',
      recordedDate: now,
      periodStart: now,
      periodEnd: now,
      periodLabel: 'Week of test',
      score: 22,
      maxScore: 25,
    })

    const res = await request(app)
      .get('/api/v1/students/me/performance/latest')
      .set('Authorization', `Bearer ${studentToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toBeTruthy()
    expect(res.body.data.averagePercentage).toBeGreaterThan(0)
    expect(res.body.data.period).toBeDefined()
  })

  it('alerts when there are updates after the since parameter', async () => {
    const now = new Date()

    const evalDoc = await StudentEvaluation.create({
      studentProfileId: studentProfile._id,
      studentUserId: studentUser._id,
      trainerId: new mongoose.Types.ObjectId(),
      type: 'aptitude',
      frequency: 'weekly',
      recordedDate: now,
      periodStart: now,
      periodEnd: now,
      periodLabel: 'Week initial',
      score: 18,
      maxScore: 25,
    })

    const firstRes = await request(app)
      .get('/api/v1/students/me/performance/alerts')
      .query({ since: new Date(Date.now() + 60 * 1000).toISOString() })
      .set('Authorization', `Bearer ${studentToken}`)

    expect(firstRes.status).toBe(200)
    expect(firstRes.body.success).toBe(true)
    expect(firstRes.body.data.hasUpdates).toBe(false)

    // Simulate an update by bumping updatedAt
    evalDoc.score = 20
    await evalDoc.save()

    const secondRes = await request(app)
      .get('/api/v1/students/me/performance/alerts')
      .query({ since: new Date(Date.now() - 60 * 1000).toISOString() })
      .set('Authorization', `Bearer ${studentToken}`)

    expect(secondRes.status).toBe(200)
    expect(secondRes.body.success).toBe(true)
    expect(secondRes.body.data.hasUpdates).toBe(true)
  })
})

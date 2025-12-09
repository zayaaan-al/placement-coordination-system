const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TrainerEvaluation = require('../models/TrainerEvaluation');
const JobPosting = require('../models/JobPosting');
const Notification = require('../models/Notification');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/placementdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      StudentProfile.deleteMany({}),
      TrainerEvaluation.deleteMany({}),
      JobPosting.deleteMany({}),
      Notification.deleteMany({})
    ]);

    console.log('🗑️  Cleared existing data');

    // Create coordinator
    const coordinator = await User.create({
      name: { first: 'John', last: 'Coordinator' },
      email: 'coordinator@placement.com',
      passwordHash: 'password123',
      role: 'coordinator',
      profile: {
        phone: '+1234567890',
        bio: 'Placement Coordinator managing student placements and job opportunities.'
      }
    });

    console.log('👨‍💼 Created coordinator');

    // Create trainers
    const trainers = await User.create([
      {
        name: { first: 'Sarah', last: 'Johnson' },
        email: 'sarah.trainer@placement.com',
        passwordHash: 'password123',
        role: 'trainer',
        profile: {
          phone: '+1234567891',
          bio: 'Senior trainer specializing in web development and programming fundamentals.'
        }
      },
      {
        name: { first: 'Michael', last: 'Chen' },
        email: 'michael.trainer@placement.com',
        passwordHash: 'password123',
        role: 'trainer',
        profile: {
          phone: '+1234567892',
          bio: 'Data science and machine learning trainer with industry experience.'
        }
      }
    ]);

    console.log('👨‍🏫 Created trainers');

    // Create students
    const students = await User.create([
      // Batch 2023
      {
        name: { first: 'Alice', last: 'Smith' },
        email: 'alice.student@placement.com',
        passwordHash: 'password123',
        role: 'student',
        profile: { phone: '+1234567893' }
      },
      {
        name: { first: 'Bob', last: 'Wilson' },
        email: 'bob.student@placement.com',
        passwordHash: 'password123',
        role: 'student',
        profile: { phone: '+1234567894' }
      },
      {
        name: { first: 'Carol', last: 'Davis' },
        email: 'carol.student@placement.com',
        passwordHash: 'password123',
        role: 'student',
        profile: { phone: '+1234567895' }
      },
      {
        name: { first: 'David', last: 'Brown' },
        email: 'david.student@placement.com',
        passwordHash: 'password123',
        role: 'student',
        profile: { phone: '+1234567896' }
      },
      {
        name: { first: 'Emma', last: 'Taylor' },
        email: 'emma.student@placement.com',
        passwordHash: 'password123',
        role: 'student',
        profile: { phone: '+1234567897' }
      },
      {
        name: { first: 'Frank', last: 'Miller' },
        email: 'frank.student@placement.com',
        passwordHash: 'password123',
        role: 'student',
        profile: { phone: '+1234567898' }
      },
      // Batch 2024
      {
        name: { first: 'Grace', last: 'Anderson' },
        email: 'grace.student@placement.com',
        passwordHash: 'password123',
        role: 'student',
        profile: { phone: '+1234567899' }
      },
      {
        name: { first: 'Henry', last: 'Thomas' },
        email: 'henry.student@placement.com',
        passwordHash: 'password123',
        role: 'student',
        profile: { phone: '+1234567800' }
      },
      {
        name: { first: 'Ivy', last: 'Jackson' },
        email: 'ivy.student@placement.com',
        passwordHash: 'password123',
        role: 'student',
        profile: { phone: '+1234567801' }
      },
      {
        name: { first: 'Jack', last: 'White' },
        email: 'jack.student@placement.com',
        passwordHash: 'password123',
        role: 'student',
        profile: { phone: '+1234567802' }
      },
      {
        name: { first: 'Kate', last: 'Harris' },
        email: 'kate.student@placement.com',
        passwordHash: 'password123',
        role: 'student',
        profile: { phone: '+1234567803' }
      },
      {
        name: { first: 'Leo', last: 'Martin' },
        email: 'leo.student@placement.com',
        passwordHash: 'password123',
        role: 'student',
        profile: { phone: '+1234567804' }
      }
    ]);

    console.log('👨‍🎓 Created students');

    // Create student profiles
    const studentProfiles = [];
    const skillSets = [
      [
        { name: 'JavaScript', level: 85, tags: ['frontend', 'backend'] },
        { name: 'React', level: 80, tags: ['frontend', 'ui'] },
        { name: 'Node.js', level: 75, tags: ['backend', 'api'] },
        { name: 'MongoDB', level: 70, tags: ['database', 'nosql'] }
      ],
      [
        { name: 'Python', level: 90, tags: ['backend', 'data'] },
        { name: 'Django', level: 85, tags: ['backend', 'web'] },
        { name: 'PostgreSQL', level: 80, tags: ['database', 'sql'] },
        { name: 'Docker', level: 65, tags: ['devops', 'containers'] }
      ],
      [
        { name: 'Java', level: 88, tags: ['backend', 'enterprise'] },
        { name: 'Spring Boot', level: 82, tags: ['backend', 'framework'] },
        { name: 'MySQL', level: 85, tags: ['database', 'sql'] },
        { name: 'AWS', level: 60, tags: ['cloud', 'devops'] }
      ],
      [
        { name: 'React', level: 92, tags: ['frontend', 'ui'] },
        { name: 'TypeScript', level: 85, tags: ['frontend', 'types'] },
        { name: 'GraphQL', level: 75, tags: ['api', 'query'] },
        { name: 'Jest', level: 70, tags: ['testing', 'unit'] }
      ]
    ];

    const programs = ['Computer Science', 'Software Engineering', 'Data Science', 'Web Development'];
    const batches = ['2023', '2024'];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const batch = i < 6 ? '2023' : '2024';
      const program = programs[i % programs.length];
      const skills = skillSets[i % skillSets.length];

      const profile = await StudentProfile.create({
        userId: student._id,
        rollNo: `STU${2023 + (i < 6 ? 0 : 1)}${String(i + 1).padStart(3, '0')}`,
        program,
        batch,
        skills,
        tests: [
          {
            title: 'Programming Fundamentals',
            date: new Date(2024, 0, 15 + i),
            score: 75 + Math.floor(Math.random() * 20),
            maxScore: 100,
            subjectBreakdown: [
              { subject: 'Theory', marks: 35 + Math.floor(Math.random() * 15) },
              { subject: 'Practical', marks: 40 + Math.floor(Math.random() * 10) }
            ]
          },
          {
            title: 'Web Development Assessment',
            date: new Date(2024, 1, 10 + i),
            score: 80 + Math.floor(Math.random() * 15),
            maxScore: 100,
            subjectBreakdown: [
              { subject: 'Frontend', marks: 42 + Math.floor(Math.random() * 8) },
              { subject: 'Backend', marks: 38 + Math.floor(Math.random() * 12) }
            ]
          }
        ],
        trainerRemarks: [
          {
            trainerId: trainers[0]._id,
            date: new Date(2024, 1, 20 + i),
            remark: 'Shows good understanding of core concepts. Needs improvement in problem-solving speed.',
            rating: 3 + Math.floor(Math.random() * 2)
          },
          {
            trainerId: trainers[1]._id,
            date: new Date(2024, 2, 5 + i),
            remark: 'Excellent participation in class. Strong technical skills and good teamwork.',
            rating: 4 + Math.floor(Math.random() * 2)
          }
        ],
        placementStatus: i < 8 ? 'approved' : 'not_approved'
      });

      studentProfiles.push(profile);
    }

    console.log('📋 Created student profiles');

    // Create trainer evaluations
    const evaluations = [];
    for (let i = 0; i < studentProfiles.length; i++) {
      const profile = studentProfiles[i];
      const trainer = trainers[i % trainers.length];

      const evaluation = await TrainerEvaluation.create({
        trainerId: trainer._id,
        studentId: profile.userId,
        evaluationDate: new Date(2024, 2, 10 + i),
        skillsEvaluated: profile.skills.map(skill => ({
          skillName: skill.name,
          score: skill.level + Math.floor(Math.random() * 10) - 5,
          remark: `Good progress in ${skill.name}`
        })),
        overallRating: 3 + Math.floor(Math.random() * 3),
        generalFeedback: 'Student shows consistent improvement and dedication to learning.',
        technicalSkills: 3 + Math.floor(Math.random() * 3),
        communicationSkills: 3 + Math.floor(Math.random() * 3),
        problemSolving: 3 + Math.floor(Math.random() * 3),
        teamwork: 4 + Math.floor(Math.random() * 2),
        punctuality: 4 + Math.floor(Math.random() * 2)
      });

      evaluations.push(evaluation);
    }

    console.log('📊 Created trainer evaluations');

    // Create job postings
    const jobs = await JobPosting.create([
      {
        coordinatorId: coordinator._id,
        title: 'Frontend Developer',
        description: 'We are looking for a skilled Frontend Developer to join our team. You will be responsible for building user-facing features using modern JavaScript frameworks.',
        company: {
          name: 'TechCorp Solutions',
          website: 'https://techcorp.com',
          logo: 'https://via.placeholder.com/100x100'
        },
        requiredSkills: [
          { name: 'JavaScript', minLevel: 80 },
          { name: 'React', minLevel: 75 },
          { name: 'CSS', minLevel: 70 }
        ],
        minAggregateScore: 75,
        positions: 2,
        location: 'San Francisco, CA',
        salary: { min: 80000, max: 120000, currency: 'USD' },
        jobType: 'full-time',
        experience: { min: 0, max: 2 },
        deadline: new Date(2024, 11, 31),
        eligibleBatches: ['2023', '2024'],
        eligiblePrograms: ['Computer Science', 'Software Engineering', 'Web Development']
      },
      {
        coordinatorId: coordinator._id,
        title: 'Backend Developer',
        description: 'Join our backend team to build scalable APIs and microservices. Experience with cloud platforms is a plus.',
        company: {
          name: 'DataFlow Inc',
          website: 'https://dataflow.com',
          logo: 'https://via.placeholder.com/100x100'
        },
        requiredSkills: [
          { name: 'Python', minLevel: 85 },
          { name: 'Django', minLevel: 80 },
          { name: 'PostgreSQL', minLevel: 75 }
        ],
        minAggregateScore: 80,
        positions: 3,
        location: 'New York, NY',
        salary: { min: 90000, max: 140000, currency: 'USD' },
        jobType: 'full-time',
        experience: { min: 0, max: 3 },
        deadline: new Date(2024, 11, 15),
        eligibleBatches: ['2023'],
        eligiblePrograms: ['Computer Science', 'Data Science']
      },
      {
        coordinatorId: coordinator._id,
        title: 'Full Stack Developer',
        description: 'Looking for a versatile full-stack developer to work on both frontend and backend technologies.',
        company: {
          name: 'StartupXYZ',
          website: 'https://startupxyz.com',
          logo: 'https://via.placeholder.com/100x100'
        },
        requiredSkills: [
          { name: 'JavaScript', minLevel: 80 },
          { name: 'Node.js', minLevel: 75 },
          { name: 'React', minLevel: 70 },
          { name: 'MongoDB', minLevel: 65 }
        ],
        minAggregateScore: 70,
        positions: 1,
        location: 'Austin, TX',
        salary: { min: 70000, max: 110000, currency: 'USD' },
        jobType: 'full-time',
        experience: { min: 0, max: 2 },
        deadline: new Date(2024, 10, 30),
        eligibleBatches: ['2023', '2024']
      },
      {
        coordinatorId: coordinator._id,
        title: 'Software Engineering Intern',
        description: 'Great opportunity for students to gain hands-on experience in software development.',
        company: {
          name: 'MegaCorp Enterprise',
          website: 'https://megacorp.com',
          logo: 'https://via.placeholder.com/100x100'
        },
        requiredSkills: [
          { name: 'Java', minLevel: 70 },
          { name: 'Spring Boot', minLevel: 60 }
        ],
        minAggregateScore: 65,
        positions: 5,
        location: 'Seattle, WA',
        salary: { min: 4000, max: 6000, currency: 'USD' },
        jobType: 'internship',
        experience: { min: 0, max: 1 },
        deadline: new Date(2024, 9, 15),
        eligibleBatches: ['2024']
      },
      {
        coordinatorId: coordinator._id,
        title: 'Data Analyst',
        description: 'Analyze large datasets and provide insights to drive business decisions.',
        company: {
          name: 'Analytics Pro',
          website: 'https://analyticspro.com',
          logo: 'https://via.placeholder.com/100x100'
        },
        requiredSkills: [
          { name: 'Python', minLevel: 80 },
          { name: 'SQL', minLevel: 85 },
          { name: 'Tableau', minLevel: 70 }
        ],
        minAggregateScore: 78,
        positions: 2,
        location: 'Chicago, IL',
        salary: { min: 65000, max: 95000, currency: 'USD' },
        jobType: 'full-time',
        experience: { min: 0, max: 2 },
        deadline: new Date(2024, 11, 20),
        eligibleBatches: ['2023'],
        eligiblePrograms: ['Data Science', 'Computer Science']
      }
    ]);

    console.log('💼 Created job postings');

    // Add some job applications
    for (let i = 0; i < 3; i++) {
      const job = jobs[i];
      const applicableStudents = studentProfiles.filter(profile => 
        profile.placementEligible && 
        profile.aggregateScore >= job.minAggregateScore
      );

      // Add 2-3 applications per job
      const numApplications = Math.min(3, applicableStudents.length);
      for (let j = 0; j < numApplications; j++) {
        const student = applicableStudents[j];
        job.applicants.push({
          studentId: student.userId,
          appliedDate: new Date(2024, 2, 15 + j),
          status: j === 0 ? 'shortlisted' : 'applied',
          matchScore: 70 + Math.floor(Math.random() * 25)
        });
      }

      await job.save();
    }

    console.log('📝 Added job applications');

    // Create sample notifications
    const notifications = [];
    for (let i = 0; i < studentProfiles.length; i++) {
      const profile = studentProfiles[i];
      
      notifications.push(
        {
          userId: profile.userId,
          title: 'New Job Match Found',
          message: `A new job "${jobs[i % jobs.length].title}" matches your profile with ${70 + Math.floor(Math.random() * 25)}% compatibility.`,
          type: 'job_match',
          priority: 'medium',
          relatedEntity: { type: 'job', id: jobs[i % jobs.length]._id }
        },
        {
          userId: profile.userId,
          title: 'Test Result Added',
          message: 'Your latest test result has been added to your profile.',
          type: 'test_result',
          priority: 'low',
          isRead: Math.random() > 0.5
        }
      );
    }

    await Notification.create(notifications.flat());

    console.log('🔔 Created notifications');

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Seed Data Summary:');
    console.log(`👨‍💼 Coordinators: 1`);
    console.log(`👨‍🏫 Trainers: ${trainers.length}`);
    console.log(`👨‍🎓 Students: ${students.length}`);
    console.log(`💼 Job Postings: ${jobs.length}`);
    console.log(`📊 Evaluations: ${evaluations.length}`);
    console.log(`🔔 Notifications: ${notifications.length}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('Coordinator: coordinator@placement.com / password123');
    console.log('Trainer 1: sarah.trainer@placement.com / password123');
    console.log('Trainer 2: michael.trainer@placement.com / password123');
    console.log('Student: alice.student@placement.com / password123');
    console.log('(and more students with similar pattern)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seed function
seedData();

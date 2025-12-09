# Placement Performance & Coordination System (MERN)

A comprehensive full-stack web application that connects Students, Trainers, and Placement Coordinators with role-based authentication, performance tracking, automated job matching, and advanced analytics.

## 🚀 Features

### 🎯 Core Functionality
- **Role-based Authentication**: Secure JWT-based auth for Students, Trainers, and Coordinators
- **Student Performance Tracking**: Test scores, skill assessments, and trainer evaluations
- **Automated Job Matching**: AI-powered algorithm matching students to jobs based on skills and performance
- **Real-time Notifications**: In-app notifications for job matches, evaluations, and updates
- **Advanced Analytics**: Performance dashboards with charts and insights

### 👥 User Roles

#### 🎓 Students
- View personalized dashboard with performance metrics
- Browse and apply for matched job opportunities
- Track skill development and test scores
- Receive notifications for new opportunities

#### 👨‍🏫 Trainers
- Evaluate student performance and add remarks
- Add test results and skill assessments
- View student analytics and progress
- Manage assigned student groups

#### 👨‍💼 Coordinators
- Approve students for placement eligibility
- Create and manage job postings
- View comprehensive reports and analytics
- Manage the entire placement process

## 🛠 Tech Stack

### Backend
- **Node.js** (v18+) with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication with refresh tokens
- **Joi** for input validation
- **bcryptjs** for password hashing
- **Helmet** and **CORS** for security

### Frontend
- **React** (v18) with functional components and hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Axios** for HTTP requests
- **React Hook Form** for form handling

### DevOps & Tools
- **Docker** & **Docker Compose** for containerization
- **Jest** & **Supertest** for backend testing
- **React Testing Library** for frontend testing
- **ESLint** & **Prettier** for code quality
- **GitHub Actions** for CI/CD

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v7.0 or higher)
- Docker & Docker Compose (optional)
- Git

## 🚀 Quick Start

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd placement-coordination-system
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Seed the database**
   ```bash
   docker-compose exec backend npm run seed
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - MongoDB: localhost:27017

### Option 2: Local Development Setup

1. **Clone and setup backend**
   ```bash
   git clone <repository-url>
   cd placement-coordination-system/server
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Setup frontend**
   ```bash
   cd ../client
   npm install
   ```

3. **Start MongoDB**
   ```bash
   # Using MongoDB service or Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   ```

4. **Seed the database**
   ```bash
   cd ../server
   npm run seed
   ```

5. **Start the applications**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/placementdb
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-change-in-production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## 🎭 Demo Credentials

After seeding the database, use these credentials to explore different roles:

### Coordinator
- **Email**: coordinator@placement.com
- **Password**: password123

### Trainers
- **Email**: sarah.trainer@placement.com
- **Password**: password123
- **Email**: michael.trainer@placement.com
- **Password**: password123

### Students
- **Email**: alice.student@placement.com
- **Password**: password123
- **Email**: bob.student@placement.com
- **Password**: password123

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test                # Run all tests
npm run test:watch     # Run tests in watch mode
```

### Frontend Tests
```bash
cd client
npm test               # Run all tests
npm run test:watch    # Run tests in watch mode
```

### Coverage Reports
```bash
# Backend coverage
cd server && npm test -- --coverage

# Frontend coverage
cd client && npm test -- --coverage --watchAll=false
```

## 📊 Matching Algorithm

The job-student matching system uses a sophisticated scoring algorithm:

### Scoring Components
1. **Skill Matching (60%)**: Compares student skills with job requirements
2. **Test Performance (25%)**: Based on aggregate test scores
3. **Trainer Ratings (15%)**: Weighted average of trainer evaluations

### Additional Factors
- **Recency Boost**: Recent activity increases match score
- **Eligibility Filters**: Batch, program, and minimum score requirements
- **Customizable Weights**: Coordinators can adjust scoring parameters

### API Endpoint
```
GET /api/v1/jobs/:jobId/matches?skillWeight=0.6&testWeight=0.25&trainerWeight=0.15
```

## 📡 API Documentation

### Authentication Endpoints
```
POST /api/v1/auth/register    # Register new user
POST /api/v1/auth/login       # User login
POST /api/v1/auth/refresh     # Refresh access token
POST /api/v1/auth/logout      # User logout
GET  /api/v1/auth/me          # Get current user profile
```

### Student Management
```
GET  /api/v1/students              # Get all students (paginated)
GET  /api/v1/students/:id          # Get student by ID
POST /api/v1/students/:id/tests    # Add test result (trainers)
POST /api/v1/students/:id/evaluations # Add evaluation (trainers)
PUT  /api/v1/students/:id/approve  # Approve student (coordinators)
```

### Job Management
```
GET  /api/v1/jobs                  # Get all jobs (filtered)
POST /api/v1/jobs                  # Create job (coordinators)
GET  /api/v1/jobs/:id/matches      # Get candidate matches
POST /api/v1/jobs/:id/apply        # Apply for job (students)
POST /api/v1/jobs/:id/shortlist    # Shortlist candidates
```

### Reports & Analytics
```
GET /api/v1/reports/placement-stats    # Placement statistics
GET /api/v1/reports/trainer-performance # Trainer analytics
GET /api/v1/reports/skills-analysis    # Skills gap analysis
GET /api/v1/reports/export/students     # Export student data (CSV)
```

## 🏗 Project Structure

```
placement-coordination-system/
├── server/                 # Backend API
│   ├── models/            # MongoDB models
│   ├── routes/            # Express routes
│   ├── services/          # Business logic
│   ├── middleware/        # Custom middleware
│   ├── scripts/           # Database scripts
│   └── tests/             # Backend tests
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── docker-compose.yml     # Docker configuration
└── README.md             # This file
```

## 🔄 Development Workflow

### Available Scripts

#### Root Level
```bash
npm run dev          # Start both frontend and backend
npm run build        # Build frontend for production
npm test            # Run all tests
npm run seed        # Seed database with sample data
npm run lint        # Lint all code
```

#### Backend (server/)
```bash
npm run dev         # Start with nodemon
npm start          # Start production server
npm test           # Run Jest tests
npm run seed       # Seed database
npm run lint       # ESLint check
```

#### Frontend (client/)
```bash
npm run dev        # Start Vite dev server
npm run build      # Build for production
npm test          # Run React tests
npm run lint      # ESLint check
```

## 🚢 Deployment

### Production Build
```bash
# Build frontend
cd client && npm run build

# Start backend in production mode
cd server && NODE_ENV=production npm start
```

### Docker Production
```bash
# Build and run production containers
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure proper SMTP settings
4. Set up MongoDB Atlas or production database
5. Configure reverse proxy (nginx)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Add tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern MERN stack technologies
- Inspired by real-world placement coordination needs
- Designed for scalability and maintainability

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

**Happy Coding! 🚀**

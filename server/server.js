const mongoose = require('mongoose');
require('dotenv').config();

const { app, ensureAdminCoordinator } = require('./index');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/placementdb';

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');

    await ensureAdminCoordinator();

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  // Only start the server when this file is run directly
  startServer();
}

module.exports = { startServer };

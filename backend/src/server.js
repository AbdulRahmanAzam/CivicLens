const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { Category } = require('./models');

/**
 * Server startup and configuration
 */

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Database connected');

    // Seed default categories if needed
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      await Category.seedDefaults();
      console.log('✅ Default categories seeded');
    }

    // Start listening
    const server = app.listen(env.port, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🏛️  CivicLens Backend Server                           ║
║                                                          ║
║   Environment: ${env.nodeEnv.padEnd(40)}║
║   Port: ${String(env.port).padEnd(47)}║
║   API: http://localhost:${env.port}/api/v1${' '.repeat(24)}║
║                                                          ║
║   Press Ctrl+C to stop                                   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      server.close(async () => {
        await disconnectDB();
        process.exit(1);
      });
    });

    // Handle SIGTERM signal (graceful shutdown)
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
      server.close(async () => {
        await disconnectDB();
        console.log('💤 Process terminated!');
        process.exit(0);
      });
    });

    // Handle SIGINT signal (Ctrl+C)
    process.on('SIGINT', () => {
      console.log('\n👋 SIGINT RECEIVED. Shutting down gracefully');
      server.close(async () => {
        await disconnectDB();
        console.log('💤 Process terminated!');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = { startServer };

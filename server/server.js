import { createApp } from './src/app.js';
import { connectDatabase } from './src/config/database.js';
import { env } from './src/config/env.js';

async function startServer() {
  await connectDatabase(env.mongodbUri);

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start the server:', error);
  process.exitCode = 1;
});

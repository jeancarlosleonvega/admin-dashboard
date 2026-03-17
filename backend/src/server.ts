import { WebSocketServer } from 'ws';
import { env } from './config/env.js';
import { logger } from './shared/utils/logger.js';
import { buildApp } from './app.js';
import { prisma } from './infrastructure/database/client.js';
import { closeRedis } from './infrastructure/cache/redis.js';
import { addWsClient, removeWsClient } from './shared/utils/wsBroadcast.js';

async function start() {
  const app = await buildApp();

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

  for (const signal of signals) {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, shutting down...`);

      await app.close();
      await prisma.$disconnect();
      await closeRedis();

      logger.info('Server shutdown complete');
      process.exit(0);
    });
  }

  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected');

    // Start server
    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info(`Server running at http://${env.HOST}:${env.PORT}`);

    // WebSocket server adjunto al mismo HTTP server
    const wss = new WebSocketServer({ noServer: true });
    wss.on('connection', (ws) => {
      addWsClient(ws);
      ws.on('close', () => removeWsClient(ws));
    });

    const httpServer = app.server;
    httpServer.on('upgrade', (request, socket, head) => {
      if (request.url === '/api/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    if (env.NODE_ENV !== 'production') {
      logger.info(`Swagger docs at http://localhost:${env.PORT}/docs`);
    }
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

start();

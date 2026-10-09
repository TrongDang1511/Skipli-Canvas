import app from './app';
import { env } from './config/env.config';

const PORT = env.port;

const server = app.listen(PORT, () => {
  console.log(`[Server] Skipli Canvas Backend running on http://localhost:${PORT}`);
});

server.setTimeout(0);
server.keepAliveTimeout = 0;

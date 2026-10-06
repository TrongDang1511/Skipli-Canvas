import app from './app';
import { env } from './config/env.config';

const PORT = env.port || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Skipli Canvas Backend running on http://localhost:${PORT}`);
});

import cors, { CorsOptions } from 'cors';
import { env } from '../config/env.config';

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (env.corsAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked: Origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['RateLimit', 'RateLimit-Policy', 'Retry-After'],
  maxAge: env.corsMaxAge,
};

export const corsMiddleware = cors(corsOptions);

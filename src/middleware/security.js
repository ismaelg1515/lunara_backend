const cors = require('cors');
const helmet = require('helmet');
const { formatErrorResponse } = require('../utils/helpers');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * CORS configuration
 * Configure Cross-Origin Resource Sharing for the Flutter frontend
 */
const corsConfig = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allowed origins for different environments
    const allowedOrigins = [
      'http://localhost:3000',     // React development
      'http://localhost:8080',     // Vue development
      'http://localhost:4200',     // Angular development
      'http://127.0.0.1:8080',     // Local development
      'https://lunara-app.web.app', // Firebase Hosting (example)
      'https://lunara-app.firebaseapp.com' // Firebase Hosting (example)
    ];

    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // In production, check allowed origins
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-API-Key'
  ],
  optionsSuccessStatus: 200 // For legacy browser support
};

/**
 * Helmet security configuration
 * Sets various HTTP headers for security
 */
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.openai.com'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disable to allow external API calls
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
};

/**
 * Request size limiter middleware
 * Prevents large request bodies that could cause DoS
 */
const requestSizeLimiter = (req, res, next) => {
  // Express built-in size limiting through bodyParser
  // This is handled in app.js with express.json({ limit: '10mb' })
  next();
};

/**
 * API Key validation middleware (optional)
 * Can be used for additional API security if needed
 */
const validateApiKey = (req, res, next) => {
  // Skip API key validation if not configured
  if (!process.env.API_KEY) {
    return next();
  }

  const apiKey = req.header('X-API-Key');
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      formatErrorResponse('Invalid or missing API key', HTTP_STATUS.UNAUTHORIZED)
    );
  }

  next();
};

/**
 * Security headers middleware
 * Adds additional security headers
 */
const securityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add cache control for API responses
  if (req.url.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

/**
 * IP-based rate limiting (simple implementation)
 * Tracks request counts per IP address
 */
const ipRateLimit = (() => {
  const requests = new Map();
  const WINDOW_SIZE = 15 * 60 * 1000; // 15 minutes
  const MAX_REQUESTS = 100; // Max requests per window

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean old entries
    for (const [key, data] of requests.entries()) {
      if (now - data.timestamp > WINDOW_SIZE) {
        requests.delete(key);
      }
    }

    // Check current IP
    const ipData = requests.get(ip) || { count: 0, timestamp: now };
    
    if (now - ipData.timestamp > WINDOW_SIZE) {
      // Reset window
      ipData.count = 1;
      ipData.timestamp = now;
    } else {
      ipData.count++;
    }

    requests.set(ip, ipData);

    if (ipData.count > MAX_REQUESTS) {
      return res.status(429).json(
        formatErrorResponse(
          `Too many requests from this IP. Limit: ${MAX_REQUESTS} requests per 15 minutes.`,
          429
        )
      );
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - ipData.count));
    res.setHeader('X-RateLimit-Reset', new Date(ipData.timestamp + WINDOW_SIZE).toISOString());

    next();
  };
})();

/**
 * Health check bypass middleware
 * Allows health checks to bypass some security measures
 */
const healthCheckBypass = (req, res, next) => {
  if (req.url === '/api/health' || req.url === '/health') {
    // Skip rate limiting and some security checks for health endpoints
    req.skipRateLimit = true;
  }
  next();
};

module.exports = {
  corsConfig,
  helmetConfig,
  requestSizeLimiter,
  validateApiKey,
  securityHeaders,
  ipRateLimit,
  healthCheckBypass,
  
  // Export configured middleware functions
  cors: cors(corsConfig),
  helmet: helmet(helmetConfig)
}; 
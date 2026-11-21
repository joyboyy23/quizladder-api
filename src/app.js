// Builds the Express app. Does NOT start listening - server.js does that.
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middlewares/not-found');
const errorHandler = require('./middlewares/error-handler');

const app = express();

// Render puts a proxy in front of the API: trust one hop so req.ip and req.protocol are right.
app.set('trust proxy', 1);

// Middleware runs in this order for every request.
if (env.nodeEnv !== 'test') app.use(morgan('dev'));   // 1. one log line per request
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));   // 2. safe headers
// 3. Only the pages listed in CORS_ORIGINS may read answers in a browser.
//    curl and Postman send no Origin and are not affected: /results is protected by the Hub key.
app.use(cors({ origin: (origin, done) => done(null, !origin || env.corsOrigins.includes(origin)) }));
app.use(express.json());                              // 4. turn the JSON body into req.body
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Hub Contract: every endpoint lives under /api/v1
app.use('/api/v1', routes);                           // 5. the routes

app.use(notFound);                                    // 6. no route matched
app.use(errorHandler);                                // 7. something was thrown

module.exports = app;

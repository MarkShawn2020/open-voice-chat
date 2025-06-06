#!/usr/bin/env node

/**
 * Health Check Script for Open Voice Chat
 * 
 * This script performs a basic health check by making an HTTP request
 * to the application's health endpoint.
 */

const http = require('http');

const options = {
  hostname: process.env.HOSTNAME || 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 3000, // 3 second timeout
};

const healthCheck = () => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve('Health check passed');
      } else {
        reject(new Error(`Health check failed with status code: ${res.statusCode}`));
      }
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Health check timeout'));
    });

    req.setTimeout(options.timeout);
    req.end();
  });
};

// Run health check
healthCheck()
  .then((message) => {
    console.log('✅', message);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  });

/**
 * PM2 Ecosystem Configuration
 * 
 * Production-grade process manager for Node.js applications
 * 
 * Usage:
 *   Development: npm run dev (uses nodemon)
 *   Production:  pm2 start ecosystem.config.js
 *   Production (cluster mode): pm2 start ecosystem.config.js --env production
 * 
 * PM2 Commands:
 *   pm2 start ecosystem.config.js     - Start the app
 *   pm2 stop electrical-pm-api        - Stop the app
 *   pm2 restart electrical-pm-api     - Restart the app
 *   pm2 reload electrical-pm-api      - Zero-downtime reload
 *   pm2 logs electrical-pm-api        - View logs
 *   pm2 monit                         - Monitor CPU/Memory
 *   pm2 list                          - List all apps
 */

module.exports = {
  apps: [
    {
      name: 'electrical-pm-api',
      script: 'dist/src/server.js', // Compiled JS file
      instances: 1, // Single instance for development, use 'max' for production
      exec_mode: 'fork', // Use 'cluster' for multiple instances in production
      
      // Auto-restart configuration
      autorestart: true,
      watch: false, // Set to true only in development
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      
      // Restart configuration
      min_uptime: '10s', // Consider app unstable if it exits before 10s
      max_restarts: 10, // Max number of unstable restarts
      restart_delay: 3000, // Delay between restarts (3 seconds)
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      
      // Logging
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced settings
      kill_timeout: 5000, // Time to wait for graceful shutdown
      listen_timeout: 10000, // Time to wait for app to be ready
      shutdown_with_message: true,
      
      // Cron restart (optional - restart every day at 4 AM)
      // cron_restart: '0 4 * * *',
      
      // Source map support
      source_map_support: true,
      
      // Node.js flags
      node_args: '--max-old-space-size=512', // Limit memory to 512MB
      
      // Instance variables
      instance_var: 'INSTANCE_ID',
      
      // Health check
      // Uncomment if you have a health check endpoint
      // health_check_url: 'http://localhost:5000/health',
      // health_check_interval: 30000, // 30 seconds
      // health_check_timeout: 5000, // 5 seconds
    }
  ]
};


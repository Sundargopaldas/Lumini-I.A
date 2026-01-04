module.exports = {
  apps: [{
    name: "lumini-backend",
    script: "./server.js",
    instances: "max", // Use all available CPU cores
    exec_mode: "cluster", // Enable clustering for load balancing
    watch: false, // Don't watch for file changes in production (save resources)
    max_memory_restart: '1G', // Restart if memory usage exceeds 1GB
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    },
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    time: true // Add timestamps to logs
  }]
};

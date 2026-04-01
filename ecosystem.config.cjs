module.exports = {
  apps: [
    {
      name: "vexor-saas-api",
      script: "server/index.mjs",
      cwd: __dirname,
      interpreter: "node",
      node_args: "--env-file=.env.mariadb",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

#!/usr/bin/env node
const cp = require('child_process');

function isGlobalNpmInstall() {
  return !!process.env.npm_config_global;
}

function isGlobalYarnInstall() {
  if (!process.env.npm_config_argv) return false;

  const argv = process.env.npm_config_argv || { original: [] };
  const parsed = JSON.parse(argv);
  return parsed.original.includes('global');
}

if (isGlobalNpmInstall() || isGlobalYarnInstall()) {
  cp.spawn('npm install @salesforce/cli --global', { stdio: 'inherit', shell: true });
}

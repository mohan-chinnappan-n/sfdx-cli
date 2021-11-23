#!/usr/bin/env node
const shell = require('shelljs');

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
  shell.exec('npm install @salesforce/cli --global');
}

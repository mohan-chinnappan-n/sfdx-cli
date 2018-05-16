import CLI from 'cli-engine';
import { Config } from 'cli-engine-config';
import * as path from 'path';
import env from './util/env';
import * as lazyRequire from './experiments/lazyRequire';

export function create(version: string, channel: string) {
    const root = path.join(__dirname, '..');
    const pjson = require(path.join(root, 'package.json')); // tslint:disable-line
    const args = process.argv.slice(1);

    // Require a dark feature envar to enable the lazy loading experiment, and disable during update commands
    if (env.getBoolean('SFDX_LAZY_LOAD_MODULES') && args[1] !== 'update') {
        lazyRequire.start();
    }

    return new CLI({
        argv: args,
        config: configureAutoUpdate(env, {
            channel, pjson, root, version
        })
    });
}

export const UPDATE_DISABLED_INSTALLER =
    'Manual and automatic CLI updates have been disabled by setting "SFDX_AUTOUPDATE_DISABLE=true". ' +
    'To check for a new version, unset that environment variable.';

export const UPDATE_DISABLED_OTHER =
    'Use "npm install --global sfdx-cli" to update npm-based installations.';

export const UPDATE_DISABLED_DEMO =
    'Manual and automatic CLI updates have been disabled in DEMO mode. ' +
    'To check for a new version, unset the environment variable SFDX_ENV.';

export function configureAutoUpdate(envars: typeof env, config: Config): Config {
    const sfdxEnv = envars.get('SFDX_ENV');
    if (sfdxEnv && sfdxEnv.toLowerCase() === 'demo') {
        // Disable autoupdates in demo mode
        envars.setBoolean('SFDX_AUTOUPDATE_DISABLE', true);
        config.updateDisabled = UPDATE_DISABLED_DEMO;
        return config;
    }

    if (envars.getBoolean('SFDX_INSTALLER')) {
        if (envars.getBoolean('SFDX_AUTOUPDATE_DISABLE')) {
            config.updateDisabled = UPDATE_DISABLED_INSTALLER;
        }
        return config;
    }

    if (!envars.get('SFDX_AUTOUPDATE_DISABLE')) {
        // Disable autoupdates if run from an npm install or in local dev, if not explicitly set
        envars.setBoolean('SFDX_AUTOUPDATE_DISABLE', true);
    }

    if (envars.getBoolean('SFDX_AUTOUPDATE_DISABLE')) {
        config.updateDisabled = UPDATE_DISABLED_OTHER;
    }

    return config;
}

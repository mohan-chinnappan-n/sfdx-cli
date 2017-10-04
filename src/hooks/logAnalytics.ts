import { Config } from 'cli-engine-config';
import * as Debug from 'debug';
import * as path from 'path';
import timedHook from './timedHook';

import * as cp from 'child_process';

const debug = Debug('sfdx:analytics');

function run(config: Config, opts: any) {
    try {
        const start = Date.now();
        const command = opts.Command;

        // Only log usage for commands with plugins
        if (command && command.plugin) {
            process.on('exit', (status) => {
                cp.fork(path.join(__dirname, '../processes/logUsage'), [], { execArgv: [] }).send({
                    config,
                    plugin: command.plugin ? { name: command.plugin.name, version: command.plugin.version } : undefined,
                    commandId: command.id,
                    time: Date.now() - start,
                    status
                });
            });
        } else {
            debug('no plugin found for analytics');
        }
    } catch (err) {
        debug(`error tracking usage: ${err.message}`);
    }
}

export = timedHook('analytics', run);
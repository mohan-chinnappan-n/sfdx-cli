import { AnyDictionary } from '@salesforce/ts-json';

export interface ProcessLike {
    argv: string[];
    env: AnyDictionary;
}

export function processCliFlags(process: ProcessLike): void {
    process.argv = process.argv.filter((arg: string) => {
        let match = true;
        switch (arg) {
            case '--dev-debug': {
                process.env.DEBUG = '*';
                process.env.SFDX_DEBUG = '1';
                process.env.SFDX_ENV = 'development';
                break;
            }
            default: {
                match = false;
            }
        }
        return !match;
    });
}
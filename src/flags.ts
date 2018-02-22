export function processCliFlags(process) {
    process.argv = process.argv.filter((arg) => {
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

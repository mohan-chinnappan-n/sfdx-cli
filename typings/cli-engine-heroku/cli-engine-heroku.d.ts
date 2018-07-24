declare module 'cli-engine-heroku/lib/vars' {
    export class Vars {
        env: any;
        host: string;
        apiUrl: string;
        apiHost: string;
        gitHost: string;
        httpGitHost: string;
        gitPrefixes: string[];

        constructor(env: any);
    }

    const vars: Vars;
    export default vars;
}
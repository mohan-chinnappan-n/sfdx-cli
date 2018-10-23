/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// tslint:disable:no-unused-expression

import { Hook, Hooks, IConfig } from '@oclif/config';
import {
    StubbedCallableType,
    stubCallable,
    stubInterface
} from '@salesforce/ts-sinon';
import { expect } from 'chai';
import * as Request from 'request';
import * as sinon from 'sinon';
import { Env } from '../util/env';
import hook from './updateReachability';

class SystemError extends Error {
    public constructor(
        public code: string
    ) {
        super();
    }
}

describe('updateReachability preupdate hook', () => {
    let sandbox: sinon.SinonSandbox;
    let context: Hook.Context;
    let config: IConfig;
    let options: Hooks['preupdate'] & { config: IConfig };
    let env: Env;
    let pingErr: Error;
    let pingRes: Request.RequestResponse;
    let request: StubbedCallableType<typeof Request>;
    let warnings: string[];
    let errors: string[];

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        config = stubInterface<IConfig>(sandbox, {
            dataDir: 'test',
            pjson: {
                oclif: {
                    update: {
                        s3: {
                            host: 'developer.salesforce.com/media/salesforce-cli'
                        }
                    }
                }
            }
        });

        context = stubInterface<Hook.Context>(sandbox, {
            config,
            warn(...args: any[]) { // tslint:disable-line:no-any
                warnings.push(args.join(' '));
            },
            error(...args: any[]) { // tslint:disable-line:no-any
                errors.push(args.join(' '));
            }
        });

        options = {
            channel: 'test',
            config
        };

        env = new Env({});

        request = stubCallable<typeof Request>(sandbox, ({
            get(opts: object, cb: (err?: Error, res?: object) => void) { // tslint:disable-line:no-reserved-keywords
                return cb(pingErr, pingRes);
            }
        }));

        warnings = [];
        errors = [];
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should not test S3 host reachability when update is disabled', async () => {
        env.setAutoupdateDisabled(true, 'test disabled');
        await hook.call(context, options, env, request);
        expect(warnings).to.deep.equal([]);
        expect(request.get.calledOnce).to.be.false;
    }).timeout(5000);

    it('should not warn about updating from a custom S3 host when not set', async () => {
        pingRes = { statusCode: 200 } as Request.RequestResponse;
        await hook.call(context, options, env, request);
        expect(warnings).to.deep.equal([]);
    }).timeout(5000);

    it('should warn about updating from a custom S3 host and ask about SFM', async () => {
        env.setS3HostOverride('http://10.252.156.165:9000/sfdx/media/salesforce-cli');
        pingRes = { statusCode: 200 } as Request.RequestResponse;
        await hook.call(context, options, env, request);
        expect(warnings).to.deep.equal(['Updating from SFDX_S3_HOST override. Are you on SFM?']);
    }).timeout(5000);

    it('should test the S3 update site before updating, failing when 3 ping attempts fail with unexpected HTTP status codes', async () => {
        pingRes = { statusCode: 404 } as Request.RequestResponse;
        await hook.call(context, options, env, request);
        expect(request.get.calledThrice).to.been.true;
        expect(warnings).to.deep.equal([
            'Attempting to contact update site...'
        ]);
        expect(errors).to.deep.equal([
            'S3 host is not reachable.'
        ]);
    }).timeout(5000);

    it('should test the S3 update site before updating, failing when 3 ping attempts fail with dns resolution errors', async () => {
        pingErr = new SystemError('ENOTFOUND');
        await hook.call(context, options, env, request);
        expect(request.get.calledThrice).to.been.true;
        expect(warnings).to.deep.equal([
            'Attempting to contact update site...'
        ]);
        expect(errors).to.deep.equal([
            'S3 host is not reachable.'
        ]);
    }).timeout(5000);

    it('should test the S3 update site before updating, failing when 3 ping attempts fail with reachability errors', async () => {
        pingErr = new SystemError('ENETUNREACH');
        await hook.call(context, options, env, request);
        expect(request.get.calledThrice).to.been.true;
        expect(warnings).to.deep.equal([
            'Attempting to contact update site...'
        ]);
        expect(errors).to.deep.equal([
            'S3 host is not reachable.'
        ]);
    }).timeout(5000);

    it('should test the S3 update site before updating, failing when 3 ping attempts fail with timeout errors', async () => {
        pingErr = new SystemError('ETIMEDOUT');
        await hook.call(context, options, env, request);
        expect(request.get.calledThrice).to.been.true;
        expect(warnings).to.deep.equal([
            'Attempting to contact update site...'
        ]);
        expect(errors).to.deep.equal([
            'S3 host is not reachable.'
        ]);
    }).timeout(30000);
});

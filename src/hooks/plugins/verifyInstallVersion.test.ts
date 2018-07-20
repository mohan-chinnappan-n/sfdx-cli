import { Hook } from '@oclif/config';
import { StubbedType, stubInterface } from '@salesforce/ts-sinon';
import { assert, expect } from 'chai';
import * as sinon from 'sinon';
import hook from './verifyInstallVersion';

// tslint:disable:no-unused-expression

describe('verifyInstallVersion preinstall hook', () => {
    let sandbox: sinon.SinonSandbox;
    let context: StubbedType<Hook.Context>;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        context = stubInterface<Hook.Context>(sandbox);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should allow the salesforcedx plugin with tag "41.2.0" to be installed', async () => {
        await testHook('41.2.0');
    });

    it('should allow the salesforcedx plugin with tag "latest" to be installed', async () => {
        await testHook('latest');
    });

    it('should allow the salesforcedx plugin with tag "pre-release" to be installed', async () => {
        await testHook('pre-release');
    });

    it('should allow the salesforcedx plugin with tag "foo" to be installed', async () => {
        await testHook('foo');
    });

    it('should allow the salesforcedx plugin with no tag to be installed', async () => {
        await testHook('');
        await testHook(null);
        await testHook(undefined);
    });

    it('should not allow the salesforcedx plugin with tag "41.1.0" to be installed', async () => {
        await testHook('41.1.0');
        expect(context.exit.calledOnce).to.be.true;
        expect(context.error.getCalls().some(call => call.args[0].includes('can only be installed'))).to.be.true;
    });

    async function testHook(tag?: string | null) {
        await hook.call(context, {
            config: { version: '6.0.0' },
            plugin: { name: 'salesforcedx', tag }
        });
    }
});

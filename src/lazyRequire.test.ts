/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// tslint:disable:no-unused-expression

import { IConfig } from '@oclif/config';
import LazyRequire from '@salesforce/lazy-require';
import { StubbedCallableType, StubbedType, stubCallable, stubInterface } from '@salesforce/ts-sinon';
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as mod from './lazyRequire';

describe('lazyRequire', () => {
    let sandbox: sinon.SinonSandbox;
    let config: IConfig;
    let mock: StubbedType<LazyRequire>;
    let create: StubbedCallableType<typeof LazyRequire.create>;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        config = stubInterface<IConfig>(sandbox, {
            cacheDir: '/test'
        });

        mock = stubInterface<LazyRequire>(sandbox);

        create = stubCallable(sandbox, LazyRequire.create, () => mock);
    });

    afterEach(() => {
        delete mod.lazyRequire;
    });

    it('should cache instances of the lazy require class', () => {
        mod.start(config, create);
        expect(create.calledOnce).to.be.true;
        expect(create.calledWith('/test/module-types.json')).to.be.true;
        expect(mod.lazyRequire).to.equal(mock);
        mod.start(config, create);
        expect(create.calledOnce).to.be.true;
        expect(mod.lazyRequire).to.equal(mock);
    });

    it('should start the lazy require instance', () => {
        mod.start(config, create);
        expect(mock.start.calledOnce).to.be.true;
    });

    it('should reset the lazy require instance\'s type cache file', () => {
        mod.resetTypeCache(config, create);
        expect(mock.resetTypeCache.calledOnce).to.be.true;
    });
});

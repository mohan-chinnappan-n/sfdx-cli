/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Hook, IConfig } from '@oclif/config';
import { StubbedType, stubInterface } from '@salesforce/ts-sinon';
import { JsonMap, Nullable, Optional } from '@salesforce/ts-types';
import { expect } from 'chai';
import * as Debug from 'debug';
import { Stats } from 'fs';
import * as sinon from 'sinon';
import { default as hook, FsLib } from './migratePlugins';

// tslint:disable:no-unused-expression

const v6Json = {
  private: 'true',
  dependencies: {
    oclif: 'latest',
    other: 'latest'
  }
};

const oclifPluginJson = {
  version: '1.2.3',
  oclif: { }
};

const otherPluginJson = {
  version: '3.2.1'
};

const trace = Debug('test:migrate:plugins');

describe('migratePlugins preupdate hook', () => {
  let sandbox: sinon.SinonSandbox;
  let config: StubbedType<IConfig>;
  let context: StubbedType<Hook.Context>;
  let mockFs: StubbedType<FsLib>;
  let warnings: Error[];

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    config = stubInterface<IConfig>(sandbox, {
      dataDir: '/home/tester/.local/share/sfdx'
    });

    context = stubInterface<Hook.Context>(sandbox, {
      warn: (err: Error) => {
        trace('[WARNING] %s', err.message);
        warnings.push(err);
      },
      config
    });

    warnings = [];
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should migrate v6 plugin config to v7', async () => {
    let v7Path = '';
    let v7PackageJson = '';
    mockFs = stubInterface<FsLib>(sandbox, {
      access: (p: string, cb: (err: Nullable<Error>) => void) => {
        trace('access:', p);
        if (p.endsWith('sfdx/plugins/package.json')) return cb(null);
        if (p.endsWith('sfdx/plugins/node_modules')) return cb(null);
        if (p.endsWith('sfdx/plugins/yarn.lock')) return cb(null);
        if (p.endsWith('sfdx/plugins/node_modules/oclif/package.json')) return cb(null);
        if (p.endsWith('sfdx/plugins/node_modules/other/package.json')) return cb(null);
        cb(new Error('ENOENT: ' + p));
      },
      lstat: (p: string, cb: (err: Nullable<Error>, r: Partial<Stats>) => {}) => {
        trace('lstat:', p);
        cb(null, { isDirectory: () => !p.endsWith('.json') });
      },
      rename: (f: string, t: string, cb: (err: Nullable<Error>) => void): void => {
        trace('rename:', f, t);
        cb(null);
      },
      readdir: (p: string, cb: (err: Nullable<Error>, files?: string[]) => void): void => {
        trace('readdir:', p);
        cb(null, []);
      },
      readFile: (p: string, cb: (err: Nullable<Error>, buffer?: Buffer) => void): void => {
        trace('readFile:', p);
        let json: Optional<JsonMap>;
        if (p.endsWith('sfdx/plugins/package.json')) json = v6Json;
        if (p.endsWith('sfdx/plugins/node_modules/oclif/package.json')) json = oclifPluginJson;
        if (p.endsWith('sfdx/plugins/node_modules/other/package.json')) json = otherPluginJson;
        cb(json ? null : new Error('ENOENT: ' + p), json && Buffer.from(JSON.stringify(json)));
      },
      rmdir: (p: string, cb: (err: Nullable<Error>) => void) => {
        trace('rmdir:', p);
        cb(null);
      },
      unlink: (p: string, cb: (err: Nullable<Error>) => void) => {
        trace('unlink:', p);
        cb(null);
      },
      writeFile: (p: string, content: string, cb: (err: Nullable<Error>) => void) => {
        v7Path = p;
        v7PackageJson = content;
        trace('writeFile:', v7Path, v7PackageJson);
        cb(null);
      }
    });

    await testHook();

    console.log();
    expect(warnings.length).to.equal(1);
    expect(warnings[0].message).to.equal('Plugin other@latest is incompatible and could not be migrated');
    expect(v7Path).to.equal('/home/tester/.local/share/sfdx/package.json');
    expect(JSON.parse(v7PackageJson)).to.deep.equal({
      private: 'true',
      oclif: {
        schema: 1,
        plugins: [{
          name: 'oclif',
          tag: 'latest',
          type: 'user'
        }]
      },
      dependencies: {
        oclif: '^1.2.3'
      }
    });
  });

  it('should do nothing if no v6 plugin config is found', async () => {
    mockFs = stubInterface<FsLib>(sandbox, {
      access: (p: string, cb: (err: Nullable<Error>) => void) => {
        trace('access:', p);
        if (p.endsWith('sfdx/plugins/package.json')) return cb(new Error('ENOENT: ' + p));
        cb(null);
      }
    });

    await testHook();

    expect(mockFs.access.calledOnce).to.be.true;
    expect(warnings.length).to.equal(0);
  });

  it('should not migrate if a v7 plugin config is found, then remove v6 config', async () => {
    mockFs = stubInterface<FsLib>(sandbox, {
      access: (p: string, cb: (err: Nullable<Error>) => void) => {
        trace('access:', p);
        if (p.endsWith('sfdx/plugins/package.json')) return cb(null);
        if (p.endsWith('sfdx/package.json')) return cb(null);
        cb(new Error('ENOENT: ' + p));
      },
      lstat: (p: string, cb: (err: Nullable<Error>, r: Partial<Stats>) => {}) => {
        trace('lstat:', p);
        cb(null, { isDirectory: () => !p.endsWith('.json') });
      },
      unlink: (p: string, cb: (err: Nullable<Error>) => void) => {
        trace('unlink:', p);
        cb(null);
      }
    });

    await testHook();

    expect(mockFs.access.calledTwice).to.be.true;
    expect(warnings.length).to.equal(0);
    expect(mockFs.unlink.calledOnce).to.be.true;
    expect(mockFs.unlink.getCall(0).args[0]).to.equal('/home/tester/.local/share/sfdx/plugins/package.json');
  });

  async function testHook() {
    await hook.call(context, { config }, mockFs);
  }
});
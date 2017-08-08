# CLI for sfdx

This is the `sfdx` CLI application, based on Heroku's v6
[cli-engine](https://github.com/heroku/cli-engine).  By default it comes installed with the `salesforcedx` plugin, which contributes all commands in the `force` namespace.

## Installation and Development

### Requirements

To get started, you'll need to install `node` v8 or greater.  While this can be done using an installer from [nodejs.com](nodejs.com), we recommend using [nvm](https://github.com/creationix/nvm) to easily manage multiple node versions.

If using `nvm`, be sure that you've selected the v8+ version with `nvm use v8.x.y`, where `x` and `y` are specific to the version that you installed. If you want to use this version by default run `nvm alias default node`. Otherwise, when you restart your shell nvm will revert to whatever version configured prior to installing v8.

You'll also need [yarn](https://yarnpkg.com/en/docs/install).  If you did decide to use `nvm`, be sure to follow the `nvm`-specific install instructions.

### Up and running as a user

1. From within this repository's root directory, run `yarn` (short for `yarn install`).
1. Run `bin/run` to view the CLI's root help.

### Up and running as a `force` namespace plugin developer

1. Make sure you have the any of the following dependencies that you need to work on cloned locally as sibling directories to this repository:
    * [salesforcedx](https://git.soma.salesforce.com/salesforcedx/salesforcedx)
    * [salesforce-alm](https://git.soma.salesforce.com/ALMSourceDrivenDev/force-com-toolbelt)
    * [force-language-services](https://git.soma.salesforce.com/DevTools/force-language-services)
    * [salesforce-lightning-cli](https://git.soma.salesforce.com/aura/lightning-cli)
1. Prior to v6 being the official CLI engine, you will also need to checkout the `develop` branch, or a derivative thereof, in each (except `salesforce-lightning-cli`, which can remain on master).
1. Set up the `salesforcedx` aggregate plugin for development by running `bin/setup`.  Note that this script creates various types of links between the above packages and this one.
    * If you don't like scripts messing with your projects, you can recreate the actions of the script by running something like the following commands, depending on your exact needs:
        1. `yarn install`
        1. `bin/run plugins:link ../salesforcedx`
        1. `cd ../salesforcedx`
        1. `npm link ../force-com-toolbelt`
        1. `npm link ../force-language-services`
        1. `npm link ../lightning-cli`
        1. `bin/run plugins`
1. If everything worked, you should see something like `salesforcedx 41.1.0 (link)` (the exact version should be anything `41` or later).
1. (OPTIONAL) If you need to make modifications to the Heroku `cli-engine` upon which this is based, also clone these repositories as sibling directories of this repository:
    * [cli-engine](https://github.com/heroku/cli-engine)
    * [cli-engine-command](https://github.com/heroku/cli-engine-command)
    * [cli-engine-config](https://github.com/heroku/cli-engine-config)
1. Run `bin/setup +engine` to have all necessary npm links created for you.  You can revert the effects of this command by running `bin/setup -engine`.

You can now run the CLI using the `bin/run` script to test your changes.

#### Developer CLI flags

The following flags are supported by the `bin/run` script, and can be combined as desired.  They are stripped from the args passed to the CLI application itself.

* *--cli-suspend*: Starts the `node` binary with the `--inspect-brk` flag to allow a remote debugger to attach before running.
* *--cli-debug*: Sets the `SFDX_DEBUG=1` and `DEBUG=\*` envars for the CLI's `node` process, which enables full debug output from the v6 `cli-engine`.

#### Developer notes

* If you change this project's `package.json` to reference a new core plugin, or change the `package.json` of any referenced plugins, you may need to delete `cli-engine`'s plugin cache to force it to reload.
    * For macOS: `rm ~/Library/Caches/sfdx-cli/plugins.json`
* If you are using a locally linked `cli-engine` and making changes, you may want to set up its compile watch with `npm run watch`.

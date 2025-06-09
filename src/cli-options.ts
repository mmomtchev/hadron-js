import * as cp from 'node:child_process';
import * as os from 'node:os';
import assert from 'node:assert';

/**
 * npm options parser
 * 
 * An option can be set and overridden
 * (last one wins)
 * 
 * "enable_option=true" .npmrc entry
 * - "npm_config_enable_option=true" env variable
 * - "--enable-option" npm install CLI option
 *
 * "magickwand_js_enable_option=true" .npmrc entry 
 * "npm_config_magickwand_js_enable_option=true" env variable
 * "--magickwand_js_enable-option" npm install CLI option
 */

const quote = os.platform() == 'win32' ? '"' : '\'';

// These are always set by npm with a special meaning
// that is not the meson meaning
const mesonBlacklist = ['prefix'];

type OptionVal = boolean | string | undefined;
type ConanOption = Record<string, string[]>;
type MesonOption = {
  name: string;
  type: 'string' | 'boolean' | 'array';
};
type Environment = Record<string, string>;

/**
 * Get a global npm option from the environment
 * Returns true, false, a string or undefined
 */
function getRawNpmOption(pkgName: string, env: Environment, name: string): OptionVal {
  const envName = name.replace(/[^a-zA-Z0-9]/, '_');
  pkgName = pkgName.replace(/[^a-zA-Z0-9]/, '_');
  const enable = !!env[`npm_config_${pkgName ? `${pkgName}_` : ''}enable_${envName}`];
  const disable = !!env[`npm_config_${pkgName ? `${pkgName}_` : ''}disable_${envName}`];
  const string = env[`npm_config_${pkgName ? `${pkgName}_` : ''}${envName}`];

  if (+enable + +disable + +(!!string) > 1) {
    const err = `Conflicting settings present for ${name}`;
    console.error(err)
    throw new Error(err);
  }

  if (enable) return true;
  if (disable) return false;
  if (string) return string;
  return undefined;
}

/**
 * Get an npm option taking into account package overrides 
 * Returns true, false, a string or undefined
 */
function getNpmOption(pkgName: string, env: Environment, name: string): OptionVal {
  const pkgOverride = getRawNpmOption(pkgName, env, name);
  if (pkgOverride !== undefined) {
    if (env['npm_config_loglevel'])
      console.info(` - npm package ${pkgName} option ${name} = ${pkgOverride}`);
    return pkgOverride;
  }
  const globalOption = getRawNpmOption('', env, name);
  if (globalOption !== undefined) {
    if (env['npm_config_loglevel'])
      console.info(` - npm option ${name} = ${globalOption}`);
    return globalOption;
  }

  return undefined;
}

function mesonBuildOptions(path: string): MesonOption[] {
  let o, r;

  try {
    o = cp.execSync('meson introspect --buildoptions meson.build -f', { env: { ...process.env, PATH: path } });
  } catch (e) {
    console.error('Failed getting options from meson', e, e.stdout?.toString(), e.stderr?.toString());
    throw e;
  }

  try {
    r = JSON.parse(o.toString());
    assert(r.buildoptions);
  } catch (e) {
    console.error('Failed parsing meson output', e);
    throw e;
  }

  return r.buildoptions;
}

function conanBuildOptions(path: string): ConanOption[] {
  let o, r;

  try {
    o = cp.execSync('conan inspect -f json .', { env: { ...process.env, PATH: path } });
  } catch (e) {
    console.error('Failed getting options from conan', e, e.stdout?.toString(), e.stderr?.toString());
    throw e;
  }

  try {
    r = JSON.parse(o.toString());
    assert(r.options_definitions);
  } catch (e) {
    console.error('Failed parsing meson output', e);
    throw e;
  }

  return r.options_definitions;
}

function parseMesonOptions(pkgName: string, env: Environment, mesonOptions: MesonOption[]) {
  let result = '';

  for (const opt of mesonOptions) {
    if (mesonBlacklist.includes(opt.name))
      continue;

    const val = getNpmOption(pkgName, env, opt.name);
    switch (opt.type) {
      case 'string':
        {
          if (val !== undefined) {
            if (env['npm_config_loglevel'])
              console.info(` --- meson option - ${opt.name} = "${val}"`);
            result += ` -D${opt.name}=${quote}${val}${quote}`;
          }
        }
        break;
      case 'boolean':
        {
          if (val === true) {
            if (env['npm_config_loglevel'])
              console.info(` --- meson option ${opt.name} = True`);
            result += ` -D${opt.name}=True`;
          } else if (val === false) {
            if (env['npm_config_loglevel'])
              console.info(` --- meson option ${opt.name} = False`);
            result += ` -D${opt.name}=False`;
          }
        }
        break;
      case 'array':
        {
          if (val !== undefined) {
            if (env['npm_config_loglevel'])
              console.info(` --- meson option - ${opt.name} = "${val}"`);
            result += ` -D${opt.name}=${quote}${val}${quote}`;
          }
        }
        break;
    }
  }

  return result;
}

function parseConanOptions(pkgName: string, env: Environment, conanOptions: ConanOption[]) {
  let result = '';

  for (const opt of Object.keys(conanOptions)) {
    const val = getNpmOption(pkgName, env, opt);

    if (val === true) {
      if (conanOptions[opt].includes('True')) {
        if (env['npm_config_loglevel'])
          console.info(` --- conan option - ${opt} = True`);
        result += ` -o ${opt}=True`;
      } else {
        throw new Error(`${opt} does not support True setting`);
      }
    } else if (val === false) {
      if (conanOptions[opt].includes('True')) {
        if (env['npm_config_loglevel'])
          console.info(` --- conan option - ${opt} = False`);
        result += ` -o ${opt}=False`;
      } else {
        throw new Error(`${opt} does not support False setting`);
      }
    } else if (typeof val === 'string') {
      if (conanOptions[opt].includes(val)) {
        if (env['npm_config_loglevel'])
          console.info(` --- conan option - ${opt} = ${val}`);
        result += ` -o ${opt}=${quote}${val}${quote}`;
      } else {
        throw new Error(`${opt} does not support "${val}" setting`);
      }
    }
  }

  return result;
}


module.exports = function () {
  this.registerTag('mesonOptions', class MesonOptions {
    render(context) {
      const pkgName = context.environments.package.name as string;
      const mesonOptions = mesonBuildOptions(context.environments.PATH);
      return parseMesonOptions(pkgName, context.environments.env, mesonOptions);
    }
  });
  this.registerTag('conanOptions', class ConanOptions {
    render(context) {
      const pkgName = context.environments.package.name as string;
      const conanOptions = conanBuildOptions(context.environments.PATH);
      return parseConanOptions(pkgName, context.environments.env, conanOptions);
    }
  });
};

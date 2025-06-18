import * as os from 'node:os'; 

export type NpmContext = 'meson' | 'conan' | undefined;
export type OptionVal = boolean | string | undefined;
export type ConanOption = Record<string, string[]>;
export type MesonOption = {
  name: string;
  type: 'string' | 'boolean' | 'array';
};
export type Environment = Record<string, string>;

export const quote = os.platform() == 'win32' ? '"' : '\'';

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
    console.error(err);
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
export function getNpmOption(pkgName: string, env: Environment,
    name: string, context?: NpmContext): OptionVal {
  const pkgOverride = getRawNpmOption(pkgName, env, name);
  if (context) {
    const r = getNpmOption(pkgName, env, `${name}-${context}`, undefined);
    if (r !== undefined)
      return r;
  }
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

import * as cp from 'node:child_process';
import assert from 'node:assert';

import { ConanOption, Environment, getNpmOption, quote } from './util.js';

export function conanBuildOptions(path: string): ConanOption[] {
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

export function parseConanOptions(pkgName: string, env: Environment, conanOptions: ConanOption[]) {
  let result = '';

  for (const opt of Object.keys(conanOptions)) {
    const val = getNpmOption(pkgName, env, opt, 'conan');

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

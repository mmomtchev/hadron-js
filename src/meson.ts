import * as cp from 'node:child_process';
import assert from 'node:assert';

import { MesonOption, Environment, getNpmOption, quote } from './util.js';

// These are always set by npm with a special meaning
// that is not the meson meaning
const mesonBlacklist = ['prefix'];

export function mesonBuildOptions(path: string): MesonOption[] {
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

export function parseMesonOptions(pkgName: string, env: Environment, mesonOptions: MesonOption[]) {
  let result = '';

  for (const opt of mesonOptions) {
    if (mesonBlacklist.includes(opt.name))
      continue;

    const val = getNpmOption(pkgName, env, opt.name, 'meson');
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


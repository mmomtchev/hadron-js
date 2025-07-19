import * as cp from 'node:child_process';
import * as os from 'node:os';
import * as path from 'node:path';

import assert from 'node:assert';

import { Tag, TagToken, TopLevelToken, Liquid, Template, Context, Emitter } from 'liquidjs';
import { Parser } from 'liquidjs/dist/parser'; 

import { MesonOption, Environment, OptionVal, getNpmOption, quote } from './util.js';

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

export class MesonProfile extends Tag {
  toolchain: string;
  flavor: string;
  platform: string;

  constructor(tagToken: TagToken, remainTokens: TopLevelToken[], liquid: Liquid, parser: Parser) {
    super(tagToken, remainTokens, liquid);
    this.toolchain = '';
    parser.parseStream(remainTokens)
      .on('start', () => {
        this.toolchain = tagToken.tokenizer.readIdentifier().getText() || 'system';
        this.flavor = tagToken.tokenizer.readIdentifier().getText() || 'async';
        this.platform = tagToken.tokenizer.readIdentifier().getText() || os.platform();
      })
      .start();
  }

  * render(context: Context, emitter: Emitter) {
    return path.resolve(__dirname, '..', 'meson', `${this.toolchain}-${this.platform}.ini`);
  }
}

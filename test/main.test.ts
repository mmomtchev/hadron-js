import * as cp from 'node:child_process';
import * as path from 'node:path';
import * as os from 'node:os';
import { assert } from 'chai';

const fixtures = path.resolve(__dirname, 'fixtures');

const npx = os.platform() === 'win32' ? 'npx.cmd' : 'npx';

function runXpm(dir: string, cmd: string, env?: Record<string, string>) {
  const r = cp.spawnSync(npx,
    ['xpm', 'run', '-q', cmd],
    {
      env: { ...process.env, ...env },
      cwd: path.resolve(fixtures, dir),
      shell: true
    });
  assert.isUndefined(r.error);
  assert.isEmpty(r.stderr, r.stderr.toString());
  const args = JSON.parse(r.stdout.toString());
  args.shift();
  return args;
}

describe('magickwand.js', () => {
  before('install xpacks', function () {
    this.timeout(240000);
    cp.spawnSync(npx,
      ['xpm', 'install', '-q'],
      { cwd: path.resolve(fixtures, 'magickwand.js'), shell: true });
  });

  describe('meson options', () => {
    it('global options', () => {
      const r = runXpm('magickwand.js', 'showMesonOptions', {
        'npm_config_enable_fonts': 'true',
        'npm_config_disable_png': 'true',
        'npm_config_enable_jpeg': '',
        'npm_config_c_args': '-O0 -DDEBUG'
      });
      assert.sameMembers(r, ['-Dc_args=-O0 -DDEBUG', '-Dfonts=True', '-Dpng=False']);
    });
    it('package options', () => {
      const r = runXpm('magickwand.js', 'showMesonOptions', {
        'npm_config_magickwand_js_enable_fonts': 'true',
        'npm_config_magickwand_js_disable_png': 'true',
        'npm_config_magickwand_js_enable_jpeg': '',
        'npm_config_magickwand_js_c_args': '-O0 -DDEBUG'
      });
      assert.sameMembers(r, ['-Dc_args=-O0 -DDEBUG', '-Dfonts=True', '-Dpng=False']);
    });
    it('overrides', () => {
      const r = runXpm('magickwand.js', 'showMesonOptions', {
        'npm_config_disable_fonts': 'true',
        'npm_config_enable_png': 'true',
        'npm_config_disable_jpeg': 'true',
        'npm_config_c_args': '-O2 -DNDEBUG',
        'npm_config_magickwand_js_enable_fonts': 'true',
        'npm_config_magickwand_js_disable_png': 'true',
        'npm_config_magickwand_js_enable_jpeg': 'true',
        'npm_config_magickwand_js_c_args': '-O0 -DDEBUG'
      });
      assert.sameMembers(r, ['-Dc_args=-O0 -DDEBUG', '-Djpeg=True', '-Dfonts=True', '-Dpng=False']);
    });
    it('conflicts', () => {
      assert.throws(() => {
        const r = runXpm('magickwand.js', 'showMesonOptions', {
          'npm_config_enable_fonts': 'true',
          'npm_config_disable_fonts': 'true'
        });
        console.log(r);
      });
    });
  });
});

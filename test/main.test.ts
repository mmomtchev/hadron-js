import * as cp from 'node:child_process';
import * as path from 'node:path';
import { assert } from 'chai';

const fixtures = path.resolve(__dirname, 'fixtures');

function runXpm(dir: string, cmd: string, env?: Record<string, string>) {
  const r = cp.spawnSync('npx',
    ['xpm', 'run', '-q', '-C', path.resolve(fixtures, dir), cmd],
    { env: { ...process.env, ...env } });
  assert.isUndefined(r.error);
  assert.isEmpty(r.stderr, r.stderr.toString());
  return r.stdout.toString().trim().split(' ');
}

describe('magickwand.js', () => {
  describe('meson options', () => {
    it('global options', () => {
      const r = runXpm('magickwand.js', 'showMesonOptions', {
        'npm_config_enable_fonts': 'true',
        'npm_config_disable_png': 'true',
        'npm_config_enable_jpeg': '',
        'npm_config_c_args': '-O0'
      });
      assert.sameMembers(r, ['-Dc_args=\'-O0\'', '-Dfonts=True', '-Dpng=False']);
    });
    it('package options', () => {
      const r = runXpm('magickwand.js', 'showMesonOptions', {
        'npm_config_magickwand.js:enable_fonts': 'true',
        'npm_config_magickwand.js:disable_png': 'true',
        'npm_config_magickwand.js:enable_jpeg': '',
        'npm_config_magickwand.js:c_args': '-O0'
      });
      assert.sameMembers(r, ['-Dc_args=\'-O0\'', '-Dfonts=True', '-Dpng=False']);
    });
    it('overrides', () => {
      const r = runXpm('magickwand.js', 'showMesonOptions', {
        'npm_config_disable_fonts': 'true',
        'npm_config_enable_png': 'true',
        'npm_config_disable_jpeg': 'true',
        'npm_config_c_args': '-O2',
        'npm_config_magickwand.js:enable_fonts': 'true',
        'npm_config_magickwand.js:disable_png': 'true',
        'npm_config_magickwand.js:enable_jpeg': 'true',
        'npm_config_magickwand.js:c_args': '-O0'
      });
      assert.sameMembers(r, ['-Dc_args=\'-O0\'', '-Djpeg=True', '-Dfonts=True', '-Dpng=False']);
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

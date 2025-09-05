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
  const err = r.stderr.toString().trim().split('\n')
    .filter((line: string) => line)
    .filter((line: string) => !line.match(/conan building packages in/))
    .filter((line: string) => !line.match(/This directory can grow to a considerable size/));
  assert.isEmpty(err, r.stderr.toString());
  return r.stdout.toString().trim();
}

function runXpmJSON(dir: string, cmd: string, env?: Record<string, string>) {
  const r = runXpm(dir, cmd, env);
  let args: string[];
  try {
    args = JSON.parse(r);
  } catch (e) {
    console.error('failed parsing JSON', r);
    throw e;
  }
  args.shift();
  return args;
}

describe('conan+meson-dual-async', () => {
  before('install xpacks / initialize conan profile', function () {
    this.timeout(240000);
    cp.spawnSync(npx,
      ['xpm', 'install', '-q'],
      { cwd: path.resolve(fixtures, 'conan+meson-dual-async'), shell: true });
    cp.spawnSync(npx,
      ['xpm', 'run', '-q', 'conan'],
      { cwd: path.resolve(fixtures, 'conan+meson-dual-async'), shell: true });
  });

  describe('meson options', () => {
    it('global options', () => {
      const r = runXpmJSON('conan+meson-dual-async', 'showMesonOptions', {
        'npm_config_enable_fonts': 'true',
        'npm_config_disable_png': 'true',
        'npm_config_enable_jpeg': '',
        'npm_config_c_args': '-O0 -DDEBUG'
      });
      assert.sameMembers(r, [
        '-Dc_args=-O0 -DDEBUG',
        '-Dfonts=True',
        '-Dpng=False'
      ]);
    });
    it('package options', () => {
      const r = runXpmJSON('conan+meson-dual-async', 'showMesonOptions', {
        'npm_config_cmda_enable_fonts': 'true',
        'npm_config_cmda_disable_png': 'true',
        'npm_config_cmda_enable_jpeg': '',
        'npm_config_cmda_c_args': '-O0 -DDEBUG'
      });
      assert.sameMembers(r, [
        '-Dc_args=-O0 -DDEBUG',
        '-Dfonts=True',
        '-Dpng=False'
      ]);
    });
    it('package overrides', () => {
      const r = runXpmJSON('conan+meson-dual-async', 'showMesonOptions', {
        'npm_config_disable_fonts': 'true',
        'npm_config_enable_png': 'true',
        'npm_config_disable_jpeg': 'true',
        'npm_config_c_args': '-O2 -DNDEBUG',
        'npm_config_cmda_enable_fonts': 'true',
        'npm_config_cmda_disable_png': 'true',
        'npm_config_cmda_enable_jpeg': 'true',
        'npm_config_cmda_c_args': '-O0 -DDEBUG'
      });
      assert.sameMembers(r, [
        '-Dc_args=-O0 -DDEBUG',
        '-Djpeg=True',
        '-Dfonts=True',
        '-Dpng=False'
      ]);
    });
    it('meson overrides', () => {
      const r = runXpmJSON('conan+meson-dual-async', 'showMesonOptions', {
        'npm_config_disable_fonts': 'true',
        'npm_config_enable_fonts_meson': 'true'
      });
      assert.sameMembers(r, ['-Dfonts=True']);
    });
    it('conflicts', () => {
      assert.throws(() => {
        runXpmJSON('conan+meson-dual-async', 'showMesonOptions', {
          'npm_config_enable_fonts': 'true',
          'npm_config_disable_fonts': 'true'
        });
      });
    });
  });

  describe('conan options', () => {
    it('global options', () => {
      const r = runXpmJSON('conan+meson-dual-async', 'showConanOptions', {
        'npm_config_enable_fonts': 'true',
        'npm_config_disable_png': 'true',
        'npm_config_enable_jpeg': '',
        'npm_config_c_args': '-O0 -DDEBUG'
      });
      assert.sameOrderedMembers(r, [
        '-o', 'fonts=True',
        '-o', 'png=False',
        '-s', 'tools.build:cflags=-O0 -DDEBUG'
      ]);
    });
    it('package options', () => {
      const r = runXpmJSON('conan+meson-dual-async', 'showConanOptions', {
        'npm_config_cmda_enable_fonts': 'true',
        'npm_config_cmda_disable_png': 'true',
        'npm_config_cmda_enable_jpeg': '',
        'npm_config_cmda_c_args': '-O0 -DDEBUG'
      });
      assert.sameOrderedMembers(r, [
        '-o', 'fonts=True',
        '-o', 'png=False',
        '-s', 'tools.build:cflags=-O0 -DDEBUG'
      ]);
    });
    it('package overrides', () => {
      const r = runXpmJSON('conan+meson-dual-async', 'showConanOptions', {
        'npm_config_disable_fonts': 'true',
        'npm_config_enable_png': 'true',
        'npm_config_disable_jpeg': 'true',
        'npm_config_c_args': '-O2 -DNDEBUG',
        'npm_config_cmda_enable_fonts': 'true',
        'npm_config_cmda_disable_png': 'true',
        'npm_config_cmda_enable_jpeg': 'true',
        'npm_config_cmda_c_args': '-O0 -DDEBUG'
      });
      assert.sameOrderedMembers(r, [
        '-o', 'fonts=True',
        '-o', 'jpeg=True',
        '-o', 'png=False',
        '-s', 'tools.build:cflags=-O0 -DDEBUG'
      ]);
    });
    it('conan overrides', () => {
      const r = runXpmJSON('conan+meson-dual-async', 'showConanOptions', {
        'npm_config_enable_fonts': 'true',
        'npm_config_disable_fonts_conan': 'true'
      });
      assert.sameOrderedMembers(r, ['-o', 'fonts=False']);
    });
    it('conflicts', () => {
      assert.throws(() => {
        runXpmJSON('conan+meson-dual-async', 'showConanOptions', {
          'npm_config_enable_fonts': 'true',
          'npm_config_disable_fonts': 'true'
        });
      });
    });
  });

  describe('meson-dual-async', () => {
    before('install xpacks / initialize conan profile', function () {
      this.timeout(240000);
      cp.spawnSync(npx,
        ['xpm', 'install', '-q'],
        { cwd: path.resolve(fixtures, 'meson-dual-async'), shell: true });
      cp.spawnSync(npx,
        ['xpm', 'run', '-q', 'conan'],
        { cwd: path.resolve(fixtures, 'meson-dual-async'), shell: true });
    });

    describe('meson options', () => {
      it('global options', () => {
        const r = runXpmJSON('meson-dual-async', 'showMesonOptions', {
          'npm_config_enable_fonts': 'true',
          'npm_config_disable_png': 'true',
          'npm_config_enable_jpeg': '',
          'npm_config_c_args': '-O0 -DDEBUG'
        });
        assert.sameMembers(r, [
          '-Dc_args=-O0 -DDEBUG',
          '-Dfonts=True',
          '-Dpng=False'
        ]);
      });
      it('package options', () => {
        const r = runXpmJSON('meson-dual-async', 'showMesonOptions', {
          'npm_config_mmomtchev_mda_enable_fonts': 'true',
          'npm_config_mmomtchev_mda_disable_png': 'true',
          'npm_config_mmomtchev_mda_enable_jpeg': '',
          'npm_config_mmomtchev_mda_c_args': '-O0 -DDEBUG'
        });
        assert.sameMembers(r, [
          '-Dc_args=-O0 -DDEBUG',
          '-Dfonts=True',
          '-Dpng=False'
        ]);
      });
      it('package overrides', () => {
        const r = runXpmJSON('meson-dual-async', 'showMesonOptions', {
          'npm_config_disable_fonts': 'true',
          'npm_config_enable_png': 'true',
          'npm_config_disable_jpeg': 'true',
          'npm_config_c_args': '-O2 -DNDEBUG',
          'npm_config_mmomtchev_mda_enable_fonts': 'true',
          'npm_config_mmomtchev_mda_disable_png': 'true',
          'npm_config_mmomtchev_mda_enable_jpeg': 'true',
          'npm_config_mmomtchev_mda_c_args': '-O0 -DDEBUG'
        });
        assert.sameMembers(r, [
          '-Dc_args=-O0 -DDEBUG',
          '-Djpeg=True',
          '-Dfonts=True',
          '-Dpng=False'
        ]);
      });
      it('meson overrides', () => {
        const r = runXpmJSON('meson-dual-async', 'showMesonOptions', {
          'npm_config_disable_fonts': 'true',
          'npm_config_enable_fonts_meson': 'true'
        });
        assert.sameMembers(r, ['-Dfonts=True']);
      });
      it('conflicts', () => {
        assert.throws(() => {
          runXpmJSON('meson-dual-async', 'showMesonOptions', {
            'npm_config_enable_fonts': 'true',
            'npm_config_disable_fonts': 'true'
          });
        });
      });
    });
  });

  describe('LiquidJS npm option tags', () => {

    describe('unlessNpmOption', () => {
      it('unlessSkipNative default', () => {
        const r = runXpm('conan+meson-dual-async', 'unlessSkipNative');
        assert.strictEqual(r, 'triggered');
      });
      it('unlessSkipNative global disable', () => {
        const r = runXpm('conan+meson-dual-async', 'unlessSkipNative', {
          'npm_config_skip_native': 'true'
        });
        assert.strictEqual(r, '');
      });
      it('unlessSkipNative package disable', () => {
        const r = runXpm('conan+meson-dual-async', 'unlessSkipNative', {
          'npm_config_cmda_skip_native': 'true'
        });
        assert.strictEqual(r, '');
      });
      it('unlessSkipNative override disable', () => {
        const r = runXpm('conan+meson-dual-async', 'unlessSkipNative', {
          'npm_config_skip_native': '',
          'npm_config_cmda_skip_native': 'true'
        });
        assert.strictEqual(r, '');
      });
    });

    describe('ifSkipWasm', () => {
      it('ifSkipWasm default', () => {
        const r = runXpm('conan+meson-dual-async', 'ifSkipWasm');
        assert.strictEqual(r, '');
      });
      it('ifSkipWasm force', () => {
        const r = runXpm('conan+meson-dual-async', 'ifSkipWasm', {
          'npm_config_skip_wasm': 'true'
        });
        assert.strictEqual(r, 'triggered');
      });
      it('ifSkipWasm scoped', () => {
        const r = runXpm('meson-dual-async', 'ifSkipWasm');
        assert.strictEqual(r, '');
      });
      it('ifSkipWasm scoped forced', () => {
        const r = runXpm('meson-dual-async', 'ifSkipWasm', {
          'npm_config_mmomtchev_mda_skip_wasm': 'true'
        });
        assert.strictEqual(r, 'triggered');
      });
    });
  });

  describe('conditional async', () => {
    it('disable explicitly', () => {
      const r = runXpm('conditional-async', 'showConanArgs', {
        'npm_config_disable_async': 'true'
      });
      assert.include(r, 'emscripten-sync.profile');
    });
    it('enable explicitly', () => {
      const r = runXpm('conditional-async', 'showConanArgs', {
        'npm_config_enable_async': 'true'
      });
      assert.include(r, 'emscripten-async.profile');
    });
    it('default true', () => {
      const r = runXpm('conditional-async', 'showConanArgs');
      assert.include(r, 'emscripten-async.profile');
    });
  });

  describe('LiquidJS profile directories tags', () => {
    it('showConanProfile', () => {
      const r = runXpm('conan+meson-dual-async', 'showConanProfile');
      assert.isString(r);
    });
  });
});

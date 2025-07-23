# `hadron` build system

This is the `hadron` build system, a composite system for packaging, building and distributing compiled packages - especially C and C++ - for the JavaScript ecosystem.

It can produce dual environment binary modules - native build for Node.js and WASM build for the browser - that work as a normal JavaScript package and can be used both on the backend and the frontend sides. The web bundler picks up the correct binary version.

It consists of the following components:
 * [`xpm`](https://xpack.github.io) is the central orchestrator, an additional layer built over `npm` with a sophisticated scripting support built around LiquidJS
 * [`hadron`](https://github.com/mmomtchev/hadron.git) - a slightly modified [`meson`](https://github.com/mesonbuild/meson.git) core with support for building native Node-API modules and WASM bundles using [`emnapi`](https://toyobayashi.github.io/emnapi-docs/), and improved CMake support
 * [`conan`](https://conan.io/) - optional integration with the C++ package manager for self-contained builds of the most commonly used C and C++ libraries
 * [xPacks](https://xpack.github.io/) - all the compiler infrastructure comes bundled as `xpm`-enhanced `npm` packages - you can use your system compiler or the `clang` portable compiler on all OS for a build on the target host without installed C++ environment

 `hadron` is meant to be the preferred build system for [SWIG JSE](https://github.com/mmomtchev/swig)-generated projects.

# Comparison vs `node-gyp`

| Description | `node-gyp` | `hadron` = `meson` + `conan` + `xpm` |
| --- | --- | --- |
| Overview  | The official Node.js and Node.js native addon build system from the Node.js core team, inherited and adapted from the early days of V8 / Chromium  | A new experimental build system from the SWIG JSE author that follows the `meson` design principles |
| Status | Very mature | Young project |
| Platforms with native builds | All platforms supported by Node.js  | Linux, Windows and macOS, `x86-64` or `arm64` on all OS |
| WASM builds | Hackish, see `swig-napi-example-project` and `magickwand.js@1.1` for solutions | Out of the box |
| Node.js APIs | All APIs, including the now obsolete raw V8 and NAN and the current Node-API | Only Node-API |
| Integration with other builds systems for external dependencies | Very hackish, see `magickwand.js@1.1` for solutions, the only good solution is to recreate the build system of all dependencies around `node-gyp` | Out of the box support for `meson`, `CMake` and `autotools` |
| `conan` integration | Very hackish, see `magickwand.js@1.0` | Out of the box |
| Build configurations through `npm install` CLI options | Yes | Yes |
| Distributing prebuilt binaries | Yes, multiple options, including `@mapbox/node-pre-gyp`, `prebuild-install` and `prebuildify` | Only `@mmomtchev/prebuild-install` at the moment |
| Requirements for the target host when installing from source | Node.js, Python and a working C++17 build environment | Only Node.js  when using `xpack-dev-tools`, a working C++17 build environment otherwise |
| Makefile language | Obscure and obsolete (`gyp`) | Modern and supported (`meson`)

When choosing a build system, if your project:

 * targets only Node.js/native and has no dependencies

    → stay on `node-gyp`

 * meant to be distributed only as binaries compiled in a controlled environment

    → stay on `node-gyp`

 * has a dual-environment native/WASM setup

    → `node-gyp` will work for you, but `hadron` has some advantages

 * has dependencies with different build systems (`meson`, `CMake`, `autotools`)

    → `hadron` is the much better choice

 * uses `conan`

    → `hadron` is the much better choice

 * must support compilation on all end-users' machines without any assumptions about the installed software

    → `hadron` is the only choice

 * multiple from the above elements

    → `hadron` is the only choice

# Quickstart

* Install the following packages:

```bash
# Always
npm i --save @mmomtchev/hadron @mmomtchev/xpm
# If you have a WASM build
npm i --save emnapi @emnapi/runtime
# If you are shipping prebuilt binaries
npm i --save @mmomtchev/prebuild-install
```

* Add this to your `package.json`:

```json
{
  "scripts": {
    "install": "npx xpm install && npx xpm run npm-install"
  },
  "xpack": {
    "minimumXpmRequired": "0.20.0",
    "include": [
      "@mmomtchev/hadron/hadron.json"
    ],
    "properties": {
      "module_name": "first_great_cpp_project",
      "native": true,
      "wasm": true,
      "async": true,
      "conan": true
    }
  }
}
```

* Create a `meson.build` with the usual `meson` syntax with a target that looks like:

```python
main_target = napi.extension_module(
  'first_great_cpp_project',
  sources,
  install: true,
  dependencies: dependencies,
  node_api_options: {
    # This is only for the WASM build
    # Exclude Node from the WASM loader produces
    # a binary that integrates perfectly with webpack
    'environments': ['web','webview','worker']
  }
)
```

* Optionally, create a `conanfile.py` or a `conanfile.txt` for your required libraries - or alternatively - disable `conan` completely

# Customizing the build

The `hadron` collection of `xpm` actions recognizes a number of special properties in the `xpack` section:

* `native` for enabling a native build, currently must always be enabled
* `wasm` for enabling a WASM build
* `async` for enabling async support, the resulting WASM build will require [COOP/COEP](https://web.dev/articles/coop-coep)
* `conan` for enabling the conan integration

Additionally, the following options can be both in the `xpack` section to be applied globally or in a specific build configuration:

* `argsConanInstall` for passing custom arguments to `conan install`
* `argsMesonPrepare` for passing custom arguments to `meson setup`
* `argsMesonCompile` for passing custom arguments to `meson compile`

For example the following `package.json` elements specify a `conan.profile` to be passed to all build configurations and to produce a WASM size optimized build even in debug configuration:

```json
{
  "properties": {
    "argsConanInstall": "-pr:b=conan.profile -pr:h=conan.profile"
  },
  "buildConfigurations": {
    "wasm-debug": {
      "properties": {
        "argsMesonPrepare": "-Doptimization=1"
      }
    }
  }
}
```

# `npm install` options support

Parsing of the `npm install` options is automatic. All `hadron`-based packages recognize a number of universal options. When handling options, underscores and dashes are considered identical. Every option has a global notation, valid for all installed `hadron`-based packages or a package-specific option valid only for the named package. Options can also be specified in the `.npmrc` file to be automatically picked up by the default `npm install` invocation.

* `--build-from-source` or `--first_great_cpp_project_build_from_source`: rebuild the native module even if there are prebuilt binaries for the current platform
* `--build-wasm-froum-source` or `--first_great_cpp_project_build_wasm_from_source`: rebuild the WASM module even if there is a prebuilt binary, must have `emscripten` installed and activated
* `--enable-standalone-build` or `--first_great_cpp_project_enable_standalone_build`: use the `hadron`-provided integrated `clang` compiler to build the project - which should work even if the target host does not have a C++ environment installed
* `--skip-native` / `--first_great_cpp_project_skip_native` and `--skip-wasm` / `--first_great_cpp_project_skip_wasm` allow to skip installing the native or the WASM module - these are most useful in CI where the package will be rebuilt manually

Specifying in `.npmrc` looks like this:
```ini
first_great_cpp_project_build_from_source = true
```

## `meson` build options

If the `meson` project has build options, then all of these options are automatically recognized as `npm install` build options.

For example, if `meson.options` contains:

```python
option('jpeg', type: 'boolean', value: true, description: 'JPEG support')
option('name', type: 'string', value: 'first great project', description: 'Package name')
```

then `hadron` will recognize `--enable-jpeg` and `--disable-jpeg` and `--name="second project"` and their package specific variants.

Additionally, all `meson` built-in options are also recognized, for example `--c_args` and `--c_link_args` can be used to specify additional compiler and linker flags.

You should be aware that while the `--enable-...` and `--disable-...` flags are very widely used and are considered totally safe, they remain undocumented `npm` features. On the other side, their string counterparts are somewhat riskier and subject to interpretation by `npm`. Using a `.npmrc` file to specify these options is one way to reduce this risk.

## `conan` build options

`conan` build options are also handled the same way as `meson` build options. If you have a `conanfile.py` with:

```python
options = {
  'jpeg':      [ True, False ]
}
default_options = {
  'jpeg':      True
}
```

`hadron` will pass the same way as it passes to `meson` any `--enable-jpeg` or `--disable-jpeg` flags. It will also pass any `--c_args` in the format expected by `conan`.

## Customizing `npm` option behavior

When extending or overriding the existing `xpm` scripts, `npm` options can be used via the provided LiquidJS plugin:

```json
{
  "cmd": "{% ifNpmOption loglevel %}echo Verbose output{% endifNpmOption %}"
}
```

# Prebuilt binaries

Prebuilt binaries use `@mmomtchev/prebuild-install` which is a slightly modified and modernized version `prebuild-install` with support for WASM targets.

You will need to include a distribution point in the `package.json`:

```json
{
  "binary": {
    "module_name": "first_great_project",
    "module_path": "./lib/binding/{platform}-{arch}",
    "remote_path": "v{version}",
    "host": "https://github.com/great-developer/first_great_project/releases/download/",
    "package_name": "{platform}-{arch}.tar.gz",
    "hosting": {
      "provider": "github",
      "repo": "great-developer/first_great_project"
    },
    "napi_versions": [
      6
    ]
  }
}
```

Then after building in CI for each platform, you will simply have to create a `.tar.gz` archive of the `./lib/binding` directory and upload it to the above specified URL.

# Use in development and troubleshooting

Launching `npm install` with `--verbose` and `--foreground-scripts` will show you the verbose output of the build process.

When working the project locally, you can use:

 * `npx xpm install && npx xpm install --config native|wasm|native-debug|wasm-debug` to install/update the required xpacks
 * `npx xpm run prepare --config native|wasm|native-debug|wasm-debug` to populate the `conan` dependencies and run the configure step of your project
 * `npx xpm run build --config native|wasm|native-debug|wasm-debug` to build the project
 * `npx xpm run configure --config native|wasm|native-debug|wasm-debug -- -Doptimizations=1` to run the `meson` `configure` step for modifying build options on a configured project
 * `npx xpm run conan -- version` to directly invoke `conan` commands
 * `npx xpm run lock --config native|wasm|native-debug|wasm-debug` to lock the `conan` dependencies for the current configuration
 * `npx xpm run clean [--config native|wasm|native-debug|wasm-debug]` to clean the build directory as well as all the `conan` build trees

When you invoke `xpm` directly the `npm` options must be passed in the form of `npm_config_*` environment variables:

 ```bash
npm_config_enable_standalone_build=true npx xpm run prepare --config native-debug
npm_config_enable_standalone_build=true npx xpm run build --config native-debug
```

Do not forget that the integrated `meson` and `conan` come from xPacks and are purposely made to not interfere with existing `meson` and `conan` installations and will likely be different versions.

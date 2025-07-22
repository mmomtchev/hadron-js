# `hadron` build system

This is the `hadron` build system, a composite system for packaging, building and distributing compiled packages - especially C and C++ - for the JavaScript ecosystem.

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

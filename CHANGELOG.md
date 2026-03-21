## 1.2.0

* Remove the `clean` action from the `make` action, projects which want to enable automatic cleaning after rebuilding should wire the `clean` action to the `postprepare` `npm` script in order to avoid rebuilding multiple times when the `install` script is invoked multiple times

## 1.1.0 2026-01-22

* Update `meson` to 1.10.1
* Update `conan` to 2.22.1
* On macOS, compile by default with `-mmacos-version-min=13.0`
* Remove all individual `conan` recipe overrides from the standalone build, packages which require specific settings for building with LLVM/clang on all platforms, will have to include these settings themselves

# 1.0.0 2025-09-10

* First release

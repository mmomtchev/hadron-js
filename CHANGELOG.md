## 1.1.0 2026-01-22

* Update `meson` to 1.10.1
* Update `conan` to 2.22.1
* On macOS, compile by default with `-mmacos-version-min=13.0`
* Remove all individual `conan` recipe overrides from the standalone build, packages which require specific settings for building with LLVM/clang on all platforms, will have to include these settings themselves

# 1.0.0 2025-09-10

* First release

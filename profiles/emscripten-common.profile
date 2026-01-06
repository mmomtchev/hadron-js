include(default)

[buildenv]
CC={{ os.getenv("EMCC") or "emcc" }}
CXX={{ os.getenv("EMCXX") or "em++" }}
AR={{ os.getenv("EMAR") or "emar" }}
RANLIB={{ os.getenv("EMRANLIB") or "emranlib" }}
STRIP={{ os.getenv("EMSTRIP") or "emstrip" }}

[settings]
os=Emscripten
arch=wasm
compiler=clang
compiler.libcxx=libc++
compiler.version=17
compiler.cppstd=gnu20

[conf]
tools.cmake.cmaketoolchain:user_toolchain=['{{ os.getenv("EMSDK") }}/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake']

[options]

[tool_requires]
# One day when emscripten is stable enough we will
# be ok with a version that is a few monhts or an year old
#emsdk/3.1.50

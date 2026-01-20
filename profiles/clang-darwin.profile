[buildenv]
CC=clang
CXX=clang++
LD=ld64.lld
AR=llvm-ar
AS=llvm-as
RANLIB=llvm-ranlib
NM=llvm-nm
STRIP=llvm-strip
OBJDUMP=llvm-objdump

[settings]
arch={{ {"arm64": "armv8"}.get(platform.machine(), platform.machine()) }}
build_type=Release
compiler=clang
compiler.cppstd=gnu20
compiler.version=17
compiler.libcxx=libc++
os=Macos

[conf]
# By using clang we are already out of the paved road
tools.cmake.cmaketoolchain:generator=Ninja
tools.build:cflags=[ '-mmacos-version-min=13.0' ]
tools.build:cxxflags=[ '-mmacos-version-min=13.0' ]
tools.build:sharedlinkflags=[ '-fuse-ld=lld', '-mmacos-version-min=13.0' ]
tools.build:exelinkflags=[ '-fuse-ld=lld', '-mmacos-version-min=13.0' ]
tools.cmake.cmaketoolchain:extra_variables={'CMAKE_LINKER': 'ld64.lld', 'CMAKE_AR': 'llvm-ar', 'CMAKE_AS': 'llvm-as', 'CMAKE_RANLIB': 'llvm-ranlib', 'CMAKE_NM': 'llvm-nm', 'CMAKE_STRIP': 'llvm-strip', 'CMAKE_OBJDUMP': 'llvm-objdump'}

include(default)

[settings]
compiler.cppstd=gnu20

[conf]
tools.build:cflags=[ '-mmacos-version-min=13.0' ]
tools.build:cxxflags=[ '-mmacos-version-min=13.0' ]
tools.build:sharedlinkflags=[ '-mmacos-version-min=13.0' ]
tools.build:exelinkflags=[ '-mmacos-version-min=13.0' ]

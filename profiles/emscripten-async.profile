include(./emscripten-common.profile)

[conf]
tools.build:cflags=['-pthread']
tools.build:cxxflags=['-pthread']
tools.build:sharedlinkflags=['-pthread', '-sDEFAULT_PTHREAD_STACK_SIZE=2MB', '-sSTACK_SIZE=2MB']

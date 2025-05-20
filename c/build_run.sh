
clang -O3 -march=armv8-a+simd -mtune=native -o vector_addition vector_addition.c && ./vector_addition

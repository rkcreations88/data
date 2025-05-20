/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2025 Adobe
 *  All Rights Reserved.
 *
 * NOTICE: All information contained herein is, and remains
 * the property of Adobe and its suppliers, if any. The intellectual
 * and technical concepts contained herein are proprietary to Adobe
 * and its suppliers and are protected by all applicable intellectual
 * property laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe.
 **************************************************************************/

#include <stdio.h>
#include <stdlib.h>
#include <arm_neon.h>
#include <time.h>
#include <pthread.h>

// Vector3 struct to store three floats
typedef struct
{
    float x, y, z;
} Vector3;

#define ARRAY_SIZE 250000
#define NUM_RUNS 10

//  When this runs with interleaved data we get  5400 MFLOPS
//  When I run with non interleaved data we get 17000 MFLOPS

// High precision timer function using clock_gettime with CLOCK_MONOTONIC_RAW
double get_time()
{
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC_RAW, &ts);
    return ts.tv_sec + ts.tv_nsec * 1e-9;
}

void add_vectors(Vector3 *a, Vector3 *b, Vector3 *result, int size)
{
    for (int i = 0; i < size; i += 4)
    {
        // Load 4 Vector3 elements from both arrays (12 floats in total for each array)
        float32x4_t ax = vld1q_f32(&a[i].x);
        float32x4_t ay = vld1q_f32(&a[i].y);
        float32x4_t az = vld1q_f32(&a[i].z);

        float32x4_t bx = vld1q_f32(&b[i].x);
        float32x4_t by = vld1q_f32(&b[i].y);
        float32x4_t bz = vld1q_f32(&b[i].z);

        // Add corresponding components using SIMD
        float32x4_t rx = vaddq_f32(ax, bx);
        float32x4_t ry = vaddq_f32(ay, by);
        float32x4_t rz = vaddq_f32(az, bz);

        // Store the result back into the result array
        vst1q_f32(&result[i].x, rx);
        vst1q_f32(&result[i].y, ry);
        vst1q_f32(&result[i].z, rz);
    }
}

int main()
{
    // Allocate memory for the two arrays and the result array
    Vector3 *a = (Vector3 *)aligned_alloc(16, ARRAY_SIZE * sizeof(Vector3));
    Vector3 *b = (Vector3 *)aligned_alloc(16, ARRAY_SIZE * sizeof(Vector3));
    Vector3 *result = (Vector3 *)aligned_alloc(16, ARRAY_SIZE * sizeof(Vector3));

    // Initialize arrays with some data
    for (int i = 0; i < ARRAY_SIZE; i++)
    {
        a[i].x = i * 0.1f;
        a[i].y = i * 0.2f;
        a[i].z = i * 0.3f;
        b[i].x = i * 0.4f;
        b[i].y = i * 0.5f;
        b[i].z = i * 0.6f;
    }

    // Use volatile to prevent the compiler from optimizing away the result
    volatile float sink = 0.0f;

    // Perform the vector addition NUM_RUNS times and measure the time
    double start_time = get_time();

    for (int run = 0; run < NUM_RUNS; run++)
    {
        add_vectors(a, b, result, ARRAY_SIZE);

        // Force the compiler to keep the result
        sink += result[0].x + result[0].y + result[0].z;
    }

    double end_time = get_time();

    // Calculate elapsed time
    double total_time = end_time - start_time;
    double average_time = total_time / NUM_RUNS;

    // Calculate MFLOPS
    double total_flops = sizeof(Vector3) * ARRAY_SIZE * NUM_RUNS; // 3 operations per Vector3
    double mflops_per_second = (total_flops / total_time) / 1e6;

    printf("Average time per run: %f seconds\n", average_time);
    printf("Total time: %f seconds\n", total_time);
    printf("Performance: %f MFLOPS\n", mflops_per_second);

    // Use sink to prevent dead-code elimination
    printf("Sink: %f\n", sink);

    // Free allocated memory
    free(a);
    free(b);
    free(result);

    return 0;
}

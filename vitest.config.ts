import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
        ],
        setupFiles: ['./src/setupTests.js'],
        testTimeout: 20000,
    },
})
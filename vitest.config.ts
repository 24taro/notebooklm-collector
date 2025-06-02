import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    // テスト環境の設定
    environment: 'jsdom',

    // グローバル設定
    globals: true,

    // テストセットアップファイル
    setupFiles: './src/__tests__/setup.ts',

    // テスト対象から除外
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/tests/**', // Playwrightテストディレクトリを除外
    ],

    // カバレッジ設定
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '*.config.*',
        'src/types/',
        'src/app/layout.tsx',
        'src/app/page.tsx',
        'src/app/*/page.tsx',
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
    },

    // TypeScript設定
    typecheck: {
      tsconfig: './tsconfig.json',
    },
  },

  // エイリアス設定（Next.jsのパスエイリアスと同期）
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/types': resolve(__dirname, './src/types'),
      '@/adapters': resolve(__dirname, './src/adapters'),
    },
  },
})

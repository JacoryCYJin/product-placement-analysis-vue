import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': '/src'  // 直接设置路径，不需要额外的 `fileURLToPath` 和 `URL` 处理
    }
  },
  server: {
    proxy: {
      '/api': {  // 获取的路径中包含 /api 的请求
        target: 'http://localhost:8080', // 代理的目标地址
        changeOrigin: true, // 是否改变请求头中的host
        rewrite: path => path.replace(/^\/api/, '') // 重写路径
      }
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            // Proxy API requests to the ADK backend server
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                        console.log('Proxy error:', err);
                    });
                },
            },
        },
    },
    // Vite automatically loads and exposes all environment variables prefixed with VITE_
    // from .env files in the project root
    // Priority: .env.[mode].local > .env.[mode] > .env.local > .env
    // The dev server MUST be restarted after creating/modifying .env files
})

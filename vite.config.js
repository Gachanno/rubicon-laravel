import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        svgr(),
    ],
    server: {
        port: 5176,
        cors: true,
        hmr: {
            host: '127.0.0.1',
            port: 5176,
        },
    },
});

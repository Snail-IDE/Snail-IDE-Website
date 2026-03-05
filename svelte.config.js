import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter(),

    // REQUIRED for GitHub Pages
    paths: {
      base: '/TurtleMod-Website'
    },

    // Prevents build errors when pages don't exist yet
    prerender: {
      handleHttpError: 'ignore'
    }
  }
};

export default config;

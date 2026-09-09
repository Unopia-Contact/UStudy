import { readFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import { transformWithEsbuild, type Plugin } from 'vite';

const BOOKMARKLET_MODULE_ID = 'virtual:ustudy-bookmarklet-source';
const RESOLVED_BOOKMARKLET_MODULE_ID = `\0${BOOKMARKLET_MODULE_ID}`;
const bookmarkletSourcePath = fileURLToPath(new URL('../src/logic/Bookmarklet.js', import.meta.url));

export function minifiedBookmarkletSource(): Plugin {
  return {
    name: 'ustudy-minified-bookmarklet-source',
    resolveId(id) {
      return id === BOOKMARKLET_MODULE_ID ? RESOLVED_BOOKMARKLET_MODULE_ID : null;
    },
    async load(id) {
      if (id !== RESOLVED_BOOKMARKLET_MODULE_ID) return null;

      this.addWatchFile(bookmarkletSourcePath);
      const source = await readFile(bookmarkletSourcePath, 'utf8');
      const result = await transformWithEsbuild(source, bookmarkletSourcePath, {
        loader: 'js',
        legalComments: 'none',
        minify: true,
        target: 'es2020',
      });

      return `export default ${JSON.stringify(result.code)};`;
    },
  };
}

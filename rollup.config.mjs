
import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';
import strip from '@rollup/plugin-strip';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'es'
  },
  plugins: [
    typescript(),
    terser(),
    strip({
      functions: ['console.log', 'console.warn'], 
      sourceMap: false
    })
  ]
};

import * as esbuild from 'esbuild';
import fs from 'node:fs';
const config: esbuild.BuildOptions = {
  entryPoints: ['./src/cfPatch.ts', './src/workerPatch.ts'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outdir: 'build',
  minify: false,
  write: false,
  plugins: [
    {
      name: 'banner-footer',
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length > 0) {
            return;
          }
          let workerPatch;
          const banner = (fileName: string) => `const ${fileName} = (()=>{\n`;
          const footer = () => `\n});`;
          result.outputFiles?.forEach((file) => {
            if (file?.path?.endsWith('.js')) {
              const fileName = file?.path?.split('/').pop()?.split('.')[0];
              if (fileName) {
                const content = new TextDecoder().decode(file.contents);
                if (fileName === 'workerPatch') {
                  workerPatch = banner(fileName) + content + footer();
                }
                file.contents = new TextEncoder().encode(banner(fileName) + content + footer());
              }
            }
          });
          result.outputFiles?.forEach((file) => {
            const fileName = file?.path?.split('/').pop()?.split('.')[0];
            if (typeof fileName === 'string') {
              if (fileName === 'cfPatch' && workerPatch) {
                const cfPatch =
                  'const fullPatch=(win)=>{\nconst globalThis = win ?? window;\n' +
                  workerPatch +
                  '\n' +
                  new TextDecoder().decode(file.contents) +
                  `\n${fileName}();\n};`;
                fs.writeFileSync(file.path, iife(cfPatch, 'fullPatch'));
              } else {
                fs.writeFileSync(file.path, iife(new TextDecoder().decode(file.contents), fileName));
              }
              console.log(`✅ Created ${file.path}`);
            }
          });
        });
      },
    },
  ],
  loader: {
    '.ts': 'ts',
  },
};

async function build() {
  try {
    await esbuild.build(config);
    console.log('✅ Build Successful!');
  } catch (error) {
    console.error('❌ Build Error:', error);
    process.exit(1);
  }
}

build();

export default config;
function iife(cfPatch: string, fileName: string): string | NodeJS.ArrayBufferView<ArrayBufferLike> {
  return `(()=>{\n${cfPatch}\n${fileName}();\n})();\n`;
}

import * as esbuild from 'esbuild';

const config: esbuild.BuildOptions = {
  entryPoints: ['./src/cfPatch.ts', './src/workerPatch.ts'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  outdir: 'build',
  minify: false,

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

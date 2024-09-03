const esbuild = require('esbuild');

(async () => {
  await esbuild.build({
    entryPoints: [
      './src/lib/litActions/solana/src/signTransactionWithSolanaEncryptedKey.js',
      './src/lib/litActions/solana/src/signMessageWithSolanaEncryptedKey.js',
      './src/lib/litActions/solana/src/generateEncryptedSolanaPrivateKey.js',
    ],
    bundle: true,
    minify: true,
    sourcemap: false,
    outdir: './src/lib/litActions/solana/dist',
    inject: ['./buffer.shim.js'],
  });
  await esbuild.build({
    entryPoints: [
      './src/lib/litActions/ethereum/src/signTransactionWithEthereumEncryptedKey.ts',
      './src/lib/litActions/ethereum/src/signMessageWithEthereumEncryptedKey.ts',
      './src/lib/litActions/ethereum/src/generateEncryptedEthereumPrivateKey.ts',
    ],
    bundle: true,
    minify: true,
    sourcemap: false,
    outdir: './src/lib/litActions/ethereum/dist',
    inject: ['./buffer.shim.js'],
  });
  await esbuild.build({
    entryPoints: ['./src/lib/litActions/common/src/exportPrivateKey.js'],
    bundle: true,
    minify: true,
    sourcemap: false,
    outdir: './src/lib/litActions/common/dist',
    inject: ['./buffer.shim.js'],
  });
})();

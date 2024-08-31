// import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

import { hkdf } from "https://esm.sh/@noble/hashes@1.4.0/hkdf.js";
import { sha256 } from "https://esm.sh/@noble/hashes@1.4.0/sha256.js";
import { hexToBytes } from "https://esm.sh/@noble/hashes@1.4.0/utils.js";

import { HDKey } from "https://esm.sh/@scure/bip32@1.4.0";

const hdkey1 = HDKey.fromMasterSeed(
  "3ea08dc7639fed62e3ae549253ec3acc5bc065ccb7fbf21ee14e398fd358c955b78564c9ff06aaa57582432c367d8d7aedf37ecdbbf757b0bb629617871e0d16"
);

console.log(JSON.stringify(hdkey1), "hdkey1");

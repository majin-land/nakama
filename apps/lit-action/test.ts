import { ethers } from 'ethers'
import { getPublicKey } from "https://esm.sh/nostr-tools@2.7.2/pure"
import { npubEncode } from "https://esm.sh/nostr-tools@2.7.2/nip19.js"

const wallet = ethers.Wallet.createRandom();
const privateKey = wallet.privateKey

const pubKey = getPublicKey(ethers.utils.arrayify(privateKey))
const pubKey2 = (wallet._signingKey().compressedPublicKey).slice(4)


console.log(pubKey)
console.log(pubKey2)
console.log(npubEncode(pubKey2))
import { removeSaltFromDecryptedKey } from '../utils.js'

/**
 *
 * Get wallet info balance
 *
 * @jsParam nostrEvent - nostr event message
 * @jsParam ciphertext - For the encrypted Wrapped Key
 * @jsParam dataToEncryptHash - For the encrypted Wrapped Key
 * @jsParam accessControlConditions - The access control condition that allows only the pkpAddress to decrypt the Wrapped Key
 * @jsParam seedCiphertext - For the encrypted Wrapped Key
 * @jsParam seedDataToEncryptHash - For the encrypted Wrapped Key
 * @jsParam chain - For specifying chain
 * @jsParam nostrEvent - For nostr event
 *
 * @returns { Promise<string> } - Returns a message signed by the Ethers Wrapped key. Or returns errors if any.
 */
;(async () => {
  try {
    const walletDecryptedSeed = await Lit.Actions.decryptAndCombine({
      accessControlConditions, // @JSParams accessControlConditions
      ciphertext: seedCiphertext, // @JSParams seedCiphertext
      dataToEncryptHash: seedDataToEncryptHash, // @JSParams seedDataToEncryptHash
      chain: 'ethereum',
      authSig: null,
    })

    let seed
    try {
      seed = removeSaltFromDecryptedKey(walletDecryptedSeed)
    } catch (err) {
      Lit.Actions.setResponse({ response: err.message })
      return
    }

    let rootHDNode
    try {
      const textEncoder = new TextEncoder()
      const seedUint8Array = new Uint8Array(64)
      textEncoder.encodeInto(seed, seedUint8Array)
      rootHDNode = ethers.utils.HDNode.fromSeed(seedUint8Array)
    } catch (err) {
      Lit.Actions.setResponse({ response: 'ERR HDNode.fromSeed ' + err.message })
      return
    }

    let hd
    try {
      const path = "m/44'/60'/0'/0/0"
      hd = rootHDNode.derivePath(path)
    } catch (err) {
      Lit.Actions.setResponse({ response: 'ERR rootHDNode.derivePath ' + err.message })
      return
    }

    let wallet
    try {
      wallet = new ethers.Wallet(hd)
    } catch (err) {
      Lit.Actions.setResponse({ response: 'ERR ethers.Wallet ' + err.message })
      return
    }

    let provider
    try {
      const rpcUrl = await Lit.Actions.getRpcUrl({
        chain: chain, // @JSParams chain
      })
      provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    } catch (err) {
      const errorMessage = `Error: Getting the rpc for the chain: ${chain}- ` + err.message
      Lit.Actions.setResponse({ response: errorMessage })
      return
    }

    const balance = await provider.getBalance(wallet.address)
    const balanceInEth = ethers.utils.formatEther(balance)

    const nostrReplyMessage = `
Your wallet info:\n
address: ${wallet.address}\n
balance: ${balanceInEth} ETH\n
    `

    Lit.Actions.setResponse({ response: nostrReplyMessage })
  } catch (err) {
    const errorMessage = 'Error: When getting wallet info - ' + err.message
    Lit.Actions.setResponse({ response: errorMessage })
  }
})()

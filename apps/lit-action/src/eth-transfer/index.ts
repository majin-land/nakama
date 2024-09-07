const { removeSaltFromDecryptedKey } = require('../utils.js')

/**
 *
 * Signs a transaction with the Ethers wallet whose private key is decrypted inside the Lit Action.
 *
 * @jsParam seedCiphertext - For the encrypted Wrapped Key
 * @jsParam seedDataToEncryptHash - For the encrypted Wrapped Key
 * @jsParam nostrRequest - The unsigned message to be signed by the Wrapped Key
 * @jsParam chain - chain name to be used ethereum/sepolia
 * @jsParam toAddress - eth address to send to
 * @jsParam value - value of eth to be transferred
 * @jsParam accessControlConditions - The access control condition that allows only the pkpAddress to decrypt the Wrapped Key
 *
 * @returns { Promise<string> } - Returns the transaction hash if broadcast is set as true else returns only the signed transaction. Or returns errors if any.
 */
;(async () => {
  try {
    let walletDecryptedSeed
    try {
      walletDecryptedSeed = await Lit.Actions.decryptAndCombine({
        accessControlConditions, // @JSParams accessControlConditions
        ciphertext: seedCiphertext, // @JSParams seedCiphertext
        dataToEncryptHash: seedDataToEncryptHash, // @JSParams seedDataToEncryptHash
        chain: 'ethereum',
        authSig: null,
      })
    } catch (error) {
      Lit.Actions.setResponse({ response: error.message })
    }

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

    let nonce
    try {
      nonce = await Lit.Actions.getLatestNonce({
        address: wallet.address,
        chain: chain, // @JSParams chain
      })
    } catch (err) {
      const errorMessage = 'Error: Unable to get the nonce- ' + err.message
      Lit.Actions.setResponse({ response: errorMessage })
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

    const tx = {
      to: toAddress, // @JSParams toAddress
      from: wallet.address,
      value: ethers.utils.hexlify(ethers.utils.parseEther(value)), // @JSParams value
      nonce,
    }

    try {
      tx.gasPrice = await provider.getGasPrice()
    } catch (err) {
      const errorMessage = 'Error: When getting gas price- ' + err.message
      Lit.Actions.setResponse({ response: errorMessage })
      return
    }

    try {
      tx.gasLimit = await provider.estimateGas(tx)
    } catch (err) {
      const errorMessage = 'Error: When estimating gas- ' + err.message
      Lit.Actions.setResponse({ response: errorMessage })
      return
    }

    try {
      const signedTx = await wallet.signTransaction(tx)
      const transactionResponse = await provider.sendTransaction(signedTx)
      Lit.Actions.setResponse({ response: transactionResponse.hash })
    } catch (err) {
      const errorMessage = 'Error: When signing transaction- ' + err.message
      Lit.Actions.setResponse({ response: errorMessage })
    }

    return
  } catch (err) {
    const errorMessage = 'Error: When verifying the nostr transaction- ' + err.message
    Lit.Actions.setResponse({ response: errorMessage })
  }
})()

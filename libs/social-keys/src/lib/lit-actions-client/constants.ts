import { LitCidRepository } from './types'

const LIT_ACTION_CID_REPOSITORY: LitCidRepository = Object.freeze({
  signTransaction: Object.freeze({
    evm: 'QmRWGips9G3pHXNa3viGFpAyh1LwzrR35R4xMiG61NuHpS',
    solana: 'QmPZR6FnTPMYpzKxNNHt4xRckDsAoQz76cxkLhJArSoe4w',
    // nostr: 'QmRWGips9G3pHXNa3viGFpAyh1LwzrR35R4xMiG61NuHpS',
    nostr: 'QmS3aT3C3ViyTCbYAH8VRPuuiaHXuJewwwb7VpcAd3d3uN',
  }),
  signMessage: Object.freeze({
    evm: 'QmNy5bHvgaN2rqo4kMU71jtgSSxDES6HSDgadBV29pfcRu',
    solana: 'Qma1nRZN5eriT1a7Uffbiek5jsksvWCCqHuE1x1nk9zaAq',
    nostr: 'QmZTp1WMtQhpkLcJpjdm6jrEcrULzam5qoYxBx4ZpgYFdR',
  }),
  signRelayList: Object.freeze({
    evm: '',
    solana: '',
    nostr: 'QmQ1b5QYXtZrzz5cEjhr7Mo4Q5HGY3hJjwy7keBAXPhqcM',
  }),
  generateEncryptedKey: Object.freeze({
    evm: 'QmaoPMSqcze3NW3KSA75ecWSkcmWT1J7kVr8LyJPCKRvHd',
    solana: 'QmdRBXYLYvcNHrChmsZ2jFDY8dA99CcSdqHo3p1ES3UThL',
    nostr: 'QmW3Trp1vXbMXK2znDmoyNH8UMXQg6pF323XZHLjziAfjy',
  }),
  exportPrivateKey: Object.freeze({
    evm: 'Qmb5ZAm1EZRL7dYTtyYxkPxx4kBmoCjjzcgdrJH9cKMXxR',
    solana: 'Qmb5ZAm1EZRL7dYTtyYxkPxx4kBmoCjjzcgdrJH9cKMXxR',
    nostr: '',
  }),
  messageHandler: Object.freeze({
    evm: '',
    solana: '',
    nostr: 'QmZV8vFyUntMsxgbAvYJ3BZbVsQqKh8TwUY78Bg2VPqn5s',
  }),
  signMetadata: Object.freeze({
    evm: '',
    solana: '',
    nostr: 'QmZTp1WMtQhpkLcJpjdm6jrEcrULzam5qoYxBx4ZpgYFdR',
  }),
  register: Object.freeze({
    evm: '',
    solana: '',
    nostr: '',
  }),
})

export { LIT_ACTION_CID_REPOSITORY }

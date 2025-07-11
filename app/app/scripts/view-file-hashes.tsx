'use client'

import FileHashViewer from './file_hash_viewer'

// Import the file content from the CONTENT parameter
const fileContent = {
  '/Users/homie/commune/commune/modules/app/app/types/module.ts': `export type ModuleState = {
    name: string;
    key: string;
    url: string;
    description: string;
    network: string;
    app? : any
  };

  export type KeyType =  {
    address: string;
    crypto_type: 'sr25519' | 'ecdsa';
    publicKey: string;
    privateKey: string;
  }
  

  export type ModuleType = {
      name: string
      key: string // address 
      url?: string // the url of the server
      app?: string // the app name
      desc?: string // description
      hash: string  // hash of the module code
      network: string // network of the module
      code: string // code of the module
      tags: string[] // tags of the module
      comments: string[] // comments of the module
      owner: string // owner of the module
      time: number // time of the module
      schema?: any
    }


export const DefaultModule : ModuleType = {
      name: 'agi',
      key: '',
      url: 'agi.com',
      desc: 'agi module',
      hash: '0x1234567890',
      network: 'commune',
      code: '0x1234567890',
      tags: [],
      comments: ['comment1', 'comment2'],
      owner: 'owner',
      time: 0

}
    `,
  '/Users/homie/commune/commune/modules/app/app/types/client.ts': `export type NetworkType = 'local' | 'testnet' | 'mainnet';`,
  '/Users/homie/commune/commune/modules/app/app/types/user.ts': `export interface User {
    address: string
    crypto_type: string
  }`,
  '/Users/homie/commune/commune/modules/app/app/config.json': `{
    "url": "http://localhost:8000",
    "links": {
      
        "home": "/",
        "whitepaper": "https://ai-secure.github.io/DMLW2022/assets/papers/7.pdf",
        "github": "https://github.com/commune-ai",
        "discord": "https://discord.gg/communeai",
        "x": "https://twitter.com/communeaidotorg",
        "comhub": "https://www.comhub.app/",
        "modules": "/modules",
        "devDiscord": "https://discord.gg/6CpXmP6P",
        "telegram": "https://t.me/communecommunity"
      }
      
}`
}

export default function ViewFileHashes() {
  return <FileHashViewer files={fileContent} />
}
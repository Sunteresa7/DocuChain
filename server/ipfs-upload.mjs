import { create } from '@web3-storage/w3up-client'
import { File } from 'web3.storage'
import fs from 'fs/promises'

const [,, filePath, fileName, mimeType] = process.argv;
const spaceDID = process.env.W3UP_SPACE_DID;

const client = await create()
const spaces = await client.listSpaces()

const space = spaces.find(s => s.did() === spaceDID)
if (!space) {
  console.error("🚫 Space not found. Make sure it's been created and authorized.")
  process.exit(1)
}

await client.setCurrentSpace(space)

const buffer = await fs.readFile(filePath)
const file = new File([buffer], fileName, { type: mimeType })

const cid = await client.uploadFile(file)
console.log(cid.toString())

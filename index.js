'use strict'

import SteamUser from 'steam-user'
import Flags from 'steam-user/enums/EDepotFileFlag.js'
import pLimit from 'p-limit'
import fs from 'fs/promises'
import path from 'path'

const callbackDefault = (log, error, complete) => {
    if (log) {
        console.log(log)
    }
    if (error) {
        console.error(error)
    }
    if (complete) {}
}

const downloadDepot = async ({manifestFile, decryptionKey, concurrency} = {}, callback) => {
    callback = callback || callbackDefault
    concurrency = concurrency || 8
    if (!manifestFile || !decryptionKey) {
        return callback(null, new Error('Missing manifestFile or decryptionKey'))
    }
    const limit = pLimit(Number(concurrency))
    const user = new SteamUser()
    user.logOn({anonymous: true})
    user.on('loggedOn', async () => {
        user.getRawManifest = async () => Promise.resolve({manifest: await fs.readFile(manifestFile)})
        user.getDepotDecryptionKey = () => Promise.resolve({key: Buffer.from(decryptionKey, 'hex')})
        const { manifest } = await user.getManifest()
        const depotID = String(manifest.depot_id)
        const files = manifest.files
            .filter(i => !(i.flags & Flags.Directory))
            .sort((a, b) => Number(a.size) - Number(b.size))
        let completes = 0
        let cancel = false
        const start = performance.now()
        const tasks = files.map(fileManifest => limit(async () => {
            if (cancel) return
            const outputFilePath = path.join(depotID, fileManifest.filename)
            await fs.mkdir(path.dirname(outputFilePath), {recursive: true})
            await new Promise((resolve, reject) => {
                user.downloadFile(null, depotID, fileManifest, outputFilePath, (error, res) => {
                    if (cancel) return reject(new Error('Cancelled'))
                    if (error) {
                        return reject(error)
                    } else if (res && res.type === 'progress') {
                        callback(`${((completes / files.length) * 100).toFixed(2)}% ${fileManifest.filename}`)
                    } else if (res && res.type === 'complete') {
                        completes++
                        return resolve()
                    }
                })
            })
        }))
        try {
            await Promise.all(tasks)
        } catch (error) {
            cancel = true
            callback(null, error)
            user.logOff()
            return
        }
        const end = performance.now()
        const time = ((end - start) / 1000 / 60).toFixed(2)
        callback(`Downloaded ${files.length} files in ${time} minutes`, null, true)
        user.logOff()
    })
}

export default downloadDepot
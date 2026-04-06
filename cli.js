#!/usr/bin/env node

import downloadDepot from './index.js'
import { Command } from 'commander'
import pkg from './package.json' with { type: 'json' }

const program = new Command()
program
    .name('Depot Downloader JS')
    .description(pkg.description)
    .version(pkg.version)
    .requiredOption('--manifest <path>', 'Manifest File Path')
    .requiredOption('--key <key>', 'Decryption Key')
    .option('--concurrency <num>', 'Concurrency (Default: 8)')
    .parse()

const { manifest, key, concurrency } = program.opts()

downloadDepot({
    manifestFile: manifest,
    decryptionKey: key,
    concurrency
})
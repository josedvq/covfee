#!/usr/bin/env node
import * as t from 'io-ts'
import { pipe } from 'fp-ts/function'
import { fold } from 'fp-ts/Either'
import reporter from 'io-ts-reporters'
const yargs = require('yargs/yargs')
const fs = require('fs')
const { hideBin } = require('yargs/helpers')
import {ProjectCodec} from './types/project'
import {diff} from 'deep-diff'

const verify = (file: string) => {
    let rawdata = fs.readFileSync(file)
    let project = JSON.parse(rawdata)

    console.log(ProjectCodec)
    console.log(project)
    

    const result = t.exact(ProjectCodec).decode(project)

    // failure handler
    const onLeft = (errors: t.Errors) => {
      console.log(reporter.report(result))
    }

    // success handler
    const onRight = (a: t.TypeOf<typeof ProjectCodec>) => {
      console.log(a)
      let differences = diff(project, a)
      console.log(differences)
    }

    pipe(result, fold(onLeft, onRight))
}

yargs(hideBin(process.argv))
  .scriptName("filter")
  .command('verify [file]', 'verify a file against the io-ts interfaces', (yargs: any) => {
    yargs
      .positional('file', {
        describe: 'path to the file',
      })
    }, (argv: any) => {
        verify(argv.file)
    }
  ).option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging'
  })
  .help()
  .argv
import argv from 'minimist'
const options = argv(process.argv.slice(2))

export const __IS_PRODUCTION__ = Boolean(options.production)

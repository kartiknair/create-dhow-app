const args = require('minimist')(process.argv.slice(2))
const degit = require('degit')
const templates = require('./templates')
const { join } = require('path')
const { existsSync, mkdirSync } = require('fs')
const { exec } = require('child_process')
const ora = require('ora')
const chalk = require('chalk')

const directory = args._[0]

if (!directory) {
    console.log('No directory specified')
    process.exit(-1)
} else if (existsSync(join(process.cwd(), directory))) {
    console.log('Directory already exists')
    process.exit(-1)
} else {
    mkdirSync(join(process.cwd(), directory))
    process.chdir(join(process.cwd(), directory))
}

let template = 'blog'

if (args.template && !templates.includes(args.template)) {
    console.log('This template does not exist')
    process.exit(-1)
} else if (args.template && templates.includes(args.template)) {
    template = args.template
}

const emitter = degit(`kartiknair/dhow/examples/${template}`, {
    cache: false,
    force: true,
    verbose: true,
})

const cloneSpinner = ora('Getting files...')

emitter.clone(process.cwd()).then(() => {
    cloneSpinner.succeed('Done cloning files')

    const dependaSpinner = ora('Downloading dependencies').start()
    exec('npm install', (err) => {
        if (err) {
            dependaSpinner.fail(err)
            console.error(err)
            process.exit(-1)
        }

        dependaSpinner.succeed('Done installing dependancies')

        console.log(
            '\nProject was succesfully bootstrapped. Here are the commands you have available:'
        )
        console.log(chalk.gray('\n    Get started by changing directories:'))
        console.log(chalk.cyanBright(`\n        cd ${directory}`))
        console.log(chalk.gray('\n\n    Start the dev server:'))
        console.log(chalk.cyanBright(`\n        npm run dev`))
        console.log(chalk.gray('\n\n    Build production-ready static files:'))
        console.log(chalk.cyanBright(`\n        npm run build`))
    })
})

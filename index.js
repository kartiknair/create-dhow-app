#!/usr/bin/env node

const got = require('got')
const ora = require('ora')
const chalk = require('chalk')
const daegr = require('daegr')
const sade = require('sade')
const spawn = require('cross-spawn')
const { execSync } = require('child_process')
const { existsSync } = require('fs')
const { resolve } = require('path')

sade('create-dhow-app <dir>', true)
    .version('2.0.0')
    .describe('Bootstrap a Dhow app')
    .example('website')
    .example('my-blog --template blog')
    .example('www --template tailwind --use-npm')
    .option('-t, --template', 'Choose a template to use', 'basic')
    .option('-un, --use-npm', 'Use npm instead of yarn, which is default')
    .action(createDhowApp)
    .parse(process.argv)

async function createDhowApp(
    directory,
    { template = 'basic', un: useNpm = false }
) {
    console.log(
        `\nBootstrapping Dhow project using template: ${chalk.greenBright(
            template
        )}\n`
    )

    const downloadSpinner = ora('Downloading files...').start()

    const res = await got(
        'https://api.github.com/repos/kartiknair/dhow/contents/examples'
    )

    const templates = JSON.parse(res.body).map((template) => template.name)

    if (template && !templates.includes(template)) {
        console.log(`\n${chalk.red(template)} is not an available template`)
        process.exit(1)
    }

    if (directory !== '.' && existsSync(directory)) {
        console.log(
            `\n${chalk.red(
                'The directory already exists.'
            )}\n\nIf you would like to create a project inside that directory,\n${chalk.cyan(
                '`cd`'
            )} into it & use '.' as the directory argument`
        )
        process.exit(1)
    }

    try {
        await daegr({
            username: 'kartiknair',
            repo: 'dhow',
            path: `examples/${template}`,
            directory,
        })

        downloadSpinner.succeed('Successfully downloaded files')

        const packageManager = useNpm ? 'npm' : shouldUseYarn() ? 'yarn' : 'npm'

        console.log(
            `Installing dependancies with ${chalk.cyan(
                `${`\`${packageManager}\``}`
            )}`
        )

        const install = spawn(packageManager, ['install'], {
            cwd: resolve(directory),
            stdio: 'inherit',
        })

        install.on('close', (code) => {
            if (code === 0) {
                console.log(
                    '\nProject was succesfully bootstrapped. Here are the commands you have available:'
                )
                console.log(
                    chalk.gray('\n    Get started by changing directories:')
                )
                console.log(chalk.cyanBright(`\n        cd ${directory}`))
                console.log(chalk.gray('\n\n    Start the dev server:'))
                console.log(
                    chalk.cyanBright(
                        `\n        ${
                            packageManager === 'npm' ? 'npm run' : 'yarn'
                        } dev`
                    )
                )
                console.log(
                    chalk.gray('\n\n    Build production-ready static files:')
                )
                console.log(
                    chalk.cyanBright(
                        `\n        ${
                            packageManager === 'npm' ? 'npm run' : 'yarn'
                        } build`
                    )
                )
            }
        })
    } catch (err) {
        downloadSpinner.fail(err)
        console.error(err)
        process.exit(-1)
    }
}

function shouldUseYarn() {
    try {
        execSync('yarnpkg --version', { stdio: 'ignore' })
        return true
    } catch (e) {
        return false
    }
}

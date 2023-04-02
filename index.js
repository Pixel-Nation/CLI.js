console.clear();
const { Command } = require('commander');
const fetch = require('node-fetch');
const chalk = require('chalk');
const prompts = require('prompts');
const readlineSync = require('readline-sync')

const path = 'https://www.zygocraft.com/pn';
const program = new Command();

(async () => {
    console.log(chalk.yellow('Pinging server...'))
    fetch(`${path}/`, { method: 'GET' })
        .catch((err) => {
            console.log(chalk.red(`Error: ${err}`));
            console.log('')
            console.log(chalk.red('PixelNation backend down, please try again or ask on the Discord.'));
            process.exit(0);
        })
        .then(() => {
            console.clear();

            program.description('CLI for the PN')
                .action(async () => {
                    let { username } = await prompts({
                        type: 'text',
                        name: 'username',
                        message: 'Username:'
                    });

                    const { password } = await prompts({
                        type: 'password',
                        name: 'password',
                        message: 'Password:'
                    });

                    console.log(chalk.yellow('Trying to log in...'));
                    let login = await fetch(`${path}/login`, {
                        method: 'GET',
                        headers: {
                            'Authorization': JSON.stringify({ username, password })
                        }
                    });

                    if (login.status != 200) return console.log(chalk.red(await login.text()));
                    const id = await login.text();
                    console.log(chalk.green(`Hello ${username} ! Welcome on the PN CLI.`));

                    console.log('\n')
                    while (true) {
                        let { command } = await prompts({
                            type: 'text',
                            name: 'command',
                            message: `${username}@PN $ `
                        });
                        command = String(command).trim();

                        if (command === 'help') {
                            console.log(`${chalk.bold('help')}: Get all the commands
${chalk.bold('logout')}: Logout of your account and close this prompt
${chalk.bold('exit')}: Alias of logout
${chalk.bold('profile')}: Show your PN profile
${chalk.bold('edit')}: Edit your username or your github
${chalk.bold('langs')}: Add or remove a (coding) language that you speak
${chalk.bold('LEAVE PN')}: ${chalk.red('WARNING: LEAVES THE PN!')}`);
                        }

                        else if (command === 'profile') {
                            const profile = await fetch(`${path}/profile`, {
                                method: 'GET',
                                headers: {
                                    'Authorization': JSON.stringify({ id, password })
                                }
                            });

                            if (profile.status != 200) {
                                console.log(chalk.red('An error occurred using the credentials, please try again.'));
                                process.exit(0);
                            }

                            else {
                                const json = await profile.json();
                                username = json.username;
                                console.log(chalk.cyan('Username: ') + json.username);
                                console.log(chalk.cyan('Github: ') + ((json.github) ? `https://github.com/${json.github}/` : 'No github defined'));
                                console.log(chalk.cyan('Langs: ') + ((json.langs.length > 0) ? json.langs.join(', ') : 'No langs defined'));
                            }
                        }

                        else if (command == 'langs') {
                            let index = readlineSync.keyInSelect(['Add a language', 'Remove a language'], 'What do you want to do? ', { cancel: true });
                            if (index == -1) {
                                console.log(chalk.green('Command "langs" exited.'));
                            } else {
                                let toEdit = ['PUT', 'DELETE'][index];

                                if (toEdit == 'DELETE') {
                                    const profile = await fetch(`${path}/profile`, {
                                        method: 'GET',
                                        headers: {
                                            'Authorization': JSON.stringify({ id, password })
                                        }
                                    });

                                    if (profile.status != 200) {
                                        console.log(chalk.red('An error occurred using the credentials, please try again.'));
                                        process.exit(0);
                                    }

                                    else {
                                        const json = await profile.json();
                                        username = json.username;
                                        if (json.langs.length <= 0) {
                                            console.log(chalk.red('You don\'t have any language, use "Add a language" to add one.'));
                                        }

                                        else {
                                            let allLangs = json.langs;

                                            let index = readlineSync.keyInSelect(allLangs, 'What language do you want to remove? ', { cancel: true });
                                            if (index == -1) {
                                                console.log(chalk.green('Command "langs delete" exited.'));
                                            } else {
                                                let toEdit = allLangs[index];
                                                console.log(chalk.yellow(`Deleting language "${chalk.bold(toEdit)}" of your languages...`));

                                                let edit = await fetch(`${path}/profile/langs`, {
                                                    method: 'DELETE',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': JSON.stringify({ id, password })
                                                    },
                                                    body: JSON.stringify({ value: toEdit })
                                                });

                                                if (edit.status != 200) {
                                                    console.log(chalk.red(await edit.text()));
                                                } else {
                                                    console.log(chalk.green('Success!'));
                                                }
                                            }
                                        }
                                    }
                                }

                                else if (toEdit == 'PUT') {
                                    let toEdit = readlineSync.question(`What is your new language: `, { cancel: true, min: 1 });
                                    if (toEdit.trim() == '') {
                                        console.log(chalk.red('Please try again and put a language.'));
                                    }

                                    else {
                                        console.log(chalk.yellow(`Adding language "${chalk.bold(toEdit)}" to your languages...`));

                                        let edit = await fetch(`${path}/profile/langs`, {
                                            method: 'PUT',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': JSON.stringify({ id, password })
                                            },
                                            body: JSON.stringify({ value: toEdit })
                                        });

                                        if (edit.status != 200) {
                                            console.log(chalk.red(await edit.text()));
                                        } else {
                                            console.log(chalk.green('Success!'));
                                        }
                                    }
                                }
                            }
                        }

                        else if (command == 'edit') {
                            let index = readlineSync.keyInSelect(['Username', 'Github'], 'What do you want to edit?', { cancel: true });
                            if (index == -1) {
                                console.log(chalk.green('Command "edit" exited.'));
                            } else {
                                let toEdit = ['Username', 'Github'][index];

                                let newValue = readlineSync.question(`What is your new ${toEdit}: `, {
                                    min: 2,
                                    max: 16,
                                });

                                console.log(chalk.yellow('Editing value...'));

                                let edit = await fetch(`${path}/profile/${toEdit.toLowerCase()}`, {
                                    method: 'PATCH',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': JSON.stringify({ id, password })
                                    },
                                    body: JSON.stringify({ value: newValue })
                                });

                                if (edit.status != 200) {
                                    console.log(chalk.red(await edit.text()));
                                } else {
                                    console.log(chalk.green(toEdit + ' has been changed!'));

                                    if (toEdit == 'Username') username = newValue;
                                }
                            }
                        }

                        else if (command === 'logout' || command === 'exit') {
                            console.log(chalk.green('See you soon !'));
                            process.exit(0);
                        }

                        else if (command == 'LEAVE PN') {
                            if (readlineSync.keyInYN(chalk.red('Do your REALLY want to leave the PN? It is for a long time!'))) {
                                let { verifU } = await prompts({
                                    type: 'text',
                                    name: 'verifU',
                                    message: 'Please type your username before continuing:'
                                });
                                if (username != verifU) {
                                    console.log(chalk.yellow('Invalid username, returning to the prompt...'));
                                }

                                else {
                                    let { verifPassword } = await prompts({
                                        type: 'password',
                                        name: 'verifPassword',
                                        message: 'Please verify with your password:'
                                    });
                                    if (password != verifPassword) {
                                        console.log(chalk.yellow('Invalid password, returning to the prompt...'));
                                    }

                                    else {
                                        console.log(chalk.yellow('Leaving the PN...'))

                                        let LEAVEPN = await fetch(`${path}/`, {
                                            method: 'DELETE',
                                            headers: {
                                                'Authorization': JSON.stringify({ id, password: verifPassword, username: verifU })
                                            },
                                        });

                                        console.log(chalk.red(await LEAVEPN.text()));

                                        if (LEAVEPN.status == 200) process.exit(0);
                                    }
                                }
                            } else {
                                console.log(chalk.yellow('Returning to the prompt...'))
                            }
                        }

                        else if (command == '' || command.replace(/ /g, '') == '') { }

                        else {
                            console.log(chalk.red('Command not found. Type "help" to get help or "exit" to leave.'));
                        }

                        console.log('\n')
                    }
                });

            program.parse(process.argv);
        })
})()
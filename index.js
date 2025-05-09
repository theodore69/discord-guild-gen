
const readlineSync = require('readline-sync');
const { execSync } = require('child_process');

let Client, axios;

const APP_TITLE = "GHOSTCORD guild gen";

const ANSI_RESET = "\x1b[0m";
const colors = {
    black: (text) => `\x1b[30m${text}${ANSI_RESET}`,
    red: (text) => `\x1b[31m${text}${ANSI_RESET}`,
    green: (text) => `\x1b[32m${text}${ANSI_RESET}`,
    yellow: (text) => `\x1b[33m${text}${ANSI_RESET}`,
    blue: (text) => `\x1b[34m${text}${ANSI_RESET}`,
    magenta: (text) => `\x1b[35m${text}${ANSI_RESET}`,
    cyan: (text) => `\x1b[36m${text}${ANSI_RESET}`,
    white: (text) => `\x1b[37m${text}${ANSI_RESET}`,
    brightBlack: (text) => `\x1b[90m${text}${ANSI_RESET}`,
    brightRed: (text) => `\x1b[91m${text}${ANSI_RESET}`,
    brightGreen: (text) => `\x1b[92m${text}${ANSI_RESET}`,
    brightYellow: (text) => `\x1b[93m${text}${ANSI_RESET}`,
    brightBlue: (text) => `\x1b[94m${text}${ANSI_RESET}`,
    brightMagenta: (text) => `\x1b[95m${text}${ANSI_RESET}`,
    brightCyan: (text) => `\x1b[96m${text}${ANSI_RESET}`,
    brightWhite: (text) => `\x1b[97m${text}${ANSI_RESET}`,
    bold: (text) => `\x1b[1m${text}${ANSI_RESET}`,
    boldBrightYellow: (text) => `\x1b[1;93m${text}${ANSI_RESET}`,
    purple: (text) => colors.magenta(text),
    orange: (text) => colors.brightYellow(text),
};

function setTerminalTitle(title) {
    if (process.platform === 'win32') {
        execSync(`title ${title}`);
    } else {
        process.stdout.write(`\x1b]0;${title}\x07`);
    }
}

function clearTerminal() {
    console.clear();
}

function centerText(text, terminalWidth = process.stdout.columns || 80) {
    const lines = text.split('\n');
    return lines.map(line => {
        const padding = Math.max(0, Math.floor((terminalWidth - stripAnsi(line).length) / 2));
        return ' '.repeat(padding) + line;
    }).join('\n');
}

function stripAnsi(str) {
    return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}


const asciiArt = `
██████╗ ██╗  ██╗ ██████╗ ███████╗████████╗ ██████╗ ██████╗ ██████╗ ██████╗ 
██╔════╝ ██║  ██║██╔═══██╗██╔════╝╚══██╔══╝██╔════╝██╔═══██╗██╔══██╗██╔══██╗
██║  ███╗███████║██║   ██║███████╗   ██║   ██║     ██║   ██║██████╔╝██║  ██║
██║   ██║██╔══██║██║   ██║╚════██║   ██║   ██║     ██║   ██║██╔══██╗██║  ██║
╚██████╔╝██║  ██║╚██████╔╝███████║   ██║   ╚██████╗╚██████╔╝██║  ██║██████╔╝
 ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ 
`;

async function runGuildGenerator(token, webhookUrl, logCallback) {
    try {
        Client = require('discord.js-selfbot-v13').Client;
        axios = require('axios');
        fingerprints = require('axios-fingerprint');
    } catch (e) {
        logCallback(colors.red("Error: Missing 'discord.js-selfbot-v13' or 'axios'.\nPlease install them: npm install discord.js-selfbot-v13 axios"), 'status');
        return Promise.reject(e);
    }

    const discordClient = new Client({ checkUpdate: false });
    const TOTAL_GUILDS = 100;
    const CONCURRENCY = 5;
    const delay = ms => new Promise(resolveDelay => setTimeout(resolveDelay, ms));

    return new Promise((resolve, reject) => {
        let loggedIn = false;

        discordClient.on('ready', async () => {
            loggedIn = true;
            logCallback(colors.green(`${discordClient.user.username} is ready! Starting guild generation...`), 'status');

            let index = 1;
            const createGuild = async (i) => {
                logCallback(colors.yellow(`🔄 Creating guild ${i}... (Attempting)`), 'status');
                try {
                    const newGuild = await discordClient.api.guilds.post({
                        data: { name: `Test Guild ${i}`, icon: null }
                    });
                    logCallback(colors.green(`✅ Guild ${i} created with ID: ${newGuild.id}`), 'status');

                    const createdGuild = await discordClient.guilds.fetch(newGuild.id);
                    const features = createdGuild.features || [];
                    const matches = features.some(f =>
                        ['TIERLESS_BOOSTING', 'TIERLESS_BOOSTING_CLIENT_TEST', 'TIERLESS_BOOSTING_TEST'].includes(f)
                    );

                    if (matches) {
                        const foundMsg = `🎯 Found TIERLESS_BOOSTING in Guild ${i} (${createdGuild.id})`;
                        logCallback(colors.green(foundMsg), 'status');
                        if (webhookUrl) {
                            try {
                                await axios.post(webhookUrl, { content: foundMsg });
                                logCallback(colors.green(`📢 Webhook notification sent for Guild ${i}.`), 'status');
                            } catch (whError) {
                                logCallback(colors.red(`❌ Error sending webhook for Guild ${i}: ${whError.message}`), 'status');
                            }
                        }
                    } else {
                        logCallback(colors.cyan(`🔹 Guild ${i}: No special features found.`), 'status');
                    }
                } catch (err) {
                    const errMsg = `❌ Error creating/processing guild ${i}: ${err.message || (err.data ? JSON.stringify(err.data) : err)}`;
                    logCallback(colors.red(errMsg), 'status');
                    if (err?.status === 429 || err?.response?.status === 429) {
                        const retryAfter = err.retry_after || err?.response?.data?.retry_after || 5000;
                        logCallback(colors.yellow(`⏳ Rate limited. Waiting ${retryAfter / 1000}s...`), 'status');
                        await delay(retryAfter);
                        return await createGuild(i); // Retry
                    }
                }
            };

            try {
                while (index <= TOTAL_GUILDS) {
                    const batch = [];
                    for (let j = 0; j < CONCURRENCY && index <= TOTAL_GUILDS; j++, index++) {
                        batch.push(createGuild(index));
                    }
                    await Promise.all(batch);
                    if (index <= TOTAL_GUILDS) {
                        logCallback(colors.yellow(`--- Batch complete, next batch in 3s ---`), 'status');
                        await delay(3000);
                    }
                }
                logCallback(colors.green("✅ Guild generation process completed (max limit reached or all attempted)."), 'status');
            } catch (loopError) {
                logCallback(colors.red(`❌ An unexpected error occurred during the generation loop: ${loopError.message}`), 'status');
            } finally {
                if (discordClient && typeof discordClient.destroy === 'function') {
                    discordClient.destroy();
                    logCallback(colors.cyan("🔌 Discord client connection closed."), 'status');
                }
                resolve();
            }
        });

        discordClient.on('error', (err) => {
            logCallback(colors.red(`Discord Client Error: ${err.message}`), 'status');
            if (loggedIn && discordClient && typeof discordClient.destroy === 'function') {
                discordClient.destroy();
            }
            if (!loggedIn) reject(err);
        });

        discordClient.login(token).catch(err => {
            logCallback(colors.red(`❌ Failed to login: ${err.message}. Check your token. Ensure it's a USER token.`), 'status');
            reject(err);
        });
    });
}


function displayMainMenu() {
    clearTerminal();
    setTerminalTitle(APP_TITLE);

    console.log(centerText(colors.brightCyan(asciiArt)));
    console.log('\n\n');

    console.log('\n');

    console.log(centerText(colors.purple('╔════════════════════════════╗')));
    console.log(centerText(colors.purple('║') + colors.yellow('         MAIN MENU          ') + colors.purple('║')));
    console.log(centerText(colors.purple('╠════════════════════════════╣')));
    console.log(centerText(colors.purple('║ ') + colors.orange('1. Generate Guilds') + '       ║')); 
    console.log(centerText(colors.purple('║ ') + colors.orange('2. Exit           ') + '       ║')); 
    console.log(centerText(colors.purple('╚════════════════════════════╝')));
    console.log('\n');
}

function tuiLogCallback(message, type) {
    console.log(centerText(message));
}

async function handleGenerateGuilds() {
    clearTerminal();
    setTerminalTitle(`${APP_TITLE} - Guild Generation`);
    console.log(centerText(colors.brightCyan(asciiArt)));
    console.log('\n');
    console.log(centerText(colors.brightBlue('--- Generate Guilds ---')));

    console.log('\n');

    const token = readlineSync.question(centerText(colors.magenta('Enter your Discord User Token: ')), {
        hideEchoBack: true,
        mask: '*'
    });

    if (!token) {
        console.log(centerText(colors.red('\nNo token entered. Aborting.')));
        readlineSync.keyInPause(centerText(colors.brightBlack('\nPress any key to return to menu...')));
        return;
    }

    const webhookUrl = readlineSync.question(centerText(colors.magenta('Enter Webhook URL (optional, press Enter to skip): ')), {
        defaultInput: ''
    });

    console.log(centerText(colors.yellow('\nAttempting to start guild generation...')));
    console.log(centerText(colors.cyan('Output from the process will appear below:')));
    console.log(colors.cyan('----------------------------------------------------'));

    try {
        await runGuildGenerator(token, webhookUrl.trim() || null, tuiLogCallback);
    } catch (error) {
        tuiLogCallback(colors.red(`Critical error during generation setup: ${error.message || error}`), 'status');
    }

    console.log(colors.cyan('----------------------------------------------------'));
    readlineSync.keyInPause(centerText(colors.brightBlack('\nProcess finished or encountered a critical error. Press any key to return to menu...')));
}


async function mainLoop() {
    while (true) {
        displayMainMenu();
        const choice = readlineSync.question(centerText(colors.blue('Choose an option (1-2): ')));

        switch (choice) {
            case '1':

                await handleGenerateGuilds();
                break;
            case '2':
                clearTerminal();
                console.log(centerText(colors.boldBrightYellow('\nExiting application. Goodbye!\n')));
                process.exit(0);
            default:
                console.log(centerText(colors.red('Invalid option. Please try again.')));
                readlineSync.keyInPause(centerText(colors.brightBlack('\nPress any key to continue...')));
                break;
        }
    }
}

if (require.main === module) {
    (async () => {
        await mainLoop();
    })().catch(err => { 
        console.error(colors.red("An unexpected critical error occurred in the application:"), err);
        process.exit(1);
    });
}

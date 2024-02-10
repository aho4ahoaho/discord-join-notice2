import { ApplicationCommandData, ApplicationCommandOptionType, REST, Routes } from "discord.js";

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
    console.error("Environment variables not set");
    process.exit(1);
}

const commands: ApplicationCommandData[] = [
    {
        name: "join",
        description: "ボイスチャンネルに参加します",
    },
    {
        name: "leave",
        description: "ボイスチャンネルから退出します",
    },
    {
        name: "pronunciation",
        description: "名前の読みを変更します",
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: "読み",
                description: "名前の読みを指定します",
                required: true,
            },
        ],
    },
    {
        name: "random",
        description: "ランダム再生を行います",
    },
    {
        name: "resume",
        description: "再生を再開します",
    },
    {
        name: "stop",
        description: "再生を停止します",
    },
    {
        name: "next",
        description: "次の曲を再生します",
    },
    {
        name: "prev",
        description: "前の曲を再生します",
    },
    {
        name: "list",
        description: "再生リストを表示します",
    },
    {
        name: "play",
        description: "指定の曲を再生します",
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: "曲名",
                description: "再生する曲を指定します",
                required: true,
            },
        ],
    },
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

    console.log("Successfully reloaded application (/) commands.");
} catch (error) {
    console.error(error);
}

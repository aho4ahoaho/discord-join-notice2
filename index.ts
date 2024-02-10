import { Client, GatewayIntentBits, Guild, VoiceState } from "discord.js";
import dotenv from "dotenv";
import { MusicPlayer } from "./src/musicPlayer.ts";
import { VoiceChat } from "./src/voiceChat.ts";
import { VoiceGenerator, VoiceHandler } from "./src/voiceGenerator.ts";
dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
    console.error("Environment variables not set");
    process.exit(1);
}
//Discordクライアントの作成
const client = new Client({
    intents: [GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.Guilds],
});

//音声合成と音声管理のインスタンスを作成
const voiceGenerator = new VoiceGenerator(2, {
    speedScale: 1.1,
    volumeScale: 1.3,
});
const voiceHandler = new VoiceHandler(voiceGenerator, {
    suffix: "さんが入室しました。",
});

client.once("ready", () => {
    console.log(`${client.user?.displayName}#${client.user?.discriminator} is ready`);
});

/**
 * 喋りだせる状態への遷移かどうかを判定
 * @param oldState 元の状態
 * @param newState 新しい状態
 */
const onConectState = (oldState: VoiceState, newState: VoiceState) =>
    (oldState.mute && !newState.mute) || //ミュート解除
    (oldState.selfMute && !newState.selfMute) || //自分のミュート解除
    (!oldState.channel && !!newState.channel); //ボイスチャットに参加
const voiceChats = new Map<string, VoiceChat>();
client.on("voiceStateUpdate", async (oldState, newState) => {
    //自分の状態変更は無視
    if (newState.member?.id === client.user?.id) {
        return;
    }
    //接続先を特定する
    const guildId = newState.guild.id;
    const channelId = newState.member?.voice.channel?.id;
    if (!channelId || !newState.member) {
        return;
    }

    //ボイスチャットのインスタンスを取得、なければ作成
    const voiceChat = getVoiceChat(newState.guild);
    //喋りだせるならば音声を再生
    if (onConectState(oldState, newState)) {
        //ボイスチャンネルに参加
        voiceChat.joinVoiceChannel(channelId);
        //音声ファイルのパスを取得
        const voicePath = await voiceHandler.getVoice(newState.member.displayName);
        //音声ファイルを再生
        voiceChat.playVoice(voicePath);
    }

    //ボイスチャットが空になったら退出
    if ((newState.channel?.members.size ?? 0) <= 1) {
        voiceChat.leaveVoiceChannel();
        voiceChats.delete(guildId);
    }
});

const getVoiceChat = (guild: Guild) => {
    const guildId = guild.id;
    const voiceChat = voiceChats.get(guildId);
    if (!voiceChat) {
        const voiceChat = new VoiceChat(guild);
        voiceChats.set(guildId, voiceChat);
        return voiceChat;
    }
    return voiceChat;
};

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const guild = interaction.guild;
    if (!guild) {
        interaction.reply("サーバー内で実行してください");
        return;
    }
    const guildId = guild.id;
    const channelId = interaction.member && "voice" in interaction.member && interaction.member.voice.channel?.id;
    if (!channelId) {
        interaction.reply("ボイスチャンネルに参加してください");
        return;
    }

    switch (interaction.commandName) {
        case "join": {
            const voiceChat = getVoiceChat(guild);
            voiceChat.joinVoiceChannel(channelId);
            interaction.reply("ボイスチャンネルに参加しました");
            break;
        }
        case "leave": {
            const voiceChat = voiceChats.get(guildId);
            if (voiceChat && voiceChat.getVoiceChannel() === channelId) {
                voiceChat.leaveVoiceChannel();
                voiceChats.delete(guildId);
            }
            interaction.reply("ボイスチャンネルから退出しました");
            break;
        }
        case "pronunciation": {
            const pronunciation = interaction.options.getString("読み") ?? "";
            const user = interaction.member?.user ?? {};
            const userName = ("globalName" in user ? user.globalName : "username" in user ? user.username : null) as
                | string
                | null;
            if (!userName || pronunciation === "") {
                interaction.reply("名前を指定してください");
                return;
            }
            const voicePath = await voiceHandler.saveVoice(userName, pronunciation);
            interaction.reply(`名前の読みを${pronunciation}に変更しました`);
            const voiceChat = voiceChats.get(guildId);
            voiceChat?.playAudio(voicePath);
            break;
        }
        case "random": {
            interaction.reply("ランダム再生を行います");
            const voiceChat = getVoiceChat(guild);
            voiceChat.joinVoiceChannel(channelId);
            voiceChat.musicPlayer.shuffle();
            voiceChat.playContinuous();
            break;
        }
        case "resume": {
            const voiceChat = voiceChats.get(guildId);
            voiceChat?.playContinuous();
            interaction.reply("再生を再開しました");
            break;
        }
        case "stop": {
            const voiceChat = voiceChats.get(guildId);
            voiceChat?.stopAudio();
            interaction.reply("再生を停止しました");
            break;
        }
        case "next": {
            const voiceChat = voiceChats.get(guildId);
            voiceChat?.playAudio(voiceChat.musicPlayer.nextTrack());
            interaction.reply("次の曲を再生します");
            break;
        }
        case "prev": {
            const voiceChat = voiceChats.get(guildId);
            voiceChat?.playAudio(voiceChat.musicPlayer.prevTrack());
            interaction.reply("前の曲を再生します");
            break;
        }
        case "list": {
            const voiceChat = voiceChats.get(guildId);
            const playlist = voiceChat?.musicPlayer.getPlaylist() ?? MusicPlayer.getTrackList();
            const content = playlist
                ?.map((title) => title.split(".")[0])
                .map((v, i) => `${i + 1}. ${v}`)
                .join("\n");
            interaction.reply(content ?? "再生リストがありません");
            break;
        }
        case "play": {
            if (!channelId) {
                interaction.reply("ボイスチャンネルに参加してください");
                return;
            }
            const trackName = interaction.options.getString("曲名");
            if (!trackName) {
                interaction.reply("曲名を指定してください");
                return;
            }
            const voiceChat = getVoiceChat(guild);
            voiceChat?.joinVoiceChannel(channelId);
            const fileName = voiceChat.musicPlayer.getPlaylist().find((title) => title.startsWith(trackName));
            if (!fileName) {
                interaction.reply("曲が見つかりません");
                return;
            }
            voiceChat?.playAudio(MusicPlayer.getTrackPath(fileName));
            const title = fileName.split(".")[0];
            interaction.reply(`${title}を再生します`);
            break;
        }
    }
});

client.login(TOKEN);

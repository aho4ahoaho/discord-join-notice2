import { Client, GatewayIntentBits, VoiceState } from "discord.js";
import { VoiceChat } from "./src/voiceChat.ts";
import { VoiceGenerator, VoiceHandler } from "./src/voiceGenerator.ts";
import dotenv from "dotenv";
dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
    console.error("Environment variables not set");
    process.exit(1);
}
//Discordクライアントの作成
const client = new Client({ intents: [GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.Guilds] });

//音声合成と音声管理のインスタンスを作成
const voiceGenerator = new VoiceGenerator();
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
const onConectState = (oldState: VoiceState, newState: VoiceState) => (
    (oldState.mute && !newState.mute) || //ミュート解除
    (oldState.selfMute && !newState.selfMute) ||//自分のミュート解除
    (!oldState.channel && !!newState.channel)//ボイスチャットに参加
)
    ;
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
    let voiceChat = voiceChats.get(guildId);
    if (!voiceChat) {
        voiceChat = new VoiceChat(newState.guild);
        voiceChats.set(guildId, voiceChat);
    }

    //喋りだせるならば音声を再生
    if (onConectState(oldState, newState)) {
        //ボイスチャンネルに参加
        voiceChat.joinVoiceChannel(channelId);
        //音声ファイルのパスを取得
        const voicePath = await voiceHandler.getVoice(newState.member?.displayName)
        //音声ファイルを再生
        voiceChat.playAudio(voicePath);
    }

    //ボイスチャットが空になったら退出
    if ((newState.channel?.members.size ?? 0) <= 1) {
        voiceChat.leaveVoiceChannel();
    }
});


client.login(TOKEN);

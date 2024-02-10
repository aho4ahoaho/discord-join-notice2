//Node.jsでしか動かない！https://github.com/oven-sh/bun/issues/1630
import { VoiceConnection, createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { Guild } from "discord.js";

export class VoiceChat {
    private connection: VoiceConnection | null = null;
    readonly guild: Guild;
    constructor(guild: Guild) {
        this.guild = guild;
    }
    async joinVoiceChannel(channelId: string) {
        if (this.connection && this.connection.joinConfig.channelId === channelId) {
            return;
        }
        this.connection = joinVoiceChannel({
            channelId: channelId,
            guildId: this.guild.id,
            adapterCreator: this.guild.voiceAdapterCreator,
        });
    }

    async leaveVoiceChannel() {
        this.connection?.destroy();
        this.connection = null;
    }

    getVoiceChannel() {
        return this.connection?.joinConfig.channelId;
    }

    async playAudio(filePath: Parameters<typeof createAudioResource>[0]) {
        const resouces = createAudioResource(filePath);
        const player = createAudioPlayer();
        player.play(resouces);
        this.connection?.subscribe(player);
    }
}

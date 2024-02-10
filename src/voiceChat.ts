//Node.jsでしか動かない！https://github.com/oven-sh/bun/issues/1630
import {
    AudioPlayer,
    AudioPlayerStatus,
    AudioResource,
    NoSubscriberBehavior,
    VoiceConnection,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
} from "@discordjs/voice";
import { Guild } from "discord.js";
import { MusicPlayer } from "./musicPlayer.ts";

enum PlayerStatus {
    once = "once",
    continuous = "continuous",
    stop = "stop",
}
type VoiceChatEvent = "join" | "leave" | "play" | "stop";
export class VoiceChat {
    private connection: VoiceConnection | null = null;
    readonly guild: Guild;
    private player: AudioPlayer;
    readonly musicPlayer: MusicPlayer;
    private status: PlayerStatus = PlayerStatus.stop;
    private eventFunc: Partial<
        {
            play: (title: string) => void;
        } & {
            [key in VoiceChatEvent]: () => void;
        }
    > = {};
    constructor(guild: Guild) {
        this.guild = guild;
        this.player = createAudioPlayer();
        this.musicPlayer = new MusicPlayer();
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
        this.connection.subscribe(this.player);
        this.player.on("stateChange", (oldState, newState) => {
            if (oldState.status === AudioPlayerStatus.Playing && newState.status === AudioPlayerStatus.Idle) {
                if (this.status === PlayerStatus.continuous) {
                    this.playAudio(this.musicPlayer.nextTrack());
                } else if (this.status === PlayerStatus.once) {
                    this.stopAudio();
                }
            }
        });
        this.eventFunc.join?.();
    }

    async leaveVoiceChannel() {
        this.connection?.destroy();
        this.connection = null;
        this.eventFunc.leave?.();
    }

    getVoiceChannel() {
        return this.connection?.joinConfig.channelId;
    }
    /**
     * ボイスチャットで音声を再生する。再生中の音声がある場合は差し替える。
     * @param filePath
     */
    async playAudio(filePath: Parameters<typeof createAudioResource>[0]) {
        const resouces = createAudioResource(filePath);
        this.player?.play(resouces);
        this.eventFunc.play?.(String(filePath));
    }
    /**
     * ボイスチャットで一時的に音声を再生する。再生中の音声がある場合は一時停止して再生、その後再開させる。
     * @param filePath
     */
    async playVoice(filePath: Parameters<typeof createAudioResource>[0]) {
        this.player.pause();
        const resouces = createAudioResource(filePath);
        const player = createAudioPlayer({});
        player.play(resouces);
        this.connection?.subscribe(player);
        player.on("stateChange", (oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Idle) {
                this.connection?.subscribe(this.player);
                setTimeout(() => {
                    this.player.unpause();
                }, 500);
            }
        });
    }

    stopAudio() {
        this.status = PlayerStatus.stop;
        this.player.stop();
        this.eventFunc.stop?.();
    }

    on(event: VoiceChatEvent, func: () => void) {
        this.eventFunc[event] = func;
    }

    async playContinuous() {
        this.status = PlayerStatus.continuous;
        await this.playAudio(this.musicPlayer.getTrack());
    }

    async playOnce() {
        this.status = PlayerStatus.once;
        await this.playAudio(this.musicPlayer.getTrack());
    }
}

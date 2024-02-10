import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { __dirname } from "./lib.ts";
import { Logger } from "./logger.ts";
dotenv.config();

const VOICEVOX_URL = process.env.VOICEVOX_URL ?? "http://localhost:50021";
const basePath = path.resolve(__dirname, "../", "voice");

export type VoiceSetting = {
    speedScale: number;
    pitchScale: number;
    intonationScale: number;
    volumeScale: number;
    prePhonemeLength: number;
    postPhonemeLength: number;
};

export type SpeakerProps = {
    supported_features: {
        permitted_synthesis_morphing: string;
    };
    name: string;
    speaker_uuid: string;
    styles: Array<{
        name: string;
        id: number;
    }>;
    version: string;
};

export class VoiceGenerator {
    private speakerId = 4;
    voiceSetting: Partial<VoiceSetting> = {};

    constructor(spakerId?: number, voiceSetting?: Partial<VoiceSetting>) {
        this.setSpeaker(spakerId ?? 2);
        if (voiceSetting) {
            this.voiceSetting = voiceSetting;
        }
    }

    /**
     * @param text クエリを生成したいテキスト
     * @returns 生成したクエリ
     */
    async generateQuery(text: string): Promise<Object & VoiceSetting> {
        const url = new URL(`${VOICEVOX_URL}/audio_query`);
        url.searchParams.append("speaker", this.speakerId.toString());
        url.searchParams.append("text", text);
        const data = await fetch(url.href, {
            method: "POST",
        })
            .then((res) => res.json())
            .catch((e) => Logger.error(e));
        if (!data) {
            throw new Error("Failed to generate query");
        }
        return data ?? "";
    }

    /**
     * @param query generateQueryで生成したクエリを与える
     * @returns 音声バイナリ
     */
    async generateVoice(query: Object & VoiceSetting): Promise<ArrayBuffer> {
        const url = new URL(`${VOICEVOX_URL}/synthesis`);
        url.searchParams.append("speaker", this.speakerId.toString());
        const appliedQuery = { ...query, ...this.voiceSetting };
        const data = await fetch(url.href, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(appliedQuery),
        })
            .then((res) => res.arrayBuffer())
            .catch((e) => Logger.error(e));

        if (data instanceof ArrayBuffer) {
            if (data.byteLength < 100) {
                const text = new TextDecoder().decode(data);
                console.error(text);
                throw new Error("Failed to generate voice");
            }
            return data;
        }
        throw new Error("Failed to generate voice");
    }
    async getSpakers(): Promise<SpeakerProps[]> {
        const url = new URL(`${VOICEVOX_URL}/speakers`);
        const data = await fetch(url.href)
            .then((res) => res.json())
            .catch((e) => Logger.error(e));
        return data;
    }
    async setSpeaker(speakerId: number) {
        const speakers = await this.getSpakers();
        const speaker = speakers.find((s) => s.styles.some((style) => style.id === speakerId));
        if (speaker) {
            this.speakerId = speakerId;
        }
        return speaker;
    }
}

type VoiceOption = {
    prefix?: string;
    suffix?: string;
};
export class VoiceHandler {
    private prefix = "";
    private suffix = "";
    readonly voiceGenerator: VoiceGenerator;
    constructor(voiceGenerator: VoiceGenerator, options?: VoiceOption) {
        fs.mkdirSync(basePath, { recursive: true });
        this.voiceGenerator = voiceGenerator;
        if (options) {
            if (options.prefix) {
                this.prefix = options.prefix;
            }
            if (options.suffix) {
                this.suffix = options.suffix;
            }
        }
    }
    async getVoice(userName: string) {
        const fileName = `${userName}.wav`;
        const filePath = path.resolve(basePath, fileName);
        if (fs.existsSync(filePath)) {
            return filePath;
        }
        return await this.saveVoice(userName, userName);
    }
    async saveVoice(userName: string, text: string) {
        const fileName = `${userName}.wav`;
        const filePath = path.resolve(basePath, fileName);
        const query = await this.voiceGenerator.generateQuery(`${this.prefix}${text}${this.suffix}`);
        const voice = await this.voiceGenerator.generateVoice(query);
        fs.writeFileSync(filePath, Buffer.from(voice));
        return filePath;
    }
}

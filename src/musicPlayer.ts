import fs from "fs";
import path from "path";
import { __dirname } from "./lib.ts";

const basePath = path.resolve(__dirname, "../", "track");
export class MusicPlayer {
    private index = 0;
    private trackFiles: string[] = [];
    private playlist: string[] = [];
    constructor() {
        // ディレクトリがなければ作成
        fs.mkdirSync(basePath, { recursive: true });

        // 楽曲ファイルを取得、シャッフル
        this.trackFiles = fs.readdirSync(basePath);
        this.playlist = this.trackFiles;
    }
    /**
     * @returns 次の楽曲のパス
     */
    nextTrack() {
        this.index++;
        if (this.index >= this.trackFiles.length) {
            this.index = 0;
        }
        return this.getTrack();
    }
    /**
     * @returns 前の楽曲のパス
     */
    prevTrack() {
        this.index--;
        if (this.index < 0) {
            this.index = this.trackFiles.length - 1;
        }
        return this.getTrack();
    }
    /**
     * @returns 現在の楽曲のパス
     */
    getTrack() {
        return MusicPlayer.getTrackPath(this.playlist[this.index]);
    }
    /**
     * @returns プレイリストを取得する
     */
    getPlaylist() {
        return this.playlist;
    }

    shuffle() {
        this.playlist = arrayShuffle(this.playlist);
    }

    static getTrackPath(trackName: string) {
        return path.resolve(basePath, trackName);
    }
    static getTrackList() {
        try {
            return fs.readdirSync(basePath);
        } catch (e) {
            return [];
        }
    }
}

const arrayShuffle = (array: any[]) => {
    const oldArray = [...array]; // 配列のコピーを作成
    const newArray = [];
    while (oldArray.length > 0) {
        const index = Math.floor(Math.random() * oldArray.length);
        newArray.push(oldArray[index]);
        oldArray.splice(index, 1);
    }
    return newArray;
};

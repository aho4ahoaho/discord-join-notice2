import { VoiceState } from "discord.js";

/**
 * 喋りだせる状態への遷移かどうかを判定する
 * @param oldState 元の状態
 * @param newState 新しい状態
 */
export const onConectState = (oldState: VoiceState, newState: VoiceState) => {
    if (
        (!oldState.mute && newState.mute) ||
        (!oldState.selfMute && newState.selfMute) ||
        (!oldState.channel && newState.channel)
    ) {
        return true;
    }
    return false;
};

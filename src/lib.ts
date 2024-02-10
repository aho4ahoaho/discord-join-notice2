import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const safeNumber = (value: any): number | null => {
    const i = Number(value);
    if (Number.isNaN(i)) {
        return null;
    }
    return i;
};
const zeroPadding = (num: number, length: number) => {
    return num.toString().padStart(length, "0");
};
export const formatDateTime = (date: Date = new Date(), padding?: boolean) => {
    const Y = date.getFullYear();
    const Mo = date.getMonth() + 1;
    const D = date.getDate();
    const H = date.getHours();
    const Mi = date.getMinutes();
    const S = date.getSeconds();
    const ms = date.getMilliseconds();
    if (padding) {
        return `${Y}-${zeroPadding(Mo, 2)}-${zeroPadding(D, 2)} ${zeroPadding(H, 2)}:${zeroPadding(
            Mi,
            2,
        )}:${zeroPadding(S, 2)}.${zeroPadding(ms, 3)}`;
    }
    return `${Y}-${Mo}-${D} ${H}:${Mi}:${S}.${ms}`;
};

export const formatDate = (date: Date = new Date()) => {
    return `${date.getFullYear()}-${zeroPadding(date.getMonth() + 1, 2)}-${zeroPadding(date.getDate(), 2)}`;
};

export const helpText = (() => {
    const context = fs
        .readFileSync(path.join(__dirname, "..", "src", "help.md"), "utf-8")
        .split("\n")
        .filter((v) => v !== "")
        .join("\n");
    return context;
})();

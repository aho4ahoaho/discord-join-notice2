import fs from "fs";
import path from "path";
import { gzipSync } from "zlib";
import { __dirname, formatDate, formatDateTime } from "./lib.ts";

const logDir = path.resolve(__dirname, "..", "logs");

// ログファイルの圧縮
try {
    fs.readdirSync(logDir)
        .filter((file) => {
            return path.extname(file) === ".log" && !file.startsWith(formatDate());
        })
        .map((file) => path.resolve(logDir, file))
        .forEach((file) => {
            const data = fs.readFileSync(file, "utf-8");
            const compressed = gzipSync(data);
            fs.writeFileSync(`${file}.gz`, compressed);
            fs.unlinkSync(file);
        });
} catch {
    fs.mkdirSync(logDir);
}

type logLevel = "info" | "error" | "warn" | "debug" | "log" | "verbose";
export class Logger {
    public prefix: string;
    constructor(prefix: string) {
        this.prefix = prefix;
    }
    public static log(...logs: any[]) {
        console.log(...logs);
        Logger.write("log", ...logs);
    }

    public static info(...logs: any[]) {
        console.info(...logs);
        Logger.write("info", ...logs);
    }

    public static error(...logs: any[]) {
        console.error(...logs);
        Logger.write("error", ...logs);
    }

    public static warn(...logs: any[]) {
        console.warn(...logs);
        Logger.write("warn", ...logs);
    }

    public static debug(...logs: any[]) {
        console.debug(...logs);
        if (process.env.NODE_ENV === "production") return;
        Logger.write("debug", ...logs);
    }

    private static write(type: logLevel, ...logs: Array<any>) {
        const date = new Date();
        const formattedDate = formatDate(date);
        const fileName = path.resolve(logDir, `${formattedDate}.log`);
        let msg = "";
        for (const log of logs) {
            if (typeof log === "object") {
                msg += JSON.stringify(log, null, 4);
                continue;
            }
            msg += `${log} `;
        }
        const timeZoneOffset = date.getTimezoneOffset();
        const timeZone = (timeZoneOffset / -60).toString().padStart(2, "0");
        fs.appendFileSync(
            fileName,
            `[${formatDateTime(date, true)} ${timeZoneOffset < 0 ? "+" : ""}${timeZone}] "${type}" - ${msg}\n`,
        );
    }

    public static read(date: Date = new Date()) {
        const formattedDate = formatDate(date);
        const fileName = path.resolve(logDir, `${formattedDate}.log`);
        return fs.readFileSync(fileName, "utf-8");
    }
}

import { QueueRepeatMode } from "discord-player"
import type { EmbedOptions } from "../../types/configTypes"

export function formatDuration(durationMs: number): string {
    const durationDate: Date = new Date(0)
    durationDate.setMilliseconds(durationMs)

    const durationDays: number = durationDate.getUTCDate() - 1
    const durationHours: number = durationDate.getUTCHours()
    const durationMinutes: number = durationDate.getUTCMinutes()
    const durationSeconds: number = durationDate.getUTCSeconds()

    if (durationDays >= 1) {
        return `${durationDays}d ${durationHours}h`
    }
    if (durationHours >= 1) {
        return `${durationHours}h ${durationMinutes}m`
    }
    if (durationMinutes >= 1) {
        return `${durationMinutes}m ${durationSeconds}s`
    }
    return `${durationSeconds}s`
}

export function formatSlashCommand(commandName: string): string {
    // const translatedName = translator(`commands.${commandName}.metadata.name`, {
    //     defaultValue: commandName
    // })
    return `**\`/${commandName}\`**`
}

export function formatRepeatMode(repeatMode: QueueRepeatMode): string {
    switch (repeatMode) {
        case QueueRepeatMode.AUTOPLAY:
            return "Autoplay"
        case QueueRepeatMode.OFF:
            return "Disabled"
        case QueueRepeatMode.TRACK:
            return "Track"
        case QueueRepeatMode.QUEUE:
            return "Queue"
        default:
            return ""
    }
}

export function formatRepeatModeDetailed(
    repeatMode: QueueRepeatMode,
    embedOptions: EmbedOptions,
    translator: never,
    state = "info"
) {
    let icon: string

    switch (repeatMode) {
        case QueueRepeatMode.TRACK:
            icon = state === "info" ? embedOptions.icons.loop : embedOptions.icons.looping
            break
        case QueueRepeatMode.QUEUE:
            icon = state === "info" ? embedOptions.icons.loop : embedOptions.icons.looping
            break
        case QueueRepeatMode.AUTOPLAY:
            icon = state === "info" ? embedOptions.icons.autoplay : embedOptions.icons.autoplaying
            break
        default:
            return ""
    }

    return `\n${`${icon} **Looping**\nLoop mode is set to **\`${formatRepeatMode(
        repeatMode
    )}\`**. You can change it with ${formatSlashCommand("loop")}.\n`}`
}

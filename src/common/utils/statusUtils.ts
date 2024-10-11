import osu from "node-os-utils"
import type { ExtendedClient } from "../../types/clientTypes"
import { fetchTotalGuildStatistics, fetchTotalPlayerStatistics } from "./shardUtils"
import { getUptimeFormatted } from "./getUptimeFormatted"

export async function getBotStatistics(client: ExtendedClient, version: string): Promise<string> {
    const releaseVersion = version
    const { totalGuildCount, totalMemberCount } = await fetchTotalGuildStatistics(client)

    return `**${totalGuildCount}** Joined servers\n**${totalMemberCount}** Total members\n**${`v${releaseVersion}`}** Release version`
}

export async function getPlayerStatistics(client: ExtendedClient): Promise<string> {
    const { totalVoiceConnections, totalTracksInQueues, totalListeners } = await fetchTotalPlayerStatistics(client)

    return `**${totalVoiceConnections}** Voice connections\n**${totalTracksInQueues}** Tracks in queues\n**${totalListeners}** Users listening`
}

export async function getSystemStatus(executionId: string): Promise<string> {
    const uptimeString: string = getUptimeFormatted({ executionId })
    const usedMemoryInMB: number = Math.ceil((await osu.mem.info()).usedMemMb)
    const cpuUsage: number = await osu.cpu.usage()

    return `**${uptimeString}** Uptime\n**${cpuUsage}%** CPU usage\n**${usedMemoryInMB} MB** Memory usage`
}

export function getDiscordStatus(client: ExtendedClient): string {
    return `**${client.ws.ping} ms** Discord API latency`
}

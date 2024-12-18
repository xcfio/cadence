import config from "config"
import {
    type BiquadFilters,
    EqualizerConfigurationPreset,
    type GuildQueue,
    type QueueFilters,
    useQueue
} from "discord-player"
import { EmbedBuilder, type InteractionResponse, type StringSelectMenuInteraction } from "discord.js"
import type { Logger } from "../../common/services/logger"
import { BaseComponentInteraction } from "../../common/classes/interactions"
import type {
    EqualizerFilterOptions,
    BiquadFilterOptions,
    FFmpegFilterOptions,
    FilterOption
} from "../../types/configTypes"
import type { BaseComponentParams, BaseComponentReturnType } from "../../types/interactionTypes"
import { checkQueueExists } from "../../common/validation/queueValidator"
import { checkInVoiceChannel, checkSameVoiceChannel } from "../../common/validation/voiceChannelValidator"
import { useServerTranslator, type Translator } from "../../common/utils/localeUtil"

const ffmpegFilterOptions: FFmpegFilterOptions = config.get("ffmpegFilterOptions")
const biquadFilterOptions: BiquadFilterOptions = config.get("biquadFilterOptions")
const equalizerFilterOptions: EqualizerFilterOptions = config.get("equalizerFilterOptions")

class FiltersSelectMenuComponent extends BaseComponentInteraction {
    constructor() {
        super("filters-select-menu")
    }

    async execute(params: BaseComponentParams): BaseComponentReturnType {
        const { executionId, interaction, referenceId } = params
        const logger = this.getLogger(this.name, executionId, interaction)
        const translator = useServerTranslator(interaction)
        const filterType = referenceId

        logger.debug("Received select menu interaction.")

        const selectMenuInteraction: StringSelectMenuInteraction = interaction as StringSelectMenuInteraction
        const queue: GuildQueue = useQueue(interaction.guild!.id)!

        await this.runValidators({ interaction, queue, executionId }, [
            checkInVoiceChannel,
            checkSameVoiceChannel,
            checkQueueExists
        ])

        this.resetFilters(queue, logger)

        if (selectMenuInteraction.values.length === 0) {
            return await this.replyWithDisabledFiltersEmbed(logger, selectMenuInteraction, translator)
        }

        switch (filterType) {
            case "ffmpeg":
                return await this.handleFfmpegFilterToggle(logger, selectMenuInteraction, queue, filterType, translator)
            case "biquad":
                return await this.handleBiquadFilterToggle(logger, selectMenuInteraction, queue, filterType, translator)
            case "equalizer":
                return await this.handleEqualizerFilterToggle(
                    logger,
                    selectMenuInteraction,
                    queue,
                    filterType,
                    translator
                )
            default:
                logger.warn(`Unknown filter type '${filterType}'.`)
                return
        }
    }

    private async handleFfmpegFilterToggle(
        logger: Logger,
        selectMenuInteraction: StringSelectMenuInteraction,
        queue: GuildQueue,
        filterType: string,
        translator: Translator
    ): Promise<InteractionResponse<boolean>> {
        this.addFfmpegNormalizerIfRequired(selectMenuInteraction)
        this.toggleFfmpegFilters(selectMenuInteraction, queue, logger)

        logger.debug("Responding with success embed.")
        return await this.sendFiltersToggledSuccessEmbed(logger, selectMenuInteraction, filterType, translator)
    }

    private async handleBiquadFilterToggle(
        logger: Logger,
        selectMenuInteraction: StringSelectMenuInteraction,
        queue: GuildQueue,
        filterType: string,
        translator: Translator
    ): Promise<InteractionResponse<boolean>> {
        this.toggleBiquadFilter(selectMenuInteraction, queue, logger)

        logger.debug("Responding with success embed.")
        return await this.sendFiltersToggledSuccessEmbed(logger, selectMenuInteraction, filterType, translator)
    }

    private async handleEqualizerFilterToggle(
        logger: Logger,
        selectMenuInteraction: StringSelectMenuInteraction,
        queue: GuildQueue,
        filterType: string,
        translator: Translator
    ): Promise<InteractionResponse<boolean>> {
        this.toggleEqualizerFilter(selectMenuInteraction, queue, logger)

        logger.debug("Responding with success embed.")
        return await this.sendFiltersToggledSuccessEmbed(logger, selectMenuInteraction, filterType, translator)
    }

    private toggleFfmpegFilters(
        selectMenuInteraction: StringSelectMenuInteraction,
        queue: GuildQueue,
        logger: Logger
    ): void {
        try {
            if (!queue.filters.ffmpeg) {
                throw new Error("FFmpeg filter is not enabled.")
            }

            queue.filters.ffmpeg.toggle(selectMenuInteraction.values as (keyof QueueFilters)[])
            logger.debug(`Enabled filters ${selectMenuInteraction.values.join(", ")}.`)
        } catch (error) {
            logger.error(error, "Unhandled error while toggling filters.")
        }
    }

    private toggleBiquadFilter(
        selectMenuInteraction: StringSelectMenuInteraction,
        queue: GuildQueue,
        logger: Logger
    ): void {
        try {
            queue.filters.biquad!.enable()

            if (!queue.filters.biquad) {
                throw new Error("Biquad filter is not enabled.")
            }

            queue.filters.biquad!.setGain(5)
            queue.filters.biquad!.setFilter(selectMenuInteraction.values[0] as BiquadFilters)
            logger.debug(`Enabled filters ${selectMenuInteraction.values.join(", ")}.`)
        } catch (error) {
            logger.error(error, "Unhandled error while toggling filters.")
        }
    }

    private toggleEqualizerFilter(
        selectMenuInteraction: StringSelectMenuInteraction,
        queue: GuildQueue,
        logger: Logger
    ): void {
        try {
            queue.filters.equalizer!.enable()

            const inputFilter = selectMenuInteraction.values[0] as keyof typeof EqualizerConfigurationPreset
            const eqFilter = EqualizerConfigurationPreset[inputFilter]

            if (!queue.filters.equalizer) {
                throw new Error("Equalizer filter is not enabled.")
            }

            queue.filters.equalizer!.setEQ(eqFilter)
            logger.debug(`Enabled filters ${selectMenuInteraction.values.join(", ")}.`)
        } catch (error) {
            logger.error(error, "Unhandled error while toggling filters.")
        }
    }

    private resetFilters(queue: GuildQueue, logger: Logger): void {
        if (queue.filters.ffmpeg.filters.length > 0) {
            queue.filters.ffmpeg.setFilters(false)
        }

        if (queue.filters.biquad) {
            queue.filters.biquad.disable()
        }

        if (queue.filters.equalizer) {
            queue.filters.equalizer.disable()
        }

        logger.debug("Reset queue filters.")
    }

    private sendFiltersToggledSuccessEmbed(
        logger: Logger,
        interaction: StringSelectMenuInteraction,
        filterType: string,
        translator: Translator
    ): Promise<InteractionResponse<boolean>> {
        logger.debug("Responding with success embed.")
        return interaction.reply({
            embeds: [this.buildSuccessEmbed(interaction, filterType, translator)],
            components: []
        })
    }

    private buildSuccessEmbed(
        selectMenuInteraction: StringSelectMenuInteraction,
        filterType: string,
        translator: Translator
    ): EmbedBuilder {
        const availableFilters: FilterOption[] = this.getAvailableFilters(filterType)
        const enabledFilters: string = this.getEnabledFilters(selectMenuInteraction, availableFilters)

        return new EmbedBuilder()
            .setAuthor(this.getEmbedUserAuthor(selectMenuInteraction))
            .setDescription(
                `${translator("commands.filters.nowUsingFilters", {
                    icon: this.embedOptions.icons.success,
                    mode: filterType
                })}\n${enabledFilters}`
            )
            .setColor(this.embedOptions.colors.success)
    }

    private getAvailableFilters(filterType: string): FilterOption[] {
        let availableFilters: FilterOption[] = []

        switch (filterType) {
            case "ffmpeg":
                availableFilters = ffmpegFilterOptions.availableFilters
                break
            case "biquad":
                availableFilters = biquadFilterOptions.availableFilters
                break
            case "equalizer":
                availableFilters = equalizerFilterOptions.availableFilters
                break
            default:
                break
        }

        return availableFilters
    }

    private getEnabledFilters(
        selectMenuInteraction: StringSelectMenuInteraction,
        availableFilters: FilterOption[]
    ): string {
        return selectMenuInteraction.values
            .map((enabledFilter: string) => {
                const filter: FilterOption | undefined = availableFilters.find(
                    (filter) => enabledFilter === filter.value
                )

                return filter ? `- **${filter.emoji} ${filter.label}**` : enabledFilter
            })
            .join("\n")
    }

    private addFfmpegNormalizerIfRequired(selectMenuInteraction: StringSelectMenuInteraction) {
        if (
            ffmpegFilterOptions.forceNormalizerByBassBoost &&
            (selectMenuInteraction.values.includes("bassboost_low") ||
                selectMenuInteraction.values.includes("bassboost")) &&
            !selectMenuInteraction.values.includes("normalizer")
        ) {
            selectMenuInteraction.values.push("normalizer")
        }
    }

    private async replyWithDisabledFiltersEmbed(
        logger: Logger,
        interaction: StringSelectMenuInteraction,
        translator: Translator
    ): Promise<InteractionResponse<boolean>> {
        logger.debug("Responding with success embed.")
        return await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setAuthor(this.getEmbedUserAuthor(interaction))
                    .setDescription(
                        translator("commands.filters.allFiltersDisabled", {
                            icon: this.embedOptions.icons.success
                        })
                    )
                    .setColor(this.embedOptions.colors.success)
            ],
            components: []
        })
    }
}

export default new FiltersSelectMenuComponent()

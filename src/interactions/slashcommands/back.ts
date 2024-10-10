import { type GuildQueue, type GuildQueueHistory, type Track, useHistory, useQueue } from 'discord-player';
import { type ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { BaseSlashCommandInteraction } from '../../common/classes/interactions';
import type { BaseSlashCommandParams, BaseSlashCommandReturnType } from '../../types/interactionTypes';
import { checkHistoryExists, checkQueueCurrentTrack } from '../../common/validation/queueValidator';
import { checkInVoiceChannel, checkSameVoiceChannel } from '../../common/validation/voiceChannelValidator';
import type { Logger } from '../../common/services/logger';
import { localizeCommand, useServerTranslator, type Translator } from '../../common/utils/localeUtil';
import { formatSlashCommand } from '../../common/utils/formattingUtils';

class BackCommand extends BaseSlashCommandInteraction {
    constructor() {
        const data = localizeCommand(
            new SlashCommandBuilder()
                .setName('back')
                .addIntegerOption((option) => option.setName('position').setMinValue(1))
        );
        super(data);
    }

    async execute(params: BaseSlashCommandParams): BaseSlashCommandReturnType {
        const { executionId, interaction } = params;
        const logger = this.getLogger(this.name, executionId, interaction);
        const translator = useServerTranslator(interaction);

        const history: GuildQueueHistory = useHistory(interaction.guild!.id)!;

        await this.runValidators({ interaction, history, executionId }, [
            checkInVoiceChannel,
            checkSameVoiceChannel,
            checkHistoryExists,
            checkQueueCurrentTrack
        ]);

        const backToTrackInput: number = interaction.options.getInteger('position')!;

        if (backToTrackInput) {
            return await this.handleBackToTrackPosition(logger, interaction, history, backToTrackInput, translator);
        }
        return await this.handleBackToPreviousTrack(logger, interaction, history, translator);
    }

    private async handleBackToTrackPosition(
        logger: Logger,
        interaction: ChatInputCommandInteraction,
        history: GuildQueueHistory,
        backtoTrackPosition: number,
        translator: Translator
    ) {
        if (backtoTrackPosition > history.tracks.data.length) {
            return await this.handleTrackPositionHigherThanHistoryLength(
                backtoTrackPosition,
                history,
                logger,
                interaction,
                translator
            );
        }
        await history.back();
        const recoveredTrack: Track = history.currentTrack! ?? history.tracks.data[backtoTrackPosition - 1];
        logger.debug('Went back to specified track position in history.');
        return await this.respondWithSuccessEmbed(recoveredTrack, interaction, translator);
    }

    private async handleTrackPositionHigherThanHistoryLength(
        backToTrackPosition: number,
        history: GuildQueueHistory,
        logger: Logger,
        interaction: ChatInputCommandInteraction,
        translator: Translator
    ) {
        logger.debug('Specified track position was higher than total tracks.');
        return await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(
                        translator('commands.back.trackPositionHigherThanHistoryLength', {
                            icon: this.embedOptions.icons.warning,
                            count: history.tracks.data.length,
                            backPosition: backToTrackPosition,
                            historyCommand: formatSlashCommand('history', translator)
                        })
                    )
                    .setColor(this.embedOptions.colors.warning)
            ],
            ephemeral: true
        });
    }

    private async handleBackToPreviousTrack(
        logger: Logger,
        interaction: ChatInputCommandInteraction,
        history: GuildQueueHistory,
        translator: Translator
    ) {
        if (history.tracks.data.length === 0) {
            return await this.handleNoTracksInHistory(logger, interaction, translator);
        }

        await history.back();
        const queue: GuildQueue = useQueue(interaction.guild!.id)!;
        const currentTrack: Track = queue.currentTrack!;
        logger.debug('Recovered track from history.');
        return await this.respondWithSuccessEmbed(currentTrack, interaction, translator);
    }
    private async handleNoTracksInHistory(
        logger: Logger,
        interaction: ChatInputCommandInteraction,
        translator: Translator
    ) {
        logger.debug('No tracks in history.');
        return await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(
                        translator('commands.back.trackHistoryEmpty', {
                            icon: this.embedOptions.icons.warning,
                            playCommand: formatSlashCommand('play', translator)
                        })
                    )
                    .setColor(this.embedOptions.colors.warning)
            ],
            ephemeral: true
        });
    }

    private async respondWithSuccessEmbed(
        recoveredTrack: Track,
        interaction: ChatInputCommandInteraction,
        translator: Translator
    ) {
        return await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setAuthor(this.getEmbedUserAuthor(interaction))
                    .setDescription(
                        translator('commands.back.trackReplayed', {
                            icon: this.embedOptions.icons.back,
                            track: this.getDisplayTrackDurationAndUrl(recoveredTrack, translator)
                        })
                    )
                    .setThumbnail(this.getTrackThumbnailUrl(recoveredTrack))
                    .setColor(this.embedOptions.colors.success)
            ]
        });
    }
}

export default new BackCommand();

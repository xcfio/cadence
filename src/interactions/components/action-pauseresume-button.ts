import { type GuildQueue, type Track, useQueue } from 'discord-player';
import { EmbedBuilder, type MessageComponentInteraction } from 'discord.js';
import { BaseComponentInteraction } from '../../common/classes/interactions';
import type { BaseComponentParams, BaseComponentReturnType } from '../../types/interactionTypes';
import { checkQueueCurrentTrack, checkQueueExists } from '../../common/validation/queueValidator';
import { checkInVoiceChannel, checkSameVoiceChannel } from '../../common/validation/voiceChannelValidator';
import { useServerTranslator, type Translator } from '../../common/utils/localeUtil';
import { formatRepeatModeDetailed } from '../../common/utils/formattingUtils';

class ActionPauseResumeButton extends BaseComponentInteraction {
    constructor() {
        super('action-pauseresume-button');
    }

    async execute(params: BaseComponentParams): BaseComponentReturnType {
        const { executionId, interaction, referenceId } = params;
        const logger = this.getLogger(this.name, executionId, interaction);
        const translator = useServerTranslator(interaction);

        const queue: GuildQueue = useQueue(interaction.guild!.id)!;

        await this.runValidators({ interaction, queue, executionId }, [
            checkInVoiceChannel,
            checkSameVoiceChannel,
            checkQueueExists,
            checkQueueCurrentTrack
        ]);

        if (queue.currentTrack!.id !== referenceId) {
            return await this.handleAlreadySkipped(interaction, translator);
        }

        const currentTrack: Track = queue.currentTrack!;
        if (queue.node.isPaused()) {
            queue.node.resume();
            logger.debug('Resumed the track.');
        } else {
            queue.node.pause();
            logger.debug('Paused the track.');
        }

        logger.debug('Responding with success embed.');
        return await this.handleSuccess(interaction, currentTrack, queue, translator);
    }

    private async handleAlreadySkipped(interaction: MessageComponentInteraction, translator: Translator) {
        return await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(
                        translator('validation.trackNotPlayingAnymore', {
                            icon: this.embedOptions.icons.warning
                        })
                    )
                    .setColor(this.embedOptions.colors.warning)
            ],
            components: [],
            ephemeral: true
        });
    }

    private async handleSuccess(
        interaction: MessageComponentInteraction,
        track: Track,
        queue: GuildQueue,
        translator: Translator
    ) {
        const successEmbed = new EmbedBuilder()
            .setAuthor(this.getEmbedUserAuthor(interaction))
            .setDescription(
                `**${this.embedOptions.icons.pauseResumed} ${
                    queue.node.isPaused()
                        ? translator('components.responses.paused')
                        : translator('components.responses.resumed')
                }**\n ${this.getDisplayTrackDurationAndUrl(queue.currentTrack!, translator)}\n\n` +
                    `${formatRepeatModeDetailed(queue.repeatMode, this.embedOptions, translator, 'success')}`
            )
            .setThumbnail(track.thumbnail)
            .setColor(this.embedOptions.colors.success);

        return await interaction.reply({
            embeds: [successEmbed],
            components: []
        });
    }
}

export default new ActionPauseResumeButton();

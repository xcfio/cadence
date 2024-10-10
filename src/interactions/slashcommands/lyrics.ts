import { type LyricsData, lyricsExtractor } from '@discord-player/extractor';
import {
    type GuildQueue,
    type Player,
    QueryType,
    type SearchResult,
    type Track,
    useMainPlayer,
    useQueue
} from 'discord-player';
import { type ChatInputCommandInteraction, EmbedBuilder, type Message, SlashCommandBuilder } from 'discord.js';
import type { Logger } from '../../common/services/logger';
import { BaseSlashCommandInteraction } from '../../common/classes/interactions';
import type { BaseSlashCommandParams, BaseSlashCommandReturnType } from '../../types/interactionTypes';
import { checkQueueCurrentTrack, checkQueueExists } from '../../common/validation/queueValidator';
import { checkInVoiceChannel, checkSameVoiceChannel } from '../../common/validation/voiceChannelValidator';
import { localizeCommand, useServerTranslator, type Translator } from '../../common/utils/localeUtil';

class LyricsCommand extends BaseSlashCommandInteraction {
    constructor() {
        const data = localizeCommand(
            new SlashCommandBuilder()
                .setName('lyrics')
                .addStringOption((option) =>
                    option.setName('query').setRequired(false).setMinLength(2).setMaxLength(500).setAutocomplete(true)
                )
        );
        super(data);
    }

    async execute(params: BaseSlashCommandParams): BaseSlashCommandReturnType {
        const { executionId, interaction } = params;
        const logger = this.getLogger(this.name, executionId, interaction);
        const translator = useServerTranslator(interaction);

        const queue: GuildQueue = useQueue(interaction.guild!.id)!;
        const query: string = interaction.options.getString('query')!;

        if (!query) {
            await this.runValidators({ interaction, queue, executionId }, [
                checkInVoiceChannel,
                checkSameVoiceChannel,
                checkQueueExists,
                checkQueueCurrentTrack
            ]);
        }

        await interaction.deferReply();
        logger.debug('Interaction deferred.');

        const geniusSearchQuery: string = this.getGeniusSearchQuery(logger, query, queue);
        const [playerSearchResult, geniusLyricsResult] = await Promise.all([
            this.getPlayerSearchResult(logger, query),
            this.getGeniusLyricsResult(logger, geniusSearchQuery)
        ]);
        const finalLyricsData: LyricsData | null = this.validateGeniusLyricsResult(
            logger,
            geniusLyricsResult,
            playerSearchResult,
            queue
        );

        if (!finalLyricsData) {
            logger.debug('No matching lyrics found.');
            return await this.sendNoLyricsFoundEmbed(logger, interaction, geniusSearchQuery, translator);
        }

        if (finalLyricsData.lyrics.length > 3800) {
            return await this.sendMultipleLyricsMessages(logger, interaction, finalLyricsData, translator);
        }

        return await this.sendLyricsEmbed(logger, interaction, finalLyricsData, translator);
    }

    private getGeniusSearchQuery(logger: Logger, query: string, queue: GuildQueue): string {
        const geniusSearchQuery =
            query ?? `${queue.currentTrack!.title.slice(0, 50)} ${queue.currentTrack!.author.split(', ')[0]}`;
        logger.debug(`Using query for genius search: '${geniusSearchQuery}'`);
        return geniusSearchQuery;
    }

    private async getPlayerSearchResult(logger: Logger, query: string): Promise<Track | null> {
        if (!query) {
            return null;
        }
        logger.debug(`Query input provided, using query '${query}' for player.search().`);
        const player: Player = useMainPlayer()!;
        const searchResults: SearchResult | null = await player
            .search(query, {
                searchEngine: QueryType.SPOTIFY_SEARCH
            })
            .catch(() => null);

        if (!searchResults || searchResults.tracks.length === 0) {
            logger.debug('No search results using player.search() found.');
            return null;
        }

        return searchResults.tracks[0];
    }

    private async getGeniusLyricsResult(logger: Logger, geniusSearchQuery: string): Promise<LyricsData | null> {
        const genius = lyricsExtractor();
        let geniusLyricsResult: LyricsData | null = await genius.search(geniusSearchQuery).catch(() => null);

        if (!geniusLyricsResult && geniusSearchQuery.length > 20) {
            logger.debug('No lyrics found, trying again with shorter query.');
            geniusLyricsResult = await this.retryGeniusLyricsSearchSorterQuery(logger, geniusSearchQuery);
        }

        return geniusLyricsResult;
    }

    private async retryGeniusLyricsSearchSorterQuery(
        logger: Logger,
        geniusSearchQuery: string
    ): Promise<LyricsData | null> {
        if (geniusSearchQuery.length < 10) {
            return null;
        }

        const retryQuery: string = geniusSearchQuery.slice(0, geniusSearchQuery.length - 10);
        const retryLyricsResult: LyricsData | null = await this.getGeniusLyricsResult(logger, retryQuery);

        // recursively try again with shorter query
        if (!retryLyricsResult) {
            return this.retryGeniusLyricsSearchSorterQuery(logger, retryQuery);
        }

        return retryLyricsResult;
    }

    private validateGeniusLyricsResult(
        logger: Logger,
        geniusLyricsResult: LyricsData | null,
        playerSearchResult: Track | null,
        queue: GuildQueue
    ): LyricsData | null {
        let updatedGeniusLyricsResult = geniusLyricsResult;

        if (
            updatedGeniusLyricsResult &&
            !this.doesArtistNameMatch(playerSearchResult, updatedGeniusLyricsResult, queue)
        ) {
            logger.debug('Found Genius lyrics but artist name did not match from player.search() result.');
            updatedGeniusLyricsResult = null;
        }

        if (!updatedGeniusLyricsResult || updatedGeniusLyricsResult.lyrics.length === 0) {
            logger.debug('No Genius lyrics found.');
            updatedGeniusLyricsResult = null;
        }

        return updatedGeniusLyricsResult;
    }

    private doesArtistNameMatch(
        playerSearchResult: Track | null,
        geniusLyricsResult: LyricsData,
        queue: GuildQueue
    ): boolean {
        const playerAuthorLower = playerSearchResult?.author.toLowerCase() ?? queue.currentTrack!.author.toLowerCase();
        const geniusArtistNameLower = geniusLyricsResult.artist.name.toLowerCase();

        return (
            playerAuthorLower.includes(geniusArtistNameLower) ||
            geniusArtistNameLower.includes(playerAuthorLower) ||
            geniusArtistNameLower.includes(playerAuthorLower.split(', ')[0])
        );
    }

    private async sendNoLyricsFoundEmbed(
        logger: Logger,
        interaction: ChatInputCommandInteraction,
        geniusSearchQuery: string,
        translator: Translator
    ) {
        logger.debug('Responding with warning embed.');
        return await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(
                        translator('commands.lyrics.noLyricsFound', {
                            icon: this.embedOptions.icons.warning,
                            query: geniusSearchQuery
                        })
                    )
                    .setColor(this.embedOptions.colors.warning)
            ]
        });
    }

    private async sendMultipleLyricsMessages(
        logger: Logger,
        interaction: ChatInputCommandInteraction,
        geniusLyricsResult: LyricsData,
        translator: Translator
    ): Promise<Message> {
        logger.debug('Lyrics text too long, splitting into multiple messages.');
        const messageCount: number = Math.ceil(geniusLyricsResult.lyrics.length / 3800);
        const embedList: EmbedBuilder[] = [];
        embedList.push(
            new EmbedBuilder()
                .setDescription(
                    translator('commands.lyrics.lyricsEmbed', {
                        icon: this.embedOptions.icons.queue,
                        trackTitle: geniusLyricsResult.title,
                        trackUrl: geniusLyricsResult.url,
                        artistName: geniusLyricsResult.artist.name,
                        artistUrl: geniusLyricsResult.artist.url
                    })
                )
                .setColor(this.embedOptions.colors.info)
        );
        for (let i = 0; i < messageCount; i++) {
            logger.debug(`Adding message ${i + 1} of ${messageCount} to embed list.`);
            const message: string = geniusLyricsResult.lyrics.slice(i * 3800, (i + 1) * 3800);
            embedList.push(
                new EmbedBuilder().setDescription(`\`\`\`fix\n${message}\`\`\``).setColor(this.embedOptions.colors.info)
            );
        }

        logger.debug('Responding with multiple info embeds.');
        return await interaction.editReply({
            embeds: embedList
        });
    }

    private async sendLyricsEmbed(
        logger: Logger,
        interaction: ChatInputCommandInteraction,
        geniusLyricsResult: LyricsData,
        translator: Translator
    ): Promise<Message> {
        logger.debug('Responding with info embed.');
        return await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(
                        `${translator('commands.lyrics.lyricsEmbed', {
                            icon: this.embedOptions.icons.queue,
                            trackTitle: geniusLyricsResult.title,
                            trackUrl: geniusLyricsResult.url,
                            artistName: geniusLyricsResult.artist.name,
                            artistUrl: geniusLyricsResult.artist.url
                        })}\n\n\`\`\`fix\n${geniusLyricsResult.lyrics}\`\`\``
                    )
                    .setColor(this.embedOptions.colors.info)
            ]
        });
    }
}

export default new LyricsCommand();

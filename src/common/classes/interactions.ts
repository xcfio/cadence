import config from 'config';
import type { GuildQueue, GuildQueueHistory, PlayerTimestamp, Track } from 'discord-player';
import {
    type ApplicationCommandOptionChoiceData,
    type AutocompleteInteraction,
    type ChatInputCommandInteraction,
    type EmbedAuthorOptions,
    type EmbedFooterData,
    GuildMember,
    type Interaction,
    type Message,
    type MessageComponentInteraction,
    type SlashCommandBuilder,
    type SlashCommandSubcommandsOnlyBuilder
} from 'discord.js';
import { loggerService, type Logger } from '../services/logger';
import type { BotOptions, EmbedOptions, PlayerOptions } from '../../types/configTypes';
import type {
    BaseAutocompleteParams,
    BaseAutocompleteReturnType,
    BaseComponentParams,
    BaseComponentReturnType,
    BaseInteractionParams,
    BaseSlashCommandParams,
    BaseSlashCommandReturnType
} from '../../types/interactionTypes';
import type { Validator, ValidatorParams } from '../../types/utilTypes';
import type { Translator } from '../utils/localeUtil';

abstract class BaseInteraction {
    embedOptions: EmbedOptions;
    botOptions: BotOptions;
    playerOptions: PlayerOptions;

    constructor() {
        this.embedOptions = config.get('embedOptions');
        this.botOptions = config.get('botOptions');
        this.playerOptions = config.get('playerOptions');
    }

    protected getLoggerBase(
        module: string,
        name: string,
        executionId: string,
        interaction: Interaction | MessageComponentInteraction
    ): Logger {
        return loggerService.child({
            module: module,
            name: name,
            executionId: executionId,
            shardId: interaction.guild?.shardId,
            guildId: interaction.guild?.id
        });
    }

    protected validators: Validator[] = [];

    protected async runValidators(args: ValidatorParams, validators?: Validator[]): Promise<void> {
        for (const validator of validators ? validators : this.validators) {
            await validator(args);
        }
    }

    protected getFormattedDuration(track: Track): string {
        let durationFormat =
            Number(track.duration) === 0 || track.duration === '0:00' ? '' : `**\`${track.duration}\`**`;

        if (track.raw.live) {
            durationFormat = `**${this.embedOptions.icons.liveTrack} \`LIVE\`**`;
        }

        return durationFormat;
    }

    protected getFormattedTrackUrl(track: Track, translator: Translator): string {
        const trackTitle = track.title ?? translator('musicPlayerCommon.unavailableTrackTitle');
        const trackUrl = track.url ?? track.raw.url;
        if (!trackTitle || !trackUrl) {
            return translator('musicPlayerCommon.unavailableTrackUrl');
        }
        return `**[${trackTitle}](${trackUrl})**`;
    }

    protected getDisplayTrackDurationAndUrl(track: Track, translator: Translator): string {
        const formattedDuration = this.getFormattedDuration(track);
        const formattedUrl = this.getFormattedTrackUrl(track, translator);

        return `${formattedDuration} ${formattedUrl}`;
    }

    protected getTrackThumbnailUrl(track: Track): string {
        let thumbnailUrl = '';

        if (track.raw.thumbnail) {
            thumbnailUrl = track.raw.thumbnail;
        } else if (track.thumbnail) {
            thumbnailUrl = track.thumbnail;
        } else {
            thumbnailUrl = this.embedOptions.info.fallbackThumbnailUrl;
        }

        return thumbnailUrl;
    }

    protected getFooterDisplayPageInfo(
        interaction: ChatInputCommandInteraction,
        queue: GuildQueue | GuildQueueHistory,
        translator: Translator
    ): EmbedFooterData {
        const pageIndex: number = (interaction.options.getInteger('page') || 1) - 1;
        const totalPages: number = Math.ceil(queue.tracks.data.length / 10) || 1;
        return {
            text: translator('musicPlayerCommon.footerPageNumber', {
                page: pageIndex + 1,
                pageCount: totalPages,
                count: queue.tracks.data.length
            })
        };
    }

    protected getDisplayTrackRequestedBy = (track: Track, translator: Translator): string => {
        return track.requestedBy
            ? `<@${track.requestedBy.id}>`
            : translator('musicPlayerCommon.unavailableRequestedBy');
    };

    protected getDisplayQueueProgressBar(queue: GuildQueue, translator: Translator): string {
        let progressBar = '';
        try {
            const timestamp: PlayerTimestamp | null = queue.node.getTimestamp();

            if (timestamp) {
                progressBar = `**\`${timestamp.current.label}\`** ${queue.node.createProgressBar({
                    queue: false,
                    length: this.playerOptions.progressBar.length ?? 12,
                    timecodes: this.playerOptions.progressBar.timecodes ?? false,
                    indicator: this.playerOptions.progressBar.indicator ?? '🔘',
                    leftChar: this.playerOptions.progressBar.leftChar ?? '▬',
                    rightChar: this.playerOptions.progressBar.rightChar ?? '▬'
                })} **\`${timestamp.total.label}\`**`;

                if (Number(queue.currentTrack?.duration) === 0 || queue.currentTrack?.duration === '0:00') {
                    progressBar = translator('musicPlayerCommon.unavailableDuration');
                }

                if (queue.currentTrack?.raw.live) {
                    progressBar = translator('musicPlayerCommon.playingLive', {
                        icon: this.embedOptions.icons.liveTrack
                    });
                }
            }
        } catch {
            return progressBar;
        }

        return progressBar;
    }

    abstract execute(
        params: BaseInteractionParams
    ): Promise<Message<boolean> | ApplicationCommandOptionChoiceData | void>;
}

abstract class BaseInteractionWithEmbedResponse extends BaseInteraction {
    protected getEmbedUserAuthor(
        interaction: MessageComponentInteraction | ChatInputCommandInteraction
    ): EmbedAuthorOptions {
        let authorName = '';
        if (interaction.member instanceof GuildMember) {
            authorName = interaction.member.nickname || interaction.user.username;
        } else {
            authorName = interaction.user.username;
        }

        return {
            name: authorName,
            iconURL: interaction.user.avatarURL() || this.embedOptions.info.fallbackIconUrl
        };
    }

    protected getEmbedQueueAuthor(
        interaction: MessageComponentInteraction | ChatInputCommandInteraction,
        queue: GuildQueue,
        translator: Translator
    ): EmbedAuthorOptions {
        const bitrate = queue.channel ? queue.channel.bitrate / 1000 : 0;
        return {
            name: translator('musicPlayerCommon.voiceChannelInfo', {
                channel: queue.channel!.name,
                bitrate
            }),
            iconURL: interaction.guild!.iconURL() || this.embedOptions.info.fallbackIconUrl
        };
    }
}

export abstract class BaseSlashCommandInteraction extends BaseInteractionWithEmbedResponse {
    data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder;
    isNew: boolean;
    isBeta: boolean;
    name: string;

    constructor(
        data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder,
        isNew = false,
        isBeta = false
    ) {
        super();
        this.data = data.setDMPermission(false).setNSFW(false);
        this.isNew = isNew;
        this.isBeta = isBeta;
        this.name = data.name;
    }

    protected getLogger(name: string, executionId: string, interaction: ChatInputCommandInteraction): Logger {
        return super.getLoggerBase('slashCommandInteraction', name, executionId, interaction);
    }

    abstract execute(params: BaseSlashCommandParams): BaseSlashCommandReturnType;
}

export abstract class BaseComponentInteraction extends BaseInteractionWithEmbedResponse {
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    protected getLogger(name: string, executionId: string, interaction: MessageComponentInteraction): Logger {
        return super.getLoggerBase('componentInteraction', name, executionId, interaction);
    }

    abstract execute(params: BaseComponentParams): BaseComponentReturnType;
}

export abstract class BaseAutocompleteInteraction extends BaseInteraction {
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    protected getLogger(name: string, executionId: string, interaction: AutocompleteInteraction): Logger {
        return super.getLoggerBase('autocompleteInteraction', name, executionId, interaction);
    }

    abstract execute(params: BaseAutocompleteParams): BaseAutocompleteReturnType;
}

export class CustomError extends Error {
    type?: string;
    code?: string;
}

export class InteractionValidationError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'InteractionValidationError';
    }
}

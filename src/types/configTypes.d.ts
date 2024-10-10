import type { ActivityType, ColorResolvable, PresenceUpdateStatus } from 'discord.js';
import type { LogLevel } from './serviceTypes';

export type BotOptions = {
    name: string;
    botInviteUrl: string;
    serverInviteUrl: string;
    openSourceUrl: string;
};

export type CustomLoggerOptions = {
    minimumLogLevel: LogLevel;
    minimumLogLevelConsole: LogLevel;
    discordPlayerDebug: boolean;
};

export type SystemOptions = {
    systemMessageChannelId: string;
    systemUserId: string;
};

export type PresenceStatusOptions = {
    status: PresenceUpdateStatus;
    activities: {
        name: string;
        type: ActivityType;
    }[];
};

export type EmbedOptions = {
    info: {
        fallbackThumbnailUrl: string;
        fallbackIconUrl: string;
    };
    colors: {
        success: ColorResolvable;
        warning: ColorResolvable;
        error: ColorResolvable;
        info: ColorResolvable;
        note: ColorResolvable;
    };
    components: {
        showButtonLabels: boolean;
    };
    behavior: {
        enablePlayerStartMessages: boolean;
    };
    icons: {
        logo: string;
        beta: string;
        new: string;
        rule: string;
        support: string;
        bot: string;
        openSource: string;
        server: string;
        discord: string;
        audioPlaying: string;
        audioStartedPlaying: string;
        success: string;
        error: string;
        warning: string;
        disable: string;
        enable: string;
        disabled: string;
        enabled: string;
        nextTrack: string;
        previousTrack: string;
        pauseResumeTrack: string;
        paused: string;
        shuffleQueue: string;
        loop: string;
        loopAction: string;
        autoplay: string;
        autoplayAction: string;
        looping: string;
        autoplaying: string;
        skipped: string;
        back: string;
        pauseResumed: string;
        shuffled: string;
        moved: string;
        volume: string;
        volumeIsMuted: string;
        volumeChanged: string;
        volumeMuted: string;
        queue: string;
        sourceArbitrary: string;
        sourceAppleMusic: string;
        sourceYouTube: string;
        sourceSoundCloud: string;
        sourceSpotify: string;
        liveTrack: string;
    };
};

export type PlayerOptions = {
    leaveOnEmpty: boolean;
    leaveOnEmptyCooldown: number;
    leaveOnEnd: boolean;
    leaveOnEndCooldown: number;
    leaveOnStop: boolean;
    leaveOnStopCooldown: number;
    defaultVolume: number;
    maxQueueSize: number;
    maxHistorySize: number;
    bufferingTimeout: number;
    connectionTimeout: number;
    progressBar: {
        length: number;
        timecodes: boolean;
        separator: string;
        indicator: string;
        leftChar: string;
        rightChar: string;
    };
};

export type FilterOption = {
    label: string;
    value: string;
    description: string;
    emoji: string;
};

export type FFmpegFilterOptions = {
    threadAmount: string;
    forceNormalizerByBassBoost: boolean;
    maxFilters: number;
    availableFilters: FFmpegFilterOption[];
};

export type BiquadFilterOptions = {
    availableFilters: FFmpegFilterOption[];
};

export type EqualizerFilterOptions = {
    availableFilters: FFmpegFilterOption[];
};

export type LoadTestOptions = {
    enabled: boolean;
    trackUrl: string;
    channelIdsToJoin: string[];
};

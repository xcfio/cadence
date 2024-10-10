import type { BaseGuildTextChannel, Message } from 'discord.js';
import type { GuildQueuePlayerNode } from 'discord-player';
import type { ExtendedClient } from './clientTypes';

export type ClientEventArguments = unknown[];
export type ProcessEventArguments = unknown[];
export type PlayerEventArguments = unknown[];

export type ExtendedGuildQueuePlayerNode = {
    metadata:
        | undefined
        | {
              client: ExtendedClient;
              channel: BaseGuildTextChannel;
              lastMessage: Message;
          };
} & GuildQueuePlayerNode<unknown>;

import { loggerService, type Logger } from '../services/logger';
import type { GetUptimeFormattedParams } from '../../types/utilTypes';
import { formatDuration } from './formattingUtils';

export const getUptimeFormatted = ({ executionId }: GetUptimeFormattedParams): string => {
    const logger: Logger = loggerService.child({
        module: 'utilSystem',
        name: 'getUptimeFormatted',
        executionId: executionId
    });

    try {
        const uptimeInSeconds: number = Number.parseFloat(process.uptime().toFixed(0));
        return formatDuration(uptimeInSeconds * 1000);
    } catch (error) {
        logger.error('Error retrieving or transforming uptime to formatted string.', error);
        throw error;
    }
};

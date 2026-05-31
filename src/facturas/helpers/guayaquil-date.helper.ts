const GUAYAQUIL_OFFSET = '-05:00';

export const toGuayaquilStartOfDay = (dateStr: string): Date =>
    new Date(`${dateStr}T00:00:00${GUAYAQUIL_OFFSET}`);

export const toGuayaquilEndOfDay = (dateStr: string): Date =>
    new Date(`${dateStr}T23:59:59.999${GUAYAQUIL_OFFSET}`);
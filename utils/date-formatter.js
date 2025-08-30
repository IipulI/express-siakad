import dayjs from 'dayjs';

export const formatTimestamp = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
    return dayjs(date).format(format);
};
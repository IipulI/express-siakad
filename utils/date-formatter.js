import dayjs from 'dayjs';

export const formatTimestamp = (date) => {
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};
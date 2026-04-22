import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";
import utc from "dayjs/plugin/utc";
import duration from "dayjs/plugin/duration";

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(duration);

export default dayjs;

/** "Jan 5, 2025" */
export const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return "—";
    return dayjs(date).format("ll");
};

/** "Jan 5, 2025 at 2:34 PM" */
export const formatDateTime = (date: string | Date | null | undefined): string => {
    if (!date) return "—";
    return dayjs(date).format("ll [at] h:mm A");
};

/** "2 hours ago" / "in 3 days" */
export const fromNow = (date: string | Date | null | undefined): string => {
    if (!date) return "—";
    return dayjs(date).fromNow();
};

/** ISO 8601 string for <input type="date"> */
export const toDateInput = (date: string | Date | null | undefined): string => {
    if (!date) return "";
    return dayjs(date).format("YYYY-MM-DD");
};

export type ReportPeriod = "today" | "week" | "month";

export class DateUtils {
    private static readonly formatter = new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Lagos"
    });

    /**
     * Beginning of today.
     */
    public static startOfToday(): Date {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    }

    /**
     * Last 7 days.
     */
    public static startOfWeek(): Date {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date;
    }

    /**
     * First day of current month.
     */
    public static startOfMonth(): Date {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }

    /**
     * Start date for a reporting period.
     */
    public static startOf(period: ReportPeriod): Date {
        switch (period) {
            case "today":
                return this.startOfToday();

            case "week":
                return this.startOfWeek();

            case "month":
                return this.startOfMonth();

            default:
                return this.assertNever(period);
        }
    }

    /**
     * SQL expression for report queries.
     */
    public static sqlPeriod(period: ReportPeriod): string {
        switch (period) {
            case "today":
                return "CURDATE()";

            case "week":
                return "NOW() - INTERVAL 7 DAY";

            case "month":
                return "DATE_FORMAT(NOW(), '%Y-%m-01')";

            default:
                return this.assertNever(period);
        }
    }

    /**
     * Human-readable label.
     */
    public static label(period: ReportPeriod): string {
        switch (period) {
            case "today":
                return "Today";

            case "week":
                return "Last 7 Days";

            case "month":
                return "This Month";

            default:
                return this.assertNever(period);
        }
    }

    /**
     * Format a date for display.
     */
    public static format(date: Date): string {
        return this.formatter.format(date);
    }

    /**
     * Convert to YYYY-MM-DD.
     */
    public static toSqlDate(date: Date): string {
        return date.toISOString().slice(0, 10);
    }

    /**
     * Exhaustiveness check.
     */
    private static assertNever(value: never): never {
        throw new Error(`Unhandled ReportPeriod: ${value}`);
    }
}
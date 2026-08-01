"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateUtils = void 0;
class DateUtils {
    static formatter = new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Lagos"
    });
    /**
     * Beginning of today.
     */
    static startOfToday() {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    }
    /**
     * Last 7 days.
     */
    static startOfWeek() {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date;
    }
    /**
     * First day of current month.
     */
    static startOfMonth() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    /**
     * Start date for a reporting period.
     */
    static startOf(period) {
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
    static sqlPeriod(period) {
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
    static label(period) {
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
    static format(date) {
        return this.formatter.format(date);
    }
    /**
     * Convert to YYYY-MM-DD.
     */
    static toSqlDate(date) {
        return date.toISOString().slice(0, 10);
    }
    /**
     * Exhaustiveness check.
     */
    static assertNever(value) {
        throw new Error(`Unhandled ReportPeriod: ${value}`);
    }
}
exports.DateUtils = DateUtils;
//# sourceMappingURL=dates.js.map
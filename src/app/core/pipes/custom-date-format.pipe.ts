import { Pipe, PipeTransform, inject } from '@angular/core';
import { GlobalDateFormatService } from '../services/global-date-format.service';
/**
 * Angular pipe that formats dates using the application's global date format by default.
 * Supports custom date formats, optional time display (12-hour or 24-hour), and seconds.
 *
 * The pipe delegates actual formatting to {@link GlobalDateFormatService}.
 *
 * @example Basic usage — global format only
 * {{ createdAt | formatDate }}
 * → "13/02/2026"   (depending on company/global setting)
 *
 * @example Custom format (recommended syntax — object literal)
 * {{ eta | formatDate : { customFormat: 'dd-MMM-yyyy' } }}
 * → "13-Feb-2026"
 *
 * @example With 12-hour time (hh:mm AM/PM)
 * {{ updatedAt | formatDate : { includeTime: true } }}
 * → "13/02/2026 09:15 AM"
 *
 * @example With 24-hour time + seconds
 * {{ loggedAt | formatDate : { includeTime: true, includeSeconds: true, use24Hour: true } }}
 * → "13/02/2026 09:15:37"
 *
 * @example Classic positional syntax (still supported but less readable)
 * {{ jobDate | formatDate : true : true : true : 'dd-MMM-yyyy' }}
 * → "13-Feb-2026 09:15:37"
 *
 * @remarks
 * - When `customFormat` is provided, the global/company date format is completely ignored for the date part.
 * - Time is **only** added when `includeTime: true`.
 * - Default time style = **12-hour + AM/PM** unless `use24Hour: true`.
 * - Invalid / null / undefined input → returns empty string `''`.
 * - The pipe is **pure** → only re-evaluates when input reference changes.
 *
 * @param value - The date to format (accepts ISO string, Date object, timestamp number, null/undefined)
 * @param includeTime - Whether to append time (default: `false`)
 * @param includeSeconds - Include seconds when time is shown (default: `false`)
 * @param use24Hour - Use 24-hour clock instead of 12-hour + AM/PM (default: `false`)
 * @param customFormat - Override date format string (e.g. `'dd-MMM-yyyy'`, `'YYYY-MM-DD'`, `'DD MMM YYYY'`) — ignores global format
 *
 * @preferredSyntax Use **object literal** syntax for clarity:
 * ```html
 * {{ date | formatDate : { includeTime: true, use24Hour: true, customFormat: 'YYYY-MM-DD' } }}
 * ```
 *
 * @see GlobalDateFormatService For the actual formatting logic and supported tokens
 * @see formatMapping In GlobalDateFormatService for recognized global format patterns
 */
@Pipe({
  name: 'formatDate',
  standalone: true,
  pure: true
})
export class CustomDatePipe implements PipeTransform {

  private globalDateService = inject(GlobalDateFormatService);

  transform(
    value: Date | string | number | null | undefined,
    includeTimeOrOptions:
      | boolean
      | { includeTime?: boolean; includeSeconds?: boolean; use24Hour?: boolean; customFormat?: string; branchOffset?: boolean }
      = false,
    includeSeconds: boolean = false,
    use24Hour: boolean = false,
    customFormat?: string
  ): string {
    // Support both the positional form ({{ d | formatDate : true }}) and the documented
    // object-literal form ({{ d | formatDate : { includeTime: true, branchOffset: true } }}).
    const options =
      includeTimeOrOptions && typeof includeTimeOrOptions === 'object'
        ? includeTimeOrOptions
        : { includeTime: !!includeTimeOrOptions, includeSeconds, use24Hour, customFormat };
    return this.globalDateService.formatDate(value, options);
  }
}

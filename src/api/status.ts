/**
 * The one conversion every status field needs.
 *
 * Go declares these columns as ints and the DTOs bind them as ints, while the
 * dictionaries that label them (sys_normal_disable, sys_common_status,
 * sys_job_status) key on strings. So a page works in strings, its endpoint
 * works in numbers, and something has to sit between them.
 *
 * That something is each api module, not this file: whether a resource has the
 * split at all is a fact about its endpoints -- the audit logs have no write
 * DTO and so no split. What lives here is only the arithmetic, because the
 * default below is the dictionaries' "normal" value and had been spelled out
 * separately in four modules.
 */

/** The dictionaries' 正常/启用 value, and what a new record starts as. */
export const STATUS_NORMAL = '2'

/** Form value -> wire value. */
export const statusToWire = (status: unknown): number => Number(status)

/** Wire value -> form value. */
export const statusToForm = (status: unknown): string => String(status ?? STATUS_NORMAL)

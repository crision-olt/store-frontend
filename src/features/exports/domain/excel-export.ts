export type ExcelCell = string | number | boolean | null
export type ExcelTable = { headers: string[]; rows: ExcelCell[][] }

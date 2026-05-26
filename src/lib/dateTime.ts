export const BRASILIA_TIME_ZONE = "America/Sao_Paulo";

const dateInputFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BRASILIA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function dateInputInBrasilia(value: Date | string = new Date()) {
  return dateInputFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function formatBrasiliaDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("pt-BR", {
    ...options,
    timeZone: BRASILIA_TIME_ZONE,
  }).format(typeof value === "string" ? new Date(value) : value);
}

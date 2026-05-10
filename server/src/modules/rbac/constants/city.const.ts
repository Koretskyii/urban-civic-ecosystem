export const CITY_ERRORS = {
  NAME_AND_REGION_REQUIRED: 'Назва міста та область є обовʼязковими',
  USER_ID_REQUIRED: 'ID користувача є обовʼязковим',
  TOKEN_NOT_FOUND:
    'Токен не знайдено. Спочатку згенеруйте токен для цього домену.',
  INVALID_TOKEN: 'Невірний токен.',
  DNS_RECORD_NOT_FOUND:
    'DNS TXT запис не знайдено. Переконайтеся, що ви додали запис _urban-civic-verify з правильним токеном і зачекайте поширення DNS (5-10 хвилин).',
  ADMIN_ROLE_NOT_FOUND: 'Admin role not found after city creation',
  CITY_NOT_FOUND: 'Місто не знайдено',
  ALERT_TYPE_NOT_FOUND: 'Alert type not found',

  CITY_ALREADY_EXISTS: (name: string, region: string) =>
    `Міське середовище "${name}" (${region}) вже існує`,
  DOMAIN_ALREADY_REGISTERED: (domain: string) =>
    `Домен "${domain}" вже зареєстрований за іншим містом`,
  DNS_LOOKUP_FAILED: (domain: string) =>
    `Не вдалося перевірити DNS записи для домену ${domain}. Переконайтеся, що TXT запис додано та DNS поширено.`,
} as const;

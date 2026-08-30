export const SETTINGS_TAB_ORDER = [
  "profile",
  "personalizations",
  "categories",
  "tags",
  "recipients",
  "accounts",
  "support",
] as const;

export type SettingsTab = (typeof SETTINGS_TAB_ORDER)[number];

export const DEFAULT_SETTINGS_TAB: SettingsTab = "profile";

export const SETTINGS_TAB_TITLES: Record<SettingsTab, readonly [string, string]> = {
  profile: ["Profile", "Профіль"],
  personalizations: ["Personalizations", "Персоналізація"],
  accounts: ["Accounts", "Рахунки"],
  categories: ["Categories", "Категорії"],
  tags: ["Tags", "Теги"],
  recipients: ["Recipients", "Одержувачі"],
  support: ["Support", "Підтримка"],
};

export const SETTINGS_TAB_DESCRIPTIONS: Record<SettingsTab, readonly [string, string]> = {
  profile: [
    "Your account photo and info",
    "Фото та дані вашого облікового запису",
  ],
  personalizations: [
    "Default currency, theme and language",
    "Валюта, тема інтерфейсу та мова",
  ],
  accounts: [
    "Accounts in the active budget book",
    "Рахунки в активній книзі бюджетування",
  ],
  categories: [
    "Manage expense and income categories",
    "Керування категоріями витрат і доходів",
  ],
  tags: [
    "Additional grouping for transactions",
    "Додаткове групування ваших транзакцій",
  ],
  recipients: [
    "People and companies that receive funds",
    "Особи та компанії, які отримують кошти",
  ],
  support: [
    "Contact the team and give feedback",
    "Зв'язок з командою та зворотній зв'язок",
  ],
};

export function resolveSettingsTab(raw: string | null | undefined): SettingsTab {
  return SETTINGS_TAB_ORDER.includes(raw as SettingsTab)
    ? (raw as SettingsTab)
    : DEFAULT_SETTINGS_TAB;
}

export function getSettingsTabTitle(
  tab: SettingsTab,
  text: (english: string, ukrainian: string) => string,
): string {
  const [english, ukrainian] = SETTINGS_TAB_TITLES[tab];
  return text(english, ukrainian);
}

export function getSettingsTabDescription(
  tab: SettingsTab,
  text: (english: string, ukrainian: string) => string,
): string {
  const [english, ukrainian] = SETTINGS_TAB_DESCRIPTIONS[tab];
  return text(english, ukrainian);
}
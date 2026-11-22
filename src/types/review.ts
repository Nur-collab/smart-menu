// Типы данных для системы сбора отзывов, NPS и интеграции с 2ГИС / Google Maps Бишкека

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export type ReviewSentiment = 'positive' | 'neutral' | 'negative';

export type ExternalReviewPlatform = '2gis' | 'google' | 'yandex';

export interface GuestReview {
  readonly id: string;
  readonly orderId?: string;
  readonly tableNumber: number;
  readonly rating: ReviewRating;
  readonly sentiment: ReviewSentiment;
  readonly tags: readonly string[];
  readonly comment?: string;
  readonly externalPlatform?: ExternalReviewPlatform | null;
  readonly bonusAwarded: number;
  readonly status: 'new' | 'reviewed' | 'resolved';
  readonly createdAt: string;
  readonly managerNotes?: string;
}

export interface ReviewSubmitPayload {
  readonly orderId?: string;
  readonly tableNumber: number;
  readonly rating: ReviewRating;
  readonly tags: readonly string[];
  readonly comment?: string;
  readonly externalPlatform?: ExternalReviewPlatform | null;
}

export interface ReviewStats {
  readonly totalReviews: number;
  readonly averageRating: number;
  readonly ratingCounts: Record<ReviewRating, number>;
  readonly positivePercentage: number;
  readonly externalRedirectsCount: number;
  readonly totalBonusesGiven: number;
  readonly pendingIssuesCount: number;
}

export interface ExternalPlatformConfig {
  readonly id: ExternalReviewPlatform;
  readonly name: string;
  readonly shortName: string;
  readonly icon: string;
  readonly url: string;
  readonly color: string;
  readonly badgeText: string;
}

export const EXTERNAL_PLATFORMS: readonly ExternalPlatformConfig[] = [
  {
    id: '2gis',
    name: '2ГИС Бишкек',
    shortName: '2GIS',
    icon: 'Compass',
    url: 'https://2gis.kg/bishkek/firm/70000001019345678',
    color: '#00A040',
    badgeText: 'Топ-1 в Кыргызстане',
  },
  {
    id: 'google',
    name: 'Google Карты',
    shortName: 'Google',
    icon: 'MapPin',
    url: 'https://maps.google.com/?q=Aura+Specialty+Coffee+Kitchen+Bishkek',
    color: '#4285F4',
    badgeText: 'Для туристов',
  },
  {
    id: 'yandex',
    name: 'Яндекс Карты',
    shortName: 'Яндекс',
    icon: 'Navigation',
    url: 'https://yandex.ru/maps/10309/bishkek/',
    color: '#FC3F1D',
    badgeText: 'Карты Бишкека',
  },
];

export const POSITIVE_FEEDBACK_TAGS: readonly string[] = [
  'Вкусная еда',
  'Быстрая подача',
  'Отличный specialty кофе',
  'Вежливый официант',
  'Уютная атмосфера',
  'Приятная музыка',
  'Красивая подача',
  'Чисто и опрятно',
];

export const CRITICAL_FEEDBACK_TAGS: readonly string[] = [
  'Долгое ожидание блюда',
  'Холодная еда',
  'Невнимательный официант',
  'Громкая музыка в зале',
  'Забыли приборы/салфетки',
  'Блюдо не соответствовало ожиданиям',
];

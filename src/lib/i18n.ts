import type { OrderStatus } from '@/types/menu';

export type Language = 'ru' | 'kg' | 'en';

export interface Translations {
  // Шапка и общие элементы
  readonly tableLabel: string;
  readonly tableNumberPrefix: string;
  readonly callWaiter: string;
  readonly bill: string;
  readonly cart: string;
  readonly emptyCart: string;
  readonly emptyCartSubtitle: string;
  readonly currency: string;
  readonly searchPlaceholder: string;
  readonly allCategories: string;
  readonly nothingFound: string;
  readonly nothingFoundDesc: string;
  readonly backToHall: string;
  readonly clearSearch: string;
  readonly wifiCopied: string;
  readonly wifiPassword: string;
  readonly happyHoursOn: string;
  readonly happyHoursOff: string;
  readonly cashbackNotice: string;

  // Фильтры
  readonly filterAll: string;
  readonly filterHit: string;
  readonly filterChef: string;
  readonly filterNew: string;
  readonly filterDiscount: string;
  readonly filterVegetarian: string;
  readonly filterSpicy: string;

  // Бейджи
  readonly badgeHit: string;
  readonly badgeChef: string;
  readonly badgeVegan: string;
  readonly badgeSpicy: string;
  readonly badgeGlutenFree: string;
  readonly badgeDiscount: string;
  readonly badgeBreakfast: string;

  // Карточка и детали блюда
  readonly cookingTimePrefix: string;
  readonly minutesShort: string;
  readonly kbjuTitle: string;
  readonly caloriesLabel: string;
  readonly proteinsLabel: string;
  readonly fatsLabel: string;
  readonly carbsLabel: string;
  readonly allergensTitle: string;
  readonly optionsTitle: string;
  readonly requiredOption: string;
  readonly commentPlaceholder: string;
  readonly addToCartWithPrice: string;
  readonly addToCart: string;
  readonly inCart: string;
  readonly outOfStock: string;
  readonly close: string;
  readonly perfectPair: string;

  // Погода и Happy Hours
  readonly weatherRecommend: string;
  readonly sunnyWeather: string;
  readonly rainWeather: string;
  readonly coldWeather: string;
  readonly happyHoursBadge: string;
  readonly happyHoursDesc: string;

  // AI Сомелье
  readonly aiSommelierTitle: string;
  readonly aiSommelierSubtitle: string;
  readonly aiSommelierButton: string;
  readonly aiInputPlaceholder: string;
  readonly aiSend: string;
  readonly aiQuickQ1: string;
  readonly aiQuickQ2: string;
  readonly aiQuickQ3: string;
  readonly aiQuickQ4: string;
  readonly aiWelcome: string;
  readonly aiThinking: string;

  // Апсейл в корзине
  readonly upsellTitle: string;
  readonly upsellSubtitle: string;

  // Корзина и оформление заказа
  readonly yourOrder: string;
  readonly itemsCount: string;
  readonly clearCartTitle: string;
  readonly checkoutTitle: string;
  readonly subtotal: string;
  readonly serviceFee: string;
  readonly tipAmount: string;
  readonly bonusDiscount: string;
  readonly total: string;
  readonly submitOrder: string;
  readonly checkoutOrder: string;
  readonly paymentMethodTitle: string;
  readonly cashbackEarn: string;

  // Способы оплаты
  readonly payOnline: string;
  readonly payElqr: string;
  readonly payMbank: string;
  readonly payOdengi: string;
  readonly payCash: string;
  readonly payTerminal: string;
  readonly paySplit: string;

  // Вызов официанта
  readonly waiterCallTitle: string;
  readonly waiterCallSubtitle: string;
  readonly waiterReasonBill: string;
  readonly waiterReasonBillDesc: string;
  readonly waiterReasonHelp: string;
  readonly waiterReasonHelpDesc: string;
  readonly waiterReasonCutlery: string;
  readonly waiterReasonCutleryDesc: string;
  readonly waiterReasonClean: string;
  readonly waiterReasonCleanDesc: string;
  readonly waiterCallSuccess: string;
  readonly waiterCallSuccessDesc: string;

  // Трекер заказа и статусы
  readonly orderCookingBanner: string;
  readonly statusKitchen: string;
  readonly statusAccepted: string;
  readonly statusCooking: string;
  readonly statusReady: string;
  readonly statusServed: string;
  readonly statusPaid: string;
  readonly trackOrder: string;
  readonly orderAccepted: string;
  readonly cookingOrder: string;
  readonly orderReady: string;
  readonly orderServed: string;
  readonly orderReceipt: string;

  // Фискальный чек
  readonly fiscalReceiptTitle: string;
  readonly fiscalSalykNotice: string;
}

export const DICTIONARY: Record<Language, Translations> = {
  ru: {
    tableLabel: 'Столик',
    tableNumberPrefix: 'Столик №',
    callWaiter: 'Официант',
    bill: 'Счет',
    cart: 'Корзина',
    emptyCart: 'Ваша корзина пуста',
    emptyCartSubtitle: 'Выберите вкусные блюда и напитки из меню, чтобы оформить заказ со столика.',
    currency: 'сом',
    searchPlaceholder: 'Поиск блюд, кофе, десертов...',
    allCategories: 'Все категории',
    nothingFound: 'Ничего не найдено',
    nothingFoundDesc: 'Попробуйте изменить поисковый запрос или сбросить фильтры',
    backToHall: 'В зал',
    clearSearch: 'Очистить',
    wifiCopied: 'Скопировано!',
    wifiPassword: 'пароль',
    happyHoursOn: 'Happy Hours 🌙 -20%',
    happyHoursOff: 'Happy Hours: Выкл',
    cashbackNotice: 'кэшбек',

    filterAll: 'Все блюда',
    filterHit: '🔥 Хиты',
    filterChef: 'Шеф ⭐',
    filterNew: '✨ Новинки',
    filterDiscount: '🏷️ Скидки',
    filterVegetarian: '🌱 Веган',
    filterSpicy: '🌶️ Острое',

    badgeHit: 'ХИТ',
    badgeChef: 'Шеф',
    badgeVegan: 'Веган',
    badgeSpicy: 'Острое',
    badgeGlutenFree: 'Без глютена',
    badgeDiscount: 'Скидка',
    badgeBreakfast: 'Завтрак',

    cookingTimePrefix: 'Время подачи',
    minutesShort: 'мин',
    kbjuTitle: 'Пищевая ценность порции',
    caloriesLabel: 'Калории',
    proteinsLabel: 'Белки',
    fatsLabel: 'Жиры',
    carbsLabel: 'Углеводы',
    allergensTitle: 'Аллергены',
    optionsTitle: 'Дополнения и параметры',
    requiredOption: 'Обязательно',
    commentPlaceholder: 'Особые пожелания к блюду (без лука, погорячее...)',
    addToCartWithPrice: 'Добавить в корзину',
    addToCart: 'В корзину',
    inCart: 'В корзине',
    outOfStock: 'Закончилось',
    close: 'Закрыть',
    perfectPair: 'Идеальная пара',

    weatherRecommend: 'Шеф рекомендует к погоде',
    sunnyWeather: 'Солнечно и тепло в Бишкеке — идеальное время для освежающих напитков!',
    rainWeather: 'Дождливо за окном — согрейтесь ароматным кофе и горячими блюдами!',
    coldWeather: 'Свежий горный бриз — рекомендуем согревающий чай с горными травами!',
    happyHoursBadge: 'Happy Hours 🌙 -20%',
    happyHoursDesc: 'Вечерняя скидка 20% на свежую выпечку и десерты!',

    aiSommelierTitle: 'AI-Сомелье Айпери',
    aiSommelierSubtitle: 'Ваш цифровой гастрономический консьерж в AURA',
    aiSommelierButton: 'AI-Гид по меню',
    aiInputPlaceholder: 'Например: что посоветуете к кофе без сахара?',
    aiSend: 'Спросить',
    aiQuickQ1: 'Что взять к кофе? ☕',
    aiQuickQ2: 'Сытное горячее блюдо 🍲',
    aiQuickQ3: 'Без сахара и глютена 🌱',
    aiQuickQ4: 'Традиционное фирменное ⭐',
    aiWelcome: 'Здравствуйте! Я Айпери — ваш умный AI-сомелье. Расскажите, какое у вас настроение или что вы любите, и я подберу идеальные блюда и напитки!',
    aiThinking: 'Айпери подбирает идеальное сочетание...',

    upsellTitle: 'Шеф-повар рекомендует к заказу',
    upsellSubtitle: 'Гармоничные дополнения, которые сделают трапезу идеальной',

    yourOrder: 'Ваш заказ',
    itemsCount: 'поз.',
    clearCartTitle: 'Очистить корзину',
    checkoutTitle: 'Оформление заказа',
    subtotal: 'Сумма блюд',
    serviceFee: 'Обслуживание (15%)',
    tipAmount: 'Чаевые официанту',
    bonusDiscount: 'Списание бонусов',
    total: 'Итого к оплате',
    submitOrder: 'Подтвердить и отправить на кухню',
    checkoutOrder: 'Оформить заказ',
    paymentMethodTitle: 'Способ оплаты',
    cashbackEarn: 'Кэшбек к начислению',

    payOnline: 'Оплатить онлайн (ELQR / MBANK)',
    payElqr: 'Оплата по ELQR НБКР',
    payMbank: 'Оплата через MBANK QR',
    payOdengi: 'Оплата через О!Деньги',
    payCash: 'Наличными официанту',
    payTerminal: 'Банковской картой (POS)',
    paySplit: 'Разделить счет с друзьями',

    waiterCallTitle: 'Сервис заведения',
    waiterCallSubtitle: 'Выберите, чем мы можем вам помочь прямо сейчас:',
    waiterReasonBill: 'Попросить счет',
    waiterReasonBillDesc: 'Официант принесет терминал или сдачу',
    waiterReasonHelp: 'Позвать официанта',
    waiterReasonHelpDesc: 'Нужна помощь по меню или совет',
    waiterReasonCutlery: 'Принести приборы / салфетки',
    waiterReasonCutleryDesc: 'Вилки, ножи, палочки или салфетки',
    waiterReasonClean: 'Убрать со стола',
    waiterReasonCleanDesc: 'Освободить столик от пустой посуды',
    waiterCallSuccess: 'Вызов отправлен!',
    waiterCallSuccessDesc: 'Официант уже спешит к вашему столику',

    orderCookingBanner: 'Готовим заказ',
    statusKitchen: 'На кухне',
    statusAccepted: 'Принят',
    statusCooking: 'Готовится',
    statusReady: 'Готов',
    statusServed: 'Подан',
    statusPaid: 'Оплачен',
    trackOrder: 'Отследить',
    orderAccepted: 'Принят кухней',
    cookingOrder: 'Готовится поваром',
    orderReady: 'Готов к выдаче',
    orderServed: 'Подан гостю',
    orderReceipt: 'Чек ЭККМ',

    fiscalReceiptTitle: 'Электронный фискальный чек ЭККМ',
    fiscalSalykNotice: 'Зарегистрировано в ГНС при МФ КР (Salyk.kg)',
  },

  kg: {
    tableLabel: 'Үстөл',
    tableNumberPrefix: 'Үстөл №',
    callWaiter: 'Официант',
    bill: 'Эсеп',
    cart: 'Себет',
    emptyCart: 'Себетиңиз бош',
    emptyCartSubtitle: 'Буйрутма берүү үчүн менюдан даамдуу тамактарды жана суусундуктарды тандаңыз.',
    currency: 'сом',
    searchPlaceholder: 'Тамактарды, кофени, таттууларды издөө...',
    allCategories: 'Бардык бөлүмдөр',
    nothingFound: 'Эч нерсе табылган жок',
    nothingFoundDesc: 'Издөө сөзүн өзгөртүп же чыпкаларды баштапкы абалга келтириңиз',
    backToHall: 'Залга кайтуу',
    clearSearch: 'Тазалоо',
    wifiCopied: 'Көчүрүлдү!',
    wifiPassword: 'сырсөз',
    happyHoursOn: 'Happy Hours 🌙 -20%',
    happyHoursOff: 'Happy Hours: Өчүк',
    cashbackNotice: 'кэшбек',

    filterAll: 'Бардык тамактар',
    filterHit: '🔥 Хиттер',
    filterChef: 'Шеф ⭐',
    filterNew: '✨ Жаңылыктар',
    filterDiscount: '🏷️ Арзандатуу',
    filterVegetarian: '🌱 Вегетариандык',
    filterSpicy: '🌶️ Ачуу',

    badgeHit: 'ХИТ',
    badgeChef: 'ШЕФ',
    badgeVegan: 'ВЕГАН',
    badgeSpicy: 'АЧУУ',
    badgeGlutenFree: 'Глютенсиз',
    badgeDiscount: 'Арзандатуу',
    badgeBreakfast: 'Эртең мененки',

    cookingTimePrefix: 'Даярдоо убактысы',
    minutesShort: 'мүн',
    kbjuTitle: 'Бир порциянын азыктык баалуулугу',
    caloriesLabel: 'Калория',
    proteinsLabel: 'Белоктор',
    fatsLabel: 'Майлар',
    carbsLabel: 'Көмүртектер',
    allergensTitle: 'Аллергендер',
    optionsTitle: 'Кошумчалар жана параметрлер',
    requiredOption: 'Милдеттүү',
    commentPlaceholder: 'Өзгөчө каалоолор (пиязсыз, өтө ысык...)',
    addToCartWithPrice: 'Себетке кошуу',
    addToCart: 'Себетке кошуу',
    inCart: 'Себетте',
    outOfStock: 'Түгөндү',
    close: 'Жабуу',
    perfectPair: 'Эң сонун айкалыш',

    weatherRecommend: 'Ашпозчу аба ырайына карата сунуштайт',
    sunnyWeather: 'Бишкекте жылуу күн — сергитүүчү суусундуктардын мезгили!',
    rainWeather: 'Жамгырлуу аба ырайы — жыпар жыттуу кофе жана ысык тамактан ырахат алыңыз!',
    coldWeather: 'Тоодон соккон салкын жел — тоо чөптөрүнөн жасалган ысык чай сунуштайбыз!',
    happyHoursBadge: 'Happy Hours 🌙 -20%',
    happyHoursDesc: 'Кечки 20% арзандатуу жаңы бышырылган таттууларга!',

    aiSommelierTitle: 'AI-Сомелье Айпери',
    aiSommelierSubtitle: 'AURA ресторанындагы сиздин жеке санариптик жардамчыңыз',
    aiSommelierButton: 'AI-Меню гиди',
    aiInputPlaceholder: 'Мисалы: кофеге кошуп эмне тандасам болот?',
    aiSend: 'Суроо',
    aiQuickQ1: 'Кофеге эмне алсам болот? ☕',
    aiQuickQ2: 'Тоюмдуу ысык тамак 🍲',
    aiQuickQ3: 'Кантсыз жана глютенсиз 🌱',
    aiQuickQ4: 'Салттуу фирмалык тамак ⭐',
    aiWelcome: 'Саламатсызбы! Мен Айпери — сиздин акылдуу AI-сомельеңизмин. Бүгүн кандай тамак каалайсыз? Мен сиз үчүн эң даамдуусун тандап берем!',
    aiThinking: 'Айпери сизге ылайыктуу тамакты тандоодо...',

    upsellTitle: 'Ашпозчу буйрутмага сунуштайт',
    upsellSubtitle: 'Тамагыңызды толуктоочу эң сонун даамдар',

    yourOrder: 'Сиздин буйрутмаңыз',
    itemsCount: 'даана',
    clearCartTitle: 'Себетти тазалоо',
    checkoutTitle: 'Буйрутманы тариздөө',
    subtotal: 'Тамактардын баасы',
    serviceFee: 'Тейлөө акысы (15%)',
    tipAmount: 'Официант үчүн чайпул',
    bonusDiscount: 'Бонустарды колдонуу',
    total: 'Жалпы төлөм',
    submitOrder: 'Ырастоо жана ашканага жөнөтүү',
    checkoutOrder: 'Буйрутма берүү',
    paymentMethodTitle: 'Төлөө ыкмасы',
    cashbackEarn: 'Кошула турган кэшбек',

    payOnline: 'Онлайн төлөө (ELQR / MBANK)',
    payElqr: 'Улуттук ELQR менен төлөө',
    payMbank: 'MBANK QR аркылуу төлөө',
    payOdengi: 'О!Деньги аркылуу төлөө',
    payCash: 'Официантка накталай төлөө',
    payTerminal: 'Банк картасы менен (POS)',
    paySplit: 'Эсепти достор менен бөлүү',

    waiterCallTitle: 'Тейлөө кызматы',
    waiterCallSubtitle: 'Сизге кандай жардам керек, тандаңыз:',
    waiterReasonBill: 'Эсеп суроо',
    waiterReasonBillDesc: 'Официант терминал же кайтарым акча алып келет',
    waiterReasonHelp: 'Официантты чакыруу',
    waiterReasonHelpDesc: 'Меню боюнча кеңеш же суроолор',
    waiterReasonCutlery: 'Аспаптарды / салфеткаларды алып келүү',
    waiterReasonCutleryDesc: 'Вилка, бычак же нымдуу салфеткалар',
    waiterReasonClean: 'Үстөлдү тазалоо',
    waiterReasonCleanDesc: 'Бош идиштерди алып кетүү',
    waiterCallSuccess: 'Чакыруу жөнөтүлдү!',
    waiterCallSuccessDesc: 'Официант сиздин үстөлүңүзгө келе жатат',

    orderCookingBanner: 'Буйрутма даярдалууда',
    statusKitchen: 'Ашканада',
    statusAccepted: 'Кабыл алынды',
    statusCooking: 'Даярдалууда',
    statusReady: 'Даяр болду',
    statusServed: 'Берилди',
    statusPaid: 'Төлөндү',
    trackOrder: 'Көзөмөлдөө',
    orderAccepted: 'Кабыл алынды',
    cookingOrder: 'Даярдалууда',
    orderReady: 'Даяр болду',
    orderServed: 'Берилди',
    orderReceipt: 'ЭККМ чеги',

    fiscalReceiptTitle: 'Электрондук фискалдык чек ЭККМ',
    fiscalSalykNotice: 'КР МКК Салык кызматында катталган (Salyk.kg)',
  },

  en: {
    tableLabel: 'Table',
    tableNumberPrefix: 'Table #',
    callWaiter: 'Call Waiter',
    bill: 'Bill',
    cart: 'Cart',
    emptyCart: 'Your cart is empty',
    emptyCartSubtitle: 'Choose delicious dishes and drinks from the menu to place an order from your table.',
    currency: 'som',
    searchPlaceholder: 'Search dishes, coffee, desserts...',
    allCategories: 'All Categories',
    nothingFound: 'Nothing found',
    nothingFoundDesc: 'Try changing your search query or clear the active filters',
    backToHall: 'Back to Hall',
    clearSearch: 'Clear',
    wifiCopied: 'Copied!',
    wifiPassword: 'password',
    happyHoursOn: 'Happy Hours 🌙 -20%',
    happyHoursOff: 'Happy Hours: Off',
    cashbackNotice: 'cashback',

    filterAll: 'All Dishes',
    filterHit: '🔥 Popular',
    filterChef: 'Chef ⭐',
    filterNew: '✨ New',
    filterDiscount: '🏷️ Deals',
    filterVegetarian: '🌱 Vegan',
    filterSpicy: '🌶️ Spicy',

    badgeHit: 'HIT',
    badgeChef: 'CHEF',
    badgeVegan: 'VEGAN',
    badgeSpicy: 'SPICY',
    badgeGlutenFree: 'Gluten Free',
    badgeDiscount: 'Sale',
    badgeBreakfast: 'Breakfast',

    cookingTimePrefix: 'Cooking time',
    minutesShort: 'min',
    kbjuTitle: 'Nutritional Value per Serving',
    caloriesLabel: 'Calories',
    proteinsLabel: 'Proteins',
    fatsLabel: 'Fats',
    carbsLabel: 'Carbs',
    allergensTitle: 'Allergens',
    optionsTitle: 'Options & Customizations',
    requiredOption: 'Required',
    commentPlaceholder: 'Special instructions (no onion, extra hot...)',
    addToCartWithPrice: 'Add to Cart',
    addToCart: 'Add to Cart',
    inCart: 'In Cart',
    outOfStock: 'Out of stock',
    close: 'Close',
    perfectPair: 'Perfect pairing',

    weatherRecommend: "Chef's Weather Recommendation",
    sunnyWeather: 'Sunny day in Bishkek — perfect time for refreshing craft lemonades!',
    rainWeather: 'Rainy outside — warm up with our specialty coffee and hearty dishes!',
    coldWeather: 'Fresh mountain breeze — we recommend soothing Issyk-Kul herbal tea!',
    happyHoursBadge: 'Happy Hours 🌙 -20%',
    happyHoursDesc: 'Evening 20% discount on all fresh pastries and desserts!',

    aiSommelierTitle: 'AI Sommelier Aiperi',
    aiSommelierSubtitle: 'Your digital culinary concierge at AURA Bishkek',
    aiSommelierButton: 'AI Menu Guide',
    aiInputPlaceholder: 'E.g.: what pairs best with filter coffee?',
    aiSend: 'Ask',
    aiQuickQ1: 'What pairs with coffee? ☕',
    aiQuickQ2: 'Hearty warm meal 🍲',
    aiQuickQ3: 'Sugar-free & gluten-free 🌱',
    aiQuickQ4: 'Signature local dish ⭐',
    aiWelcome: "Hello! I am Aiperi, your AI sommelier. Tell me your mood or dietary preferences, and I'll find the perfect pairings from our kitchen!",
    aiThinking: 'Aiperi is choosing the best pairings...',

    upsellTitle: 'Chef Recommends to Complete Your Order',
    upsellSubtitle: 'Carefully chosen pairings for an exquisite dining experience',

    yourOrder: 'Your Order',
    itemsCount: 'items',
    clearCartTitle: 'Clear cart',
    checkoutTitle: 'Checkout Order',
    subtotal: 'Items Subtotal',
    serviceFee: 'Service Fee (15%)',
    tipAmount: 'Tip for Waiter',
    bonusDiscount: 'Bonus Discount',
    total: 'Total to Pay',
    submitOrder: 'Confirm & Send to Kitchen',
    checkoutOrder: 'Checkout Order',
    paymentMethodTitle: 'Payment Method',
    cashbackEarn: 'Earned cashback',

    payOnline: 'Pay Online (ELQR / MBANK)',
    payElqr: 'Pay via National ELQR',
    payMbank: 'Pay with MBANK QR',
    payOdengi: 'Pay with O!Dengi',
    payCash: 'Cash to waiter',
    payTerminal: 'Bank card (POS Terminal)',
    paySplit: 'Split bill with friends',

    waiterCallTitle: 'Guest Service',
    waiterCallSubtitle: 'How can our staff assist you right now:',
    waiterReasonBill: 'Request the bill',
    waiterReasonBillDesc: 'Waiter will bring payment terminal or change',
    waiterReasonHelp: 'Call the waiter',
    waiterReasonHelpDesc: 'Need help with menu recommendations',
    waiterReasonCutlery: 'Bring cutlery / napkins',
    waiterReasonCutleryDesc: 'Forks, knives, or extra napkins',
    waiterReasonClean: 'Clear the table',
    waiterReasonCleanDesc: 'Remove empty plates and glassware',
    waiterCallSuccess: 'Request Sent!',
    waiterCallSuccessDesc: 'Your waiter has been notified and is coming',

    orderCookingBanner: 'Cooking your order',
    statusKitchen: 'In kitchen',
    statusAccepted: 'Accepted',
    statusCooking: 'Cooking',
    statusReady: 'Ready',
    statusServed: 'Served',
    statusPaid: 'Paid',
    trackOrder: 'Track Order',
    orderAccepted: 'Accepted',
    cookingOrder: 'Cooking',
    orderReady: 'Ready for pickup',
    orderServed: 'Served',
    orderReceipt: 'Fiscal Receipt',

    fiscalReceiptTitle: 'Electronic Fiscal Receipt (EKKM)',
    fiscalSalykNotice: 'Officially registered with State Tax Service KR (Salyk.kg)',
  },
};

export const LANGUAGE_LABELS: Record<Language, { label: string; flag: string; short: string }> = {
  ru: { label: 'Русский', flag: '🇷🇺', short: 'РУС' },
  kg: { label: 'Кыргызча', flag: '🇰🇬', short: 'КЫР' },
  en: { label: 'English', flag: '🇬🇧', short: 'ENG' },
};

/**
 * Localization Helper Functions with safe fallbacks
 */
export function getLocalizedName(
  item: { name: string; nameKg?: string; nameEn?: string },
  lang: Language
): string {
  if (lang === 'kg' && item.nameKg) return item.nameKg;
  if (lang === 'en' && item.nameEn) return item.nameEn;
  return item.name;
}

export function getLocalizedDescription(
  item: { description: string; descriptionKg?: string; descriptionEn?: string },
  lang: Language
): string {
  if (lang === 'kg' && item.descriptionKg) return item.descriptionKg;
  if (lang === 'en' && item.descriptionEn) return item.descriptionEn;
  return item.description;
}

export function getLocalizedCategoryName(
  category: { name: string; nameKg?: string; nameEn?: string },
  lang: Language
): string {
  if (lang === 'kg' && category.nameKg) return category.nameKg;
  if (lang === 'en' && category.nameEn) return category.nameEn;
  return category.name;
}

export function getLocalizedOptionGroupName(
  group: { title: string; titleKg?: string; titleEn?: string },
  lang: Language
): string {
  if (lang === 'kg' && group.titleKg) return group.titleKg;
  if (lang === 'en' && group.titleEn) return group.titleEn;
  return group.title;
}

export function getLocalizedOptionName(
  option: { name: string; nameKg?: string; nameEn?: string },
  lang: Language
): string {
  if (lang === 'kg' && option.nameKg) return option.nameKg;
  if (lang === 'en' && option.nameEn) return option.nameEn;
  return option.name;
}

export function getLocalizedOrderStatus(status: OrderStatus, lang: Language): string {
  switch (status) {
    case 'cooking':
      return DICTIONARY[lang]?.statusCooking || 'Готовится';
    case 'ready':
      return DICTIONARY[lang]?.statusReady || 'Готов';
    case 'served':
      return DICTIONARY[lang]?.statusServed || 'Подан';
    case 'paid':
      return DICTIONARY[lang]?.statusPaid || 'Оплачен';
    case 'pending':
    case 'accepted':
    default:
      return DICTIONARY[lang]?.statusAccepted || 'Принят';
  }
}

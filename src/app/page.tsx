'use client';

import React from 'react';
import { MenuProvider, useMenu } from '@/context/MenuContext';
import { Header } from '@/components/Header';
import { WeatherBanner } from '@/components/WeatherBanner';
import { CategoryNav } from '@/components/CategoryNav';
import { SearchBar } from '@/components/SearchBar';
import { DishCard } from '@/components/DishCard';
import { DishDetailModal } from '@/components/DishDetailModal';
import { CartDrawer } from '@/components/CartDrawer';
import { WaiterCallModal } from '@/components/WaiterCallModal';
import { SplitBillModal } from '@/components/SplitBillModal';
import { OrderTrackerModal } from '@/components/OrderTrackerModal';
import { AdminPanelModal } from '@/components/AdminPanelModal';
import { PaymentModal } from '@/components/PaymentModal';
import { FiscalReceiptModal } from '@/components/FiscalReceiptModal';
import { FloatingCartBar } from '@/components/FloatingCartBar';
import { AiSommelierModal } from '@/components/AiSommelierModal';
import { FloatingAiSommelierButton } from '@/components/FloatingAiSommelierButton';
import { ReviewModal } from '@/components/ReviewModal';
import { ReviewPromptBanner } from '@/components/ReviewPromptBanner';
import { Utensils, SearchX } from 'lucide-react';
import { getLocalizedCategoryName } from '@/lib/i18n';

function MenuCatalogContent(): React.JSX.Element {
  const {
    items,
    selectedCategory,
    categories,
    searchQuery,
    activeFilter,
    activeModal,
    setActiveModal,
    currentPayingOrderId,
    activeFiscalReceipt,
    openFiscalReceiptModal,
    t,
    language,
  } = useMenu();

  // Фильтрация позиций по мультиязычному поиску, категории и диетическим фильтрам
  const filteredItems = items.filter((item) => {
    // 1. Поиск по тексту на любом из 3 языков (название, описание, аллергены)
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const matchName =
        item.name.toLowerCase().includes(q) ||
        (item.nameKg && item.nameKg.toLowerCase().includes(q)) ||
        (item.nameEn && item.nameEn.toLowerCase().includes(q));
      const matchDesc =
        item.description.toLowerCase().includes(q) ||
        (item.descriptionKg && item.descriptionKg.toLowerCase().includes(q)) ||
        (item.descriptionEn && item.descriptionEn.toLowerCase().includes(q));
      const matchAllergens = item.allergens.some((a) => a.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchAllergens) {
        return false;
      }
    } else {
      // Если поиск не ведется — фильтруем по выбранной категории
      if (item.categoryId !== selectedCategory) {
        return false;
      }
    }

    // 2. Фильтр по бейджам/диете
    if (activeFilter !== null) {
      if (!item.badges.includes(activeFilter)) {
        return false;
      }
    }

    return true;
  });

  const currentCategoryObj = categories.find((c) => c.id === selectedCategory);
  const currentCategoryName = currentCategoryObj
    ? getLocalizedCategoryName(currentCategoryObj, language)
    : '';

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#24211D] flex flex-col font-sans pb-32">
      {/* Шапка меню со статусом столика и кнопками сервиса */}
      <Header />

      {/* Умная рекомендация под текущую погоду */}
      <WeatherBanner />

      {/* Поиск и фильтры по диете */}
      <SearchBar />

      {/* Навигация по категориям (скролл) */}
      <CategoryNav />

      {/* Каталог блюд */}
      <main className="max-w-4xl mx-auto px-4 mt-4 w-full flex-1">
        {searchQuery.trim().length === 0 && currentCategoryObj && (
          <div className="mb-3.5 flex items-center justify-between">
            <h2 className="text-base font-black text-[#24211D] tracking-tight flex items-center gap-2">
              <Utensils className="w-4 h-4 text-[#B86B3E]" />
              <span>{currentCategoryName}</span>
            </h2>
            <span className="text-xs text-[#8C7A6B] font-medium">
              {filteredItems.length} {t('itemsCount')}
            </span>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <SearchX className="w-12 h-12 text-[#C4B8A9] mx-auto" />
            <h3 className="text-base font-bold text-[#24211D]">{t('nothingFound')}</h3>
            <p className="text-xs text-[#7E766D] max-w-sm mx-auto">
              {t('nothingFoundDesc')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <DishCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>

      {/* Плавающая кнопка вызова AI-Сомелье */}
      <FloatingAiSommelierButton />

      {/* Плавающая нижняя панель корзины и трекера */}
      <FloatingCartBar />

      {/* Модальные окна сервиса */}
      <DishDetailModal />
      <CartDrawer />
      <WaiterCallModal />
      <SplitBillModal />
      <OrderTrackerModal />
      <AdminPanelModal />
      <AiSommelierModal />

      {/* Модальные окна эквайринга Кыргызстана и чеков ЭККМ */}
      <PaymentModal
        isOpen={activeModal === 'payment'}
        onClose={() => setActiveModal('tracker')}
        orderId={currentPayingOrderId || ''}
        onPaymentSuccess={(receipt) => {
          if (currentPayingOrderId) {
            openFiscalReceiptModal(currentPayingOrderId, receipt);
          }
        }}
      />
      <FiscalReceiptModal
        isOpen={activeModal === 'fiscal'}
        onClose={() => setActiveModal('tracker')}
        orderId={currentPayingOrderId || ''}
        receiptData={activeFiscalReceipt || undefined}
      />

      {/* Модуль сбора отзывов и продвижения в 2ГИС Бишкека */}
      <ReviewPromptBanner />
      <ReviewModal
        isOpen={activeModal === 'review'}
        onClose={() => setActiveModal(null)}
        orderId={currentPayingOrderId || undefined}
      />
    </div>
  );
}

export default function SmartMenuPage(): React.JSX.Element {
  return (
    <MenuProvider>
      <MenuCatalogContent />
    </MenuProvider>
  );
}

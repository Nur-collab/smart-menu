'use client';

import React, { useState, useMemo } from 'react';
import { useMenu } from '@/context/MenuContext';
import { MenuItem, MenuItemOptionGroup, BadgeType } from '@/types/menu';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Check,
  X,
  Flame,
  Clock,
  Sparkles,
  AlertCircle,
  Layers,
  UtensilsCrossed,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

const COMMON_ALLERGENS = [
  'Глютен',
  'Лактоза',
  'Орехи',
  'Рыба',
  'Морепродукты',
  'Соя',
  'Яйца',
  'Кунжут',
  'Арахис',
];

const AVAILABLE_BADGES: { id: BadgeType; label: string; icon: string }[] = [
  { id: 'hit', label: 'Хит продаж', icon: '🔥' },
  { id: 'chef_choice', label: 'Выбор шефа', icon: '⭐' },
  { id: 'discount', label: 'Скидка', icon: '🏷️' },
  { id: 'breakfast', label: 'Завтрак', icon: '🍳' },
  { id: 'vegan', label: 'Веган', icon: '🌱' },
  { id: 'spicy', label: 'Острое', icon: '🌶️' },
  { id: 'gluten_free', label: 'Без глютена', icon: '🌾' },
];

interface DishFormData {
  id?: string;
  name: string;
  categoryId: string;
  description: string;
  price: string;
  oldPrice: string;
  imageUrl: string;
  weight: string;
  calories: string;
  proteins: string;
  fats: string;
  carbs: string;
  allergens: string[];
  badges: BadgeType[];
  cookingTimeMinutes: string;
  weatherAffinity: string;
  optionGroups: {
    title: string;
    required: boolean;
    multiple: boolean;
    options: { name: string; price: string }[];
  }[];
}

const EMPTY_FORM: DishFormData = {
  name: '',
  categoryId: '',
  description: '',
  price: '',
  oldPrice: '',
  imageUrl: '',
  weight: '250 г',
  calories: '300',
  proteins: '10',
  fats: '12',
  carbs: '30',
  allergens: [],
  badges: [],
  cookingTimeMinutes: '15',
  weatherAffinity: '',
  optionGroups: [],
};

export function MenuManager(): React.JSX.Element {
  const { categories, items, cafeInfo, refreshMenu, stopList, toggleStopList } = useMenu();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<DishFormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [quickPriceId, setQuickPriceId] = useState<string | null>(null);
  const [quickPriceVal, setQuickPriceVal] = useState<string>('');

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.categoryId === selectedCategory;
      const matchesSearch =
        search.trim() === '' ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [items, selectedCategory, search]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      ...EMPTY_FORM,
      categoryId: categories[0]?.id || '',
    });
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      name: item.name,
      categoryId: item.categoryId,
      description: item.description,
      price: String(item.price),
      oldPrice: item.oldPrice ? String(item.oldPrice) : '',
      imageUrl: item.imageUrl,
      weight: item.weight,
      calories: String(item.calories || 0),
      proteins: String(item.proteins || 0),
      fats: String(item.fats || 0),
      carbs: String(item.carbs || 0),
      allergens: [...item.allergens],
      badges: [...item.badges],
      cookingTimeMinutes: String(item.cookingTimeMinutes || 10),
      weatherAffinity: item.weatherAffinity || '',
      optionGroups: (item.optionGroups || []).map((g) => ({
        title: g.title,
        required: g.required,
        multiple: g.multiple,
        options: g.options.map((o) => ({
          name: o.name,
          price: String(o.price),
        })),
      })),
    });
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: MenuItem) => {
    if (!window.confirm(`Вы уверены, что хотите удалить блюдо «${item.name}» из базы Neon?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/menu/${item.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Ошибка удаления');
      }
      setActionSuccess(`Блюдо «${item.name}» удалено`);
      await refreshMenu();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось удалить блюдо');
    }
  };

  const handleQuickPriceSave = async (itemId: string) => {
    const num = Number(quickPriceVal);
    if (isNaN(num) || num <= 0) {
      setActionError('Укажите корректную цену');
      return;
    }

    try {
      const res = await fetch(`/api/menu/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: num }),
      });
      if (!res.ok) throw new Error('Ошибка обновления цены');
      setQuickPriceId(null);
      await refreshMenu();
      setActionSuccess('Цена обновлена');
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Ошибка обновления');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!formData.name.trim()) {
      setActionError('Название блюда обязательно');
      return;
    }
    const priceNum = Number(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setActionError('Укажите положительную цену блюда');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        description: formData.description.trim(),
        price: priceNum,
        oldPrice: formData.oldPrice ? Number(formData.oldPrice) : null,
        imageUrl: formData.imageUrl.trim() || undefined,
        weight: formData.weight.trim(),
        calories: Number(formData.calories) || 0,
        proteins: Number(formData.proteins) || 0,
        fats: Number(formData.fats) || 0,
        carbs: Number(formData.carbs) || 0,
        allergens: formData.allergens,
        badges: formData.badges,
        cookingTimeMinutes: Number(formData.cookingTimeMinutes) || 10,
        weatherAffinity: formData.weatherAffinity || null,
        optionGroups: formData.optionGroups.map((g) => ({
          title: g.title.trim(),
          required: g.required,
          multiple: g.multiple,
          options: g.options.map((o) => ({
            name: o.name.trim(),
            price: Number(o.price) || 0,
          })),
        })),
      };

      const url = editingItem ? `/api/menu/${editingItem.id}` : '/api/menu';
      const method = editingItem ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Ошибка сохранения в базу Neon');
      }

      setIsModalOpen(false);
      setActionSuccess(editingItem ? 'Блюдо обновлено в Neon' : 'Блюдо создано в Neon');
      await refreshMenu();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Ошибка сохранения блюда');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAllergen = (all: string) => {
    setFormData((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(all)
        ? prev.allergens.filter((a) => a !== all)
        : [...prev.allergens, all],
    }));
  };

  const toggleBadge = (badge: BadgeType) => {
    setFormData((prev) => ({
      ...prev,
      badges: prev.badges.includes(badge)
        ? prev.badges.filter((b) => b !== badge)
        : [...prev.badges, badge],
    }));
  };

  const addOptionGroup = () => {
    setFormData((prev) => ({
      ...prev,
      optionGroups: [
        ...prev.optionGroups,
        {
          title: 'Дополнительно',
          required: false,
          multiple: true,
          options: [{ name: 'Опция', price: '50' }],
        },
      ],
    }));
  };

  const removeOptionGroup = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      optionGroups: prev.optionGroups.filter((_, i) => i !== idx),
    }));
  };

  const addOptionItem = (groupIdx: number) => {
    setFormData((prev) => {
      const copy = [...prev.optionGroups];
      copy[groupIdx] = {
        ...copy[groupIdx],
        options: [...copy[groupIdx].options, { name: '', price: '0' }],
      };
      return { ...prev, optionGroups: copy };
    });
  };

  const removeOptionItem = (groupIdx: number, optIdx: number) => {
    setFormData((prev) => {
      const copy = [...prev.optionGroups];
      copy[groupIdx] = {
        ...copy[groupIdx],
        options: copy[groupIdx].options.filter((_, i) => i !== optIdx),
      };
      return { ...prev, optionGroups: copy };
    });
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-400 text-sm animate-in fade-in">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-rose-400 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию или составу..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/80"
            />
          </div>
          <button
            onClick={() => refreshMenu()}
            title="Обновить из Neon"
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-zinc-400 hidden sm:block">
            Всего позиций: <span className="font-semibold text-zinc-200">{items.length}</span>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-semibold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить блюдо</span>
          </button>
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${
            selectedCategory === 'all'
              ? 'bg-amber-500 text-zinc-950 font-semibold shadow-md shadow-amber-500/20'
              : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          Все категории ({items.length})
        </button>
        {categories.map((cat) => {
          const count = items.filter((i) => i.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-zinc-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Dishes Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
          <UtensilsCrossed className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-zinc-300 font-medium">Блюда не найдены</h3>
          <p className="text-xs text-zinc-500 mt-1">Попробуйте изменить поисковый запрос или категорию</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const inStopList = stopList.has(item.id);
            const category = categories.find((c) => c.id === item.categoryId);

            return (
              <div
                key={item.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-4 transition ${
                  inStopList
                    ? 'bg-zinc-950/40 border-rose-900/30 opacity-70'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700/80'
                }`}
              >
                <div>
                  {/* Image and Header */}
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 border border-zinc-700/50">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <UtensilsCrossed className="w-6 h-6" />
                        </div>
                      )}
                      {inStopList && (
                        <div className="absolute inset-0 bg-rose-950/80 backdrop-blur-[1px] flex items-center justify-center text-[10px] font-bold text-rose-300 uppercase">
                          Стоп
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                          {category?.name || 'Меню'}
                        </span>
                        {item.weight && (
                          <span className="text-[10px] text-zinc-500">{item.weight}</span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-zinc-100 truncate">{item.name}</h4>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Badges & Metrics */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {item.calories > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-md">
                        <Flame className="w-3 h-3 text-amber-500/80" />
                        {item.calories} ккал
                      </span>
                    )}
                    {item.cookingTimeMinutes > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-sky-400/80" />
                        {item.cookingTimeMinutes} мин
                      </span>
                    )}
                    {item.badges.slice(0, 2).map((b) => (
                      <span
                        key={b}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      >
                        {AVAILABLE_BADGES.find((ab) => ab.id === b)?.label || b}
                      </span>
                    ))}
                    {item.optionGroups && item.optionGroups.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                        +{item.optionGroups.length} опц.
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Bar: Price & Controls */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {quickPriceId === item.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={quickPriceVal}
                          onChange={(e) => setQuickPriceVal(e.target.value)}
                          className="w-20 px-2 py-1 bg-zinc-800 border border-amber-500/80 rounded-lg text-xs text-zinc-100 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleQuickPriceSave(item.id)}
                          className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-500"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setQuickPriceId(null)}
                          className="p-1 bg-zinc-800 text-zinc-400 rounded-md hover:bg-zinc-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setQuickPriceId(item.id);
                          setQuickPriceVal(String(item.price));
                        }}
                        className="group flex items-center gap-1.5 hover:text-amber-400 transition"
                        title="Нажмите для быстрого изменения цены"
                      >
                        <span className="text-base font-bold text-zinc-100 group-hover:text-amber-400">
                          {item.price} {cafeInfo.currency}
                        </span>
                        {item.oldPrice && (
                          <span className="text-xs text-zinc-500 line-through">
                            {item.oldPrice}
                          </span>
                        )}
                        <Pencil className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleStopList(item.id)}
                      title={inStopList ? 'Убрать из стоп-листа' : 'Поместить в стоп-лист'}
                      className={`p-2 rounded-xl transition ${
                        inStopList
                          ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {inStopList ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      title="Редактировать всё"
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      title="Удалить позицию"
                      className="p-2 rounded-xl bg-zinc-800/80 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">
                    {editingItem ? 'Редактирование блюда' : 'Новое блюдо в меню'}
                  </h3>
                  <p className="text-xs text-zinc-400">Данные сохраняются в облачный Neon PostgreSQL</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-200 rounded-xl hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Section 1: Base Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Основная информация
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Название блюда *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Например, Латте Халва & Фисташка"
                      className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Категория меню *
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Описание и состав
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Подробный состав, подача, вкусовые акценты..."
                    className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Цена ({cafeInfo.currency}) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="380"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Старая цена
                    </label>
                    <input
                      type="number"
                      value={formData.oldPrice}
                      onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })}
                      placeholder="450"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Выход / Порция
                    </label>
                    <input
                      type="text"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="300 г"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Готовка (мин)
                    </label>
                    <input
                      type="number"
                      value={formData.cookingTimeMinutes}
                      onChange={(e) => setFormData({ ...formData, cookingTimeMinutes: e.target.value })}
                      placeholder="15"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Media URL */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <label className="block text-xs font-medium text-zinc-300">
                  URL фотографии блюда
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                  {formData.imageUrl && (
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: КБЖУ */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  Пищевая ценность (КБЖУ)
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Калории (ккал)</label>
                    <input
                      type="number"
                      value={formData.calories}
                      onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Белки (г)</label>
                    <input
                      type="number"
                      value={formData.proteins}
                      onChange={(e) => setFormData({ ...formData, proteins: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Жиры (г)</label>
                    <input
                      type="number"
                      value={formData.fats}
                      onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Углеводы (г)</label>
                    <input
                      type="number"
                      value={formData.carbs}
                      onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Allergens & Badges */}
              <div className="space-y-4 pt-3 border-t border-zinc-800">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-2">
                    Маркетинговые бейджи
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_BADGES.map((b) => {
                      const isSelected = formData.badges.includes(b.id);
                      return (
                        <button
                          type="button"
                          key={b.id}
                          onClick={() => toggleBadge(b.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                            isSelected
                              ? 'bg-amber-500 text-zinc-950 font-semibold'
                              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700'
                          }`}
                        >
                          <span>{b.icon}</span>
                          <span>{b.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-2">
                    Аллергены в составе
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_ALLERGENS.map((all) => {
                      const isSelected = formData.allergens.includes(all);
                      return (
                        <button
                          type="button"
                          key={all}
                          onClick={() => toggleAllergen(all)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                            isSelected
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300 border border-zinc-700'
                          }`}
                        >
                          {all}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 5: Option Groups / Modifiers */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    Группы опций и модификаторы
                  </h4>
                  <button
                    type="button"
                    onClick={addOptionGroup}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Добавить группу</span>
                  </button>
                </div>

                {formData.optionGroups.map((grp, gIdx) => (
                  <div key={gIdx} className="p-3.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        value={grp.title}
                        onChange={(e) => {
                          const copy = [...formData.optionGroups];
                          copy[gIdx].title = e.target.value;
                          setFormData({ ...formData, optionGroups: copy });
                        }}
                        placeholder="Название группы (напр. Молоко)"
                        className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 flex-1 focus:outline-none"
                      />
                      <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={grp.required}
                          onChange={(e) => {
                            const copy = [...formData.optionGroups];
                            copy[gIdx].required = e.target.checked;
                            setFormData({ ...formData, optionGroups: copy });
                          }}
                          className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-0"
                        />
                        Обязательно
                      </label>
                      <button
                        type="button"
                        onClick={() => removeOptionGroup(gIdx)}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Options list inside group */}
                    <div className="space-y-2 pl-2 border-l-2 border-zinc-700">
                      {grp.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt.name}
                            onChange={(e) => {
                              const copy = [...formData.optionGroups];
                              copy[gIdx].options[oIdx].name = e.target.value;
                              setFormData({ ...formData, optionGroups: copy });
                            }}
                            placeholder="Опция (напр. Овсяное)"
                            className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 flex-1"
                          />
                          <input
                            type="number"
                            value={opt.price}
                            onChange={(e) => {
                              const copy = [...formData.optionGroups];
                              copy[gIdx].options[oIdx].price = e.target.value;
                              setFormData({ ...formData, optionGroups: copy });
                            }}
                            placeholder="+Цена"
                            className="w-20 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100"
                          />
                          <button
                            type="button"
                            onClick={() => removeOptionItem(gIdx, oIdx)}
                            className="text-zinc-500 hover:text-rose-400 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOptionItem(gIdx)}
                        className="text-[11px] text-zinc-400 hover:text-amber-400 flex items-center gap-1 mt-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Добавить вариант</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-semibold rounded-xl text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Сохранение в Neon...' : editingItem ? 'Сохранить изменения' : 'Создать блюдо'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

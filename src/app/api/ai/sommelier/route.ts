import { NextRequest, NextResponse } from 'next/server';
import { MENU_ITEMS } from '@/data/mockData';
import { MenuItem } from '@/types/menu';
import { AiRecommendRequest, AiRecommendResponse } from '@/types/ai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as AiRecommendRequest;
    const { message = '', cartItemIds = [], language = 'ru' } = body;

    const lowerQuery = message.toLowerCase().trim();

    // Алгоритм семантического подбора блюд
    let matchedDishes: MenuItem[] = [];
    let reasoning = '';
    let quickPrompts: string[] = [];

    const isCoffeeQuery =
      lowerQuery.includes('кофе') ||
      lowerQuery.includes('coffee') ||
      lowerQuery.includes('чай') ||
      lowerQuery.includes('tea') ||
      lowerQuery.includes('напиток') ||
      lowerQuery.includes('латте') ||
      lowerQuery.includes('латтэ');

    const isDessertQuery =
      lowerQuery.includes('сладк') ||
      lowerQuery.includes('десерт') ||
      lowerQuery.includes('выпечк') ||
      lowerQuery.includes('sweet') ||
      lowerQuery.includes('dessert') ||
      lowerQuery.includes('чизкейк') ||
      lowerQuery.includes('сырник') ||
      lowerQuery.includes('таттуу');

    const isHeartyMainsQuery =
      lowerQuery.includes('сытн') ||
      lowerQuery.includes('горяч') ||
      lowerQuery.includes('обед') ||
      lowerQuery.includes('ужин') ||
      lowerQuery.includes('мяс') ||
      lowerQuery.includes('плов') ||
      lowerQuery.includes('суп') ||
      lowerQuery.includes('паст') ||
      lowerQuery.includes('том ям') ||
      lowerQuery.includes('hearty') ||
      lowerQuery.includes('dinner') ||
      lowerQuery.includes('ысык') ||
      lowerQuery.includes('тойумдуу');

    const isVeganDietQuery =
      lowerQuery.includes('веган') ||
      lowerQuery.includes('постн') ||
      lowerQuery.includes('без сахара') ||
      lowerQuery.includes('глютен') ||
      lowerQuery.includes('зож') ||
      lowerQuery.includes('легк') ||
      lowerQuery.includes('боул') ||
      lowerQuery.includes('vegan') ||
      lowerQuery.includes('healthy') ||
      lowerQuery.includes('diet');

    const isBreakfastQuery =
      lowerQuery.includes('завтрак') ||
      lowerQuery.includes('утро') ||
      lowerQuery.includes('яйц') ||
      lowerQuery.includes('бенедикт') ||
      lowerQuery.includes('breakfast') ||
      lowerQuery.includes('эртең');

    if (isVeganDietQuery) {
      matchedDishes = MENU_ITEMS.filter((item) =>
        item.badges.includes('vegan') || item.badges.includes('gluten_free') || item.id === 'item-7'
      );
      if (language === 'kg') {
        reasoning =
          'Сиз үчүн эң сонун тандоо — жаңы авокадо, киноа жана эдамаме кошулган Зеленый Боул! Ал жеңил, пайдалуу жана глютенсиз.';
        quickPrompts = ['Кофе кошуу ☕', 'Кантсыз десерт 🌱', 'Рахмат!'];
      } else if (language === 'en') {
        reasoning =
          'For a light and balanced meal, I recommend our Green Quinoa & Avocado Bowl. It is fully vegan, gluten-free, and rich in natural nutrients.';
        quickPrompts = ['Add Flat White ☕', 'Sugar-free dessert 🌱', 'Thank you!'];
      } else {
        reasoning =
          'Для легкого и здорового приема пищи идеален наш Зеленый Боул с киноа, авокадо и эдамаме. Он богат белком, не содержит глютена и дарит заряд чистой энергии!';
        quickPrompts = ['Добавить кофе ☕', 'Десерт без сахара 🌱', 'Спасибо, беру!'];
      }
    } else if (isDessertQuery || (isCoffeeQuery && lowerQuery.includes('к кофе'))) {
      matchedDishes = MENU_ITEMS.filter(
        (item) => item.categoryId === 'cat-desserts' || item.id === 'item-8' || item.id === 'item-4'
      );
      if (language === 'kg') {
        reasoning =
          'Биздин кондитерлердин шедеври — Баск чизкейки Сан-Себастьян! Анын жумшак каймактуу даамы кофе менен укмуштуудай айкалышат.';
        quickPrompts = ['Флэт Уайт кошуу ☕', 'Сырниктер тууралуу айтып бериңиз 🥞', 'Рахмат!'];
      } else if (language === 'en') {
        reasoning =
          'Our signature San Sebastian Basque Cheesecake with a caramelized crust and melting cream center pairs exquisitely with our Ethiopian roast coffee!';
        quickPrompts = ['Add Flat White ☕', 'Tell me about Syrniki 🥞', 'Sounds delicious!'];
      } else {
        reasoning =
          'Настоящая гордость нашей кондитерской — Баскский чизкейк Сан-Себастьян с нежнейшей сливочной сердцевиной и соленой карамелью. Идеальная пара к чашке флэт уайта!';
        quickPrompts = ['Добавить Флэт Уайт ☕', 'А что насчет сырников? 🥞', 'Беру, спасибо!'];
      }
    } else if (isHeartyMainsQuery) {
      matchedDishes = MENU_ITEMS.filter(
        (item) => item.categoryId === 'cat-mains' && (item.id === 'item-5' || item.id === 'item-6')
      );
      if (language === 'kg') {
        reasoning =
          'Тоюмдуу тамактануу үчүн Том Ям шорпосун чоң креветкалар менен же трюфель соусу кошулган колго жасалган пастаны сунуштайм!';
        quickPrompts = ['Ачуу эмеспи? 🌶️', 'Таттуу кошуу 🍰', 'Рахмат!'];
      } else if (language === 'en') {
        reasoning =
          'For a rich hot lunch or dinner, I highly recommend our Tom Yum with Tiger Prawns or the artisanal Tagliatelle with wild mushrooms and truffle cream.';
        quickPrompts = ['Is it spicy? 🌶️', 'Dessert pairings 🍰', 'Add to cart!'];
      } else {
        reasoning =
          'Для насыщенного обеда рекомендую наш пикантный Том Ям с тигровыми креветками или пасту ручной лепки с белыми грибами и трюфельным кремом от шефа!';
        quickPrompts = ['Насколько острый Том Ям? 🌶️', 'Что взять на десерт? 🍰', 'Отлично, спасибо!'];
      }
    } else if (isBreakfastQuery) {
      matchedDishes = MENU_ITEMS.filter(
        (item) => item.categoryId === 'cat-breakfast' || item.id === 'item-2' || item.id === 'item-4'
      );
      if (language === 'kg') {
        reasoning =
          'Күндү сонун баштоо үчүн Ысык-Көл форели кошулган Бенедикт же тоо малинасы менен назик сырниктер эң жакшы чечим!';
        quickPrompts = ['Кофе кошуу ☕', 'Айпери, дагы эмне сунуштайсыз? ⭐'];
      } else if (language === 'en') {
        reasoning =
          'Breakfast is served all day! Our Salmon Benedict on warm brioche with poached eggs or organic cottage cheese Syrniki will brighten your day.';
        quickPrompts = ['Add Specialty Coffee ☕', 'More recommendations ⭐'];
      } else {
        reasoning =
          'Завтраки у нас подаются весь день! Рекомендую яйца Бенедикт со слабосоленой иссык-кульской форелью на хрустящей бриоши или сырники с горной малиной.';
        quickPrompts = ['Добавить Specialty кофе ☕', 'Покажи все меню ⭐'];
      }
    } else if (isCoffeeQuery) {
      matchedDishes = MENU_ITEMS.filter(
        (item) => item.categoryId === 'cat-coffee' || item.categoryId === 'cat-seasonal'
      );
      if (language === 'kg') {
        reasoning =
          'Эфиопия Иргачеффе дандарынан жасалган Флэт Уайт же жыпар жыттуу ашкабак латтесин сунуштайм!';
        quickPrompts = ['Таттуу кошуу 🍰', 'Сулу сүтү менен болобу? 🥛'];
      } else if (language === 'en') {
        reasoning =
          'Enjoy our double-shot Flat White with velvety microfoam, or try our seasonal Spiced Pumpkin Latte with natural spices.';
        quickPrompts = ['Add pastry 🍰', 'Oat milk options? 🥛'];
      } else {
        reasoning =
          'Попробуйте наш Флэт Уайт на зерне свежей обжарки Эфиопия Иргачеффе со сладковатой микропенкой фермерского молока, либо согревающий Пряный Тыквенный Латте!';
        quickPrompts = ['Что взять к кофе? 🍰', 'Есть растительное молоко? 🥛'];
      }
    } else {
      // Универсальный совет с хитами заведения
      matchedDishes = MENU_ITEMS.filter((item) => item.badges.includes('hit')).slice(0, 3);
      if (language === 'kg') {
        reasoning =
          'Биздин коноктор эң көп жактырган популярдуу тамактар: Иссык-Көл форели кошулган Бенедикт, жыпар жыттуу кофе жана Баск чизкейки!';
        quickPrompts = ['Тоюмдуу ысык тамак 🍲', 'Кофе жана десерт ☕', 'Веган меню 🌱'];
      } else if (language === 'en') {
        reasoning =
          'Here are our guests most-loved hits in Bishkek: Salmon Benedict on brioche, specialty Flat White, and our Basque Cheesecake!';
        quickPrompts = ['Hearty lunch 🍲', 'Coffee & sweets ☕', 'Vegan options 🌱'];
      } else {
        reasoning =
          'Рада помочь с выбором! Главные бестселлеры нашего заведения: Бенедикт с иссык-кульской форелью, Флэт Уайт на авторском зерне и знаменитый Баскский чизкейк.';
        quickPrompts = ['Сытное горячее блюдо 🍲', 'Что-то к кофе ☕', 'Здоровое питание 🌱'];
      }
    }

    // Приоритетно рекомендуем те блюда, которых еще нет в корзине гостя
    const cartSet = new Set(cartItemIds);
    const notInCartDishes = matchedDishes.filter((dish) => !cartSet.has(dish.id));
    const finalDishes = notInCartDishes.length > 0 ? notInCartDishes : matchedDishes;

    if (finalDishes.length === 0) {
      matchedDishes = MENU_ITEMS.slice(0, 2);
    } else {
      matchedDishes = finalDishes;
    }

    const responsePayload: AiRecommendResponse = {
      success: true,
      reply: reasoning,
      recommendedItems: matchedDishes.slice(0, 3),
      quickPrompts,
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка обработки AI-запроса';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

import { Order } from '@/types/menu';
import { PrinterConfig } from '@/types/pos';

/**
 * Константы бинарных команд протокола ESC/POS (Epson / Star / Xprinter)
 */
export const ESC_POS_COMMANDS = {
  // Инициализация принтера
  INIT: Buffer.from([0x1b, 0x40]),
  // Выравнивание текста
  ALIGN_LEFT: Buffer.from([0x1b, 0x61, 0x00]),
  ALIGN_CENTER: Buffer.from([0x1b, 0x61, 0x01]),
  ALIGN_RIGHT: Buffer.from([0x1b, 0x61, 0x02]),
  // Жирный шрифт
  BOLD_ON: Buffer.from([0x1b, 0x45, 0x01]),
  BOLD_OFF: Buffer.from([0x1b, 0x45, 0x00]),
  // Размер шрифта: нормальный
  FONT_NORMAL: Buffer.from([0x1d, 0x21, 0x00]),
  // Размер шрифта: двойная ширина и высота (для стола и важных заголовков)
  FONT_DOUBLE: Buffer.from([0x1d, 0x21, 0x11]),
  // Размер шрифта: увеличенная высота
  FONT_TALL: Buffer.from([0x1d, 0x21, 0x01]),
  // Звуковой зуммер принтера (двойной звонок кухни)
  BEEPER: Buffer.from([0x1b, 0x42, 0x02, 0x02]),
  // Прогон ленты (3 строки)
  FEED_3: Buffer.from([0x1b, 0x64, 0x03]),
  // Автоотрезка бумаги (GS V 66 3)
  CUT_PAPER: Buffer.from([0x1d, 0x56, 0x42, 0x03]),
};

/**
 * Генерация бинарного ESC/POS буфера для сетевого термопринтера кухни
 */
export function generateEscPosBuffer({
  order,
  printer,
  cafeName = 'AURA SMART CAFE BISHKEK',
}: {
  readonly order: Order;
  readonly printer?: PrinterConfig;
  readonly cafeName?: string;
}): Buffer {
  const chunks: Buffer[] = [];

  const addText = (text: string): void => {
    // Кодируем в UTF-8 или CP866/Windows-1251 для кириллицы
    chunks.push(Buffer.from(text, 'utf-8'));
  };

  const addLine = (text: string = ''): void => {
    addText(`${text}\n`);
  };

  // 1. Инициализация и звонок зуммера для кухни
  chunks.push(ESC_POS_COMMANDS.INIT);
  chunks.push(ESC_POS_COMMANDS.BEEPER);

  // 2. Шапка чека (Центрирование)
  chunks.push(ESC_POS_COMMANDS.ALIGN_CENTER);
  chunks.push(ESC_POS_COMMANDS.BOLD_ON);
  addLine(cafeName);
  chunks.push(ESC_POS_COMMANDS.BOLD_OFF);
  addLine('*** КУХОННЫЙ ЧЕК-БЕГУНОК ***');
  addLine(new Date(order.createdAt).toLocaleString('ru-RU'));

  // 3. Выделение столика крупным шрифтом
  const widthChars = printer?.paperWidth === '58mm' ? 32 : 42;
  const divider = '='.repeat(widthChars);
  const thinDivider = '-'.repeat(widthChars);

  addLine(divider);
  chunks.push(ESC_POS_COMMANDS.FONT_DOUBLE);
  chunks.push(ESC_POS_COMMANDS.BOLD_ON);
  addLine(`СТОЛ №${order.tableNumber}`);
  chunks.push(ESC_POS_COMMANDS.FONT_NORMAL);
  chunks.push(ESC_POS_COMMANDS.BOLD_OFF);
  addLine(`Заказ: #${order.id}`);
  addLine(divider);

  // 4. Список блюд и модификаторов
  chunks.push(ESC_POS_COMMANDS.ALIGN_LEFT);
  order.items.forEach((item, index) => {
    chunks.push(ESC_POS_COMMANDS.BOLD_ON);
    const itemName = item.menuItem.name || 'Позиция';
    addLine(`${index + 1}. [${item.quantity} шт.] ${itemName}`);
    chunks.push(ESC_POS_COMMANDS.BOLD_OFF);

    // Выбранные опции / модификаторы
    if (item.selectedOptions && item.selectedOptions.length > 0) {
      item.selectedOptions.forEach((opt) => {
        const prefix = opt.groupTitle ? `${opt.groupTitle}: ` : '';
        addLine(`   * ${prefix}${opt.optionName}`);
      });
    }

    // Персональный комментарий к позиции
    if (item.comment) {
      addLine(`   ! Примечание: «${item.comment}»`);
    }

    addLine(thinDivider);
  });

  // 5. Комментарий гостя ко всему заказу (крупным шрифтом)
  if (order.guestComment) {
    chunks.push(ESC_POS_COMMANDS.BOLD_ON);
    addLine(`ОБЩЕЕ ПРИМЕЧАНИЕ ГОСТЯ:`);
    chunks.push(ESC_POS_COMMANDS.FONT_TALL);
    addLine(`«${order.guestComment}»`);
    chunks.push(ESC_POS_COMMANDS.FONT_NORMAL);
    chunks.push(ESC_POS_COMMANDS.BOLD_OFF);
    addLine(divider);
  }

  // 6. Подвал и статус оплаты
  chunks.push(ESC_POS_COMMANDS.ALIGN_RIGHT);
  addLine(`Итого позиций: ${order.items.reduce((acc, i) => acc + i.quantity, 0)} шт.`);
  addLine(`Сумма: ${order.finalAmount} сом`);

  const paymentStatusText =
    order.status === 'paid'
      ? `[ОПЛАЧЕНО ОНЛАЙН (${order.paymentMethod.toUpperCase()})]`
      : `[ОПЛАТА: ${order.paymentMethod.toUpperCase()} (НЕ ОПЛАЧЕН)]`;

  chunks.push(ESC_POS_COMMANDS.BOLD_ON);
  addLine(paymentStatusText);
  chunks.push(ESC_POS_COMMANDS.BOLD_OFF);

  // 7. Прогон ленты и автоотрезка (если включена)
  chunks.push(ESC_POS_COMMANDS.FEED_3);
  if (!printer || printer.autoCut) {
    chunks.push(ESC_POS_COMMANDS.CUT_PAPER);
  }

  return Buffer.concat(chunks);
}

/**
 * Генерация текстового макета (ASCII) чека-бегунка для предпросмотра в панели управления
 */
export function generateTextTicketPreview({
  order,
  cafeName = 'AURA SMART CAFE BISHKEK',
}: {
  readonly order: Order;
  readonly cafeName?: string;
}): string {
  const line = '==========================================';
  const dash = '------------------------------------------';
  const now = new Date(order.createdAt).toLocaleTimeString('ru-RU');

  let text = '';
  text += `${line}\n`;
  text += `          ${cafeName}\n`;
  text += `        *** ЧЕК-БЕГУНОК КУХНИ ***\n`;
  text += `             ${now}\n`;
  text += `${line}\n`;
  text += `>>>>> СТОЛИК №${order.tableNumber} <<<<<\n`;
  text += `Номер чека: #${order.id}\n`;
  text += `${line}\n`;

  order.items.forEach((item, idx) => {
    const itemName = item.menuItem.name || 'Позиция';
    text += `${idx + 1}. [${item.quantity}x] ${itemName}\n`;
    if (item.selectedOptions && item.selectedOptions.length > 0) {
      item.selectedOptions.forEach((opt) => {
        const prefix = opt.groupTitle ? `${opt.groupTitle}: ` : '';
        text += `   * ${prefix}${opt.optionName}\n`;
      });
    }
    if (item.comment) {
      text += `   ! «${item.comment}»\n`;
    }
    text += `${dash}\n`;
  });

  if (order.guestComment) {
    text += `ПРИМЕЧАНИЕ ГОСТЯ: «${order.guestComment}»\n`;
    text += `${line}\n`;
  }

  text += `ИТОГО: ${order.finalAmount} сом\n`;
  text += `СТАТУС: ${order.status === 'paid' ? 'ОПЛАЧЕНО ОНЛАЙН ✓' : 'ОЖИДАЕТ ОПЛАТЫ'}\n`;
  text += `${line}\n`;
  text += `              [ОТРЕЗКА ЛЕНТЫ]\n`;

  return text;
}

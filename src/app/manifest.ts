import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Aura Coffee & Kitchen — Smart Menu Bishkek',
    short_name: 'Smart Menu',
    description: 'Умное цифровое меню для кафе в Бишкеке: заказы со столика, оффлайн-кэш, AI-сомелье и оплата ELQR',
    start_url: '/?source=pwa',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#FBF9F5',
    theme_color: '#B45309',
    categories: ['food', 'shopping', 'lifestyle'],
    lang: 'ru',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    shortcuts: [
      {
        name: 'Открыть меню столика',
        short_name: 'Меню',
        description: 'Просмотр блюд и напитков',
        url: '/?table=4',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Вызов официанта',
        short_name: 'Официант',
        description: 'Быстрый вызов персонала к столику',
        url: '/?action=waiter',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}

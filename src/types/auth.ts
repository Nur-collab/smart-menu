export type StaffRole = 'waiter' | 'kitchen' | 'manager';

export interface StaffMember {
  readonly id: string;
  readonly name: string;
  readonly role: StaffRole;
  readonly roleTitle: string;
  readonly pinCode: string;
  readonly avatarInitial: string;
}

export interface StaffSession {
  readonly member: StaffMember;
  readonly loggedInAt: string;
}

export interface StaffPermissions {
  readonly canViewKds: boolean;
  readonly canCookOrders: boolean;
  readonly canServeOrders: boolean;
  readonly canManageStopList: boolean;
  readonly canManageMenu: boolean;
  readonly canHandleCalls: boolean;
  readonly canViewAnalytics: boolean;
  readonly canGenerateQr: boolean;
  readonly canManageReviews: boolean;
}

export const STAFF_MEMBERS: readonly StaffMember[] = [
  {
    id: 'staff-waiter-1',
    name: 'Айбек Садыков',
    role: 'waiter',
    roleTitle: 'Официант зала',
    pinCode: '1111',
    avatarInitial: 'А',
  },
  {
    id: 'staff-kitchen-1',
    name: 'Бакыт Токтогулов',
    role: 'kitchen',
    roleTitle: 'Шеф-повар',
    pinCode: '2222',
    avatarInitial: 'Б',
  },
  {
    id: 'staff-manager-1',
    name: 'Нурлан Асанов',
    role: 'manager',
    roleTitle: 'Управляющий заведением',
    pinCode: '9999',
    avatarInitial: 'Н',
  },
];

/**
 * Получить права доступа для роли сотрудника
 */
export function getPermissionsByRole(role: StaffRole): StaffPermissions {
  switch (role) {
    case 'waiter':
      return {
        canViewKds: true,
        canCookOrders: false,
        canServeOrders: true,
        canManageStopList: false,
        canManageMenu: false,
        canHandleCalls: true,
        canViewAnalytics: false,
        canGenerateQr: false,
        canManageReviews: true,
      };
    case 'kitchen':
      return {
        canViewKds: true,
        canCookOrders: true,
        canServeOrders: false,
        canManageStopList: true,
        canManageMenu: true,
        canHandleCalls: false,
        canViewAnalytics: false,
        canGenerateQr: false,
        canManageReviews: false,
      };
    case 'manager':
      return {
        canViewKds: true,
        canCookOrders: true,
        canServeOrders: true,
        canManageStopList: true,
        canManageMenu: true,
        canHandleCalls: true,
        canViewAnalytics: true,
        canGenerateQr: true,
        canManageReviews: true,
      };
  }
}

/**
 * Валидация введенного PIN-кода сотрудника
 */
export function authenticateStaffPin(pin: string): StaffMember | null {
  const cleanPin = pin.trim();
  const staff = STAFF_MEMBERS.find((member) => member.pinCode === cleanPin);
  return staff ?? null;
}

import { atom } from 'recoil';

export const notificationState = atom<string | null>({
    key: 'notificationState',
    default: null,
});

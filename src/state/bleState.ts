import { atom } from 'recoil';
import { Peripheral } from '../models/Peripheral';

export const bleDevicesState = atom<Peripheral[]>({
    key: 'bleDevicesState',
    default: [],
});

export const bleScanningState = atom<boolean>({
    key: 'bleScanningState',
    default: false,
});
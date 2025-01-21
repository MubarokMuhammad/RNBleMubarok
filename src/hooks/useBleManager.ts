import { BleManager } from 'react-native-ble-plx';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { bleDevicesState, bleScanningState } from '../state/bleState';
import PushNotification from 'react-native-push-notification';
import { Peripheral } from '../models/Peripheral';

export const useBleManager = () => {
    const [manager] = useState(() => new BleManager());
    const [devices, setDevices] = useRecoilState(bleDevicesState);
    const [isScanning, setIsScanning] = useRecoilState(bleScanningState);

    const showNotification = (title: string, message: string) => {
        PushNotification.localNotification({
            title,
            message,
        });
    };

    const startScan = async () => {
        try {
            setIsScanning(true);
            showNotification('BLE Scan', 'Scanning started');

            manager.startDeviceScan(null, null, (error, device) => {
                if (error) {
                    console.error(error);
                    return;
                }

                if (device) {
                    const peripheral: Peripheral = {
                        id: device.id,
                        name: device.name,
                        rssi: device.rssi || 0,
                        advertisementData: {
                            localName: device.localName || undefined,
                            manufacturerData: device.manufacturerData || undefined,
                            serviceUUIDs: device.serviceUUIDs || undefined,
                        },
                    };

                    setDevices((prev) => {
                        if (!prev.find((d) => d.id === peripheral.id)) {
                            return [...prev, peripheral];
                        }
                        return prev;
                    });
                }
            });
        } catch (error) {
            console.error('Failed to start scan:', error);
        }
    };

    const stopScan = () => {
        manager.stopDeviceScan();
        setIsScanning(false);
        showNotification('BLE Scan', 'Scanning stopped');
    };

    useEffect(() => {
        return () => {
            manager.destroy();
        };
    }, [manager]);

    return {
        startScan,
        stopScan,
        isScanning,
        devices,
    };
};
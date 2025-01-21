import { useCallback } from 'react';
import { useBleManager } from '../hooks/useBleManager';
import { useRecoilValue } from 'recoil';
import { bleDevicesState, bleScanningState } from '../state/bleState';

export const useBleViewModel = () => {
    const { startScan, stopScan } = useBleManager();
    const devices = useRecoilValue(bleDevicesState);
    const isScanning = useRecoilValue(bleScanningState);

    const handleStartScan = useCallback(async () => {
        await startScan();
    }, [startScan]);

    const handleStopScan = useCallback(() => {
        stopScan();
    }, [stopScan]);

    return {
        devices,
        isScanning,
        handleStartScan,
        handleStopScan,
    };
};
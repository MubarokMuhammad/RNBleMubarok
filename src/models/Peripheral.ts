export interface Peripheral {
    id: string;
    name: string | null;
    rssi: number;
    advertisementData?: {
        localName?: string;
        manufacturerData?: string;
        serviceUUIDs?: string[];
    };
}
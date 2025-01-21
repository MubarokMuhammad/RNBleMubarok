import React from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { useBleViewModel } from '../viewmodels/BleViewModel';

export const BleScanner: React.FC = () => {
    const { devices, isScanning, handleStartScan, handleStopScan } = useBleViewModel();

    return (
        <View style={styles.container}>
            <Button
                title={isScanning ? 'Stop Scan' : 'Start Scan'}
                onPress={isScanning ? handleStopScan : handleStartScan}
            />
            <FlatList
                data={devices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.deviceItem}>
                        <Text>Name: {item.name || 'Unknown'}</Text>
                        <Text>ID: {item.id}</Text>
                        <Text>RSSI: {item.rssi}</Text>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    deviceItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
});
import React, { useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  PushNotificationIOS,
  Alert,
} from 'react-native';
import { RecoilRoot } from 'recoil';
import { NativeModules, NativeEventEmitter } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { BleScanner } from './components/BleScanner';

const { BleModule } = NativeModules;
const bleEmitter = new NativeEventEmitter(BleModule);

const requestAndroidPermissions = async () => {
  try {
    const androidVersion = Number(Platform.Version);

    if (Platform.OS === 'android' && androidVersion >= 31) {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);

      const allGranted = Object.values(granted).every(
        (permission) => permission === PermissionsAndroid.RESULTS.GRANTED,
      );

      if (!allGranted) {
        Alert.alert(
          'Permission Denied',
          'Some required permissions for BLE were not granted.',
        );
      }

      return allGranted;
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Bluetooth Low Energy requires Location Permission',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          'Permission Denied',
          'Location permission is required for BLE functionality.',
        );
      }

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  } catch (err) {
    console.warn(err);
    return false;
  }
};

const configurePushNotifications = () => {
  PushNotification.configure({
    onRegister: function (token) {
      console.log('TOKEN:', token);
    },
    onNotification: function (notification) {
      console.log('NOTIFICATION:', notification);
      // notification.finish(PushNotificationIOS.FetchResult.NoData);
    },
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },
    popInitialNotification: true,
    requestPermissions: Platform.OS === 'ios',
  });

  PushNotification.createChannel(
    {
      channelId: 'ble-scanner',
      channelName: 'BLE Scanner Notifications',
      channelDescription: 'Notifications for BLE scanning status',
      playSound: true,
      soundName: 'default',
      importance: 4,
      vibrate: true,
    },
    (created) => console.log(`Channel created: ${created}`),
  );
};

const App = () => {
  useEffect(() => {
    configurePushNotifications();

    if (Platform.OS === 'android') {
      requestAndroidPermissions().then((isGranted) => {
        if (!isGranted) {
          console.log('Required permissions not granted');
        }
      });
    }

    const deviceFoundListener = bleEmitter.addListener('onDeviceFound', (device) => {
      console.log('Device found:', device);
      PushNotification.localNotification({
        channelId: 'ble-scanner',
        title: 'BLE Device Found',
        message: `Device: ${device.name || 'Unknown'} (${device.id})`,
      });
    });

    return () => {
      deviceFoundListener.remove();
    };
  }, []);

  return (
    <RecoilRoot>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <BleScanner />
      </SafeAreaView>
    </RecoilRoot>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});

export default App;

package com.rnblemubarok

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.content.Context
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class BleModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val bluetoothAdapter: BluetoothAdapter? =
        (reactContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter
    private var scanning = false
    private val discoveredDevices = mutableSetOf<String>()

    override fun getName(): String {
        return "BleModule"
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        val isBluetoothEnabled = bluetoothAdapter?.isEnabled ?: false
        when {
            isBluetoothEnabled -> promise.resolve("authorized")
            bluetoothAdapter == null -> promise.resolve("unsupported")
            else -> promise.resolve("poweredOff")
        }
    }

    @ReactMethod
    fun startScan(promise: Promise) {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled) {
            promise.reject("ERROR", "Bluetooth is not powered on")
            return
        }

        if (!scanning) {
            scanning = true
            discoveredDevices.clear()
            bluetoothAdapter.bluetoothLeScanner?.startScan(scanCallback)
            sendEvent("onScanningStarted", null)
            promise.resolve(null)
        } else {
            promise.reject("ERROR", "Scanning already in progress")
        }
    }

    @ReactMethod
    fun stopScan(promise: Promise) {
        if (scanning) {
            scanning = false
            bluetoothAdapter?.bluetoothLeScanner?.stopScan(scanCallback)
            sendEvent("onScanningStopped", null)
            promise.resolve(null)
        } else {
            promise.reject("ERROR", "No scanning in progress")
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    private fun peripheralToWritableMap(device: ScanResult): WritableMap {
        val map = Arguments.createMap()
        map.putString("id", device.device.address)
        map.putString("name", device.device.name ?: "Unknown")
        map.putInt("rssi", device.rssi)

        val advertisementData = Arguments.createMap()
        advertisementData.putString("localName", device.scanRecord?.deviceName ?: "Unknown")
        map.putMap("advertisementData", advertisementData)

        return map
    }

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            val deviceAddress = result.device.address
            if (!discoveredDevices.contains(deviceAddress)) {
                discoveredDevices.add(deviceAddress)
                val deviceMap = peripheralToWritableMap(result)
                sendEvent("onDeviceFound", deviceMap)
            }
        }

        override fun onScanFailed(errorCode: Int) {
            sendEvent("onScanFailed", Arguments.createMap().apply {
                putInt("errorCode", errorCode)
            })
        }
    }
}

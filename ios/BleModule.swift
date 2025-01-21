//
//  BleModule.swift
//  RNBleMubarok
//
//  Created by mubarok on 20/1/25.
//
import Foundation
import CoreBluetooth
import React

@objc(BleModule)
class BleModule: NSObject {
  
    private var centralManager: CBCentralManager!
    private var discoveredPeripherals: [CBPeripheral] = []
    private var bridge: RCTBridge?
    
    override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: nil)
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc
    func setBridge(_ bridge: RCTBridge) {
        self.bridge = bridge
    }
    
    @objc(checkPermissions:rejecter:)
    func checkPermissions(_ resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
        let status = centralManager.state
        
        switch status {
        case .poweredOn:
            resolve("authorized")
        case .poweredOff:
            resolve("poweredOff")
        case .unauthorized:
            resolve("unauthorized")
        case .unsupported:
            resolve("unsupported")
        default:
            resolve("unknown")
        }
    }
    
    @objc(startScan:rejecter:)
    func startScan(_ resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard centralManager.state == .poweredOn else {
            reject("ERROR", "Bluetooth is not powered on", nil)
            return
        }
        
        discoveredPeripherals.removeAll()
        centralManager.scanForPeripherals(withServices: nil, options: [CBCentralManagerScanOptionAllowDuplicatesKey: false])
        
        sendEvent("onScanningStarted", body: nil)
        resolve(nil)
    }
    
    @objc(stopScan:rejecter:)
    func stopScan(_ resolve: @escaping RCTPromiseResolveBlock,
                 rejecter reject: @escaping RCTPromiseRejectBlock) {
        centralManager.stopScan()
        sendEvent("onScanningStopped", body: nil)
        resolve(nil)
    }
    
    private func sendEvent(_ name: String, body: Any?) {
        bridge?.eventDispatcher()?.sendAppEvent(withName: name, body: body)
    }
    
    private func peripheralToDictionary(_ peripheral: CBPeripheral, rssi: NSNumber?) -> [String: Any] {
        var dict: [String: Any] = [
            "id": peripheral.identifier.uuidString,
            "name": peripheral.name ?? NSNull()
        ]
        
        if let rssi = rssi {
            dict["rssi"] = rssi
        }
        
        return dict
    }
}

extension BleModule: CBCentralManagerDelegate {
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        var state: String
        
        switch central.state {
        case .poweredOn:
            state = "PoweredOn"
        case .poweredOff:
            state = "PoweredOff"
        case .resetting:
            state = "Resetting"
        case .unauthorized:
            state = "Unauthorized"
        case .unsupported:
            state = "Unsupported"
        case .unknown:
            state = "Unknown"
        @unknown default:
            state = "Unknown"
        }
        
        sendEvent("bleStateChanged", body: ["state": state])
    }
    
    func centralManager(_ central: CBCentralManager,
                       didDiscover peripheral: CBPeripheral,
                       advertisementData: [String: Any],
                       rssi RSSI: NSNumber) {
      
        var advData: [String: Any] = [:]
        
        if let localName = advertisementData[CBAdvertisementDataLocalNameKey] as? String {
            advData["localName"] = localName
        }
        
        if let manufacturerData = advertisementData[CBAdvertisementDataManufacturerDataKey] as? Data {
            advData["manufacturerData"] = manufacturerData.base64EncodedString()
        }
        
        if let serviceUUIDs = advertisementData[CBAdvertisementDataServiceUUIDsKey] as? [CBUUID] {
            advData["serviceUUIDs"] = serviceUUIDs.map { $0.uuidString }
        }
        
        var peripheralDict = peripheralToDictionary(peripheral, rssi: RSSI)
        peripheralDict["advertisementData"] = advData
        
        sendEvent("onDeviceFound", body: peripheralDict)
    }
}

@objc(BleModuleManager)
class BleModuleManager: NSObject {
    @objc
    static func moduleName() -> String! {
        return "BleModule"
    }
    
    @objc
    var methodQueue: DispatchQueue {
        return DispatchQueue.main
    }
}

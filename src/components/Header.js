// ******************************************************************************
// * @file    Header.js
// * @author  MCD Application Team
// *
//  ******************************************************************************
//  * @attention
//  *
//  * Copyright (c) 2022-2023 STMicroelectronics.
//  * All rights reserved.
//  *
//  * This software is licensed under terms that can be found in the LICENSE file
//  * in the root directory of this software component.
//  * If no LICENSE file comes with this software, it is provided AS-IS.
//  *
//  ******************************************************************************


import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import logoST from '../images/st-logo.svg';
import nucleo from '../images/NUCLEO_board.png';
import nucleoWBA6 from '../images/NUCLEO_board_WBA6.png';
import STM32WBA65I_DK1 from '../images/STM32WBA65I_DK1.png';
import dk1 from '../images/DK1.png';
import bluetooth from '../images/bluetoothLogo.png';
import hrlogo from '../images/HRlogo.png';
import p2pslogo from '../images/P2PSlogo.png';
import ecglogo from '../images/ECG_logo.png';

export let deviceId;

var myDevice;
let showAllDevices = false;
let imgSrc = null;

const Header = (props) => {


  const [deviceType, setDeviceType] = useState('nucleo');
  const [selectedApp, setSelectedApp] = useState('');
  const [characteristicFound, setCharacteristicFound] = useState(false);
  const navigate = useNavigate();


  const OptionalServices =  [
    '00001800-0000-1000-8000-00805f9b34fb',
    '0000fe40-cc7a-482a-984a-7f2ed5b3e58f', 
    '0000180d-0000-1000-8000-00805f9b34fb',
    '0000fe80-cc7a-482a-984a-7f2ed5b3e58f',
    '0000fe80-8e22-4541-9d4c-21edae82fe80',
    '0000fe20-cc7a-482a-984a-7f2ed5b3e58f', 
    '0000feb0-cc7a-482a-984a-7f2ed5b3e58f', 
    '00001809-0000-1000-8000-00805f9b34fb',
    'd973f2e0-b19e-11e2-9e96-0800200c9a66', 
    '0000fec0-cc7a-482a-984a-7f2ed5b3e58f', 
    '0000ff9a-cc7a-482a-984a-7f2ed5b3e58f', 
    '0000f11a-cc7a-482a-984a-7f2ed5b3e58f', 
    '0000fe90-cc7a-482a-984a-7f2ed5b3e58f',
    '00001810-0000-1000-8000-00805f9b34fb',
    '0000181d-0000-1000-8000-00805f9b34fb',
    '00001814-0000-1000-8000-00805f9b34fb',
    '0000181f-0000-1000-8000-00805f9b34fb',
    '8d53dc1d-1db7-4cd3-868b-8a527460aa84',
    '00001840-0000-1000-8000-00805f9b34fb', 
    '0000ff1a-cc7a-482a-984a-7f2ed5b3e58f', 
    '0000ab40-cc7a-482a-984a-7f2ed5b3e58f'
  ];// service uuid of [P2P service, Heart Rate service, DataThroughput, Ota, P2P Router, Health Thermomiter, Finger Print, Blood Pressure, Weight Scale, Running Speed and Cadence, Continuous Glucose Monitoring, SolarDemo]



  function connection() {
    console.log('Requesting Bluetooth Device...');
    if (showAllDevices == false) {
      console.log("Bluetooth Device Filter is ON");
      myDevice = navigator.bluetooth.requestDevice({
        filters:
          [{
            namePrefix: "HT_"            // BLE_HealthThermometer
          }, {
            namePrefix: "HR_"            // BLE_HeartRate
          }, {
            namePrefix: "p2pS_"           // P2P : Server 
          }, {
            namePrefix: "P2PS_"           // P2P : Server 
          }, {
            namePrefix: "p2pR_"           // P2P : Router
          }, {
            namePrefix: "p2pSext_"        // P2P : Server Ext
          }, {
            namePrefix: "DT"              // BLE_DataThroughput
          }, {
            namePrefix: "FP"              // BLE_FingerPrint
          }, {
            namePrefix: "BLS_"            // BLE_BloodPressure
          }, {
            namePrefix: "WS_"            // BLE_WeightScale
          }, {
            namePrefix: "RSC_"            // BLE_RunningSpeedandCadence
          }, {
            namePrefix: "CGM_"            // BLE_ContinuousGlucoseMonitoring
          }, {
            namePrefix: "WBAx_WiFi"       // BLE_WifCommissionning
          }, {
            namePrefix: "ST"            // BLE_WifCommissionning
          }, {
            namePrefix: "FC"              // BLE_FanProject
          }, {
            namePrefix: "FOTA"             // Secure FOTA 
          }, {
            namePrefix: "HUB_DYN"         // HUB Zigbee
          }, {
            namePrefix: "FC"              // BLE_FanProject
          }, {
            namePrefix: "WBA"              // other WBA projects
          }, {
            namePrefix: "ECG"              // BLE_Electrocardiogram
          }, {
            namePrefix : "GHS"             // BLE_GHS
          }, {
            namePrefix : "PO"             // BLE_PulseOxymeter
          }, {
            namePrefix: "Solar"           // Solar Demo : Server 
          }
        ],

        optionalServices: OptionalServices  

      })
        .then(device => {
          myDevice = device;
          myDevice.addEventListener('gattserverdisconnected', onDisconnected);
          return device.gatt.connect();
        })

        .then(server => {
          return server.getPrimaryServices();
        })

        .then(services => {
          console.log('HEADER - Getting Characteristics...');
          let queue = Promise.resolve();
          services.forEach(service => {
            console.log(service);
            createLogElement(service, 3, 'SERVICE')
            props.setAllServices((prevService) => [
              ...prevService,
              {
                service,
                device: service.device
              },
            ]);
            queue = queue.then(_ => service.getCharacteristics()
              .then(characteristics => {
                console.log(characteristics);
                console.log('HEADER - > Service: ' + service.device.name + ' - ' + service.uuid);
                characteristics.forEach(characteristic => {
                  props.setAllCharacteristics((prevChar) => [
                    ...prevChar,
                    {
                      characteristic
                    },
                  ]);
                  console.log('HEADER - >> Characteristic: ' + characteristic.uuid + ' ' + getSupportedProperties(characteristic));
                  createLogElement(characteristic, 4, 'CHARACTERISTIC')
                });
                readOTACharacteristic(services);
                readNewCharacteristic(characteristics);
              }));
          });
          let buttonConnect = document.getElementById('connectButton');
          buttonConnect.innerHTML = "Connected";
          buttonConnect.disabled = true;
          props.setIsDisconnected(false);
          return queue;
        })
        .catch(error => {
          console.error(error);
        });
    }
    else {
      console.log("Bluetooth Device Filter is OFF");
      myDevice = navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices:  OptionalServices
      })
      

        .then(device => {
          myDevice = device;
          myDevice.addEventListener('gattserverdisconnected', onDisconnected);
          return device.gatt.connect();
        })
        .then(server => {
          console.log("##==>> ", server.getPrimaryServices());
          return server.getPrimaryServices();
        })
        .then(services => {
          console.log('HEADER - Getting Characteristics...');
          let queue = Promise.resolve();
          services.forEach(service => {
            console.log(service);
            createLogElement(service, 3, 'SERVICE')
            props.setAllServices((prevService) => [
              ...prevService,
              {
                service,
                device: service.device
              },
            ]);
            queue = queue.then(_ => service.getCharacteristics()
              .then(characteristics => {
                console.log(characteristics);
                console.log('HEADER - > Service: ' + service.device.name + ' - ' + service.uuid);
                characteristics.forEach(characteristic => {
                  props.setAllCharacteristics((prevChar) => [
                    ...prevChar,
                    {
                      characteristic
                    },
                  ]);
                  console.log('HEADER - >> Characteristic: ' + characteristic.uuid + ' ' + getSupportedProperties(characteristic));
                  createLogElement(characteristic, 4, 'CHARACTERISTIC')
                });
              }));
          });
          let buttonConnect = document.getElementById('connectButton');
          buttonConnect.innerHTML = "Connected";
          buttonConnect.disabled = true;
          props.setIsDisconnected(false);
          return queue;
        })
        .catch(error => {
          console.error(error);
        });
    }

  }

  //Start Characteristics And Upload Sections

  const readOTACharacteristic = (services) => {
    const otaService = services.find(service => service.uuid === "0000fe20-cc7a-482a-984a-7f2ed5b3e58f");
    if (otaService) {
      console.log("OTA found:", otaService);
    } else {
      console.log("OTA not found");
    }
  };

  const readNewCharacteristic = (characteristics) => {
    const newChar = characteristics.find(char => char.uuid === "0000fe31-8e22-4541-9d4c-21edae82ed19");
    if (newChar) {
      console.log("Characteristic found:", newChar);
      setCharacteristicFound(true);
      newChar.readValue().then(value => {
        console.log("Value read from characteristic:", value);
        readInfoDevice(value)
        // Additional processing here
      }).catch(error => {
        console.error('Error reading the new characteristic:', error);
      });
    } else {
      console.log("Characteristic not found");
    }
  };

  async function readInfoDevice(value) {
    let statusWord = Array.from(new Uint8Array(value.buffer)).map(byte => byte.toString(16).padStart(2, '0')).join('-');
    let board, rev, hw, appv, app, hsv, hsvp1, hsvp2, apprep;

    console.log("Device Info", statusWord);

    let DeviceID = "0x" + statusWord.substring(3, 5) + " " + statusWord.substring(0, 2);
    let RevID = "0x" + statusWord.substring(9, 11) + " " + statusWord.substring(6, 8);
    let BoardID = "0x" + statusWord.substring(12, 14);
    let HWp = "0x" + statusWord.substring(15, 17);
    let AppFWv = "0x" + statusWord.substring(18, 20) + " " + "0x" + statusWord.substring(21, 23) + " " + "0x" + statusWord.substring(24, 26) + " " + "0x" + statusWord.substring(27, 29) + " " + "0x" + statusWord.substring(30, 32);
    let AppFWID = "0x" + statusWord.substring(33, 35);
    let HSv = "0x" + statusWord.substring(39, 41) + " " + statusWord.substring(36, 38);
    let HSvp1 = "0x" + statusWord.substring(39, 41);
    let HSvp2 = "0x" + statusWord.substring(36, 38);

    console.log("----- Device Info -----");
    console.log("Device ID : ", DeviceID);
    console.log("Rev ID : ", RevID);
    console.log("Board ID : ", BoardID);
    console.log("HW package : ", HWp);
    console.log("FW package: ", AppFWv);
    console.log("App FW ID : ", AppFWID);
    console.log("Host Stack Version : ", HSv);

    console.log("-------------------------------");
    
    deviceId = "0xFF";

    switch (DeviceID) {
      case '0x04 92':
        deviceId = '5'
        break;

      case '0x04 b0':
        deviceId = '6'
        break;
      case '0x04 b2':
        deviceId = 'X'
        break;
    }

    switch (RevID) {
      case '0x10 00':
        rev = 'Rev A'
        break;

      case '0x10 01':
        rev = 'Rev Z'
        break;

      case '0x20 00':
        rev = 'Rev B'
        break;
    }

    switch (BoardID) {
      case '0x8b':
        board = 'Nucleo-WBA55CG'
        imgSrc = nucleo
        updateDeviceType(board)
        break;

      case '0x8c':
        board = 'STM32WBA55G-DK1'
        imgSrc = dk1 
        updateDeviceType(board)
        break;

      case '0x8d':
        board = 'B-WBA5M-WPAN'
        updateDeviceType(board)
        break;

      case '0x8e':
          board = 'Nucleo-WBA65RI'
          imgSrc = nucleoWBA6
          updateDeviceType(board)
          break;

      case '0x8f':
        board = 'STM32WBA65I-DK1'
        imgSrc = STM32WBA65I_DK1
        updateDeviceType(board)
        break;
      
      case '0x90':
        board = 'Nucleo-WBAXXXX'
        updateDeviceType(board)
        break;
        
    }

    setGithubBaseUrl(board);


    switch (HWp) {
      case '0x00':
        hw = 'UFQFPN32'
        break;

      case '0x02':
        hw = 'UFQFPN48'
        break;

      case '0x03':
        hw = 'UFQFPN48-USB'
        break;

      case '0x05':
        hw = 'WLCSP88-USB'
        break;

      case '0x07':
        hw = 'UFBGA121-USB'
        break;

      case '0x09':
        hw = 'WLCSP41-SMPS'
        break;

      case '0x0a':
        hw = 'UFQFPN48-SMPS'
        break;

      case '0x0b':
        if(deviceId == '5')
        {          
          hw = 'UFBGA59-SMPS'
        }
        else if(deviceId = '6')
        {
          hw = 'UFQFPN48-SMPS-USB'
        }
        break;

      case '0x0c':
        hw = 'VFQFPN68'
        break;

      case '0x0d':
        hw = 'WLCSP88-SMPS-USB'
        break;

      case '0x0f':
        hw = 'UFBGA121-SMPS-USB'
        break;

    }


    hsvp1 = 'Tag 0.'+ hexToDecimal(HSvp2);

    switch (HSvp1) {
      case '0x00':
        hsvp2 = 'Full Stack'
        break;

      case '0x10':
        hsvp2 = 'Basic Plus'
        break;

      case '0x20':
        hsvp2 = 'Basic Features'
        break;

      case '0x40':
        hsvp2 = 'Peripheral Only'
        break;

      case '0x80':
        hsvp2 = 'LL Only'
        break;

      case '0xA0':
        hsvp2 = 'LL Only Basic'
        break;

      case '0xxn':
        hsvp2 = 'branch n'
        break;

      case '0xxf':
        hsvp2 = 'debug version'
        break;

    }

    hsv = hsvp1 + " " + hsvp2

    switch (AppFWID) {
      case '0x83':
        app = 'Peer 2 Peer Server'
        apprep = 'BLE_p2pServer'
        break;

      case '0x89':
        app = 'Heart Rate'
        apprep = 'BLE_HeartRate'
        break;

      case '0x8a':
        app = 'Health Thermometer'
        apprep = 'BLE_HealthThermometer'
        break;

      case '0x88':
        app = 'Data Throughput'
        apprep = 'BLE_HealthThermometer'
        break;

      case '0x85':
        app = 'Peer 2 Peer Router'
        apprep = 'BLE_p2pRouter'
        break;

      case '0x87':
        app = 'Serial Com Peripheral'
        apprep = 'BLE_SerialCom_Peripheral'
        break;

      case '0x8d':
        app = 'Alert Notifiaction'
        apprep = 'BLE_AlertNotification'
        break;

      case '0x90':
        app = 'Find Me'
        apprep = 'BLE_FindMe'
        break;

      case '0x8f':
        app = 'Phone Alert Status'
        apprep = 'BLE_PhoneAlertStatus'
        break;

      case '0x8e':
        app = 'Proximity'
        apprep = 'BLE_Proximity'
        break;

      case '0x8b':
        app = 'Weight Scale'
        apprep = 'BLE_WeightScale'
        break;

      case '0x8c':
        app = 'Blood Pressure'
        apprep = 'BLE_BloodPressure'
        break;

      case '0x9a':
        app = 'Continuous Glucose Monitoring'
        apprep = 'BLE_ContinuousGlucoseMonitoring'
        break;

      case '0x9b':
        app = 'Running Speed and Cadence'
        apprep = 'BLE_RunningSpeedAndCadence'
        break;

      case '0x9c':
        app = 'BLE Sensor - HeartRate - P2PServer'
        apprep = 'BLE_Sensor_HR_P2PServer'
        break;
      
      case '0x9d':
        app= 'Electrocardiogram'
        apprep = 'BLE_GenericHealth_ECG'
        break;

      case '0x9e':
        app= 'Pulse Oximeter'
        apprep = 'BLE_GenericHealth_POX'
        break;

    }

    appv = "v" + parseInt(statusWord.substring(18, 20), 16) + "." + parseInt(statusWord.substring(21, 23), 16) + "." + parseInt(statusWord.substring(24, 26), 16) + "." + parseInt(statusWord.substring(27, 29), 16) + "." + parseInt(statusWord.substring(30, 32), 16);


    console.log("----- Device Info -----");
    console.log("Device id : ", deviceId);
    console.log("Rev : ", rev);
    console.log("Board : ", board);
    console.log("HW package : ", hw);
    console.log("App Version: ", appv);
    console.log("App : ", app);
    console.log("Host Stack Version : ", hsvp1);
    console.log("Host Stack Type : ", hsvp2);

    console.log("-------------------------------");

    var dev = document.getElementById("dev");
    dev.innerText = board;
    var revs = document.getElementById("revs");
    revs.innerText = rev;
    var hwp = document.getElementById("hwp");
    hwp.innerText = "HW package : " + hw;
    var hsvs1 = document.getElementById("hsvs1");
    hsvs1.innerText = "Host Stack Version : " + hsvp1;
    var hsvs2 = document.getElementById("hsvs2");
    hsvs2.innerText = "Host Stack Type : " + hsvp2;
    var apps = document.getElementById("apps");
    apps.innerText = app;
    var appvs = document.getElementById("appvs");
    appvs.innerText = "App FW Version : " + appv;

    let apprepOta = `${apprep}${"_ota"}`;
    const latestVersion = await getLatestVersion(apprepOta);

    const versionRecentRow = document.getElementById('versionrecent');
    const versionUpdateRow = document.getElementById('versionupdate');

    if (isLatestVersion(appv, latestVersion)) {
      versionRecentRow.style.display = '';
      versionUpdateRow.style.display = 'none';
    } else {
      versionRecentRow.style.display = 'none';
      versionUpdateRow.style.display = '';
    }

  }

  async function getLatestVersion(appFolderName) {
    const url = `${githubBaseUrl}${appFolderName}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`GitHub API responded with status code ${response.status}`);
      }
      const files = await response.json();
      const versionRegex = /(v\d+\.\d+\.\d+)\.bin/;

      let versions = files
        .map(file => {
          const match = file.name.match(versionRegex);
          return match ? match[1] : null;
        })
        .filter(version => version !== null)
        .map(version => formatVersion(version))
        .sort((a, b) => b.localeCompare(a));
      console.log("Latest Version: ", versions[0]);

      return versions[0];
    } catch (error) {
      console.error('Error fetching the latest version:', error);
    }
  }


  function formatVersion(version) {
    const versionRegex = /(v\d+\.\d+\.\d+)/;
    const match = version.match(versionRegex);
    if (match && match[1]) {
      return match[1] + '.0.0';
    }
    return null;
  }


  function isLatestVersion(current, latest) {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    for (let i = 0; i < currentParts.length; i++) {
      if (currentParts[i] < latestParts[i]) {
        return false;
      } else if (currentParts[i] > latestParts[i]) {
        return true;
      }
    }
    return true;
  }


  function updateDeviceType(type) {
    setDeviceType(type);
  }

  async function downloadByOTA() {
    try {
      const selectedVersion = document.getElementById('selectedVersion').value;
      const selectedAppInfo = applications.find(app => app.id === selectedApp);
      const appName = selectedAppInfo.fileName;
      const binaryFileName = `${appName}_v${selectedVersion}.bin`;
      setGithubBaseUrl(deviceType);
      const githubRawUrl = `${githubBaseUrl}${appName}/${binaryFileName}`;
      localStorage.setItem('githubUrl', githubRawUrl);
      console.log('GitHub URL set for OTA:', githubRawUrl);
      const fileName = githubRawUrl.split('/').pop();

      alert('GitHub URL set for OTA: ' + fileName);
      
      navigate('/OTA', { replace: true });
       const element = document.getElementById('ota-section');
       if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }

      const event = new CustomEvent('githubUrlUpdated', { detail: githubRawUrl });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error during OTA update:', error);
      alert('An error occurred during OTA update: ' + error.message);
    }
  }


  function handleDownloadClick() {
        downloadByOTA();
  }


  let githubBaseUrl = null;

   function setGithubBaseUrl(board) {
    if (board === 'Nucleo-WBA65RI') {
      githubBaseUrl = 'https://api.github.com/repos/AppliBLE/STM32WBA_Binaries/contents/STM32WBA6_Binaries/';
    } else if (board === 'Nucleo-WBAXXXX'){
      githubBaseUrl = 'https://api.github.com/repos/AppliBLE/STM32WBA_Binaries/contents/STM32WBAX_Binaries/';
    } else{
      githubBaseUrl = 'https://api.github.com/repos/AppliBLE/STM32WBA_Binaries/contents/STM32WBA5_Binaries/';
    }
  }

  async function updateVersionOptions(selectedApp) {
    //const directory = appFolderMap[selectedApp];
    if (!selectedApp) {
      console.error('Invalid application selection');
      return;
    }

    let versionRegex;
    setGithubBaseUrl(deviceType);
    const url = `${githubBaseUrl}${selectedApp}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`GitHub API responded with status code ${response.status}`);
      }
      const files = await response.json();
      
      versionRegex = /v(\d+\.\d+\.\d+)\.bin/;
      const versions = files
        .map(file => {
          const match = file.name.match(versionRegex);
          return match ? match[1] : null;
        })
        .filter(version => version !== null);

      versions.sort((a, b) => {
        const versionA = a.split('.').map(Number);
        const versionB = b.split('.').map(Number);
        for (let i = 0; i < versionA.length; i++) {
          if (versionA[i] > versionB[i]) return -1;
          if (versionA[i] < versionB[i]) return 1;
        }
        return 0;
      });

      const versionSelect = document.getElementById('selectedVersion');
      versionSelect.innerHTML = '';

      versions.forEach(version => {
        const option = document.createElement('option');
        option.value = version;
        option.textContent = "v" + version;
        versionSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error fetching the list of versions:', error);
    }
  }
  //End Characteristics And Upload Sections




  function getSupportedProperties(characteristic) {
    let supportedProperties = [];
    for (const p in characteristic.properties) {
      if (characteristic.properties[p] === true) {
        supportedProperties.push(p.toUpperCase());
      }
    }
    return supportedProperties.join(', ');
  }

  function disconnection() {
    console.log('HEADER - Disconnecting from Bluetooth Device...');
    myDevice.gatt.disconnect();
    document.getElementById('connectButton').disabled = false;
    props.setIsDisconnected(true);
    props.setAllServices([]);
    document.location.href = "/Web_Bluetooth_App_WBA";
  }

  function onDisconnected() {
    console.log('HEADER - > Bluetooth Device disconnected');
    document.getElementById('connectButton').disabled = false;
    props.setIsDisconnected(true);
    props.setAllServices([]);
    document.location.href = "/Web_Bluetooth_App_WBA/";
  }

  function hexToDecimal(hex) {
    return parseInt(hex, 16);
  }



/**
  * @brief  Application configuration
  *
  * @property  id           unique identifier for the application
  * @property  name         name of the application
  * @property  fileName     file name for OTA updates
  * @property  logo         path to the application's logo image
  * @property  link         URL link to the application's documentation or page
  * @property  deviceTypes  array of compatible device types (e.g., 'all', 'Nucleo-WBA55CG', 'Nucleo-WBA65RI')
  *
  */
  const applications = [
    {
      id: 'app0',
      name: 'Peer2Peer Server',
      fileName: 'BLE_p2pServer_ota',
      logo: p2pslogo,
      link: 'https://wiki.st.com/stm32mcu/wiki/Connectivity:STM32WBA_Peer_To_Peer',
      deviceTypes: [ 'Nucleo-WBA55CG', 'Nucleo-WBA65RI', 'Nucleo-WBAXXXX']
    },
    {
      id: 'app1',
      name: 'Electrocardiogram',
      fileName: 'BLE_GenericHealth_ECG_ota',
      logo: ecglogo,
      link: '',
      deviceTypes: ['Nucleo-WBA65RI']
    },
    {
      id: 'app2',
      name: 'Heart Rate',
      fileName: 'BLE_HeartRate_ota',
      logo: hrlogo,
      link: 'https://wiki.st.com/stm32mcu/wiki/Connectivity:STM32WBA_HeartRate',
      deviceTypes: ['Nucleo-WBA55CG', 'Nucleo-WBA65RI', 'Nucleo-WBAXXXX']
    }
  ];


  return (
    <div className="container-fluid" id="header">
      <div className="container ">
        <div className="row">
          <div className="col-12">
            <img className="logoST" src={logoST} alt="logo st"></img>
          </div>
        </div>
        <div className="textTitle">
          WBA
        </div>
        <div className="row mt-3">
          <div className="d-grid col-xs-12 col-sm-4 col-md-4 col-lg-4 p-2">
            <button className="defaultButton" type="button" onClick={connection} id="connectButton">Connect</button>
          </div>
          <div className="d-grid col-xs-12 col-sm-4 col-md-4 col-lg-4 p-2">
            <button className="defaultButton" type="button" onClick={disconnection}>Disconnect</button>
          </div>
          <div className="d-grid col-xs-12 col-sm-4 col-md-4 col-lg-4 p-2">
            <button class="defaultButton" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasLogPanel" aria-controls="offcanvasLogPanel">
              Info
            </button>
          </div>
          <div class="offcanvas offcanvas-start" data-bs-scroll="true" tabindex="-1" id="offcanvasLogPanel" aria-labelledby="offcanvasLogPanelLabel">
            <div class="offcanvas-header">
              <h5 class="offcanvas-title" id="offcanvasLogPanelLabel">Application log panel</h5>
              <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body">
              <div id="logPanel"></div>
            </div>
          </div>
          <div className="input-group mb-3">
            <label> Disable STM32 WBA Devices Filter &nbsp;</label>
            <label class="containerCheckBox" onClick={checkBoxDeviceFilter}>
              <input type="checkbox" id="checkboxFilter" />
              <span class="checkmark"></span>
            </label>
          </div>
        </div>
      </div>
      {characteristicFound && (
        <div className="ALL__container">
          <div className="main-content">

            <div>
              <div className="Char_titlebox">
                <h3><strong>Device Informations</strong></h3>
              </div>


              <div class="Char__container container grid">

                <div class="Chartitle__card2">
                  <div class="Char__container2 container grid">
                    <div>
                      <img src={imgSrc} alt="" className="boardImage"></img>
                    </div>

                    <div>
                      <br></br>
                      <h1><span id='dev' ></span></h1>
                      <div class="custom-divider"></div>
                      <h3><span id='revs' > </span></h3>
                      <h3><span id='hwp' > </span></h3>
                      <br></br>
                    </div>
                  </div>
                </div>

                <div>

                  <div class="Chartitle__card3">
                    <div class="header-content">
                      <img src={bluetooth} alt="" className="bluetoothLogo">
                      </img><h1><span id='apps' > </span></h1>
                    </div>
                    <h3><span id='appvs' > </span></h3>
                    <div id="versionrecent" style={{ display: 'none' }}>
                      <h4><box-icon name='info-circle' size='xs' type='solid' color='#03234B' class='infoLogo'></box-icon> This is the latest version of the application.</h4>
                    </div>
                    <div id="versionupdate" style={{ display: 'none' }}>
                      <h4><box-icon name='info-circle' size='xs' type='solid' color='#03234B' class='infoLogo'></box-icon> A new version of the application is available.</h4>
                    </div>
                  </div>

                  <div class="Chartitle__card4">
                    <h3><span id='hsvs1' > </span></h3>
                    <h3><span id='hsvs2' > </span></h3>
                  </div>
                </div>

              </div>

            </div>
          </div>
          <div className="sidebar">
            <div class="Chartitle__card5">

              <h1>Upload via OTA</h1>

              <div class="custom-divider"></div>
              <h1>Select The Available Application</h1>

              <div class="app-list-container">
              {applications.map((app) => (
                <label
                  key={app.id}
                  className={`app-list-item ${selectedApp === app.id ? 'active' : ''} ${!app.deviceTypes.includes('all') && !app.deviceTypes.includes(deviceType) ? 'disabled' : ''}`}
                >
                <input
                  type="radio"
                  name="application"
                  value={app.id}
                  checked={selectedApp === app.id}
                  disabled={!app.deviceTypes.includes('all') && !app.deviceTypes.includes(deviceType)}
                  onChange={() => {
                    setSelectedApp(app.id);
                    updateVersionOptions(app.fileName);
                  }}
                />
                <img
                  src={app.logo}
                  className={`appsLogo ${!app.deviceTypes.includes('all') && !app.deviceTypes.includes(deviceType) ? 'logo-disabled' : ''}`}
                  alt={`${app.name} logo`}
                />
                <a
                  href={app.link || ''}
                  target="_blank"
                  //rel="noopener noreferrer"
                  className="app-list-link"
                >
                <span className={`app-list-text ${!app.deviceTypes.includes('all') && !app.deviceTypes.includes(deviceType) ? 'disabled' : ''}`}>
                {app.name}
                </span>
                </a>
                </label>
                ))}
              </div>
      


              <div class="custom-divider"></div>

              <h1>Select The Available Version</h1>

              <div class="Chartitle__card6">
                <select id="selectedVersion">
                  <option disabled selected>Choose app first</option>
                </select>
              </div>

              <div className="custom-divider"></div>

              <div className="Charbuttitle__card">
                  <button onClick={handleDownloadClick}>Set OTA App</button>
              </div>
            </div>
          </div>
        </div>

      )}
    </div>

  );
};



function checkBoxDeviceFilter() {
  // Get the checkbox
  var checkBox = document.getElementById("checkboxFilter");
  var inputSector = document.getElementById("nbSector");
  // If the checkbox is checked, display the output text
  if (checkBox.checked == true) {
    showAllDevices = true;
    console.log("Turn Off the bluetooth device Filter for the connection");
  } else {
    showAllDevices = false;
    console.log("Turn ON the bluetooth device Filter for the connection");
  }
}


// Create a new element in the log panel
export function createLogElement(logText, maxLevel, description) {
  // Format and beautify (like JSON) the object (interface) content give in parameter 
  // maxLevel set the number of recursivity loops, because interfaces have references to themselves and are infinite
  function formatInterface(object, maxLevel, currentLevel) {
    var str = '';
    var levelStr = '';
    if (typeof currentLevel == "undefined") {
      currentLevel = 0;
    }

    // Text in a pre element is displayed in a fixed-width font, and it preserves both spaces and line breaks;
    if (currentLevel == 0) {
      str = '<pre>';
    }

    for (var x = 0; x < currentLevel; x++) {
      levelStr += '    ';
    }

    if (maxLevel != 0 && currentLevel >= maxLevel) {
      str += levelStr + '...</br>';
      return str;
    }

    if (currentLevel <= maxLevel) {
      for (var property in object) {
        if (typeof object[property] != "function") { // if value is not type function
          if (typeof object[property] != "object") { // if value is not type object
            str += levelStr + property + ': ' + object[property] + ' </br>';
          } else if (object[property] == null) {
            str += levelStr + property + ': null </br>';
          } else {
            str += levelStr + property + ': { </br>' + formatInterface(object[property], maxLevel, currentLevel + 1) + levelStr + '}</br>';
          }
        }
      }
    }
    if (currentLevel == 0) {
      str += '</pre>';
    }
    return str;
  }

  // Get current time
  let currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  let formatedString = formatInterface(logText, maxLevel);
  let logPanel = document.getElementById('logPanel');
  let logElememt = document.createElement('div');
  logElememt.setAttribute("class", "logElememt");
  logElememt.innerHTML = currentTime + " : " + description + '</br>' + formatedString;
  logPanel.appendChild(logElememt);
}

export default Header;
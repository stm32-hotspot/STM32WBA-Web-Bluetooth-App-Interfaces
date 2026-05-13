// ******************************************************************************
// * @file    WifiCommissioning.js
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

import React, { useState, useEffect } from 'react';
import iconInfo from '../images/iconInfo.svg';
import strong_signal from '../images/wifi_strong.svg';
import good_signal from '../images/wifi_good.svg';
import weak_signal from '../images/wifi_weak.svg';
import very_weak_signal from '../images/wifi_very_weak.svg';
import no_wifi from '../images/no_wifi.svg';
import wifi_error from '../images/wifi_red.svg';
import { createLogElement } from "../components/Header";
import { OverlayTrigger, Popover } from 'react-bootstrap';

let interval_scanning;
let interval_connection;
let selectedSsid;

const WifiCommissioning = (props) => {
    let WiFi_Control;
    let WiFi_Configure;
    let WiFi_AP_list;
    let Monitoring;
    var ssids;
    

    props.allCharacteristics.map(element => {
        switch (element.characteristic.uuid) {
            case "0000fe9b-8e22-4541-9d4c-21edae82ed19":
              WiFi_Control = element;
            break;
            case "0000fe9c-8e22-4541-9d4c-21edae82ed19":
              WiFi_Configure = element;
            break;
            case "0000fe9d-8e22-4541-9d4c-21edae82ed19":
              WiFi_AP_list = element;
            break;
            case "0000fe9e-8e22-4541-9d4c-21edae82ed19":
              Monitoring = element;
            break;
            default:
            console.log("# No characteristics found..");
        }
    });
    

    document.getElementById("readmeInfo").style.display = "none";

    var toggle_scan = 0;

    useEffect(() => {
      maFonctionInitiale();
    }, []); // Le tableau de dépendances vide [] indique que l'effet ne s'exécutera qu'après le premier rendu
  
    const maFonctionInitiale = () => {
      //Enable Characteristic Notifications
      WiFi_AP_list.characteristic.startNotifications();
      WiFi_AP_list.characteristic.oncharacteristicvaluechanged = notif_Ap_List_Handler;
      
      Monitoring.characteristic.startNotifications();
      Monitoring.characteristic.oncharacteristicvaluechanged = notif_Monitoring_List_Handler;
    };

    // Toggle scaning state
    function toggleScanImage() {
      var wifiList = document.getElementById("wifiList");
      var image = document.createElement('img');
      image.src = no_wifi;
      image.width = 20;
      image.height = 100; 

      if (toggle_scan === 1) {
        wifiList.innerHTML = ""; // Effacer le contenu précédent
        toggle_scan = 0;
      } else {
        wifiList.appendChild(image);
        toggle_scan = 1;
      }
    }

    //Write Wifi_Control to start scan WiFi
    async function ScanRequestButtonClick() {
      let myWord = new Uint8Array(1);
      myWord[0] = 0x1;

      ////Erase old content
      document.getElementById("wifiList").innerHTML = "";
      document.getElementById("Wifi_selected").value = "Select your Wi-Fi";
      document.getElementById("pwd_text").value = '';
      document.getElementById("security_mode").innerHTML = '';

      //Start to toggle the Wifi Image
      if (interval_scanning) {
        clearInterval(interval_scanning);
      }
      interval_scanning = setInterval(toggleScanImage, 500);  

      //Send Write
      try {
          await WiFi_Control.characteristic.writeValue(myWord);
          createLogElement(myWord, 1, "Start scanning");
      }
      catch (error) {
          console.log('2 : Argh! ' + error);
      }

      

      console.log("Notification enabled");
    }


    // Send SSID, pwd, security and then connection request
    async function ConnectRequestButtonClick() {
      let encoder = new TextEncoder();
      let wifiSelectedBytes = encoder.encode(document.getElementById("Wifi_selected").value);
      let myWord = new Uint8Array(1+ wifiSelectedBytes.length);

      
      //Send SSiD
      myWord.set([0x01], 0);
      myWord.set(wifiSelectedBytes, 1);
      
      try {
        await WiFi_Configure.characteristic.writeValue(myWord);
        console.log("SSID send : " + myWord);
      }
        catch (error) {
        console.log('2 : Argh! ' + error);
      }

      //Save selected SSID
      selectedSsid = document.getElementById("Wifi_selected").value;

      // Send pwd 
      wifiSelectedBytes = encoder.encode(document.getElementById("pwd_text").value);

      let pwd = new Uint8Array(1 + wifiSelectedBytes.length);
      
      pwd.set([0x02], 0);
      pwd.set(wifiSelectedBytes, 1);

      try {
        await WiFi_Configure.characteristic.writeValue(pwd);
        console.log("pwd send : " + pwd);
      }
        catch (error) {
        console.log('2 : Argh! ' + error);
      }

      //Send security
      let securitySelectedBytes = document.getElementById("security_mode").value; //encoder.encode(
      
      let mySecurity = new Uint8Array(2);

      mySecurity.set([0x03], 0);
      mySecurity.set(securitySelectedBytes, 1);
      

      try {
        await WiFi_Configure.characteristic.writeValue(mySecurity);
        console.log("Security send : " + mySecurity);
      }
        catch (error) {
        console.log('2 : Argh! ' + error);
      }

      //Connect Request
      
      myWord = new Uint8Array(1);
      myWord[0] = 0x3;

      try {
          await WiFi_Control.characteristic.writeValue(myWord);
          createLogElement(myWord, 1, "Start scanning");
      }
      catch (error) {
          console.log('2 : Argh! ' + error);
      }

      // Clean all element
      document.getElementById("wifiList").innerHTML = "";
      document.getElementById("pwd_text").value = '';
      document.getElementById("security_mode").innerHTML = '';
    }

    // Ping Button -> Send Ping Request
    async function handlePing() {

      let myWord = new Uint8Array(1);
      myWord[0] = 0x5;

      try {
          await WiFi_Control.characteristic.writeValue(myWord);
          console.log('Ping Write send');
          createLogElement(myWord, 1, "Start Ping");
      }
      catch (error) {
          console.log('2 : Argh! ' + error);
      }
    }


    const [showDisconnect, setShowDisconnect] = useState(false);

    //Disconnect Button
    async function handleDisconnect() {
      let myWord = new Uint8Array(1);
      myWord[0] = 0x4;

      try {
          await WiFi_Control.characteristic.writeValue(myWord);
          createLogElement(myWord, 1, "Start scanning");
      }
      catch (error) {
          console.log('2 : Argh! ' + error);
      }
    
      // Back to no connection state
      setShowDisconnect(false);
      document.getElementById('wifi_state_img').src = no_wifi;
      updateWifiStatusText('Not connected');

      setShowPingTable(false);

    }


    function afficherWifi() {
      var wifiList = document.getElementById("wifiList");
      wifiList.innerHTML = ""; //Erase old content
    
      for (var i = 0; i < ssids.length; i++) {
        var ssid = String.fromCharCode.apply(null, ssids[i].ssid);
        var signalStrength = ssids[i].signal;
        var wifiItem = document.createElement("div");
        wifiItem.className = "wifiItem";
        var wifiIcon = document.createElement("img");
        wifiIcon.className = "wifi-icon";

        // Icon selection depending of signal strength
        if (signalStrength > -45) {
          wifiIcon.src = strong_signal;
        } else if (signalStrength > -60) {
          wifiIcon.src = good_signal;
        } else if (signalStrength > -75) {
          wifiIcon.src = weak_signal;
        } else {
          wifiIcon.src = very_weak_signal;
        }

        wifiItem.appendChild(wifiIcon);
        wifiItem.appendChild(document.createTextNode(ssid + " (Canal: " + ssids[i].channel + ")"));

        //Wifi selection logic
        wifiItem.onclick = function(ssid,security) {
          return function() {
            //selectedSsid = ssid;
            document.getElementById("Wifi_selected").value = ssid;
            console.log("SSID sélectionné : " + ssid);
            console.log(security);
            updateSecurityModes(security);
          };
        }(ssid, ssids[i].security);

        wifiList.appendChild(wifiItem);
      }
    }

    const SECURITY_MODES = {
      0x00: 'Open', // 0x00 – Open, no security
      0x01: 'WEP', // 0x01 – WEP
      0x02: 'WPA', // 0x02 – WPA
      0x03: 'WPA2', // 0x03 – WPA2
      0x04: 'WPA/WPA2', // 0x04 – WPA/WPA2
      0x05: 'WPA Enterprise', // 0x05 – WPA Enterprise
      0x06: 'WPA3', // 0x06 – WPA3
      0x07: 'WPA2/WPA3', // 0x07 – WPA2/WPA3
      0x08: 'Unknown' // 0x08 – Unknown
    };
    
    function updateSecurityModes(securityByte) {
      var securitySelect = document.getElementById('security_mode');
      var connectionReqButton = document.getElementById('connectButton');
      securitySelect.innerHTML = ''; // Clear the old content
    
      var noSecurity = 1;
      var maxBits = Object.keys(SECURITY_MODES).length; // Total number of security options
    
      for (var bit = 0; bit < maxBits; bit++) {
        // Check if the value of 'securityByte' matches a key in SECURITY_MODES
        if (securityByte === bit) {
          noSecurity = 0; // A security option is selected
          var modeName = SECURITY_MODES[bit] || 'Unsupported'; // Get the name of the security mode
    
          // Create a new option for the dropdown list
          var option = document.createElement('option');
          option.value = bit;
          option.textContent = modeName;
          securitySelect.appendChild(option); // Add the option to the dropdown list

          // Disable the connect button for specific security modes
          if (bit === 0x06 || bit === 0x07 || bit === 0x08) 
          {
            connectionReqButton.disabled = true;
          }
        }
      }
    
      // If no security option is selected, add 'Open'
      if (noSecurity) {
        var option = document.createElement('option');
        option.value = 0;
        option.textContent = 'Open';
        securitySelect.appendChild(option);
      }
    }
    
    


    const [showPingTable, setShowPingTable] = useState(false);
    const [pingDelay, setPingDelay] = useState(0); 
    const [pingCount, setPingCount] = useState(0); 
    const [pingPacketLost, setPacketLost] = useState(0); 

    /* API List handler */
    function notif_Ap_List_Handler(event){
      console.log("Notification received");
      var buf = new Uint8Array(event.target.value.buffer);
      
      createLogElement(buf, 1, "FanControl Status NOTIFICATION RECEIVED");
      
      console.log(buf);

      if (!ssids) {
        ssids = []; // Initialize
      }

      var buf_channel = [];
      var buf_signal_level = [];
      var buf_sec_flag = [];
      var buf_name = [];
      
      var i=1;
      buf_channel = buf[i];
      i = i + 1;
      buf_signal_level = buf[i] + (buf[i+1] << 8);
      if (buf_signal_level & 0x8000) {
        buf_signal_level = buf_signal_level - 0x10000;
      }
      i = i + 2;
      buf_sec_flag = buf[i] + (buf[i+1] << 8) + (buf[i+2] << 16) + (buf[i+3] << 24);
      i = i + 4;
      console.log(i);
      
      //var i=8;
      while (buf[i] > 0){
        buf_name[i-8] = buf[i];
        i++;
      }


      console.log(buf_name);
      //ssids.push(buf_name);

      ssids.push({
        ssid: buf_name,
        channel: buf_channel,
        signal: buf_signal_level,
        security: buf_sec_flag
      });

      ssids.sort(function(a, b) {
        return b.signal - a.signal; // Compare les niveaux de signal
      });

      clearInterval(interval_scanning);
      interval_scanning = null;

      afficherWifi()
    }

    function toggleWifiImage() {
      const wifiImage = document.getElementById('wifi_state_img');
      const currentSrc = wifiImage.getAttribute('src');

      if (currentSrc === no_wifi) {
        wifiImage.src = strong_signal;
      } else {
        wifiImage.src = no_wifi;
      }
    }

    /* Monitoring Handler */
    function notif_Monitoring_List_Handler(event){
      console.log("Notification received");
      var buf = new Uint8Array(event.target.value.buffer);
      
      createLogElement(buf, 1, "Wifi Monitoring NOTIFICATION RECEIVED");

      if(buf[0] == 0x03){
        interval_connection = setInterval(toggleWifiImage, 500); 
        updateWifiStatusText('Trying to connect to : ' + selectedSsid);
        
      }else if(buf[0] == 0x04){

        clearInterval(interval_connection);
        document.getElementById('wifi_state_img').src = strong_signal;
        selectedSsid = String.fromCharCode.apply(null, buf.slice(1)); // TBC
        updateWifiStatusText('Connected to : ' + selectedSsid);

        setShowDisconnect(true);
        console.log("What's happen");
      }else if(buf[0] == 0x05){
        setPacketLost(buf[1]);
        setPingCount(buf[2]);
        setPingDelay(buf[7]);
        setShowPingTable(true);



    //     const average_ping = (buf[4] << 24) | (buf[5] << 16) | (buf[6] << 8) | buf[7];


      }else if(buf[0] == 0x06){
        if(buf[1] == 0x01){
          console.log("Error connection ");
          clearInterval(interval_connection);
          document.getElementById('wifi_state_img').src = wifi_error;
          updateWifiStatusText("Couldn't connect to: " + selectedSsid);
        }
      }
      
      console.log(buf);
    }

    const [wifiStatusText, setWifiStatusText] = useState('Not Connected');

    // Update State Wifi Text
    const updateWifiStatusText = (newStatus) => {
      setWifiStatusText(newStatus);
    };


    const popoverScanButton = (
      <Popover id="popover-trigger-hover-focus" title="Popover bottom">
        <strong>Info :</strong> Start scanning WiFi <br />
      </Popover>
    );
    
    const popoverConnectionButton = (
      <Popover id="popover-trigger-hover-focus" title="Popover bottom">
        <strong>Info :</strong> Connect to the WiFi selected<br />
      </Popover>
    );


    /// Save for ping button in html div
    // {showDisconnect && (
    //   <div className="col-12">
    //     <button id="ping-button" className="btn btn-warning" onClick={handlePing}>
    //       Ping
    //     </button>
    //   </div>
    // )}

{/* <thead>
                      <tr>
                        <th>Ping Count</th>
                        <th>Average Ping Delay (ms)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pingDelays.map((delay, index) => (
                        <tr key={index}>
                          <td>{index+1}</td>
                          <td>{delay}</td>
                        </tr>
                      ))}
                    </tbody> */}

  return (
    <div className="container-fluid">
      <div className="container">
        <div className="row justify-content-center mt-3">
          <div className="col-12 col-md-6 col-lg-4 m-2 mb-6">

            <div className="d-flex justify-content-between">
              <button className="defaultButton w-100" type="button" onClick={ScanRequestButtonClick} id="scanButton">
                Wi-Fi Scan Request
              </button>

            </div>
            <div className="d-flex justify-content-between mt-3">
              <label htmlFor="Wifi_selected">SSID Selected:</label>
              <input type="text" id="Wifi_selected" value="Select your Wi-Fi" readOnly style={{ backgroundColor: "#f2f2f2" }} />
            </div>
            <div className="d-flex justify-content-between mt-3">
              <label htmlFor="pwd_text">Password:</label>
              <input type="text" id="pwd_text" />
            </div>
            <div className="d-flex justify-content-between mt-3">
              <label htmlFor="security_mode">Security: </label>
              <select type="text" id="security_mode" ></select>
            </div>
            <div className="d-flex justify-content-between mt-3">
              <button className="defaultButton w-100" type="button" onClick={ConnectRequestButtonClick} id="connectButton">
                Wi-Fi Connection Request
              </button>
            </div>

          </div>
          <div className="d-grid col-xs-12 col-sm-12 col-md-6 col-lg-4 m-2">
            <div className="wifiListContainer">
              <div className="wifiList" id="wifiList"></div>
            </div>
          </div>
        </div>

        <hr />

        <div className="row justify-content-center mt-3 wifi-container">
          <div className="col-12">
            <h2 className="wifi-state-title">Wifi State</h2>
            <p className="wifi-status-text">{wifiStatusText}</p>
          </div>


          <div class="content-wifi-wrapper">

            <div className="content-wifi-box">
              <img src={no_wifi} id='wifi_state_img' alt="Wifi State" className="wifi-state-image" />
              {showDisconnect && (
                <button id="disconnect-button" className="btn-wifi" onClick={handleDisconnect}> Disconnect </button>
              )}
            </div>

            <div className="content-wifi-box">
              {showPingTable && (
                <table class="ping-table">
                  <thead>
                    <tr>
                      <th>Ping Count</th>
                      <th>Average Ping Delay</th>
                      <th>Packet Lost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{pingCount}</td>
                      <td>{pingDelay}ms</td>
                      <td>{pingPacketLost} %</td>
                    </tr>
                  </tbody>
                </table>
              )}
              {showDisconnect && (
                <button id="ping-button" className="btn-wifi" onClick={handlePing}> Ping </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );


};

export default WifiCommissioning;
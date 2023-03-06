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


import React, { useState } from "react";
import logoST from '../images/st-logo.svg';

var myDevice;
let showAllDevices = false;

const Header = (props) => {

    function connection() {
        console.log('Requesting Bluetooth Device...');
        if(showAllDevices == false){
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
                }],

                optionalServices: ['0000fe40-cc7a-482a-984a-7f2ed5b3e58f', '0000180d-0000-1000-8000-00805f9b34fb','0000fe80-cc7a-482a-984a-7f2ed5b3e58f','0000fe80-8e22-4541-9d4c-21edae82fe80','0000fe20-cc7a-482a-984a-7f2ed5b3e58f', '0000feb0-cc7a-482a-984a-7f2ed5b3e58f', '00001809-0000-1000-8000-00805f9b34fb'] // service uuid of [P2P service, Heart Rate service, DataThroughput, Ota, P2P Router, Health Thermomiter]
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
                                service
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
                                    createLogElement(characteristic, 4 , 'CHARACTERISTIC')
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
            else {
                console.log("Bluetooth Device Filter is OFF");
                myDevice = navigator.bluetooth.requestDevice({
                    acceptAllDevices: true,
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
                                    service
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
                                        createLogElement(characteristic, 4 , 'CHARACTERISTIC')
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
        document.location.href="/Web_Bluetooth_App_WBA";
    }

    function onDisconnected() {
        console.log('HEADER - > Bluetooth Device disconnected');
        document.getElementById('connectButton').disabled = false;
        props.setIsDisconnected(true);
        props.setAllServices([]);
        document.location.href="/Web_Bluetooth_App_WBA";
      }
    


      
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
                        <input type="checkbox"id="checkboxFilter" />
                        <span class="checkmark"></span>
                    </label>
                    </div>
                </div>
            </div>
        </div>
    );
};







function checkBoxDeviceFilter() {
    // Get the checkbox
    var checkBox = document.getElementById("checkboxFilter");
    var inputSector = document.getElementById("nbSector");
    // If the checkbox is checked, display the output text
    if (checkBox.checked == true){
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
    function formatInterface(object, maxLevel, currentLevel){
        var str = '';
        var levelStr = '';
        if ( typeof currentLevel == "undefined" ) {
            currentLevel = 0;
        }

        // Text in a pre element is displayed in a fixed-width font, and it preserves both spaces and line breaks;
        if ( currentLevel == 0 ) {
            str = '<pre>';
        }

        for ( var x = 0; x < currentLevel; x++ ) {
            levelStr += '    ';
        }

        if ( maxLevel != 0 && currentLevel >= maxLevel ) {
            str += levelStr + '...</br>';
            return str;
        }

        if (currentLevel <= maxLevel ){
            for ( var property in object ) { 
                if (typeof object[property] != "function") { // if value is not type function
                    if ( typeof object[property] != "object" ) { // if value is not type object
                        str += levelStr + property + ': ' + object[property] + ' </br>';
                    } else if ( object[property] == null){
                        str += levelStr + property + ': null </br>';
                    } else {
                        str += levelStr + property + ': { </br>' + formatInterface( object[property], maxLevel, currentLevel + 1 ) + levelStr + '}</br>';
                    }
                }                
            }
        }
        if ( currentLevel == 0 ) {
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
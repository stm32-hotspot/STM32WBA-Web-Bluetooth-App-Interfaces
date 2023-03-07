// ******************************************************************************
// * @file    Ota.js
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
import React from 'react';
import imagelightOffBlue from '../images/lightOffBlue.svg';
import imagelightOnBlue from '../images/lightOnBlue.svg';
import imagelightOffPink from '../images/lightOffPink.svg';
import imagelightOnPink from '../images/lightOnPink.svg';
import { createLogElement } from "../components/Header";
import { OverlayTrigger, Popover } from 'react-bootstrap';
import iconInfo from '../images/iconInfo.svg';

// Device info Characteristic, remote device status
const NONE = "00";
const DETECTED = "01";
const CONNECTING = "02";
const DISCOVERING = "03";
const CONNECTED = "04";
const LOST = "05";

// Write forward Characteristic, led level
const LED_OFF = "00";
const LED_ON = "01";
const ALL_END_DEV = "FF";
const ALL_ON = "AA";
const ALL_OFF = "BB";

const SWITCH_OFF = "00";
const SWITCH_ON = "01";

const NB_DEVICES = 14;
const DEVICES_ALREADY_CREATED = false;

let allIconToggle = false;
let lightOn = [];
let toggleStress = true;


const P2Prouter = (props) => {
  let notifyCharacteristic;
  let ReadWriteCharacteristic;
  let deviceInfoCharacteristic;
  
  document.getElementById("readmeInfo").style.display = "none";

  // Filtering the different datathroughput characteristics

  props.allCharacteristics.map(element => {

    switch (element.characteristic.uuid) {
      case "0000feb2-8e22-4541-9d4c-21edae82ed19":
        notifyCharacteristic = element;
        notifyCharacteristic.characteristic.stopNotifications();
        break;
      case "0000feb1-8e22-4541-9d4c-21edae82ed19":
        ReadWriteCharacteristic = element;
        break;
      case "0000feb3-8e22-4541-9d4c-21edae82ed19":
        deviceInfoCharacteristic = element;
        break;
      default:
        console.log("# No characteristics found..");
    }
  });

  let devices = []; 
  
  function init(){    
    createDevices();
    deviceInfoCharacteristic.characteristic.startNotifications();
    deviceInfoCharacteristic.characteristic.oncharacteristicvaluechanged = notifHandler2;
    setTimeout(function() {      
      notifyCharacteristic.characteristic.startNotifications();
      notifyCharacteristic.characteristic.oncharacteristicvaluechanged = notifHandler;
    }, 500);
    document.getElementById("StartButton").style.display = "none";
    document.getElementById("headerLine").style.display = "flex";
    
  }
  
  function notifHandler2(event) { 
    var buf = new Uint8Array(event.target.value.buffer);
    console.log(buf);
    let bufHex = buf2hex(buf)
    //console.log(bufHex)
    let indexDev;
    let statusDev;
    let bdAddDev;
    let nameDev;
    let ledStatusDev;
    let switchStatusDev;
    let buf1, buf2, buf3, buf4, buf5, buf6;
    
    // Index of End Device
    indexDev = bufHex.slice(0,2); 
    indexDev = parseInt(indexDev, 16);

    // Status of End Device
    statusDev = bufHex.slice(2, 4); 

    // BD Adress of End Device
    buf1 = bufHex.slice(4, 6);
    buf2 = bufHex.slice(6, 8);
    buf3 = bufHex.slice(8, 10);
    buf4 = bufHex.slice(10, 12);
    buf5 = bufHex.slice(12, 14);
    buf6 = bufHex.slice(14, 16);
    bdAddDev = buf1 + ":" + buf2 + ":" + buf3 + ":" + buf4 + ":" + buf5 + ":" + buf6; 

    // LED and Switch Status of End Device
    ledStatusDev = bufHex.slice(16, 18);
    switchStatusDev = bufHex.slice(18, 20);

    // Name of End Device
    nameDev = bufHex.slice(20, bufHex.length-2);
    nameDev = hexToASCII(nameDev);
   

    console.log(" ----  info du end device ---- ");
    console.log("Index : ", indexDev);    
    console.log("Status : ", statusDev);
    console.log("BD Add : ", bdAddDev);
    console.log("Led Status : ", ledStatusDev);
    console.log("Switch Status : ", switchStatusDev);
    console.log("Name : ", nameDev);
    console.log(" ----  info du end device ---- ");

    devices[indexDev].index_ = indexDev;
    devices[indexDev].statusDev_ = statusDev;
    devices[indexDev].bdAdd_ = bdAddDev.toUpperCase();
    devices[indexDev].lightStatus_ = ledStatusDev;
    lightOn[indexDev] = ledStatusDev;
    devices[indexDev].notifStatus_ = switchStatusDev;
    devices[indexDev].name_ = nameDev;



    displayDevice(indexDev);
    updateLedBtn(indexDev);
    updateSwitchBtn(indexDev);
  }


  function hexToASCII(hex) {
    var result = '';
    for (var i = 0; i < hex.length; i += 2) {
      result += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return result;
  }

  function buf2hex(buffer) { // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
  }

  // Write button handler
  async function onWriteButtonClick() {
    let myInput = document.getElementById('writeInput').value;
    let myWord = new Uint8Array(2);
    myWord[0] = myInput.slice(0, 2);
    myWord[1] = myInput.slice(2, 4);
    try {
      await ReadWriteCharacteristic.characteristic.writeValue(myWord);
      createLogElement(myWord, 1, "P2Pserver WRITE");
    }
    catch (error) {
      console.log('2 : Argh! ' + error);
    }
  }

  // Enable Light image handler
  async function onEnableLightClick(index) {
    let myWord;
    let btnLight = document.getElementById("light" + index);
    try {
      if (lightOn[index] === LED_OFF) {
        lightOn[index] = LED_ON;
        myWord = new Uint8Array(2);
        myWord[0] = index;
        myWord[1] = parseInt(LED_ON, 16);
        
       /* btnLight.innerHTML = "ON";
        btnLight.className = "btnLightON";*/
        console.log("Send Light ON msg : ");
        console.log(myWord); 
        await ReadWriteCharacteristic.characteristic.writeValue(myWord);
        console.log("log element : ");
        createLogElement(myWord, 1, "P2Prouter WRITE");        
      } else {
        lightOn[index] = LED_OFF;
        myWord = new Uint8Array(2);
        myWord[0] = index;
        myWord[1] = parseInt(LED_OFF, 16);     
        
        /*btnLight.innerHTML = "OFF";
        btnLight.className = "btnLightOFF"*/
        console.log("Send Light OFF msg : ");

        console.log(myWord);
        await ReadWriteCharacteristic.characteristic.writeValue(myWord);
        createLogElement(myWord, 1, "P2Prouter WRITE");
      }
      console.log("### On est avant l update du boutton.");
      console.log("Light Status = ", devices[index].lightStatus_);

      updateLedBtn(index);
    }
    catch (error) {
      console.log('2 : Argh! ' + error);
    }
  }

  async function chenillardStressWF(){
    console.log("*****STRESS******");
    //setTimeout(function() { 
     /*
      for(let i = 0; i<NB_DEVICES; i++){
        if(devices[i].statusDev_ === CONNECTED){
          //setTimeout(function() {      
            onEnableLightClick(i);
            if(i === (NB_DEVICES-1)){
              i=0;
              console.log("I = 0 ");

            }
          //}, 1000);
        }
      }
      */
     while(toggleStress == true) {
      toggleStress =false;
      console.log("!= true");
     }
    toggleAllEndDevices();
      

   // }, 1000);
   
    console.log("**************");
  }

  async function toggleAllEndDevices(){
    let myWord;

    if(allIconToggle === false){
      allIconToggle = true;
      //document.getElementById("allIcon").style.filter = "";
      myWord = new Uint8Array(2);
      myWord[0] = parseInt(ALL_END_DEV, 16);
      myWord[1] = parseInt(LED_ON, 16);
      console.log("Toggle All End Devices ON: ");
      console.log(myWord); 
  
      for(let i = 0; i<NB_DEVICES; i++){
        if(devices[i].statusDev_ === CONNECTED){
          lightOn[i] = LED_ON;
        }
      }
    }
    else {
      allIconToggle = false;
      //document.getElementById("allIcon").style.filter = "grayscale(100%)";
      myWord = new Uint8Array(2);
      myWord[0] = parseInt(ALL_END_DEV, 16);
      myWord[1] = parseInt(LED_OFF, 16);
      console.log("Toggle All End Devices OFF: ");
      console.log(myWord); 
      for(let i = 0; i<NB_DEVICES; i++){
        if(devices[i].statusDev_ === CONNECTED){
          lightOn[i] = LED_OFF;
        }
      }
    }
    await ReadWriteCharacteristic.characteristic.writeValue(myWord);

    
    setTimeout(function() { 
        
      toggleStress = true;
      chenillardStressWF();   
    }, 1000);
  }






  // notification handler
  function notifHandler(event) {
    console.log("Notification received");
    var buf = new Uint8Array(event.target.value.buffer);
    console.log(buf);
  
    let index = buf[0]; 
    let btnNotif = document.getElementById("notif" + index);    

    if (buf[1].toString() === "1") {
      devices[index].notifStatus_ = SWITCH_ON;
      //btnNotif.innerHTML = "ON";
      //btnNotif.className = "btnNotifON"
    } else {
      devices[index].notifStatus_ = SWITCH_OFF;
      //btnNotif.innerHTML = "OFF";
      //btnNotif.className = "btnNotifOFF"
    }
    updateSwitchBtn(index);
  }




  function createDevices(){ 
   for(let i = 0; i<NB_DEVICES; i++){
        devices.push(new Device(i, NONE, "000000000000", "unknown", false, false));
    }
  }







  function displayDevice(index){
    if(devices[index].statusDev_ != NONE){
      console.log("displaying device of index : ");
      console.log(index);

      var myElem = document.getElementById(index);
      if (myElem === null) {
        let card = document.createElement("div") // creates a div element for the Card
        card.className = "smallBoxDevice" // Sets the class name so we can style it with CSS
        card.id = index;
        document.body.appendChild(card) // Adds the card to the body
    
        let indexDisplay = document.createElement("p"); // creates A paragraph element
        indexDisplay.className = "pIndex";
        indexDisplay.innerText = devices[index].index_; // sets the text inside it to "Make: " + the device's make
        card.appendChild(indexDisplay) // adds the element to the card
    
        let statusDisplay = document.createElement("p"); // creates A paragraph element
        statusDisplay.innerText = statusInterpretation(devices[index].statusDev_); // sets the text inside it to "Make: " + the device's make
        statusDisplay.id = index + "status";
        statusDisplay.className = "pStatus";
        card.appendChild(statusDisplay) // adds the element to the card

        let name = document.createElement("p"); // creates A paragraph element
        name.innerText = devices[index].name_; // sets the text inside it to "Make: " + the device's make
        name.className = "pName";
        card.appendChild(name) // adds the element to the card
    
        let bdAdd = document.createElement("p"); // creates A paragraph element
        bdAdd.innerText = devices[index].bdAdd_; // sets the text inside it to "Model: " +  device's model
        bdAdd.className = "pBd";
        card.appendChild(bdAdd) // adds the element to the card

        console.log("bd add ", devices[index].bdAdd_);

        let btnLight = document.createElement("button");
        btnLight.className = "btnLightOFF"
        btnLight.innerHTML = "OFF"; 
        btnLight.id = "light" + index
        btnLight.onclick = function () {onEnableLightClick(index)};
        card.appendChild(btnLight);

        let btnNotif = document.createElement("button");
        btnNotif.className = "btnNotifOFF"
        btnNotif.innerHTML = "0"; 
        btnNotif.disabled = true; 
        btnNotif.id = "notif" + index
        card.appendChild(btnNotif);
      }
      else {
        console.log(" On Update le Device ! ");

        var myElem = document.getElementById(index + "status");
        myElem.innerText = statusInterpretation(devices[index].statusDev_);


        
        
        
      }
    }
  }


  function updateLedBtn (index) {
    var btnLight = document.getElementById("light" + index);
    if (devices[index].lightStatus_ == LED_OFF){
      console.log(">> BTN LED OFF");
      btnLight.innerHTML = "OFF";
      btnLight.className = "btnLightOFF";
    } 
    else if(devices[index].lightStatus_ == LED_ON){
      console.log(">> BTN LED ON");
      btnLight.innerHTML = "ON";
      btnLight.className = "btnLightON";
    }
  } 


  function updateSwitchBtn (index){
    var btnNotif = document.getElementById("notif" + index);
    if (devices[index].notifStatus_ == SWITCH_OFF){
      console.log(">> BTN Switch OFF");
      btnNotif.innerHTML = "0";
      btnNotif.className = "btnNotifOFF";
    } 
    else if (devices[index].notifStatus_ == SWITCH_ON){
      console.log(">> BTN Switch ON");
      btnNotif.innerHTML = "1";
      btnNotif.className = "btnNotifON";
    }
  }


  function statusInterpretation(value){
    if(value == NONE)             return "NONE \t \t ";
    else if(value == DETECTED)    return "DETECTED \t \t";
    else if(value == CONNECTING)  return "CONNECTING ";
    else if(value == DISCOVERING) return "DISCOVERING";
    else if(value == CONNECTED)   return "CONNECTED  ";
    else if(value == LOST)        return "LOST       ";
  }



  class Device{
    constructor(index, statusDev, bdAdd, name, lightStatus, notifStatus){
      this.index_ = index;
      this.statusDev_ = statusDev;
      this.bdAdd_ = bdAdd;
      this.name_ = name;
      this.lightStatus_ = lightStatus;
      this.notifStatus_ = notifStatus;
    }
  }
//<div className="container-fluid">
//<div className="container">


//<button className="secondaryButton me-1" type="button" onClick={chenillardStressWF} id="">STRESS</button>
 


  return (
  
  <div className='bigBoxDevices'>
    
    <button className="secondaryButton me-1" type="button" onClick={init} id="StartButton">START</button>
    
    <div className='headerLine smallBoxDevice' id="headerLine" style={{"display": "none"}}>
      <p className='pIndex'> Index </p>
      <p className='pStatus'> Status </p>
      <p className='pName'> Name </p>
      <p className='pBd'> Bd Address </p>
      <p className='pLED'> LED Status </p>
      <p className='pAlert'> Button Status </p>

    </div>


  </div>

  );
};

export default P2Prouter;
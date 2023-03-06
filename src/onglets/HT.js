// ******************************************************************************
// * @file    P2Pserver.js
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
import React, { useState } from 'react';
import imagelightOffBlue from '../images/lightOffBlue.svg';
import imagelightOnBlue from '../images/lightOnBlue.svg';
import imagelightOffPink from '../images/lightOffPink.svg';
import imagelightOnPink from '../images/lightOnPink.svg';
import iconInfo from '../images/iconInfo.svg';
import { createLogElement } from "../components/Header";
import { OverlayTrigger, Popover } from 'react-bootstrap';


const ARMPIT = "01";
const BODY = "02";

const HT = (props) => {
  let IndicateCharacteristic;
  let ReadWriteIndicateCharacteristic;
  let NotifyCharacteristic;
  let ReadCharacteristic

  let currentTemperature = 0;
  let INITVAL = 255;
  let maxTemp = INITVAL;
  let minTemp = INITVAL;
  
  let location;
  let tempMeasurement;
  let year;
  let month;
  let day;

  // Filtering the different datathroughput characteristics
  props.allCharacteristics.map(element => {
    switch (element.characteristic.uuid) {
      case "00002a1c-0000-1000-8000-00805f9b34fb":
        IndicateCharacteristic = element; // Temperature Measurement (TEMM)
        IndicateCharacteristic.characteristic.startNotifications();
        IndicateCharacteristic.characteristic.oncharacteristicvaluechanged = temperatureMeasurement;

        break;
      case "00002a1d-0000-1000-8000-00805f9b34fb":
        ReadCharacteristic = element; // Temperature Type
        readTemperatureType();
        break;
      case "00002a1e-0000-1000-8000-00805f9b34fb":
        NotifyCharacteristic = element; //Immediate Temperature
        NotifyCharacteristic.characteristic.startNotifications();
        NotifyCharacteristic.characteristic.oncharacteristicvaluechanged = notifHandler;
              break; 
      case "00002a21-0000-1000-8000-00805f9b34fb":
        ReadWriteIndicateCharacteristic = element; // Measurement Interval
        readMeasurementInterval();
        break;
      default:
        console.log("# No characteristics found..");
    }
  });
  
  document.getElementById("readmeInfo").style.display = "none";




  function buf2hex(buffer) { // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
  }




  function temperatureMeasurement(event){
    console.log(" >> Indication received : ");
    var buf = new Uint8Array(event.target.value.buffer);
    console.log(buf);
    let bufHex = buf2hex(buf);
    console.log(bufHex);

    tempMeasurement = buf[1];
    year = bufHex.slice(12, 14) + bufHex.slice(10, 12);
    year = parseInt(year, 16);
    month = buf[7];
    day = buf[8];
    location = buf[12];

    if(location == 1){
      location = "Armpit";
    } else if(location == 2){
      location = "Body";
    } else {
      location = "Undifined";
    }

    if (month < 10) {
      month = "0" + month;
    }
    if (day < 10) {
      day = "0" + day;
    }

    console.log("----- Indication Received -----");
    console.log("Temperature : ", tempMeasurement);
    console.log("Year : ", year);
    console.log("Month : ", month);
    console.log("Day : ", day);
    console.log("Location : ", location);
    console.log("-------------------------------");

    var temp = document.getElementById("temp");
    temp.innerText = tempMeasurement + " C°";
    
    var loc = document.getElementById("location");
    loc.innerText = location;
    
    var date = document.getElementById("date");
    date.innerText = year + "/" + month + "/" + day;



  }




  // notification handler
  function notifHandler(event) {
    console.log("Notification received");
    var buf = new Uint8Array(event.target.value.buffer);
    console.log(buf);
    currentTemperature = buf[1];
    // Init Values
    if(minTemp == INITVAL) minTemp = currentTemperature;
    if(maxTemp == INITVAL) maxTemp = currentTemperature;
    
    if(currentTemperature > maxTemp){
      maxTemp = currentTemperature;
    }
    else if(currentTemperature < minTemp){
      minTemp = currentTemperature;
    }

    console.log("Temperature : ", currentTemperature);
    console.log("Max Temp : ", maxTemp);
    console.log("Min Temp : ", minTemp);



    var current = document.getElementById("curTemp");
    current.innerText = currentTemperature + " C°";
    
    var min = document.getElementById("minTemp");
    min.innerText = minTemp + " C°";
    
    var max = document.getElementById("maxTemp");
    max.innerText = maxTemp + " C°";

  }

 
  // read button handler
  async function readTemperatureType() {
    var value = await ReadCharacteristic.characteristic.readValue();
    console.log("Temperature Type : ", value)
    let statusWord = new Uint16Array(value.buffer);
    console.log(statusWord);
    //document.getElementById('readLabel').innerHTML = "0x" + statusWord.toString();
    createLogElement(statusWord, 1, "HEART RATE READ");
  }

  async function readMeasurementInterval() {
    var value = await ReadWriteIndicateCharacteristic.characteristic.readValue();
    console.log("Measurement Interval : ", value)
    let statusWord = new Uint16Array(value.buffer);
    console.log(statusWord);
  }

  return (
      <div className="tempPannel">
      
        <div className='rcorners3' id="temperatureMeasurement">

          <div className='tempContainer tempTitle'> 
            <span className='gap'>  </span>
            <span className='tempInfo underlineTitle'> Temperature Measurement </span>
            <span className='gap'>  </span>
          </div>

          <div className='tempContainer'> 
            <span className='tempInfo tempSubTitle'> Temperature </span>
            <span className='tempInfo tempSubTitle'> Location</span>
            <span className='tempInfo tempSubTitle'> Date</span>
          </div>

          <div className='tempContainer'> 
            <span className='tempInfo' id='temp'> </span>
            <span className='tempInfo' id='location'> </span>
            <span className='tempInfo' id='date'> </span>
          </div>

        </div>


        <div className='rcorners3' id="intermediateTemperature">

          <div className='tempContainer tempTitle'> 
            <span className='gap'>  </span>
            <span className='tempInfo underlineTitle'> Intermediate Temperature </span>
            <span className='gap'>  </span>
          </div>

          <div className='tempContainer'> 
            <span className='tempInfo tempSubTitle'> Min </span>
            <span className='tempInfo tempSubTitle'> Actual</span>
            <span className='tempInfo tempSubTitle'> Max</span>
          </div>

          <div className='tempContainer'> 
            <span className='tempInfo' id='minTemp'> </span>
            <span className='tempInfo' id='curTemp'> </span>
            <span className='tempInfo' id='maxTemp'> </span>
          </div>

        </div>

        






      </div>
     
  );
};

export default HT;
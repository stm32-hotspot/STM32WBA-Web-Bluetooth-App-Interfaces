// ******************************************************************************
// * @file    BloodPressure.js
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
import imagebloodpressure from '../images/bloodpressure.svg';
import boxicons from 'boxicons';


const BloodPressure = (props) => {
  let IndicateCharacteristic;
  let ReadWriteIndicateCharacteristic;
  let NotifyCharacteristic;
  let ReadCharacteristic

  
  let min;
  let max;
  let map;
  let pulse;

  // Filtering the different datathroughput characteristics
  props.allCharacteristics.map(element => {
    switch (element.characteristic.uuid) {
      case "00002a35-0000-1000-8000-00805f9b34fb":
        IndicateCharacteristic = element; // Blood Pressure Measurement 
        IndicateCharacteristic.characteristic.startNotifications();
        IndicateCharacteristic.characteristic.oncharacteristicvaluechanged = BloodPressureMeasurement;

        break;
      case "00002a49-0000-1000-8000-00805f9b34fb":
        ReadCharacteristic = element; // Blood Pressure Feature (Status)
        readStatus();
        break;
      case "00002a36-0000-1000-8000-00805f9b34fb":
        NotifyCharacteristic = element; //Intermediate Cuff Pressure
        NotifyCharacteristic.characteristic.startNotifications();
        NotifyCharacteristic.characteristic.oncharacteristicvaluechanged = element;
              break; 

      default:
        console.log("# No characteristics found..");
    }
  });
  
  document.getElementById("readmeInfo").style.display = "none";




  function buf2hex(buffer) { 
    return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
  }




  function BloodPressureMeasurement(event) {
    console.log(" >> Indication received : ");
    var buf = new Uint8Array(event.target.value.buffer);
    const dataView = event.target.value;
    console.log(buf);
    let bufHex = buf2hex(buf); 
    console.log(bufHex);
  
    let min = buf[1];    // MIN
    let max = buf[3];    // MAX
    let map = buf[5];    // MAP
    let pulse = buf[14]; // Pulse
  
    let measurementStatus;
    let bodyMovementDetected, cuffFitDetected, irregularPulseDetected, pulseRateWithinRange, measurementPositionDetected;
  
    let offset = 1; 
  

    const flags = dataView.getUint8(0);
  
    if (flags & (1 << 3)) {
      measurementStatus = dataView.getUint16(offset, true);
      offset += 2;
  

      bodyMovementDetected = (measurementStatus & (1 << 0)) !== 0;
      cuffFitDetected = (measurementStatus & (1 << 1)) !== 0;
      irregularPulseDetected = (measurementStatus & (1 << 2)) !== 0;
      pulseRateWithinRange = (measurementStatus & (1 << 3)) !== 0;
      measurementPositionDetected = (measurementStatus & (1 << 4)) !== 0;
    }
  
    console.log("----- Indication Received -----");
    console.log("MIN : ", min);
    console.log("MAX : ", max);
    console.log("MAP : ", map);
    console.log("Pulse : ", pulse);
    if (measurementStatus !== undefined) {
      updateStatusElement("movementStatusCard", !bodyMovementDetected, "No body movement during measurement", "Body movement detected during measurement");

      updateStatusElement("pulseStatusCard", pulseRateWithinRange, "Pulse rate is within the range", "Pulse rate is out of range");

      updateStatusElement("cuffStatusCard", !cuffFitDetected, "Cuff fit is proper", "Cuff too loose");

      updateStatusElement("positionStatusCard", !measurementPositionDetected, "Measurement position is proper", "Improper measurement position");

      updateStatusElement("irregularPulseStatusCard", !irregularPulseDetected, "No irregular pulse detected", "Irregular pulse detected");
    }
    console.log("-------------------------------");
  
    var mn = document.getElementById("mn");
    mn.innerText = min;
    
    var mx = document.getElementById("mx");
    mx.innerText = max;
    
    var mp = document.getElementById("mp");
    mp.innerText = map;
  
    var p = document.getElementById("p");
    p.innerText = pulse;
  }

  async function readStatus() {
    var value = await ReadCharacteristic.characteristic.readValue();
    let statusWord = new Uint8Array(value.buffer);
    console.log("Status : ", statusWord);
  
    let binaryString = statusWord[0].toString(2).padStart(8, '0');
  

    let bodyMovementDetectionSupport = binaryString[7] === '1'; 
    let cuffFitDetectionSupport = binaryString[6] === '1';
    let irregularPulseDetectionSupport = binaryString[5] === '1';
    let pulseRateRangeDetectionSupport = binaryString[4] === '1';
    let measurementPositionDetectionSupport = binaryString[3] === '1';
  

    console.log("Status: ", binaryString);
    console.log("Body Movement Detection Support: ", bodyMovementDetectionSupport);
    console.log("Cuff Fit Detection Support: ", cuffFitDetectionSupport);
    console.log("Irregular Pulse Detection Support: ", irregularPulseDetectionSupport);
    console.log("Pulse Rate Range Detection Support: ", pulseRateRangeDetectionSupport);
    console.log("Measurement Position Detection Support: ", measurementPositionDetectionSupport);
  }


  function updateStatusElement(elementId, status, positiveText, negativeText) {
    const container = document.getElementById(elementId);
    let newIconHTML;
  
    if (status) {
      newIconHTML = `<box-icon name='check-circle' type='solid' size='md' color='#50e008'></box-icon>`;
      container.innerHTML = newIconHTML + `<h3 class="passion__title2"><strong>${positiveText}</strong></h3>`;
    } else {
      newIconHTML = `<box-icon name='x-circle' type='solid' size='md' color='#fb1107'></box-icon>`;
      container.innerHTML = newIconHTML + `<h3 class="passion__title2"><strong>${negativeText}</strong></h3>`;
    }
  }



  return (
    <><script src="https://unpkg.com/boxicons@2.1.3/dist/boxicons.js"></script>
    <div className="tempPannel">

      <div className="titlebox">
        <img src={imagebloodpressure} alt="" className="BLPlogo"></img>
        <h3><strong>Blood Pressure Measurement</strong></h3>
      </div>

      <div class="passion__container container grid">

        <div class="passion__card">
          <h3 class="passion__title">M I N</h3>
            <div class="unite">
              <box-icon name='down-arrow-alt' pull='left' size='m' animation='burst' color='#74747c'></box-icon>
              <p><strong>mmHg</strong></p>
            </div>
          <span className='BLPInfo' id='mn'> </span>
        </div>

        <div class="passion__card">
        <h3 class="passion__title">M A X</h3>
          <div class="unite">
              <box-icon name='up-arrow-alt' pull='left' size='m' animation='burst' color='#74747c'></box-icon>
              <p><strong>mmHg</strong></p>
            </div>
          <span className='BLPInfo' id='mx'> </span>
        </div>

        <div class="passion__card">
          <h3 class="passion__title">M A P</h3>
            <div class="unite">
              <box-icon name='down-arrow-alt' pull='left' size='m' animation='burst' color='#74747c'></box-icon>
              <box-icon name='up-arrow-alt' pull='left' size='m' animation='burst' color='#74747c'></box-icon>
              <p><strong>mmHg</strong></p>
            </div>
          <span className='BLPInfo' id='mp'> </span>
        </div>

        <div class="passion__card">
          <h3 class="passion__title">P u l s e</h3>
            <div class="unite">
              <box-icon name='heart' type='solid' pull='left' size='m' animation='burst' color='#74747c'></box-icon>
              <p><strong>mmHg</strong></p>
            </div>
          <span className='BLPInfo' id='p'> </span>
        </div>

      </div>


      <div className="titlebox2">
        <h3><strong>Measurement Status</strong></h3>
      </div>

      <div class="passion__container2 container grid">
        <div class="passion__card2" id="pulseStatusCard">
          <div class="unite">
            <box-icon id="pulseStatusIcon" name='check-circle' type='solid' size='md' color='#50e008'></box-icon>
            <h3 id="pulseStatusText" class="passion__title2"><strong>Pulse rate is within the range</strong></h3>
          </div>
        </div>

        <div class="passion__card2" id="cuffStatusCard">
          <div class="unite">
            <box-icon id="cuffStatusIcon" name='x-circle' size='md' type='solid' color='#fb1107'></box-icon>
            <h3 id="cuffStatusText" class="passion__title2"><strong>Cuff too loose</strong></h3>
          </div>
        </div>

        <div class="passion__card2" id="positionStatusCard">
          <div class="unite">
            <box-icon id="positionStatusIcon" name='x-circle' size='md' type='solid' color='#fb1107'></box-icon>
            <h3 id="positionStatusText" class="passion__title2"><strong>Improper measurement position</strong></h3>
          </div>
        </div>

        <div class="passion__card2" id="irregularPulseStatusCard">
          <div class="unite">
            <box-icon id="irregularPulseStatusIcon" name='check-circle' type='solid' size='md' color='#50e008'></box-icon>
            <h3 id="irregularPulseStatusText" class="passion__title2"><strong>No irregular pulse detected</strong></h3>
          </div>
        </div>
      </div>

    <div class="passion__container3 container grid">

      <div class="passion__card3 " id="movementStatusCard">
        <div class="unite">
          <box-icon id="movementStatusIcon" name='check-circle' type='solid' size='md' color='#50e008' ></box-icon>
          <h3 id="movementStatusText" class="passion__title2"><strong>No body movement during measurement</strong></h3>
        </div>
      </div>


    </div>

    </div></>
     
  );
};

export default BloodPressure;
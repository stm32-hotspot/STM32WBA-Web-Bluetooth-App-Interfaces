// ******************************************************************************
// * @file    GCM.js
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
import React, { useState, useRef, useEffect } from 'react';
import { createLogElement } from "../components/Header";
import { Chart, registerables } from 'chart.js';
import iconInfo from '../images/iconInfo.svg';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import glucoselogo from '../images/glucose-meter.svg';
import boxicons from 'boxicons';
import crc from 'crc';
Chart.register(...registerables);



const ContinuousGlucoseMonitoring = (props) => {
    let IndicateCharacteristic;
    let ReadWriteCharacteristic;
    let NotifyCharacteristic;
    let ReadCharacteristic;
    let ReadIndicateCharacteristic;
    let WriteIndicateCharacteristic;
    let WriteCharacteristic;

    const gcChartContainer = useRef(null);
  
    const [gcChart, setgcChart] = useState(null);

    const [selectedOperator, setSelectedOperator] = useState('AllRecords');

    const [selectedSocpOperator, setSelectedSocpOperator] = useState('SetCGMcommunicationinterval');

    const [sequenceNumber, setSequenceNumber] = useState('');

    const [sequenceNumberMin, setSequenceNumberMin] = useState('');

    const [sequenceNumberMax, setSequenceNumberMax] = useState('');

    const [calibrationTime, setCalibrationTime] = useState('');

    const [nextCalibrationTime, setNextCalibrationTime] = useState('');

    const [calibrationDataRecordNumber, setcalibrationDataRecordNumber] = useState('');

    const [startTime, setStartTime] = useState('');

    let gcDataSet = [];
    let gcTime = [];
  
    const createChartConfig = (label, title, color) => {
      return {
        type: "line",
        data: {
          labels: [], 
          datasets: [{
            label: label,
            borderColor: color,
            backgroundColor: color,
            fill: false, 
            data: [], 
          }],
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          transition: {
            duration: 0,
          },
          plugins: {
            legend: { 
              display: false
            },
            title: {
              position: 'top',
              align: 'center',
              display: true,
              text: title,
              font: {
                size: 20,
              }
            },
          },
  
        }
      };
    };

    useEffect(() => {
      if (gcChartContainer.current) {
          const newgcChart = new Chart(gcChartContainer.current, gcChartConfig);
          setgcChart(newgcChart);
      }

      if (WriteIndicateCharacteristic && WriteIndicateCharacteristic.characteristic) {
        WriteIndicateCharacteristic.characteristic.startNotifications()
          .then(() => {
            WriteIndicateCharacteristic.characteristic.addEventListener('characteristicvaluechanged', handleRacpIndication);
          })
          .catch(error => {
            console.error('Error starting indications for RACP:', error);
          });
      }

      if (IndicateCharacteristic && IndicateCharacteristic.characteristic) {
        IndicateCharacteristic.characteristic.startNotifications()
          .then(() => {
            IndicateCharacteristic.characteristic.addEventListener('characteristicvaluechanged', handleSocpIndication);
          })
          .catch(error => {
            console.error('Error starting indications for SOCP:', error);
          });
      }

      return () => {
        if (gcChart) gcChart.destroy();
        if (WriteIndicateCharacteristic && WriteIndicateCharacteristic.characteristic) {
          WriteIndicateCharacteristic.characteristic.removeEventListener('characteristicvaluechanged', handleRacpIndication);
          WriteIndicateCharacteristic.characteristic.stopNotifications();
        }
        if (IndicateCharacteristic && IndicateCharacteristic.characteristic) {
          IndicateCharacteristic.characteristic.removeEventListener('characteristicvaluechanged', handleSocpIndication);
          IndicateCharacteristic.characteristic.stopNotifications();
        }
      };
    }, [WriteIndicateCharacteristic, IndicateCharacteristic]);

    const gcChartConfig = createChartConfig('Glucose Concentration', 'Glucose Concentration Chart', '#03234B');

    const updateDataset = (chart, datasetIndex, newData, newLabel) => {
      if (!chart) {
        console.error('Chart instance is not yet initialized.');
        return;
      }

      const GRAPH_MAX_LABELS = 30; 
    
     
      if (chart.data.labels.length >= GRAPH_MAX_LABELS) {
        chart.data.labels.pop(); // Remove the last element
        chart.data.datasets[datasetIndex].data.pop(); // Remove the last element
      }
    
      chart.data.labels.unshift(newLabel); // Add current time at the beginning of the Array
      chart.data.datasets[datasetIndex].data.unshift(newData); // Add new data at the beginning of the Array
    

      chart.update();
    }



  props.allCharacteristics.map(element => {
    switch (element.characteristic.uuid) {

      case "00002aa8-0000-1000-8000-00805f9b34fb":
        ReadIndicateCharacteristic = element; // CGM Feature
        readFeature();
        break;

      case "00002aa9-0000-1000-8000-00805f9b34fb":
        ReadCharacteristic = element; // CGM Status
        readStatus();
        break;

      case "00002aaa-0000-1000-8000-00805f9b34fb":
            ReadCharacteristic = element; // CGM Session Start Time
            WriteCharacteristic = element;
            readStartTime();
        break;

      /*case "00002aab-0000-1000-8000-00805f9b34fb":
            ReadCharacteristic = element; // CGM Session Run Time
            readRunTime();
        break;*/

      case "00002aa7-0000-1000-8000-00805f9b34fb":
        NotifyCharacteristic = element; //CGM Measurement
        NotifyCharacteristic.characteristic.startNotifications();
        NotifyCharacteristic.characteristic.oncharacteristicvaluechanged = notifHandler;
            break; 

      case "00002a52-0000-1000-8000-00805f9b34fb":
        WriteIndicateCharacteristic = element; // Record Acces Control Point
 
       break;

     case "00002aac-0000-1000-8000-00805f9b34fb":
        IndicateCharacteristic = element; // Specific Ops Control Point 
       break;

      default:
        console.log("# No characteristics found..");
    }
  });

  
  
  document.getElementById("readmeInfo").style.display = "none";

  function notifHandler(event) {
    console.log("Notification Received");
    var buf = new Uint8Array(event.target.value.buffer);
    console.log(buf);

  
    let recordSize = buf[0];

  
    let flags = buf[1];


    let glucoseConcentrationRaw = buf[2] | (buf[3] << 8);
    let glucoseConcentration = glucoseConcentrationRaw; 
    

    // Time Offset
    let timeOffset = buf[4] | (buf[5] << 8);
    updateDataset(gcChart, 0, glucoseConcentration, timeOffset);

    // Sensor Status Annunciation (if present)
    let sensorStatusAnnunciation = { status: null, calTemp: null, warning: null };
    let currentIndex = 6; 

    if (flags & (1 << 7)) { // Status field present
        sensorStatusAnnunciation.status = buf[currentIndex];
        currentIndex++;
    }
    if (flags & (1 << 6)) { // Cal/Temp field present
        sensorStatusAnnunciation.calTemp = buf[currentIndex];
        currentIndex++;
    }
    if (flags & (1 << 5)) { // Warning field present
        sensorStatusAnnunciation.warning = buf[currentIndex];
        currentIndex++;
    }

        // Interpret the status bits
        let sessionStopped = (sensorStatusAnnunciation.status & (1 << 0)) !== 0;
        let batteryLow = (sensorStatusAnnunciation.status & (1 << 1)) !== 0;
        let incorrectsesnsortype = (sensorStatusAnnunciation.status & (1 << 2)) !== 0;
        let sensormalfunction= (sensorStatusAnnunciation.status & (1 << 3)) !== 0;
        let devspecificalert = (sensorStatusAnnunciation.status & (1 << 4)) !== 0;
        let devicefault = (sensorStatusAnnunciation.status & (1 << 5)) !== 0;

    
        // Interpret the Cal/Temp bits
        let timeSyncRequired = (sensorStatusAnnunciation.calTemp & (1 << 0)) !== 0; 
        let calibrationNotAllowed = (sensorStatusAnnunciation.calTemp & (1 << 1)) !== 0;
        let calibrationRecommed = (sensorStatusAnnunciation.calTemp & (1 << 2)) !== 0;
        let calibrationRequired = (sensorStatusAnnunciation.calTemp & (1 << 3)) !== 0;
        let sensorTempHigh = (sensorStatusAnnunciation.calTemp & (1 << 4)) !== 0;
        let sensorTempLow = (sensorStatusAnnunciation.calTemp & (1 << 5)) !== 0;
        let calibrationPending= (sensorStatusAnnunciation.calTemp & (1 << 6)) !== 0;

    
        // Interpret the Warning bits
        let sensorPatientLow = (sensorStatusAnnunciation.warning & (1 << 0)) !== 0; 
        let sensorPatientHigh = (sensorStatusAnnunciation.warning & (1 << 1)) !== 0;
        let sensorHypo = (sensorStatusAnnunciation.warning & (1 << 2)) !== 0;
        let sensorHyper = (sensorStatusAnnunciation.warning & (1 << 3)) !== 0;
        let sensorRateDecrease= (sensorStatusAnnunciation.warning & (1 << 4)) !== 0;
        let sensorRateIncrease = (sensorStatusAnnunciation.warning & (1 << 5)) !== 0;
        let sensorLowerDev = (sensorStatusAnnunciation.warning & (1 << 6)) !== 0;
        let sensorHigherDev = (sensorStatusAnnunciation.warning & (1 << 7)) !== 0;

    // CGM Trend Information (if present)
    let trendInformation = null;
    if (flags & (1 << 0)) { 
        trendInformation = buf[currentIndex] | (buf[currentIndex + 1] << 8); 
        currentIndex += 2; 
    }

    // CGM Quality
    let quality = null;
    if (flags & (1 << 1)) { // Check if bit 1 is set
        quality = buf[currentIndex] | (buf[currentIndex + 1] << 8); 
        currentIndex += 2; 
    }

    // E2E-CRC (if present )
    let e2eCrc = null;
    if (recordSize === currentIndex + 2) { 
        e2eCrc = buf[currentIndex] | (buf[currentIndex + 1] << 8);
    }


    console.log("----- CGM Measurement Record -----");
    console.log("Glucose Concentration:", glucoseConcentration, "mg/dL");
    console.log("Time Offset:", timeOffset, "min");
    if (trendInformation !== null) {
        console.log("Trend Information:", trendInformation, "mg/dL/min");
    }
    if (quality !== null) {
        console.log("Quality:", quality, "%");
    }
    console.log("Sensor Status Annunciation:", sensorStatusAnnunciation);
    if (e2eCrc !== null) {
        console.log("E2E-CRC:", e2eCrc);
    }
    console.log("Session Stopped:", sessionStopped);
    console.log("Battery Low:", batteryLow);
    console.log("Incorrect Sesnsor Type:", incorrectsesnsortype);
    console.log("Sensor Malfunction:", sensormalfunction);
    console.log("Dev Specific Alert:", devspecificalert);
    console.log("Device Fault:", devicefault);
    console.log("Time Sync Required:", timeSyncRequired);
    console.log("Calibration Not Allowed:", calibrationNotAllowed);
    console.log("Calibration Recommeded:", calibrationRecommed);
    console.log("Calibration Required:", calibrationRequired);
    console.log("Sensor Temp High:", sensorTempHigh);
    console.log("Sensor Temp Low:", sensorTempLow);
    console.log("Calibration Pending:", calibrationPending);
    console.log("Sensor Patient Low:", sensorPatientLow);
    console.log("Sensor Patient High:", sensorPatientHigh);
    console.log("Sensor Hypo:", sensorHypo);
    console.log("Sensor Hyper:", sensorHyper);
    console.log("Sensor Rate Decrease:", sensorRateDecrease);
    console.log("Sensor Rate Increase:", sensorRateIncrease);
    console.log("Sensor Lower Dev:", sensorLowerDev);
    console.log("Sensor Higher Dev:", sensorHigherDev);

    console.log("-----------------------------------");


    var gc = document.getElementById("gc");
    gc.innerText = glucoseConcentration + " mg/dL";

    var to = document.getElementById("to");
    to.innerText = timeOffset + " min";

    var ti = document.getElementById("ti");
    if (trendInformation !== null) {
        ti.innerText = trendInformation + " mg/dL/min";
    } else {
        ti.innerText = "Not present";
    }

    var q = document.getElementById("q");
    if (quality !== null) {
        q.innerText = quality + " %";
    } else {
        q.innerText = "Not present";
    }
    let isTrendInfoPresent = (flags & (1 << 0)) !== 0;


let isQualityPresent = (flags & (1 << 1)) !== 0;

console.log("Is CGM Trend Information Present:", isTrendInfoPresent);
console.log("Is CGM Quality Present:", isQualityPresent);

document.getElementById('sessionStoppedStatus').style.display = 'none';
document.getElementById('timeSyncRequiredStatus').style.display = 'none';
document.getElementById('lowLevelStatus').style.display = 'none';
document.getElementById('lowBatteryStatus').style.display = 'none';

    if (sessionStopped) {
      console.log("Session stopped");
      document.getElementById('sessionStoppedStatus').style.display = 'flex';
    }

  if (batteryLow) {
    console.log("Sensor battery low");
    document.getElementById('lowBatteryStatus').style.display = 'flex';
  }

  if (timeSyncRequired) {
    console.log("Time Sync");
    document.getElementById('timeSyncRequiredStatus').style.display = 'flex';
  }

  if (sensorPatientLow) {
    console.log("Low Level");
    document.getElementById('lowLevelStatus').style.display = 'flex';
  }

}

async function readStatus() {
  var value = await ReadCharacteristic.characteristic.readValue();
  let statusWord = new Uint8Array(value.buffer);
  console.log("Status", statusWord);


}



async function readFeature() {
  var value = await ReadIndicateCharacteristic.characteristic.readValue();
  let featureData = new Uint8Array(value.buffer);
  console.log("Feature", featureData);


  let features = featureData[0] | (featureData[1] << 8) | (featureData[2] << 16);


  let calibrationSupported = (features & (1 << 0)) !== 0;
  let patientHighLowAlertsSupported = (features & (1 << 1)) !== 0;
  let hypoAlertsSupported = (features & (1 << 2)) !== 0;
  let hyperAlertsSupported = (features & (1 << 3)) !== 0;
  let rateOfIncreaseDecreaseAlertsSupported = (features & (1 << 4)) !== 0;
  let deviceSpecificAlertSupported = (features & (1 << 5)) !== 0;
  let sensorMalfunctionDetectionSupported = (features & (1 << 6)) !== 0;
  let sensorTemperatureHighLowDetectionSupported = (features & (1 << 7)) !== 0;
  let sensorResultHighLowDetectionSupported = (features & (1 << 8)) !== 0;
  let lowBatteryDetectionSupported = (features & (1 << 9)) !== 0;
  let sensorTypeErrorDetectionSupported = (features & (1 << 10)) !== 0;
  let generalDeviceFaultSupported = (features & (1 << 11)) !== 0;
  let e2eCrcSupported = (features & (1 << 12)) !== 0;
  let multipleBondSupported = (features & (1 << 13)) !== 0;
  let multipleSessionsSupported = (features & (1 << 14)) !== 0;
  let cgmTrendInformationSupported = (features & (1 << 15)) !== 0;
  let cgmQualitySupported = (features & (1 << 16)) !== 0;



  let typeSampleLocation = featureData[3];
  let type = (typeSampleLocation & 0xF0) >> 4; 
  let sampleLocation = typeSampleLocation & 0x0F;


  let e2eCrc = featureData[4] | (featureData[5] << 8);


  console.log("Calibration Supported:", calibrationSupported);
  console.log("Patient High/Low Alerts Supported:", patientHighLowAlertsSupported);
  console.log("Hypo Alerts Supported:", hypoAlertsSupported);
  console.log("Hyper Alerts Supported:", hyperAlertsSupported);
  console.log("Rate of Increase/Decrease Alerts Supported:", rateOfIncreaseDecreaseAlertsSupported);
  console.log("Device Specific Alert Supported:", deviceSpecificAlertSupported);
  console.log("Sensor Malfunction Detection Supported:", sensorMalfunctionDetectionSupported);
  console.log("Sensor Temperature High-Low Detection Supported:", sensorTemperatureHighLowDetectionSupported);
  console.log("Sensor Result High-Low Detection Supported:", sensorResultHighLowDetectionSupported);
  console.log("Low Battery Detection Supported:", lowBatteryDetectionSupported);
  console.log("Sensor Type Error Detection Supported:", sensorTypeErrorDetectionSupported);
  console.log("General Device Fault Supported:", generalDeviceFaultSupported);
  console.log("E2E-CRC Supported:", e2eCrcSupported);
  console.log("Multiple Bond Supported:", multipleBondSupported);
  console.log("Multiple Sessions Supported:", multipleSessionsSupported);
  console.log("CGM Trend Information Supported:", cgmTrendInformationSupported);
  console.log("CGM Quality Supported:", cgmQualitySupported);


  console.log("CGM Type:", type);
  console.log("Sample Location:", sampleLocation);


  console.log("E2E-CRC:", e2eCrc);
}

async function readStartTime() {
  var value = await ReadCharacteristic.characteristic.readValue();
  let startTimeData = new Uint8Array(value.buffer);
  console.log("Start Time", startTimeData);
  let hexStringArray = Array.from(startTimeData, byte => byte.toString(16).padStart(2, '0'));


  let hexFormattedStartTime = hexStringArray.join('-');
  console.log(`Start Time: ${hexFormattedStartTime}`);

 
  let year = startTimeData[0] | (startTimeData[1] << 8);
  let month = startTimeData[2];
  let day = startTimeData[3];
  let hours = startTimeData[4];
  let minutes = startTimeData[5];
  let seconds = startTimeData[6];


  let formattedStartTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  console.log(`Start Time: ${formattedStartTime}`);
  

  setStartTime(formattedStartTime);
}


async function writeStartTime() {

  let now = new Date();

  let timeZoneOffsetMinutes = now.getTimezoneOffset();

  let year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 1; 
  let day = now.getUTCDate();
  let hours = now.getUTCHours() - (timeZoneOffsetMinutes / 60);
  let minutes = now.getUTCMinutes();
  let seconds = now.getUTCSeconds();
  let timeZone = (timeZoneOffsetMinutes / 15) * -1;
  let dstOffset =  0; 


  let buffer = new ArrayBuffer(9);
  let dataView = new DataView(buffer);
  dataView.setUint16(0, year, true); // Year (little-endian)
  dataView.setUint8(2, month);       // Month
  dataView.setUint8(3, day);         // Day
  dataView.setUint8(4, hours);       // Hours
  dataView.setUint8(5, minutes);     // Minutes
  dataView.setUint8(6, seconds);     // Seconds
  dataView.setUint8(7, timeZone);    // Time Zone
  dataView.setUint8(8, dstOffset);   // DST Offset


  let crcValue = computeCRC(new Uint8Array(buffer));


  let crcBytes = new Uint8Array([
    crcValue & 0xFF,       
    (crcValue >> 8) & 0xFF  
  ]);

 
  let finalBuffer = new ArrayBuffer(11);
  let finalDataView = new DataView(finalBuffer);
  new Uint8Array(finalBuffer).set(new Uint8Array(buffer), 0); 
  finalDataView.setUint8(9, crcBytes[0]); 
  finalDataView.setUint8(10, crcBytes[1]); 

  try {
    console.log('Command to be sent:', Array.from(new Uint8Array(finalBuffer)).map(byte => byte.toString(16).padStart(2, '0')).join('-'));
    const writeResult = await WriteCharacteristic.characteristic.writeValue(finalBuffer);
    console.log("New session start time written successfully.");
  } catch (error) {
    console.error("Failed to write start time:", error);
  }
}


function computeCRC(bytes) {
  const poly = 0x8408;
  let res = 0xFFFF;

  bytes.forEach(byte => {
    let byteInt = byte;
    for (let i = 0; i < 8; i++) {
      const bitThatEnters = byteInt & 0x01;
      const bitThatExits = res & 0x01 ^ bitThatEnters;
      res = res >>> 1;
      if (bitThatExits !== 0) res ^= poly;
      byteInt = byteInt >>> 1;
    }
  });

  
  const crcLowByte = res & 0xFF;
  const crcHighByte = (res >>> 8) & 0xFF;

  return (crcHighByte << 8) | crcLowByte; 
}

async function startNewSession() {
  await writeStartTime(); 
  await readStartTime(); 
}




function handleRacpIndication(event) {
  const value = event.target.value;
  console.log(value)
  const opCode = value.getUint8(0);
  const operator = value.getUint8(1);
  const operand = new Uint8Array(value.buffer.slice(2)); 

  console.log(`RACP Indication: OpCode=${opCode}, Operator=${operator}, Operand=${operand}`);

  if (opCode === 0x06 && operator === 0x00 && operand[0] === 0x01 && operand[1] === 0x01) {
    console.log('Received successful response to Op Code 0x01');
  
    const successMessageElement = document.getElementById('racpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = 'Response Code to Report stored records: Success';
    }
  }
  
  else if(opCode === 0x05 && operator === 0x00) {

      const numberOfRecords = operand[0] | (operand[1] << 8);
      console.log(`Number of Stored Records: ${numberOfRecords}`);
  

      const successMessageElement = document.getElementById('racpSuccessMessage');
      if (successMessageElement) {
        successMessageElement.textContent = `The Report Number of Stored Records: ${numberOfRecords}`;
      }
    }

    else if(opCode === 0x06 && operator === 0x00 && operand[0] === 0x03) {

      console.log('Received successful response to Op Code 0x06');
  
 
      const successMessageElement = document.getElementById('racpSuccessMessage');
      if (successMessageElement) {
        successMessageElement.textContent = `Response Code to Abort Operation: Success`;
      }
    }

    else if(opCode === 0x06 && operator === 0x00 && operand[0] === 0x02) {
 
      console.log('Received successful response to Op Code 0x06');
  

      const successMessageElement = document.getElementById('racpSuccessMessage');
      if (successMessageElement) {
        successMessageElement.textContent = `Response Code to Delete stored records: Success`;
      }
    }

}




function handleSocpIndication(event) {
  const value = event.target.value;
  console.log(value)
  const opCode = value.getUint8(0);
  const operator = value.getUint8(1);
  const operand = value.getUint8(2);

  console.log(`SOCP Indication: OpCode=${opCode}, Operator=${operator}, Operand=${operand}`);

  if(opCode === 0x1c && operator === 0x01 && operand === 0x01) {

    console.log('Received successful response to Op Code 0x01');


    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = `Set CGM Communication Interval: Success`;
    }
  }

  else if(opCode === 0x03) {

    console.log('Received successful response to Op Code 0x02');
    const communicationInterval = value.getUint8(1, true);
    console.log(`CGM Communication Interval: ${communicationInterval} minutes`);

    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = `CGM Communication Interval Response: ${communicationInterval} min`;
    }
  }

  else if(opCode === 0x1c && operator === 0x07 && operand === 0x01) {

    console.log('Received successful response to Op Code 0x07');


    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = `Set Patient High Alert Level: Success`;
    }
  }

  else if(opCode === 0x09 ) {

    console.log('Received successful response to Op Code 0x08');
    const highalert = value.getUint16(1, true);
    console.log(`Patient High Alert Level: ${highalert} mg / dL`);

    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = `Patient High Alert Level Response: ${highalert} mg / dL`;
    }
  }

  else if(opCode === 0x1c && operator === 0x0a && operand === 0x01) {

    console.log('Received successful response to Op Code 0x0A');

    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = `Set Patient Low Alert Level: Success`;
    }
  }

  else if(opCode === 0x0c ) {

    console.log('Received successful response to Op Code 0x0B');
    const lowalert = value.getUint16(1, true);
    console.log(`Patient Low Alert Level: ${lowalert} mg / dL`);

    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = `Patient Low Alert Level Response: ${lowalert} mg / dL`;
    }
  }

  else if(opCode === 0x1c && operator === 0x0d && operand === 0x01) {

    console.log('Received successful response to Op Code 0x0D');


    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = `Set Hypo Alert Level: Success`;
    }
  }

  else if(opCode === 0x0f ) {

    console.log('Received successful response to Op Code 0x0E');
    const hypo = value.getUint16(1, true);
    console.log(`Hypo Alert Level: ${hypo} mg / dL`);

    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = `Hypo Alert Level Response: ${hypo} mg / dL`;
    }
  }

  else if(opCode === 0x1c && operator === 0x10 && operand === 0x01) {

    console.log('Received successful response to Op Code 0x10');


    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = `Set Hyper Alert Level: Success`;
    }
  }

  else if(opCode === 0x12 ) {

    console.log('Received successful response to Op Code 0x11');
    const hyper = value.getUint16(1, true);
    console.log(`Hyper Alert Level: ${hyper} mg / dL`);

    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = `Hyper Alert Level Response: ${hyper} mg / dL`;
    }
  }

  else if(opCode === 0x1c && operator === 0x13 && operand === 0x01) {

    console.log('Received successful response to Op Code 0x13');

    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = `Set Rate of Decrease Alert Level: Success`;
    }
  }

  else if(opCode === 0x15 ) {

    console.log('Received successful response to Op Code 0x14');
    const dec = value.getUint16(1, true);
    console.log(`Rate of Decrease Alert Level: ${dec} mg / dL`);
  
    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = `Rate of Decrease Alert Level Response: ${dec} mg/dL/min`;
    }
  }

  else if(opCode === 0x1c && operator === 0x16 && operand === 0x01) {

    console.log('Received successful response to Op Code 0x16');


    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = `Set Rate of Increase Alert Level: Success`;
    }
  }

  else if(opCode === 0x18 ) {

    console.log('Received successful response to Op Code 0x17');
    const inc = value.getUint16(1, true);
    console.log(`Rate of Increase Alert Level: ${inc} mg / dL`);

    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = `Rate of Increase Alert Level Response: ${inc} mg/dL/min`;
    }
  }

  else if(opCode === 0x1c && operator === 0x19 && operand === 0x01) {

    console.log('Received successful response to Op Code 0x19');


    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = `Reset Device Specific Alert: Success`;
    }
  }

  else if(opCode === 0x1c && operator === 0x1a && operand === 0x01) {

    console.log('Received successful response to Op Code 0x1A');

    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = `Start The Session: Success`;
    }
  }

  else if(opCode === 0x1c && operator === 0x1b && operand === 0x01) {

    console.log('Received successful response to Op Code 0x1B');

    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = `Stop The Session: Success`;
    }
  }

  else if(opCode === 0x1c && operator === 0x04 && operand === 0x01) {

    console.log('Received successful response to Op Code 0x04');

    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
      successMessageElement.textContent = `Set Glucose Calbration Value: Success`;
    }
  }

  else if (opCode === 0x06) {
    const glucoseConcentration = value.getUint8(2,true);
    const calibrationTime = value.getUint16(3, true);
    const calibrationTypeSampleLocation = value.getUint8(5);
    const nextCalibrationTime = value.getUint16(6, true);
    const calibrationDataRecordNumber = value.getUint16(8, true);
    const calibrationStatus = value.getUint8(10);


    const calibrationType = (calibrationTypeSampleLocation & 0xF0) >> 4;
    const sampleLocation = calibrationTypeSampleLocation & 0x0F;

    const calibrationTypeStrings = {
        0x0: "Reserved for Future Use",
        0x1: "Capillary Whole blood",
        0x2: "Capillary Plasma",
        0x3: "Venous Whole blood",
        0x4: "Venous Plasma",
        0x5: "Arterial Whole blood",
        0x6: "Arterial Plasma",
        0x7: "Undetermined Whole blood",
        0x8: "Undetermined Plasma",
        0x9: "Interstitial Fluid (ISF)",
        0xA: "Control Solution",
    };

    const sampleLocationStrings = {
        0x0: "Reserved for Future Use",
        0x1: "Finger",
        0x2: "Alternate Site Test (AST)",
        0x3: "Earlobe",
        0x4: "Control solution",
        0x5: "Subcutaneous tissue",
    };

    const calibrationStatusStrings = {
      0: "Calibration Data Rejected (Calibration failed)",
      1: "Calibration Data Out of Range",
      2: "Calibration Process Pending",

  };

    const calibrationTypeString = calibrationTypeStrings[calibrationType] || "Unknown Type";
    const sampleLocationString = sampleLocationStrings[sampleLocation] || "Unknown Location";
    const calibrationStatusString = calibrationStatusStrings[calibrationStatus] || "Unknown Status";


    console.log(`Glucose Concentration of Calibration: ${glucoseConcentration}`);
    console.log(`Calibration Time: ${calibrationTime}`);
    console.log(`Calibration Type: ${calibrationTypeString}`);
    console.log(`Sample Location: ${sampleLocationString}`);
    console.log(`Next Calibration Time: ${nextCalibrationTime}`);
    console.log(`Calibration Data Record Number: ${calibrationDataRecordNumber}`);
    console.log(`Calibration Status: ${calibrationStatus}`);

    const successMessageElement = document.getElementById('socpSuccessMessage');
    if (successMessageElement) {
        successMessageElement.textContent = `Glucose Calibration Value Response: Concentration = ${glucoseConcentration} mg/dL, Time = ${calibrationTime} min, Calibration Type = ${calibrationTypeString}, Sample Location = ${sampleLocationString}, Next Time = ${nextCalibrationTime} min, Record Number = ${calibrationDataRecordNumber}, Status = ${calibrationStatusString}`;
    }
}
}

async function onSendRacpClick() {
  const selectedOperation = document.getElementById('racpOperation').value;
  const selectedOperator = document.getElementById('racpOperator').value;

  let opCode;
  let operator;
  let command;
  let sequenceNumberInt, operandLowByte ;

  const successMessageElement = document.getElementById('racpSuccessMessage');
  if (successMessageElement) {
    successMessageElement.textContent = '';
  }
  
  switch (selectedOperation) {
    case 'reportStoredRecords':
      opCode = 0x01; 
      break;

    case 'deleteStoredRecords':
      opCode = 0x02; 
      break; 

    case 'abortOperation':
      opCode = 0x03; 
      break; 

    case 'reportNumOfStoredRecords':
      opCode = 0x04; 
      break;    

      }
    
    switch (selectedOperator) {
        case 'AllRecords':
          operator = 0x01; // Operator for "all records"
          command = Uint8Array.of(opCode, operator);
          break;

        case 'GreaterThanorEqualTo':
          operator = 0x03; // Operator for "greater than or equal to"
        
          sequenceNumberInt = parseInt(sequenceNumber, 10);
          if (isNaN(sequenceNumberInt)) {
            console.error('Invalid sequence number');
            return;
          }
          operandLowByte = sequenceNumberInt & 0xFF;

          command = Uint8Array.of(opCode, operator, 0x01, operandLowByte, 0x00);
          console.log(Array.from(command).map(byte => byte.toString(16).padStart(2, '0')).join('-'));
          break;

        case 'LessThanorEqualTo':
          operator = 0x02; 
          
          sequenceNumberInt = parseInt(sequenceNumber, 10);
          if (isNaN(sequenceNumberInt)) {
             console.error('Invalid sequence number');
            return;
          }
          operandLowByte = sequenceNumberInt & 0xFF;

          command = Uint8Array.of(opCode, operator, 0x01, operandLowByte, 0x00);
          console.log(Array.from(command).map(byte => byte.toString(16).padStart(2, '0')).join('-'));
          break;

          case 'WithinRangeof':
            operator = 0x04; 
            
            sequenceNumberInt = parseInt(sequenceNumberMin, 10);
            const sequenceNumberInt2 = parseInt(sequenceNumberMax, 10);
            if (isNaN(sequenceNumberInt) || isNaN(sequenceNumberInt2)) {
               console.error('Invalid sequence number');
              return;
            }
            operandLowByte = sequenceNumberInt & 0xFF;
            const operandLowByte2 = sequenceNumberInt2 & 0xFF;
  
            command = Uint8Array.of(opCode, operator, 0x01, operandLowByte, 0x00, operandLowByte2, 0x00);
            console.log(Array.from(command).map(byte => byte.toString(16).padStart(2, '0')).join('-'));
            break;

          case 'FirstRecord':
            operator = 0x05; 
            command = Uint8Array.of(opCode, operator);
          break;

          case 'LastRecord':
            operator = 0x06; 
            command = Uint8Array.of(opCode, operator);
          break;    
      }

  try {
    
    console.log(`Sending RACP operation: Operation=${selectedOperation}, Operator=${selectedOperator}`);
    console.log("Writing >> ", command);
    await WriteIndicateCharacteristic.characteristic.writeValue(command);
  } catch (error) {
    console.error('Error sending RACP command:', error);
  }
}



async function onSendSocpClick() {
  const selectedOperation = document.getElementById('socpOperation').value;
  const sequenceNumberInput = document.getElementById('sequenceNumberInput');

  let opCode;
  let operand = sequenceNumberInput ? parseInt(sequenceNumberInput.value) : undefined;
  let finalBuffer;
  const successMessageElement = document.getElementById('socpSuccessMessage');
  if (successMessageElement) {
    successMessageElement.textContent = '';
  }

  let bufferSize = 3;

  let dataView ;

  switch (selectedOperation) {
    case 'SetCGMcommunicationinterval':
      opCode = 0x01;
      if (operand !== undefined) {
      bufferSize = 4;
      finalBuffer = new ArrayBuffer(bufferSize);
      dataView = new DataView(finalBuffer);
      dataView.setUint8(1, operand);
      }
      break;
    case 'GetCGMcommunicationinterval':
        opCode = 0x02;
        finalBuffer = new ArrayBuffer(bufferSize);
        dataView = new DataView(finalBuffer);
        break;
    case 'SetGlucoseCalibrationvalue':
        opCode = 0x04; 
        const calibrationTime = parseInt(document.getElementById('calibrationTimeInput').value);
        const sampleLocationType = parseInt(document.getElementById('calibrationType').value);
        const sampleLocation = parseInt(document.getElementById('sampleLocation').value);
        const nextCalibrationTime = parseInt(document.getElementById('nextCalibrationTimeInput').value);
        const calibrationDataRecordNumber = parseInt(document.getElementById('calibrationDataRecordNumber').value);
        const calibrationStatus = document.querySelector('input[name="sensorLocation"]:checked').value;
        let sampleLocationTypeHex = sampleLocationType.toString(16);
        let sampleLocationHex = sampleLocation.toString(16);

        let combinedHexString = sampleLocationTypeHex + sampleLocationHex;
        

        const typeSampleLocationCombined = parseInt(combinedHexString, 16);

        bufferSize = 13; 
        finalBuffer = new ArrayBuffer(bufferSize);
        dataView = new DataView(finalBuffer);
      
        dataView.setUint8(0, opCode); 
        dataView.setUint16(1, operand); 
        dataView.setUint16(3, calibrationTime, true); 
        dataView.setUint8(5, typeSampleLocationCombined ); 
        dataView.setUint16(6, nextCalibrationTime, true);  
        dataView.setUint16(8, calibrationDataRecordNumber, true); 
        dataView.setUint8(10, calibrationStatus); 
        break;
    case 'GetGlucoseCalibrationvalue':
        opCode = 0x05;  
        bufferSize = 5; 
        finalBuffer = new ArrayBuffer(bufferSize);
        dataView = new DataView(finalBuffer);
        dataView.setUint16(1, 0xffff, true);
        break;
    case 'SetPatientHighAlertLevel':
       opCode = 0x07;
       if (operand !== undefined) {
        bufferSize = 5;
        finalBuffer = new ArrayBuffer(bufferSize);
        dataView = new DataView(finalBuffer);
        dataView.setUint8(1, operand); 
     }
       break;
    case 'GetPatientHighAlertLevel':
        opCode = 0x08;
        finalBuffer = new ArrayBuffer(bufferSize);
        dataView = new DataView(finalBuffer);
        break;
    case 'SetPatientLowAlertLevel':
      opCode = 0x0a;
      if (operand !== undefined) {
        bufferSize = 5;
        finalBuffer = new ArrayBuffer(bufferSize);
        dataView = new DataView(finalBuffer);
        dataView.setUint8(1, operand); 
     }
      break;
    case 'GetPatientLowAlertLevel':
      opCode = 0x0b;
      finalBuffer = new ArrayBuffer(bufferSize);
      dataView = new DataView(finalBuffer);
      break;
    case 'SetHypoAlertLevel':
      opCode = 0x0d;
      if (operand !== undefined) {
        bufferSize = 5;
        finalBuffer = new ArrayBuffer(bufferSize);
        dataView = new DataView(finalBuffer);
        dataView.setUint8(1, operand); 
     }
      break;
    case 'GetHypoAlertLevel':
      opCode = 0x0e;
      finalBuffer = new ArrayBuffer(bufferSize);
      dataView = new DataView(finalBuffer);
      break;
    case 'SetHyperAlertLevel':
      opCode = 0x10;
      if (operand !== undefined) {
        bufferSize = 5;
        finalBuffer = new ArrayBuffer(bufferSize);
        dataView = new DataView(finalBuffer);
        dataView.setUint8(1, operand); 
     }
      break;
    case 'GetHyperAlertLevel':
      opCode = 0x11;
      finalBuffer = new ArrayBuffer(bufferSize);
      dataView = new DataView(finalBuffer);
      break;
    case 'SetRateofDecreaseAlertLevel':
      opCode = 0x13;
      if (operand !== undefined) {
        bufferSize = 5;
        finalBuffer = new ArrayBuffer(bufferSize);
        dataView = new DataView(finalBuffer);
        dataView.setUint8(1, operand); 
     }
      break;
    case 'GetRateofDecreaseAlertLevel':
      opCode = 0x14;
      finalBuffer = new ArrayBuffer(bufferSize);
      dataView = new DataView(finalBuffer);
      break;
    case 'SetRateofIncreaseAlertLevel':
      opCode = 0x16;
      if (operand !== undefined) {
        bufferSize = 5;
        finalBuffer = new ArrayBuffer(bufferSize);
        dataView = new DataView(finalBuffer);
        dataView.setUint8(1, operand); 
     }
      break;
    case 'GetRateofIncreaseAlertLevel':
      opCode = 0x17;
      finalBuffer = new ArrayBuffer(bufferSize);
      dataView = new DataView(finalBuffer);
      break;
    case 'ResetDeviceSpecificAlert':
      opCode = 0x19;
      finalBuffer = new ArrayBuffer(bufferSize);
      dataView = new DataView(finalBuffer);
      break;
    case 'StartSession':
      opCode = 0x1A;
      finalBuffer = new ArrayBuffer(bufferSize);
      dataView = new DataView(finalBuffer);
      break;
    case 'StopSession':
      opCode = 0x1B;
      finalBuffer = new ArrayBuffer(bufferSize);
      dataView = new DataView(finalBuffer);
      break;
    default:
      console.error('Invalid operation selected');
      return;
  }

  dataView.setUint8(0, opCode);
  console.log(new Uint8Array(finalBuffer));
  let crcValue = computeCRC(new Uint8Array(finalBuffer.slice(0, -2)));

  let crcBytes = new Uint8Array([
    crcValue & 0xFF,        
    (crcValue >> 8) & 0xFF  
  ]);

  dataView.setUint8(bufferSize - 2, crcBytes[0]);
  dataView.setUint8(bufferSize - 1, crcBytes[1]);

  console.log(`Sending SOCP operation: Operation=${selectedOperation}`);
  console.log(new Uint8Array(finalBuffer));
  writeToSpecificOpsControlPoint(finalBuffer);
let value = 90;
let medfloat16Value = floatToMedFloat16(value);
console.log(medfloat16Value);
console.log(medfloat16Value.toString(16));
  
}

async function writeToSpecificOpsControlPoint(value) {

  if (IndicateCharacteristic.characteristic.uuid === "00002aac-0000-1000-8000-00805f9b34fb") {
    try {
      console.log("Writing >> ", value);
      IndicateCharacteristic.characteristic.writeValue(value);
  
      console.log('SOCP command sent successfully.');
    } catch (error) {
      console.log('Argh! ' + error);
    }
  } else {
      console.log("Characteristic UUID mismatch for Specific Ops Control Point");
  }
}

function floatToMedFloat16(value) {

  let float32Array = new Float32Array(1);
  float32Array[0] = value;
  let binary32 = new Uint32Array(float32Array.buffer)[0];


  let sign = (binary32 >> 31) & 0x1;
  let exponent = (binary32 >> 23) & 0xFF;
  let fraction = binary32 & 0x7FFFFF;


  let newExponent;
  let newFraction;

  if (exponent === 0) {
    newExponent = 0;
    newFraction = fraction >> 13; 
  } else if (exponent === 0xFF) { 
    newExponent = 0x1F;
    newFraction = 0x3FF; 
  } else { 
    newExponent = Math.max(0, Math.min(0x1F, exponent - 127 + 15));
    newFraction = fraction >> 13;
  }


  let medfloat16 = (sign << 15) | (newExponent << 10) | newFraction;
  return medfloat16;
}

  return (
  <div className="tempPannel">

      <div className="titlebox">
        <img src={glucoselogo} alt="" className="BLPlogo"></img>
        <h3><strong>Continuous Glucose Monitoring</strong></h3>
      </div>

      <div class="CGM__container container grid">


            <table class="CGM__table">
                <tr class="CGM__row">
                    <th class="CGM__Info">CGM Glucose Concentration</th>
                    <td class="CGM__data"><span className='CGMInfo' id='gc' > </span></td>
                </tr>
                <tr class="CGM__row">
                    <th class="CGM__Info">Time Offset</th>
                    <td class="CGM__data"><span className='CGMInfo' id='to' > </span></td>
                </tr>
                <tr class="CGM__row">
                    <th class="CGM__Info">CGM Trend Info</th>
                    <td class="CGM__data"><span className='CGMInfo' id='ti' > </span></td>
                </tr>
                <tr class="CGM__row">
                    <th class="CGM__Info">CGM Quality</th>
                    <td class="CGM__data"><span className='CGMInfo' id='q' > </span></td>
                </tr>
            </table>


        <div class="chart-container" style={{height: "225px", width: "90%"}}>  
          <canvas ref={gcChartContainer}></canvas>
        </div>


      </div>

      <div className="titlebox2">
        <h3><strong>Sensor Status Annunciation</strong></h3>
      </div>

      <div class="CGM__container2 container grid">

      <div class="CGM__card2" id="sessionStoppedStatus" style={{display: 'none'}}>
        <div class="unite">
            <box-icon name='info-circle' size='35px' type='solid' color='#e91d1d' ></box-icon>
            <h3 class="CGM__title2"><strong>Session stopped</strong></h3>
        </div>
      </div>

      <div class="CGM__card2" id="timeSyncRequiredStatus" style={{display: 'none'}}>
        <div class="unite">
            <box-icon name='thermometer' size='md' type='solid' color='#e91d1d' ></box-icon>
            <h3 class="CGM__title2"><strong>Time synchronization between sensor and collector required</strong></h3>
        </div>
      </div>

      <div class="CGM__card2" id="lowLevelStatus" style={{display: 'none'}}>
        <div class="unite">
            <box-icon name='error' size='md' type='solid' color='#e91d1d' ></box-icon>
            <h3 class="CGM__title2"><strong>Sensor result lower than the Patient Low Level</strong></h3>
        </div>
      </div>

      <div class="CGM__card2" id="lowBatteryStatus" style={{display: 'none'}}>
        <div class="unite">
          <box-icon name='battery' size='35px' type='solid' color='#e91d1d'></box-icon>
          <h3 class="CGM__title2"><strong>Sensor battery low</strong></h3>
          </div>
          </div>

      </div>

      <div className="titlebox2">
        <h3><strong>Session Start Time</strong></h3>
      </div>

      <div class="CGM__container3 container grid">

        <div class="CGMtitle__card2">
          <h3 class="CGM__title2"><strong>Start Time</strong></h3>
        </div>

        <div class="CGMtitle__card2">
        <h3 class="CGM__title2"><strong>{startTime}</strong></h3>
        </div>

      </div>

        <div class="CGMtitle__card4">

        <button onClick={startNewSession}>Set Start Time To Now</button>
        </div>


      <div className="titlebox2">
        <h3><strong>Record Access Control Point</strong></h3>
      </div>

      <div class="CGM__container3 container grid">

        <div class="CGMtitle__card2">
          <select id="racpOperation">
            <option value="reportStoredRecords" selected>Report Stored Records</option>
            <option value="deleteStoredRecords">Delete Stored Records</option>
            <option value="abortOperation">Abort Operation</option>
            <option value="reportNumOfStoredRecords">Report Number of Stored Records</option>
          </select>
        </div>

        <div class="CGMtitle__card2">
          <select id="racpOperator"   value={selectedOperator} onChange={(e) => setSelectedOperator(e.target.value)}>
            <option value="AllRecords" selected>All Records</option>
            <option value="LessThanorEqualTo">Less Than or Equal To</option>
            <option value="GreaterThanorEqualTo">Greater Than or Equal To</option>
            <option value="WithinRangeof">Within Range of (Inclusive)</option>
            <option value="FirstRecord">First Record</option>
            <option value="LastRecord">Last Record</option>
          </select>
        </div>

      </div>

      {selectedOperator === 'GreaterThanorEqualTo' && (
        <div class="CGM__container5 container grid">
          <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
            <div className="input-group" >
              <span className="input-group-text" id="sequenceNumberPrefix" style={{ fontWeight: 'bold' , fontSize: 20}} >Time Offset</span>
              <input type="text" className="form-control" style={{  fontSize: 20}} aria-describedby="sequenceNumberPrefix" maxLength="4" value={sequenceNumber} onChange={(e) => setSequenceNumber(e.target.value)} id="sequenceNumberInput"/>
            </div>
          </div>
          </div>
      )}

      {selectedOperator === 'LessThanorEqualTo' && (
        <div class="CGM__container5 container grid">
          <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
            <div className="input-group" >
              <span className="input-group-text" id="sequenceNumberPrefix" style={{ fontWeight: 'bold' , fontSize: 20}} >Time Offset</span>
              <input type="text" className="form-control" style={{  fontSize: 20}} aria-describedby="sequenceNumberPrefix" maxLength="4" value={sequenceNumber} onChange={(e) => setSequenceNumber(e.target.value)} id="sequenceNumberInput"/>
            </div>
          </div>
          </div>
      )}

      {selectedOperator === 'WithinRangeof' && (
        <div class="CGM__container5 container grid">
          <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
            <div className="input-group" >
              <span className="input-group-text" id="sequenceNumberPrefix" style={{ fontWeight: 'bold' , fontSize: 20}} >Maximum Time Offset</span>
              <input type="text" className="form-control" style={{  fontSize: 20}} aria-describedby="sequenceNumberPrefix" maxLength="4" value={sequenceNumberMax} onChange={(e) => setSequenceNumberMax(e.target.value)} id="sequenceNumberInputMax"/>
            </div>
            </div>

            <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
            <div className="input-group" >
              <span className="input-group-text" id="sequenceNumberPrefix" style={{ fontWeight: 'bold' , fontSize: 20}} >Minimum Time Offset</span>
              <input type="text" className="form-control" style={{  fontSize: 20}} aria-describedby="sequenceNumberPrefix" maxLength="4" value={sequenceNumberMin} onChange={(e) => setSequenceNumberMin(e.target.value)} id="sequenceNumberInputMin"/>
            </div>

          </div>
          </div>
      )}

      <div class="CGM__container4 container grid">

        <div class="CGMtitle__card3">

          <button id="sendRacp" onClick={onSendRacpClick}>S e n d</button>

        </div>
        <div id="racpSuccessMessage" className="CGM__Response" style={{ color: 'green' }}></div>

      </div>

      <div className="titlebox2">
        <h3><strong>CGM Specific Ops Control Point</strong></h3>
      </div>

      <div class="CGM__container4 container grid">
        <div className="CGM__titlebox2">
          <select id="socpOperation" value={selectedSocpOperator} onChange={(e) => setSelectedSocpOperator(e.target.value)}>
            <option value="SetCGMcommunicationinterval">Set CGM communication interval</option>
            <option value="GetCGMcommunicationinterval">Get CGM communication interval</option>
            <option value="SetGlucoseCalibrationvalue">Set Glucose Calibration value</option>
            <option value="GetGlucoseCalibrationvalue">Get Glucose Calibration value</option>
            <option value="SetPatientHighAlertLevel">Set Patient High Alert Level</option>
            <option value="GetPatientHighAlertLevel">Get Patient High Alert Level</option>
            <option value="SetPatientLowAlertLevel">Set Patient Low Alert Level</option>
            <option value="GetPatientLowAlertLevel">Get Patient Low Alert Level</option>
            <option value="SetHypoAlertLevel">Set Hypo Alert Level</option>
            <option value="GetHypoAlertLevel">Get Hypo Alert Level</option>
            <option value="SetHyperAlertLevel">Set Hyper Alert Level</option>
            <option value="GetHyperAlertLevel">Get Hyper Alert Level</option>
            <option value="SetRateofDecreaseAlertLevel">Set Rate of Decrease Alert Level</option>
            <option value="GetRateofDecreaseAlertLevel">Get Rate of Decrease Alert Level</option>
            <option value="SetRateofIncreaseAlertLevel">Set Rate of Increase Alert Level</option>
            <option value="GetRateofIncreaseAlertLevel">Get Rate of Increase Alert Level</option>
            <option value="ResetDeviceSpecificAlert">Reset Device Specific Alert</option>
            <option value="StartSession">Start Session</option>
            <option value="StopSession">Stop Session</option>
          </select>
        </div>

      </div>

      {selectedSocpOperator === 'SetCGMcommunicationinterval' && (

        <div className='d-flex' style={{ width: '85%', alignItems:'center', justifyContent:'center', marginBottom:'1rem', display:'flex'}}>
          <div className="input-group" style={{ width: '80%' }}>
            <span className="input-group-text" id="sequenceNumberPrefix" style={{ fontWeight: 'bold', fontSize: 20 }}>CGM Communication Interval (min)</span>
            <input type="text" className="form-control" style={{ fontSize: 20 }} aria-describedby="sequenceNumberPrefix" maxLength="4" value={sequenceNumber} onChange={(e) => setSequenceNumber(e.target.value)} id="sequenceNumberInput"/>
          </div>
        </div>
        

      )}

      {selectedSocpOperator === 'SetGlucoseCalibrationvalue' && (


        <div className='CGMCali__container'>
        <div className='d-flex' style={{ width: '85%', alignItems:'left', justifyContent:'left', marginBottom:'1rem', display:'flex'}}>
          <div className="input-group" style={{ width: '100%' }}>
            <span className="input-group-text" id="sequenceNumberPrefix" style={{ fontWeight: 'bold', fontSize: 20 }}>Glucose Concentration of Calibration (mg/dL)</span>
            <input type="text" className="form-control" style={{ fontSize: 20 }} aria-describedby="sequenceNumberPrefix" maxLength="4" value={sequenceNumber} onChange={(e) => setSequenceNumber(e.target.value)} id="sequenceNumberInput"/>
          </div>
          </div>
        
          <div className='d-flex' style={{ width: '85%', alignItems:'left', justifyContent:'left', marginBottom:'1rem', display:'flex'}}>
          <div className="input-group" style={{ width: '100%' }}>
            <span className="input-group-text" id="sequenceNumberPrefix" style={{ fontWeight: 'bold', fontSize: 20 }}>Calibration Time (min)</span>
            <input type="text" className="form-control" style={{ fontSize: 20 }} aria-describedby="sequenceNumberPrefix" maxLength="4" value={calibrationTime} onChange={(e) => setCalibrationTime(e.target.value)} id="calibrationTimeInput"/>
          </div>
          </div>

      <div class="CGM__container3 container grid">

        <div class="CGMtitle__card2">
          <select id="calibrationType">
            <option value="1" selected>Capillary Whole blood</option>
            <option value="2">Capillary Plasma</option>
            <option value="3">Venous Whole blood</option>
            <option value="4">Venous Plasma</option>
            <option value="5">Arterial Whole blood</option>
            <option value="6">Arterial Plasma</option>
            <option value="7">Undetermined Whole blood</option>
            <option value="8">Undetermined Plasma</option>
            <option value="9">Interstitial Fluid (ISF)</option>
            <option value="a">Control Solution</option>
          </select>
        </div>

        <div class="CGMtitle__card2">
          <select id="sampleLocation" >
            <option value="1" selected>Finger</option>
            <option value="2">Alternate Site Test (AST)</option>
            <option value="3">Earlobe</option>
            <option value="4">Control solution</option>
            <option value="5">Subcutaneous tissue</option>
          </select>
        </div>

      </div>

          <div className='d-flex' style={{ width: '85%', alignItems:'left', justifyContent:'left', marginBottom:'1rem', display:'flex'}}>
          <div className="input-group" style={{ width: '100%' }}>
            <span className="input-group-text" id="sequenceNumberPrefix" style={{ fontWeight: 'bold', fontSize: 20 }}>Next Calibration Time (min)</span>
            <input type="text" className="form-control" style={{ fontSize: 20 }} aria-describedby="sequenceNumberPrefix" maxLength="4" value={nextCalibrationTime} onChange={(e) => setNextCalibrationTime(e.target.value)} id="nextCalibrationTimeInput"/>
          </div>
          </div>


          <div className='d-flex' style={{ width: '85%', alignItems:'left', justifyContent:'left', marginBottom:'1rem', display:'flex'}}>
          <div className="input-group" style={{ width: '100%' }}>
            <span className="input-group-text" id="sequenceNumberPrefix" style={{ fontWeight: 'bold', fontSize: 20 }}>Calibration Data Record Number</span>
            <input type="text" className="form-control" style={{ fontSize: 20 }} aria-describedby="sequenceNumberPrefix" maxLength="4" value={calibrationDataRecordNumber} onChange={(e) => setcalibrationDataRecordNumber(e.target.value)} id="calibrationDataRecordNumber"/>
          </div>
          </div>

        
            <div className="input-group">
              <div className="input-group-text">
                  <input className="form-check-input mt-0" type="radio" value="0" name='sensorLocation'></input>
                </div>
                <input type="text" disabled={true} style={{ fontSize: '18px' , fontWeight: 700}} className="form-control" aria-label="Text input with radio button" value="Calibration Data Rejected ( Calibration Failed )"></input>
            </div>
            <div className="input-group">
                <div className="input-group-text">
                  <input className="form-check-input mt-0" type="radio" value="1" name='sensorLocation' ></input>
                </div>
                <input type="text" disabled={true} style={{ fontSize: '20px' , fontWeight: 500}} className="form-control" aria-label="Text input with radio button" value="Calibration Data Out of Range"></input>
            </div>
            <div className="input-group">
                <div className="input-group-text">
                  <input className="form-check-input mt-0" type="radio" value="2" name='sensorLocation' ></input>
                </div>
                <input type="text" disabled={true} style={{ fontSize: '20px' , fontWeight: 500}} className="form-control" aria-label="Text input with radio button" value="Calibration Process Pending"></input>
            </div>


        </div>

      )}


        {selectedSocpOperator === 'SetPatientHighAlertLevel' && (

          <div className='d-flex' style={{ width: '85%', alignItems:'center', justifyContent:'center', marginBottom:'1rem', display:'flex'}}>
          <div className="input-group" style={{ width: '80%' }}>
            <span className="input-group-text" id="sequenceNumberPrefix" style={{ fontWeight: 'bold', fontSize: 20 }}>Patient High Alert Level (mg/dL)</span>
            <input type="text" className="form-control" style={{ fontSize: 20 }} aria-describedby="sequenceNumberPrefix" maxLength="4" value={sequenceNumber} onChange={(e) => setSequenceNumber(e.target.value)} id="sequenceNumberInput"/>
          </div>
        </div>

      )}

        {selectedSocpOperator === 'SetPatientLowAlertLevel' && (

          <div className='d-flex' style={{ width: '85%', alignItems:'center', justifyContent:'center', marginBottom:'1rem', display:'flex'}}>
          <div className="input-group" style={{ width: '80%' }}>
            <span className="input-group-text" id="sequenceNumberPrefix" style={{ fontWeight: 'bold', fontSize: 20 }}>Patient Low Alert Level (mg/dL)</span>
            <input type="text" className="form-control" style={{ fontSize: 20 }} aria-describedby="sequenceNumberPrefix" maxLength="4" value={sequenceNumber} onChange={(e) => setSequenceNumber(e.target.value)} id="sequenceNumberInput"/>
          </div>
        </div>

      )}

        {selectedSocpOperator === 'SetHypoAlertLevel' && (

        <div className='d-flex' style={{ width: '85%', alignItems:'center', justifyContent:'center', marginBottom:'1rem', display:'flex'}}>
          <div className="input-group" style={{ width: '80%' }}>
            <span className="input-group-text" id="sequenceNumberPrefix" style={{ fontWeight: 'bold', fontSize: 20 }}>Hypo Alert Level (mg/dL)</span>
            <input type="text" className="form-control" style={{ fontSize: 20 }} aria-describedby="sequenceNumberPrefix" maxLength="4" value={sequenceNumber} onChange={(e) => setSequenceNumber(e.target.value)} id="sequenceNumberInput"/>
          </div>
        </div>

      )}

        {selectedSocpOperator === 'SetHyperAlertLevel' && (

        <div className='d-flex' style={{ width: '85%', alignItems:'center', justifyContent:'center', marginBottom:'1rem', display:'flex'}}>
          <div className="input-group" style={{ width: '80%' }}>
            <span className="input-group-text" id="sequenceNumberPrefix" style={{ fontWeight: 'bold', fontSize: 20 }}>Hyper Alert Level (mg/dL)</span>
            <input type="text" className="form-control" style={{ fontSize: 20 }} aria-describedby="sequenceNumberPrefix" maxLength="4" value={sequenceNumber} onChange={(e) => setSequenceNumber(e.target.value)} id="sequenceNumberInput"/>
          </div>
        </div>

      )}

        {selectedSocpOperator === 'SetRateofDecreaseAlertLevel' && (

          <div className='d-flex' style={{ width: '85%', alignItems:'center', justifyContent:'center', marginBottom:'1rem', display:'flex'}}>
          <div className="input-group" style={{ width: '80%' }}>
            <span className="input-group-text" id="sequenceNumberPrefix" style={{ fontWeight: 'bold', fontSize: 20 }}>Rate of Decrease Alert Level (mg/dL/min)</span>
            <input type="text" className="form-control" style={{ fontSize: 20 }} aria-describedby="sequenceNumberPrefix" maxLength="4" value={sequenceNumber} onChange={(e) => setSequenceNumber(e.target.value)} id="sequenceNumberInput"/>
          </div>
        </div>

      )}

      {selectedSocpOperator === 'SetRateofIncreaseAlertLevel' && (

          <div className='d-flex' style={{ width: '85%', alignItems:'center', justifyContent:'center', marginBottom:'1rem', display:'flex'}}>
          <div className="input-group" style={{ width: '80%' }}>
            <span className="input-group-text" id="sequenceNumberPrefix" style={{ fontWeight: 'bold', fontSize: 20 }}>Rate of Increase Alert Level (mg/dL/min)</span>
            <input type="text" className="form-control" style={{ fontSize: 20 }} aria-describedby="sequenceNumberPrefix" maxLength="4" value={sequenceNumber} onChange={(e) => setSequenceNumber(e.target.value)} id="sequenceNumberInput"/>
          </div>
        </div>

      )}


      <div class="CGM__container4 container grid">

        <div class="CGMtitle__card3">

          <button id="sendSocp" onClick={onSendSocpClick}>S e n d</button>

        </div>
        <div id="socpSuccessMessage" class="CGM__Response"></div>

      </div>

  </div>
  );
};


export default ContinuousGlucoseMonitoring;
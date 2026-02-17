// ******************************************************************************
// * @file    Electrocardiogram.js
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
import { Chart, registerables } from 'chart.js';
import iconInfo from '../images/iconInfo.svg';
import { createLogElement } from "../components/Header";
import { OverlayTrigger, Popover } from 'react-bootstrap';

Chart.register(...registerables);


const ECG = (props) => {
  const GRAPH_MAX_LABELS = 300;

  let HSF_Characteristic_Read_Indicate;
  let LHO_Characteristic_Notify_Indicate;
  let SHO_Characteristic_Notify_Indicate;
  let RACP_Characteristic_Write_Indicate;
  let GHSP_Characteristic_Write_Indicate;
  let OSC_Characteristic_Indicate;

  let ECGDataSet = [];
  let ECGTime = [];
  
  const chartContainer = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);

  const createChartConfig = (data) => {
    return {
      type: "line",
      data: {
        labels: data.map((_, index) => index), // Utilisez les indices comme étiquettes
        datasets: [{
          borderColor: '#03234B',
          backgroundColor: '#3CB4E6',
          data: data,
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
            text: 'ECG Chart',
            font: {
              size: 20,
            }
          },
        }
      }
    };
  };

  useEffect(() => {
    if (chartContainer && chartContainer.current) {
      const newChartInstance = new Chart(chartContainer.current, createChartConfig([]));
      setChartInstance(newChartInstance);
    }
  }, [chartContainer]);

  const updateChart = (data) => {
    if (chartInstance) {
      const currentTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });

      if (ECGDataSet.length >= GRAPH_MAX_LABELS) {
        for(let i = 0; i < data.length; i++){
          ECGDataSet.pop(); // Remove the last element
          ECGDataSet.unshift(data[i]); // Add data at the beginning of to the Array
          ECGTime.pop(); // Remove the last element
          ECGTime.unshift(currentTime); // Add current time at the beginning of to the Array
        }
      } else {
        for(let i = 0; i < data.length; i++){
          ECGDataSet.unshift(data[i]); // Add data at the beginning of to the Array
          ECGTime.unshift(currentTime); // Add current time at the beginning of to the Array
        }
      }

      chartInstance.data.datasets[0].data = ECGDataSet;
      chartInstance.data.labels = ECGTime;
      chartInstance.update();
    }
  };

  // Filtering the different datathroughput characteristics
  props.allCharacteristics.map(element => {
    switch (element.characteristic.uuid) {
      case "00002bf3-0000-1000-8000-00805f9b34fb":
        HSF_Characteristic_Read_Indicate = element; 
        HSF_Characteristic_Read_Indicate.characteristic.startNotifications();
        break;
      case "00002b8b-0000-1000-8000-00805f9b34fb":
        LHO_Characteristic_Notify_Indicate = element; 
        LHO_Characteristic_Notify_Indicate.characteristic.startNotifications();
        break;
      case "00002bdd-0000-1000-8000-00805f9b34fb":
        SHO_Characteristic_Notify_Indicate = element; 
        SHO_Characteristic_Notify_Indicate.characteristic.startNotifications();
        break;
      case "00002a52-0000-1000-8000-00805f9b34fb":
        RACP_Characteristic_Write_Indicate = element; 
        RACP_Characteristic_Write_Indicate.characteristic.startNotifications();
        break;
      case "00002bf4-0000-1000-8000-00805f9b34fb":
        GHSP_Characteristic_Write_Indicate = element; 
        GHSP_Characteristic_Write_Indicate.characteristic.startNotifications();
        break;
      case "00002bf1-0000-1000-8000-00805f9b34fb":
        OSC_Characteristic_Indicate = element; 
        OSC_Characteristic_Indicate.characteristic.startNotifications();
        break;
      
      default:
        console.log("# No characteristics found..");
    }
  });
  
  document.getElementById("readmeInfo").style.display = "none";

   // // write button handler
    async function onWriteButtonClick() {
        let myWord = new Uint8Array(1);
        myWord[0] = 0x1;

        try {
            await GHSP_Characteristic_Write_Indicate.characteristic.writeValue(myWord);
            createLogElement(myWord, 1, "Start Measure");
        }
        catch (error) {
            console.log('2 : Argh! ' + error);
        }

        // document.getElementById('writeButton').innerHTML = "Measuring"
        
        console.log('Start ECG');

        // LHO_Characteristic_Notify_Indicate.characteristic.startNotifications();
        LHO_Characteristic_Notify_Indicate.characteristic.oncharacteristicvaluechanged = HCG_Handler;
    }
    
    var sample = new Uint8Array(0); 
  
    function HCG_Handler(event) {
        console.log("Notification Received");
        var buf = new Uint8Array(event.target.value.buffer);
        // console.log(buf);
        
        if((buf[0] & 1) === 1){
          console.log('First segment');
          //buf[1] : Observation Class Type
          //buf[2&3] : Length
          //buf[4&5] : Flags
          //buf[6-9] : Observation Type 
          //buf[10] : Time Stamp
          //buf[11-18] : Time stamp param
          //buf[19&20] : Observation Value
          //buf[21-24] : Scale Factor
          //buf[25-28] : Offset
          //buf[29-32] : Sample Period
          //buf[33] : Number of Samples Per Period
          //buf[34] : Bytes Per Sample
          //buf[35] : Number Of Samples
          //buf[36-...] : sample
          
          sample = buf.subarray(36);
          
        }else{
          let newSample = new Uint8Array(sample.length + buf.length - 1);
          console.log(buf);
          newSample.set(sample);
          newSample.set(buf.subarray(1), sample.length);
          sample = newSample;
          console.log(sample);
        }
        
        // End of packet
        if((buf[0] >> 1 & 1) === 1){
          console.log(sample);
          const sample_16 = new Uint16Array(sample.length / 2);
          
          for (let i = 0; i < sample_16.length; i++) {
            sample_16[i] = (sample[i * 2] | (sample[i * 2 + 1] << 8));
          }
          console.log(sample_16);
          updateChart(sample_16);
        }
        // createLogElement(buf, 1, "HEART RATE NOTIFICATION");
        // updateDataset(0, buf[1].toString())
    }

  return (
    <div className="container-fluid">
            <div className='row justify-content-center mt-3 mb-3'>
                <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
                    <button className="defaultButton w-100" type="button" onClick={onWriteButtonClick} id="writeButton">Start Measure</button>
                </div>
            </div>
            <div class="card text-dark bg-light mb-3">
                            
                <div style={{height: "400px", width: "100%"}}>  
                    <canvas ref={chartContainer}></canvas>
                </div>
                
                <div class="card-footer">
                    <small class="text-muted"></small>
                </div>
            </div>

    </div>
  );
};

export default ECG;
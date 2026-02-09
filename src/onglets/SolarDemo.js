// ******************************************************************************
// * @file    SolarDemo.js
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
Chart.register(...registerables);


const SolarDemo = (props) => {
    const GRAPH_MAX_LABELS = 25;
    let notifyCharacteristicTemp;
    let notifyCharacteristicLux;; 

    let TemperatureDataSet = [];
    let TemperatureTime = [];
    let LuxDataSet = [];
    let LuxTime = [];
    
    let chartConfigTemp = {
        type: "line",
        data: {
            labels: "",
            datasets: [{
                borderColor: '#03234B',
                backgroundColor: '#3CB4E6',
                data: TemperatureDataSet,
              }],
        },
        options: {
            // aspectRatio: 1,
            maintainAspectRatio: false,
            responsive: true,
            transition: {
                duration: 0,
            },
            plugins: {
                legend: { 
                    display: false },
                title: {
                    position: 'top',
                    align: 'center',
                    display: true,
                    text: 'Temperature',
                    font: {
                        size: 20,
                    }
              },
            }
        }
    }

    const chartContainerTemp = useRef(null);
    const [chartInstanceTemp, setChartInstanceTemp] = useState(null);

    useEffect(() => {
        if (chartContainerTemp && chartContainerTemp.current) {
            const newChartInstanceTemp = new Chart(chartContainerTemp.current, chartConfigTemp);
            setChartInstanceTemp(newChartInstanceTemp);
        }
    }, [chartContainerTemp]);

        let chartConfigLux = {
        type: "line",
        data: {
            labels: "",
            datasets: [{
                borderColor: '#03234B',
                backgroundColor: '#3CB4E6',
                data: LuxDataSet,
              }],
        },
        options: {
            // aspectRatio: 1,
            maintainAspectRatio: false,
            responsive: true,
            transition: {
                duration: 0,
            },
            plugins: {
                legend: { 
                    display: false },
                title: {
                    position: 'top',
                    align: 'center',
                    display: true,
                    text: 'Lux',
                    font: {
                        size: 20,
                    }
              },
            }
        }
    }
    const chartContainerLux = useRef(null);
    const [chartInstanceLux, setChartInstanceLux] = useState(null);

    useEffect(() => {
        if (chartContainerLux && chartContainerLux.current) {
            const newChartInstanceLux = new Chart(chartContainerLux.current, chartConfigLux);
            setChartInstanceLux(newChartInstanceLux);
        }
    }, [chartContainerLux]);


    const updateTempDataset = (datasetIndex, data) => {
        let currentTime = new Date();
        let time = currentTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });

        if (TemperatureDataSet.length >= GRAPH_MAX_LABELS) {
            TemperatureDataSet.shift(); // Remove the first element
            TemperatureDataSet.push(data); // Add data at the end of to the Array
            TemperatureTime.shift(); // Remove the first element
            TemperatureTime.push(time); // Add current time at the end of to the Array
        } else {
            TemperatureDataSet.push(data); // Add data at the end of to the Array
            TemperatureTime.push(time); // Add current time at the end of to the Array
        }

        // Update the chart with new TemperatureDataSet and TemperatureTime values
        chartInstanceTemp.data.datasets[datasetIndex].data = TemperatureDataSet;
        chartInstanceTemp.data.labels = TemperatureTime;
        chartInstanceTemp.update();
    };


    const updateLuxDataset = (datasetIndex, data) => {
        let currentTime = new Date();
        let time = currentTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });

        if (LuxDataSet.length >= GRAPH_MAX_LABELS) {
            LuxDataSet.shift(); // Remove the first element
            LuxDataSet.push(data); // Add data at the end of to the Array
            LuxTime.shift(); // Remove the first element
            LuxTime.push(time); // Add current time at the end of to the Array
        } else {
            LuxDataSet.push(data); // Add data at the end of to the Array
            LuxTime.push(time); // Add current time at the end of to the Array
        }

        // Update the chart with new TemperatureDataSet and TemperatureTime values
        chartInstanceLux.data.datasets[datasetIndex].data = LuxDataSet;
        chartInstanceLux.data.labels = LuxTime;
        chartInstanceLux.update();
    };
    // Filtering the different datathroughput characteristics
    props.allCharacteristics.map(element => {
      switch (element.characteristic.uuid) {
        case "0000ab41-8e22-4541-9d4c-21edae82ed19":
          notifyCharacteristicTemp = element;
          notifyCharacteristicTemp.characteristic.stopNotifications();
          break;
        case "0000ab42-8e22-4541-9d4c-21edae82ed19":
          notifyCharacteristicLux = element;
          notifyCharacteristicLux.characteristic.stopNotifications();
          break;
        default:
          console.log("# No characteristics found..");
    }
  });

    document.getElementById("readmeInfo").style.display = "none";
  

    async function onNotifyButtonClick() {
        let notifStatus = document.getElementById('notifyButton').innerHTML;
        if (notifStatus === "Notify OFF") {
            console.log('Notification ON');
            notifyCharacteristicLux.characteristic.startNotifications();
            notifyCharacteristicTemp.characteristic.startNotifications();
            notifyCharacteristicTemp.characteristic.oncharacteristicvaluechanged = notifHandlerTemp;
            notifyCharacteristicLux.characteristic.oncharacteristicvaluechanged = notifHandlerLux;
            document.getElementById('notifyButton').innerHTML = "Notify ON"
            createLogElement(notifyCharacteristicTemp, 3, "SolarDemo Temp ENABLE NOTIFICATION ");
            createLogElement(notifyCharacteristicLux, 3, "SolarDemo lux ENABLE NOTIFICATION ");
            console.log(notifyCharacteristicLux.characteristic);
            console.log(notifyCharacteristicTemp.characteristic);
        } else {
            notifyCharacteristicTemp.characteristic.stopNotifications();
            notifyCharacteristicLux.characteristic.stopNotifications();
            console.log('Notification OFF');
            document.getElementById('notifyButton').innerHTML = "Notify OFF"
            createLogElement(notifyCharacteristicTemp, 3, "SolarDemo Temp DISABLE NOTIFICATION ");
            createLogElement(notifyCharacteristicLux, 3, "SolarDemo Lux DISABLE NOTIFICATION ");
            console.log(notifyCharacteristicTemp.characteristic);
            console.log(notifyCharacteristicLux.characteristic);
        }
    }

    function notifHandlerTemp(event) {
        console.log("Temp Notification Received");
        var buf = new Uint8Array(event.target.value.buffer);
        console.log(buf);
        
        createLogElement(buf, 2, "Lux NOTIFICATION");
        updateTempDataset(0, buf[0])
    }
    function notifHandlerLux(event) {
        console.log("Lux Notification Received");
        var buf = new Uint8Array(event.target.value.buffer);
        console.log(buf);
        
        createLogElement(buf, 2, "Lux NOTIFICATION");
        updateLuxDataset(0, buf[0]+(buf[1]<<8))
    }

    
  const popoverWriteButton = (
    <Popover id="popover-trigger-hover-focus" title="Popover bottom">
      <strong>Info :</strong> Write the heart rate control point.
    </Popover>
  );
    
  const popoverNotifyButton = (
    <Popover id="popover-trigger-hover-focus" title="Popover bottom">
      <strong>Info :</strong> Enable the reception of notifications from the connected device. <br />
      Is required to display data on the chart.
    </Popover>
  );

    return (
    <div className="container-fluid">
        <div className="container">
            <div className='row justify-content-center mt-3'>
                <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2' >
                <div className='d-flex flex-row'>
                    <button className="defaultButton w-100" type="button" onClick={onNotifyButtonClick} id="notifyButton">Notify OFF</button>
                    <span>
                        <OverlayTrigger
                            trigger={['hover', 'focus']}
                            placement="bottom"
                            overlay={popoverNotifyButton}>
                            <img className="iconInfo" src={iconInfo}></img>
                        </OverlayTrigger>
                    </span>
                </div>
                </div>

            </div>

            <div class="card text-dark bg-light mb-3">
                <div class="card-header" >Solar Demo Chart</div>

                
                <div style={{height: "400px", width: "100%"}}>  
                    <canvas ref={chartContainerLux}></canvas>
                </div>
                
                <div style={{height: "400px", width: "100%"}}>  
                    <canvas ref={chartContainerTemp}></canvas>
                </div>
                
                <div class="card-footer">
                    <small class="text-muted"></small>
                </div>
            </div>
            
            
        </div>
    </div>
    );
};

export default SolarDemo;
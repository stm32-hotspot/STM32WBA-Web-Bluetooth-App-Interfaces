// ******************************************************************************
// * @file    HeartRate.js
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


const HeartRate = (props) => {
    const GRAPH_MAX_LABELS = 25;
    let notifyCharacteristic; // 00002a37-0000-1000-8000-00805f9b34fb
    let readCharacteristic; // 00002a38-0000-1000-8000-00805f9b34fb
    let writeCharacteristic; // 00002a39-0000-1000-8000-00805f9b34fbs
    //let rebootCharacteristic;
    let displayRebootPanel = "none";
    let heartRateDataSet = [];
    let heartRateTime = [];
    
    let chartConfig = {
        type: "line",
        data: {
            labels: "",
            datasets: [{
                borderColor: '#03234B',
                backgroundColor: '#3CB4E6',
                data: heartRateDataSet,
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
                    text: 'Heart Rate Chart',
                    font: {
                        size: 20,
                    }
              },
            }
        }
    }

    const chartContainer = useRef(null);
    const [chartInstance, setChartInstance] = useState(null);

    useEffect(() => {
        if (chartContainer && chartContainer.current) {
            const newChartInstance = new Chart(chartContainer.current, chartConfig);
            setChartInstance(newChartInstance);
        }
    }, [chartContainer]);

    const updateDataset = (datasetIndex, data) => {
        let currentTime = new Date();
        let time = currentTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });

        if (heartRateDataSet.length >= GRAPH_MAX_LABELS) {
            heartRateDataSet.pop(); // Remove the last element
            heartRateDataSet.unshift(data); // Add data at the beginning of to the Array
            heartRateTime.pop(); // Remove the last element
            heartRateTime.unshift(time); // Add current time at the beginning of to the Array
        } else {
            heartRateDataSet.unshift(data); // Add data at the beginning of to the Array
            heartRateTime.unshift(time); // Add current time at the beginning of to the Array
        }

        // Update the chart with new heartRateDataSet and heartRateTime values
        chartInstance.data.datasets[datasetIndex].data = heartRateDataSet;
        chartInstance.data.labels = heartRateTime;
        chartInstance.update();
    };

    // Filtering the different datathroughput characteristics
    props.allCharacteristics.map(element => {
        switch (element.characteristic.uuid){
            case "00002a37-0000-1000-8000-00805f9b34fb" : 
                notifyCharacteristic = element;
                notifyCharacteristic.characteristic.stopNotifications();
            break;
            case "00002a38-0000-1000-8000-00805f9b34fb" : 
                readCharacteristic = element;
            break;
            case "00002a39-0000-1000-8000-00805f9b34fb" : 
                writeCharacteristic = element;
            break;
           /* case "0000fe11-8e22-4541-9d4c-21edae82ed19":
                rebootCharacteristic = element;
                displayRebootPanel = "block";
            break;*/
            default:
                console.log("# No characteristics find..");
        }
    });

    document.getElementById("readmeInfo").style.display = "none";

    // read button handler
    async function onReadButtonClick() {
        var value = await readCharacteristic.characteristic.readValue();
        let statusWord = new Uint8Array(value.buffer);
        console.log(statusWord);
        document.getElementById('readLabel').innerHTML = "0x" + statusWord.toString();
        createLogElement(statusWord, 1, "HEART RATE READ");
    }

    // write button handler
    async function onWriteButtonClick() {
        let myInput = document.getElementById('writeInput').value;
        let myWord;
        console.log(myInput);
        myWord = new Uint8Array(2);
        myWord[0] = myInput.slice(0, 2);
        myWord[1] = myInput.slice(2, 4);
        try {
            console.log("Writing >> " + myWord);
            await writeCharacteristic.characteristic.writeValue(myWord);
            createLogElement(myWord, 1, "HEART RATE WRITE");
        }
        catch (error) {
            console.log('Argh! ' + error);
        }
    }

    // reset calorie count button handler
    async function onResetButtonClick() {
        const resetEnergyExpended = Uint8Array.of(1);
        try {
            console.log("Writing >> " + resetEnergyExpended);
            await writeCharacteristic.characteristic.writeValue(resetEnergyExpended);
            createLogElement(resetEnergyExpended, 1, "HEART RATE WRITE");
        }
        catch (error) {
            console.log('Argh! ' + error);
    }
  }

    async function onNotifyButtonClick() {
        let notifStatus = document.getElementById('notifyButton').innerHTML;
        if (notifStatus === "Notify OFF") {
            console.log('Notification ON');
            notifyCharacteristic.characteristic.startNotifications();
            notifyCharacteristic.characteristic.oncharacteristicvaluechanged = notifHandler;
            document.getElementById('notifyButton').innerHTML = "Notify ON"
            createLogElement(notifyCharacteristic, 3, "HEART RATE ENABLE NOTIFICATION");
            console.log(notifyCharacteristic.characteristic);
        } else {
            notifyCharacteristic.characteristic.stopNotifications();
            console.log('Notification OFF');
            document.getElementById('notifyButton').innerHTML = "Notify OFF"
            createLogElement(notifyCharacteristic, 3, "HEART RATE DISABLE NOTIFICATION");
            console.log(notifyCharacteristic.characteristic);
        }
    }

    function notifHandler(event) {
        console.log("Notification Received");
        var buf = new Uint8Array(event.target.value.buffer);
        console.log(buf);
        
        document.getElementById('heartRateMeasurement').innerHTML = "Heart Rate measurement : " + buf[1].toString();
        document.getElementById('energyExpended').innerHTML = "Energy expended : " + buf[3].toString();
        document.getElementById('bodySensorLocation').innerHTML = "Body sensor location : " + buf[6].toString();
        // addDataToCHart(buf[1]);
        console.log(JSON.stringify(buf));
        createLogElement(buf, 2, "HEART RATE NOTIFICATION");
        updateDataset(0, buf[1].toString())
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
    
  const popoverReadButton = (
    <Popover id="popover-trigger-hover-focus" title="Popover bottom">
      <strong>Info :</strong> Read the body sensor location<br />
      Example : <br />
      0x 4 : Hand
    </Popover>
  );
    
  const popoverResetButton = (
    <Popover id="popover-trigger-hover-focus" title="Popover bottom">
      <strong>Info :</strong> Reset the energy expended.
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
                <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
                <div className='d-flex flex-row'>
                    <button className="defaultButton w-100" type="button" onClick={onResetButtonClick}>Reset</button>
                    <span>
                        <OverlayTrigger
                            trigger={['hover', 'focus']}
                            placement="bottom"
                            overlay={popoverResetButton}>
                            <img className="iconInfo" src={iconInfo}></img>
                        </OverlayTrigger>
                    </span>
                </div>
                </div>
            </div>
            <div className='row justify-content-center mt-3 mb-3'>
                <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
                    <div class="input-group">
                        <span class="input-group-text" id="button-write">0x</span>
                        <input type="text" class="form-control" placeholder="..." aria-describedby="button-write" maxLength="4" id="writeInput"></input>
                        <button class="defaultButton" type="button" id="button-write" onClick={onWriteButtonClick} data-bs-toggle="tooltip" data-bs-placement="bottom" title="Write Control Point">Write</button>
                        <span>
                            <OverlayTrigger
                                trigger={['hover', 'focus']}
                                placement="bottom"
                                overlay={popoverWriteButton}>
                                <img className="iconInfo" src={iconInfo}></img>
                            </OverlayTrigger>
                        </span>
                    </div>
                </div>

                <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
                    <div className="input-group">
                        <span className="input-group-text text-center form-control" id="readLabel">0x....</span>
                        <button className="defaultButton form-control" type="button" onClick={onReadButtonClick} aria-describedby="readLabel">Read</button>
                        <span>
                            <OverlayTrigger
                                trigger={['hover', 'focus']}
                                placement="bottom"
                                overlay={popoverReadButton}>
                                <img className="iconInfo" src={iconInfo}></img>
                            </OverlayTrigger>
                        </span>
                    </div>              
                </div>
            </div>
            <div class="card text-dark bg-light mb-3">
                <div class="card-header" >Heart Rate Chart</div>
                <div class="card-body">
                    <p class="card-text" id="heartRateMeasurement">Heart rate measurement :</p>
                    <p class="card-text" id="energyExpended">Energy expended :</p>
                    <p class="card-text" id="bodySensorLocation">Body sensor location :</p>
                </div>
                <div style={{height: "400px", width: "100%"}}>  
                    <canvas ref={chartContainer}></canvas>
                </div>
                
                <div class="card-footer">
                    <small class="text-muted"></small>
                </div>
            </div>
            
            
        </div>
    </div>
    );
};

export default HeartRate;
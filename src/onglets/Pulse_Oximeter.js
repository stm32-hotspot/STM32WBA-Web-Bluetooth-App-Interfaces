// ******************************************************************************
// * @file    Pulse_Oximeter.js
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
import { createLogElement } from "../components/Header";

Chart.register(...registerables);

const PulseOximeter = (props) => {
    const GRAPH_MAX_LABELS = 25;
    let GHSP_Characteristic_Write_Indicate;
    let LHO_Characteristic_Notify_Indicate;
    const [isMeasuring, setIsMeasuring] = useState(false);
    let displayRebootPanel = "none";

    const oxygenSaturationChartContainer = useRef(null);
    const [oxygenSaturationChartInstance, setOxygenSaturationChartInstance] = useState(null);
    let oxygenSaturationDataSet = useRef([]);
    let oxygenSaturationTime = useRef([]);

    const heartRateChartContainer = useRef(null);
    const [heartRateChartInstance, setHeartRateChartInstance] = useState(null);
    let heartRateDataSet = useRef([]);
    let heartRateTime = useRef([]);

    useEffect(() => {
        if (oxygenSaturationChartContainer && oxygenSaturationChartContainer.current) {
            const newOxygenSaturationChartInstance = new Chart(oxygenSaturationChartContainer.current, {
                type: "line",
                data: {
                    labels: [],
                    datasets: [{
                        borderColor: '#03234B',
                        backgroundColor: '#F8F9FA',
                        data: oxygenSaturationDataSet,
                    }],
                },
                options: {
                    maintainAspectRatio: false,
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: 'Pulse Oximeter Chart',
                            color: '#03234B',
                            font: { size: 20 },
                        },
                    },
                },
            });
            setOxygenSaturationChartInstance(newOxygenSaturationChartInstance);
        }
    }, [oxygenSaturationChartContainer]);

    useEffect(() => {
        if (heartRateChartContainer && heartRateChartContainer.current) {
            const newHeartRateChartInstance = new Chart(heartRateChartContainer.current, {
                type: "line",
                data: {
                    labels: [],
                    datasets: [{
                        borderColor: '#E6007E',
                        backgroundColor: '#F8F9FA',
                        data: heartRateDataSet,
                    }],
                },
                options: {
                    maintainAspectRatio: false,
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: 'Heart Rate Chart',
                            color: '#E6007E',
                            font: { size: 20 },
                        },
                    },
                },
            });
            setHeartRateChartInstance(newHeartRateChartInstance);
        }
    }, [heartRateChartContainer]);

    const updateOxygenSaturationChart = (oxygenSaturationValue) => {
        const currentTime = new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });

        if (oxygenSaturationDataSet.current.length >= GRAPH_MAX_LABELS) {
            oxygenSaturationDataSet.current.pop();
            oxygenSaturationDataSet.current.unshift(oxygenSaturationValue);
            oxygenSaturationTime.current.pop();
            oxygenSaturationTime.current.unshift(currentTime);
        } else {
            oxygenSaturationDataSet.current.unshift(oxygenSaturationValue);
            oxygenSaturationTime.current.unshift(currentTime);
        }

        if (oxygenSaturationChartInstance) {
            oxygenSaturationChartInstance.data.datasets[0].data = oxygenSaturationDataSet.current;
            oxygenSaturationChartInstance.data.labels = oxygenSaturationTime.current;
            oxygenSaturationChartInstance.update();
        }
    };

    const updateHeartRateChart = (heartRateValue) => {
        const currentTime = new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });

        if (heartRateDataSet.current.length >= GRAPH_MAX_LABELS) {
            heartRateDataSet.current.pop();
            heartRateDataSet.current.unshift(heartRateValue);
            heartRateTime.current.pop();
            heartRateTime.current.unshift(currentTime);
        } else {
            heartRateDataSet.current.unshift(heartRateValue);
            heartRateTime.current.unshift(currentTime);
        }

        if (heartRateChartInstance) {
            heartRateChartInstance.data.datasets[0].data = heartRateDataSet.current;
            heartRateChartInstance.data.labels = heartRateTime.current;
            heartRateChartInstance.update();
        }
    };

    props.allCharacteristics.map(element => {
        switch (element.characteristic.uuid) {
            case "00002bf4-0000-1000-8000-00805f9b34fb":
                GHSP_Characteristic_Write_Indicate = element;
                GHSP_Characteristic_Write_Indicate.characteristic.startNotifications();
                break;
            case "00002b8b-0000-1000-8000-00805f9b34fb":
                LHO_Characteristic_Notify_Indicate = element;
                LHO_Characteristic_Notify_Indicate.characteristic.startNotifications();
                break;
            default:
                console.log("# No characteristics found..");
        }
    });

    document.getElementById("readmeInfo").style.display = "none";

    async function onStartMeasurementClick() {
        let myWord = new Uint8Array(1);
        if (!isMeasuring) {
            // Start notifications
            myWord[0] = 0x1;
            try {
                await GHSP_Characteristic_Write_Indicate.characteristic.writeValue(myWord);
                createLogElement(myWord, 1, "Start Measure");
                console.log('Start Heart Rate and Oximeter Measurement');
                LHO_Characteristic_Notify_Indicate.characteristic.oncharacteristicvaluechanged = notifHandler;
            } catch (error) {
                console.log('Error: ' + error);
            }
        } else {
            // Stop notifications
            myWord[0] = 0x2;
            try {
                await GHSP_Characteristic_Write_Indicate.characteristic.writeValue(myWord);
                await LHO_Characteristic_Notify_Indicate.characteristic.stopNotifications();
                createLogElement(myWord, 1, "Stop Measure");
                console.log('Stop Heart Rate and Oximeter Measurement');
            } catch (error) {
                console.log('Error: ' + error);
            }
        }

        setIsMeasuring(!isMeasuring);
    }

    const resetCharts = () => {
        oxygenSaturationDataSet.current = [];
        oxygenSaturationTime.current = [];
        if (oxygenSaturationChartInstance) {
            oxygenSaturationChartInstance.data.datasets[0].data = [];
            oxygenSaturationChartInstance.data.labels = [];
            oxygenSaturationChartInstance.update();
        }
        heartRateDataSet.current = [];
        heartRateTime.current = [];
        if (heartRateChartInstance) {
            heartRateChartInstance.data.datasets[0].data = [];
            heartRateChartInstance.data.labels = [];
            heartRateChartInstance.update();
        }

        console.log("Charts have been reset");
    };

    function notifHandler(event) {
        console.log("Notification Received");
        var buf = new Uint8Array(event.target.value.buffer);
        console.log(buf);

        const oxygenSaturation = (buf[32] | (buf[33] << 8) | (buf[34] << 16) | (buf[35] << 24));
        const heartRate = (buf[buf.length - 4] | (buf[buf.length - 3] << 8) | (buf[buf.length - 2] << 16) | (buf[buf.length - 1] << 24));

        updateOxygenSaturationChart(oxygenSaturation);
        updateHeartRateChart(heartRate);
    }



    return (
        <div className="container-fluid">
            <div className="row justify-content-center mt-3 mb-3">
                <div className="d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2">
                    <button className="defaultButton w-100" type="button" onClick={onStartMeasurementClick} id="startButton">
                        {isMeasuring ? "Stop Measurement" : "Start Measurement"}
                    </button>
                </div>
                <div className="d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2">
                    <button className="defaultButton w-100" type="button" onClick={resetCharts} id="resetButton">
                        Reset
                    </button>
                </div>
            </div>
            <div className="row">
                <div className="col-md-6">
                    <div className="card text-dark bg-light mb-3">
                        <div className="card-body">
                            <div style={{ height: "400px", width: "100%" }}>
                                <canvas ref={oxygenSaturationChartContainer}></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card text-dark bg-light mb-3">
                        <div className="card-body">
                            <div style={{ height: "400px", width: "100%" }}>
                                <canvas ref={heartRateChartContainer}></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PulseOximeter;
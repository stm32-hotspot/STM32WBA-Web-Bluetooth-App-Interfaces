// ******************************************************************************
// * @file    DataThroughput.js
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
import iconInfo from '../images/iconInfo.svg';
import iconInfoPink from '../images/iconInfoPink.svg';
import { Chart, registerables } from 'chart.js';
import { OverlayTrigger, Popover } from 'react-bootstrap';

Chart.register(...registerables);

const DataThroughput = (props) => {
    const [downloadDataSet, setDownloadDataSet] = useState([]);
    const [downloadLabelTime, setDownloadLabelTime] = useState([]);
    const [uploadDataSet, setUploadDataSet] = useState([]);
    const [uploadLabelTime, setUploadLabelTime] = useState([]);

    const [intervalIdDownload, setIntervalIdDownload] = useState();
    const [intervalIdUpload, setIntervalIdUpload] = useState();
    const [displayDownloadDiv, setDisplayDownloadDiv] = useState("block");
    const [displayUploadDiv, setDisplayUploadDiv] = useState("none");
    const CHUNK_LENGTH = 237;
    const GRAPH_MAX_LABELS = 25;
    let bytesReceivedDownload = 0;
    let bytesReceivedUpload = 0;
    let MaxBytesPerSecReceivedDownload = 0;
    let MaxBytesPerSecReceivedUpload = 0;
    let downloadNotifyCharacteristic;
    let uploadNotifyCharacteristic;
    let writeCharacteristic;  

    let downloadChartConfig = {
        type: "line",
        data: {
            labels: "",
            datasets: [{
                borderColor: '#03234B',
                backgroundColor: '#3CB4E6',
                data: downloadDataSet,
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
                    text: 'Download Chart',
                    font: {
                        size: 20,
                    }
              },
            }
        }
    }

    let uploadChartConfig = {
        type: "line",
        data: {
            labels: "",
            datasets: [{
                borderColor: '#03234B',
                backgroundColor: '#3CB4E6',
                data: uploadDataSet,
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
                    text: 'Upload Chart',
                    font: {
                        size: 20,
                    }
              },
            }
        }
    }
    
    const downloadChartContainer = useRef(null);
    const [downloadChartInstance, setDownloadChartInstance] = useState(null);

    useEffect(() => {
        if (downloadChartContainer && downloadChartContainer.current) {
            const newDownloadChartInstance = new Chart(downloadChartContainer.current, downloadChartConfig);
            setDownloadChartInstance(newDownloadChartInstance);
        }
    }, [downloadChartContainer]);

    const uploadChartContainer = useRef(null);
    const [uploadChartInstance, setUploadChartInstance] = useState(null);

    useEffect(() => {
        if (uploadChartContainer && uploadChartContainer.current) {
            const newUploadChartInstance = new Chart(uploadChartContainer.current, uploadChartConfig);
            setUploadChartInstance(newUploadChartInstance);
        }
    }, [uploadChartContainer]);

    let dataToUpload = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    // Filtering the different datathroughput characteristics
    props.allCharacteristics.map(element => {
        
        switch (element.characteristic.uuid){
            /*
            case "0000fe81-8e22-4541-9d4c-21edae82fe81" : 
                downloadNotifyCharacteristic = element;
            break;
            case "0000fe82-8e22-4541-9d4c-21edae82fe82" : 
                writeCharacteristic = element;
            break;
            case "0000fe83-8e22-4541-9d4c-21edae82fe83" : 
                uploadNotifyCharacteristic = element;
            break;
            */
            
            case "0000fe81-8e22-4541-9d4c-21edae82ed19" : 
                downloadNotifyCharacteristic = element;
            break;
            case "0000fe82-8e22-4541-9d4c-21edae82ed19" : 
                writeCharacteristic = element;
            break;
            case "0000fe83-8e22-4541-9d4c-21edae82ed19" : 
                uploadNotifyCharacteristic = element;
            break;
            default:
                console.log("# No characteristics find..");
        }
    });
    
    document.getElementById("readmeInfo").style.display = "none";

    async function uploadingData(){
        var encoder = new TextEncoder();
        var view = encoder.encode(dataToUpload);
        try {
            await writeCharacteristic.characteristic.writeValue(view);
        }
        catch (error) {
            console.log('Argh! ' + error);
        }
    }
        
    async function onUploadButtonClick() {
        if (document.getElementById('UploadButton').innerHTML === "START"){
            // 4ms : max 60000
            // 5ms : max 48000
            setIntervalIdUpload(setInterval(uploadingData,4));
            createLogElement("", 0, "DT START UPLOAD");
            document.getElementById('UploadButton').innerHTML = "STOP";
        }else{
            clearInterval(intervalIdUpload);
            document.getElementById('UploadButton').innerHTML = "START";
            createLogElement("", 0, "DT STOP UPLOAD");
        }        
    }

    function eachSeconds() {
        if (bytesReceivedDownload > MaxBytesPerSecReceivedDownload) {
            MaxBytesPerSecReceivedDownload = bytesReceivedDownload;
        }
        addDataToChart("download", bytesReceivedDownload);
        document.getElementById('AveragebytesReceivedDownloadDownload').innerHTML = "Average : " + bytesReceivedDownload + " Bytes/sec";
        document.getElementById('MaxbytesReceivedDownloadDownload').innerHTML = "Max : " + MaxBytesPerSecReceivedDownload + " Bytes/sec";
        document.getElementById('PacketSizeDownload').innerHTML = "Packet size : " + CHUNK_LENGTH + " Bytes";
        bytesReceivedDownload = 0;        
    }

    // Download notify button click handler
    async function onDownloadNotifyButtonClick() {
        // Stop the upload
        clearInterval(intervalIdUpload);
        document.getElementById('UploadButton').innerHTML = "START";
        createLogElement("", 0, "DT STOP UPLOAD");
        // Hide the upload div
        setDisplayUploadDiv("none");

        // Stop upload notifications
        uploadNotifyCharacteristic.characteristic.stopNotifications();
        createLogElement(uploadNotifyCharacteristic, 3, "DT DISABLE NOTIFICATION");
        console.log('Upload Notification OFF');
        let buttonUpload = document.getElementById('notifyButtonUpload');
        buttonUpload.innerHTML = "Upload Notify OFF";
        buttonUpload.disabled = false;

        // Show download div
        setDisplayDownloadDiv("block");

        // Start download notifications
        console.log('Download Notification ON');
        downloadNotifyCharacteristic.characteristic.startNotifications();
        downloadNotifyCharacteristic.characteristic.oncharacteristicvaluechanged = notifHandlerDownload;
        createLogElement(downloadNotifyCharacteristic, 3, "DT ENABLE NOTIFICATION");
        let buttonDownload = document.getElementById('notifyButtonDownload');
        buttonDownload.innerHTML = "Download Notify ON"
        buttonDownload.disabled = true;
        // Start the timer
        setIntervalIdDownload(setInterval(eachSeconds, 1000));
    }

    // Upload notify button click handler
    async function onUploadNotifyButtonClick() {
        // Hide  download div
        setDisplayDownloadDiv("none");

        // Stop download notifications
        clearInterval(intervalIdDownload);
        downloadNotifyCharacteristic.characteristic.stopNotifications();
        createLogElement(downloadNotifyCharacteristic, 3, "DT DISABLE NOTIFICATION");
        console.log('Download Notification OFF');
        let buttonDownload = document.getElementById('notifyButtonDownload');
        buttonDownload.innerHTML = "Download Notify OFF"
        buttonDownload.disabled = false;

        // Show upload div
        setDisplayUploadDiv("block");

        // Start upload notifications
        console.log('Upload Notification ON');
        uploadNotifyCharacteristic.characteristic.startNotifications();
        uploadNotifyCharacteristic.characteristic.oncharacteristicvaluechanged = notifHandlerUpload;
        createLogElement(uploadNotifyCharacteristic, 3, "DT ENABLE NOTIFICATION");
        let buttonUpload = document.getElementById('notifyButtonUpload');
        buttonUpload.innerHTML = "Upload Notify ON";
        buttonUpload.disabled = true;
    }

    function notifHandlerDownload(event) {
        //console.log("Download Notification Received"); 
        var buf = new Uint8Array(event.target.value.buffer);
        //createLogElement(buf, 1, "DT DOWNLOAD NOTIFICATION RECEIVED");
        bytesReceivedDownload = bytesReceivedDownload + buf.byteLength;
    }    

    // Receive a notification each seconds
    function notifHandlerUpload(event) {
        console.log("Upload Notification Received");
        var buf = new Uint8Array(event.target.value.buffer);
        // console.log(buf);
        // createLogElement(buf, 3, "DT UPLOAD NOTIFICATION RECEIVED");
        // Convert decimal into hexadecimal
        let decToHex0 = buf[0].toString(16);
        let decToHex1 = buf[1].toString(16);
        // Concatenate and switch index 1 with index 0
        let hexToDec = decToHex1 + decToHex0;
        hexToDec = parseInt(hexToDec,16);

        // Calculate the maximum bytes uploaded
        bytesReceivedUpload = hexToDec;
        if (bytesReceivedUpload > MaxBytesPerSecReceivedUpload) {
            MaxBytesPerSecReceivedUpload = bytesReceivedUpload;
        }
        addDataToChart("upload", bytesReceivedUpload);
        document.getElementById('AveragebytesReceivedDownloadUpload').innerHTML = "Average : " + hexToDec + " Bytes/sec";
        document.getElementById('MaxbytesReceivedDownloadUpload').innerHTML = "Max : " + MaxBytesPerSecReceivedUpload + " Bytes/sec";
        document.getElementById('PacketSizeUpload').innerHTML = "Packet size : " + CHUNK_LENGTH + " Bytes";    
    }  

    function addDataToChart(transfertType, data) {
        // Get current time
        let currentTime = new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
        if (transfertType === "download"){
            if (downloadDataSet.length >= GRAPH_MAX_LABELS) {
                downloadDataSet.pop(); // Remove the last element
                downloadDataSet.unshift(data); // Add data at the beginning of to the Array
                downloadLabelTime.pop(); // Remove the last element
                downloadLabelTime.unshift(currentTime); // Add current time at the beginning of to the Array
            } else {
                downloadDataSet.unshift(data); // Add data at the beginning of to the Array
                downloadLabelTime.unshift(currentTime); // Add current time at the beginning of to the Array
            }
            // Update the chart with new downloadDataSet and downloadLabelTime values
            downloadChartInstance.data.datasets[0].data = downloadDataSet;
            downloadChartInstance.data.labels = downloadLabelTime;
            downloadChartInstance.update();
        }      
        if (transfertType === "upload"){
            if (uploadDataSet.length >= GRAPH_MAX_LABELS) {
                uploadDataSet.pop(); // Remove the last element
                uploadDataSet.unshift(data); // Add data at the beginning of to the Array
                uploadLabelTime.pop(); // Remove the last element
                uploadLabelTime.unshift(currentTime); // Add current time at the beginning of to the Array
            } else {
                uploadDataSet.unshift(data); // Add data at the beginning of to the Array
                uploadLabelTime.unshift(currentTime); // Add current time at the beginning of to the Array
            }
            // Update the chart with new downloadDataSet and downloadLabelTime values
            uploadChartInstance.data.datasets[0].data = uploadDataSet;
            uploadChartInstance.data.labels = uploadLabelTime;
            uploadChartInstance.update();
        }      
    }      

    function onButtonResetClick(transfertType){
        let currentTime = new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
        switch (transfertType){
            case "upload":
                uploadDataSet.fill(0,0,uploadDataSet.length)
                uploadLabelTime.fill(currentTime,0,uploadLabelTime.length)
                uploadChartInstance.data.datasets[0].data = uploadDataSet;
                uploadChartInstance.data.labels = uploadLabelTime;
                uploadChartInstance.update();
            break;
            case "download":
                downloadDataSet.fill(0,0,downloadDataSet.length)
                downloadLabelTime.fill(currentTime,0,downloadLabelTime.length)
                downloadChartInstance.data.datasets[0].data = downloadDataSet;
                downloadChartInstance.data.labels = downloadLabelTime;
                downloadChartInstance.update();
            break;
        }
    }

    const popoverUploadButton = (
        <Popover id="popover-trigger-hover-focus" title="Popover bottom">
          <strong>Info :</strong> Start/stop upload to the device.
        </Popover>
      );

    const popoverResetButton = (
        <Popover id="popover-trigger-hover-focus" title="Popover bottom">
          <strong>Info :</strong> Reset the data displayed on the chart.
        </Popover>
      );
      
    const popoverDownload = (
        <Popover id="popover-trigger-hover-focus" title="Popover bottom">
          <strong>Info :</strong> This chart display the download throughput. 
        </Popover>
      );
    const popoverUpload = (
        <Popover id="popover-trigger-hover-focus" title="Popover bottom">
          <strong>Info :</strong> This chart display the upload throughput.
        </Popover>
      );

    return (
        <div className="container-fluid">
            <div className="container">
                <div className='row justify-content-center'>
                    <div className='col-xs-6 col-sm-6 col-md-4 col-lg-4'>
                        <button className="defaultButton w-100 mb-3" type="button" onClick={onDownloadNotifyButtonClick} id="notifyButtonDownload">Download Notify OFF</button>
                    </div>
                    <div className='col-xs-6 col-sm-6 col-md-4 col-lg-4'>
                        <button className="defaultButton w-100 mb-3" type="button" onClick={onUploadNotifyButtonClick} id="notifyButtonUpload">Upload Notify OFF</button>
                    </div>
                </div>
                {/* Upload Chart */}
                <div class="card text-dark bg-light mb-3" id='uploadDiv' style={{"display": displayUploadDiv}}>
                    <div class="card-header">Upload Chart
                        <span>
                            <OverlayTrigger
                                trigger={['hover', 'focus']}
                                placement="bottom"
                                overlay={popoverUpload}>
                                <img className="iconInfo" src={iconInfoPink} ></img>
                            </OverlayTrigger>
                        </span>
                    </div>
                    <div class="card-body">
                        <div className='row mb-2'>
                            <div class="col-6">
                                <div className='input-group mx-auto bg-secondary'>
                                    <button className="secondaryButton me-1" type="button" onClick={onUploadButtonClick} id="UploadButton">START</button>
                                    <OverlayTrigger
                                        trigger={['hover', 'focus']}
                                        placement="bottom"
                                        overlay={popoverUploadButton}>
                                        <img className="iconInfo" src={iconInfo}></img>
                                    </OverlayTrigger>
                                </div>
                            </div>
                            <div class="col-6">
                                <div className='input-group mx-auto custom-bg-danger'>
                                    <button className="dangerButton me-1" type="button" onClick={() => onButtonResetClick("upload")} id="UploadButtonReset">RESET</button>
                                    <OverlayTrigger
                                        trigger={['hover', 'focus']}
                                        placement="bottom"
                                        overlay={popoverResetButton}>
                                        <img className="iconInfo" src={iconInfo}></img>
                                    </OverlayTrigger>
                                </div>
                            </div>
                        </div>                        
                        <p class="card-text" id="AveragebytesReceivedDownloadUpload">Average :</p>
                        <p class="card-text" id="MaxbytesReceivedDownloadUpload">Max :</p>
                        <p class="card-text" id="PacketSizeUpload">Packet size :</p>
                    </div>
                    <div style={{height: "400px", width: "100%"}}>  
                        <canvas ref={uploadChartContainer}></canvas>
                    </div>
                    <div class="card-footer">
                        <small class="text-muted"></small>
                    </div>
                </div>
                {/* Download Chart */}
                <div class="card text-dark bg-light mb-3" id='downloadDiv' style={{"display": displayDownloadDiv}}>
                    <div class="card-header">Download chart
                        <span>
                            <OverlayTrigger
                                trigger={['hover', 'focus']}
                                placement="bottom"
                                overlay={popoverDownload}>
                                <img className="iconInfo" src={iconInfoPink} ></img>
                            </OverlayTrigger>
                        </span>
                    </div>
                    <div class="card-body">
                    <div className='row mb-2'>
                        <div class="col-6">
                            <div className='input-group mx-auto custom-bg-danger'>
                                <button className="dangerButton me-1" type="button" onClick={() => onButtonResetClick("download")} id="DownloadButtonReset">RESET</button>
                                <OverlayTrigger
                                    trigger={['hover', 'focus']}
                                    placement="bottom"
                                    overlay={popoverResetButton}>
                                    <img className="iconInfo" src={iconInfo}></img>
                                </OverlayTrigger>
                            </div>
                        </div>
                        <div class="col-6">
                        </div>
                    </div>    
                        <p class="card-text" id="AveragebytesReceivedDownloadDownload">Average :</p>
                        <p class="card-text" id="MaxbytesReceivedDownloadDownload">Max :</p>
                        <p class="card-text" id="PacketSizeDownload">Packet size :</p>
                    </div>
                    <div style={{height: "400px", width: "100%"}}>  
                        <canvas ref={downloadChartContainer}></canvas>
                    </div>
                    <div class="card-footer">
                        <small class="text-muted"></small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataThroughput;
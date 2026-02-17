// ******************************************************************************
// * @file    SMP.js
// * @author  MCD Application Team
// *
//  ******************************************************************************
// * @attention
// *
// * Copyright (c) 2022-2023 STMicroelectronics.
// * All rights reserved.
// *
// * This software is licensed under terms that can be found in the LICENSE file
// * in the root directory of this software component.
// * If no LICENSE file comes with this software, it is provided AS-IS.
// *
//  ******************************************************************************
import { render } from '@testing-library/react';
import React, { useState, useEffect } from 'react';
// import * as CBOR from 'cbor';
//import * as CBOR from 'cbor-web';
// Inclure la bibliothèque CBOR
const CBOR = require('./cbor');


// Opcodes
const MGMT_OP_READ = 0;
const MGMT_OP_READ_RSP = 1;
const MGMT_OP_WRITE = 2;
const MGMT_OP_WRITE_RSP = 3;

// Groups
const MGMT_GROUP_ID_OS = 0;
const MGMT_GROUP_ID_IMAGE = 1;
const MGMT_GROUP_ID_STAT = 2;
const MGMT_GROUP_ID_CONFIG = 3;
const MGMT_GROUP_ID_LOG = 4;
const MGMT_GROUP_ID_CRASH = 5;
const MGMT_GROUP_ID_SPLIT = 6;
const MGMT_GROUP_ID_RUN = 7;
const MGMT_GROUP_ID_FS = 8;
const MGMT_GROUP_ID_SHELL = 9;

// OS group
const OS_MGMT_ID_ECHO = 0;
const OS_MGMT_ID_CONS_ECHO_CTRL = 1;
const OS_MGMT_ID_TASKSTAT = 2;
const OS_MGMT_ID_MPSTAT = 3;
const OS_MGMT_ID_DATETIME_STR = 4;
const OS_MGMT_ID_RESET = 5;

// Image group
const IMG_MGMT_ID_STATE = 0;
const IMG_MGMT_ID_UPLOAD = 1;
const IMG_MGMT_ID_FILE = 2;
const IMG_MGMT_ID_CORELIST = 3;
const IMG_MGMT_ID_CORELOAD = 4;
const IMG_MGMT_ID_ERASE = 5;


const SMP = (props) => {

    const [targetImageList, setTargetImageList] = useState(null);
    const [tableHoverNumber, setTableHoverNumber] = useState(-1);
    const [slotHoverNumber, setSlotHoverNumber] = useState(-1);
    const [imageSelectedVal, setImageSelectedVal] = useState("");
    const [hashSelectedVal, setHashSelectedVal] = useState("");
    const [slotSelectedVal, setSlotSelectedVal] = useState("");
    const [file, setFile] = useState(null);
    const [fileData, setFileData] = useState(null);
    const [progress, setProgress] = useState("0%");

    /* Upload context */
    const [uploadOffset, setUploadOffset] = useState(-1);
    const [uploadImageData, setUploadImageData] = useState(null);
    const [uploadIsInProgress, setUploadIsInProgress] = useState(0);
    const [uploadSlot, setUploadSlot] = useState(0);
    const [seq, setSeq] = useState(0);

    let smp_characteristic; // 8d53dc1d-1db7-4cd3-868b-8a527460aa84
    let buffer = new Uint8Array();
    let mtu = 140;

    useEffect(() => {
        cmdImageState();
    }, []);

    function onImageUploadProgress(percentage){
        var fileStatus = document.getElementById('file-status');

        fileStatus.innerText = `Uploading... ${percentage}%`;
        fileStatus.style.display = 'none';

        setProgress(percentage+"%");
    };

    function onImageUploadFinished(){
        var fileStatus = document.getElementById('file-status');
        var fileInfo = document.getElementById('file-info');
        var fileImage = document.getElementById('file-image');
        var progressBarContainer = document.getElementById('progress-container');

        fileStatus.innerText = 'Upload complete';
        fileInfo.innerHTML = '';
        fileImage.value = '';

        setProgress("100%");

        /* Refresh the state */
        cmdImageState();

        setTimeout(() => {
            progressBarContainer.style.display = 'none';
        }, 2000);
    }

    function hash(image) {
        return crypto.subtle.digest('SHA-256', image);
    }

    async function imageInfo(image) {
        // https://interrupt.memfault.com/blog/mcuboot-overview#mcuboot-image-binaries
        const info = {};
        const view = new Uint8Array(image);

        // check header length
        if (view.length < 32) {
            throw new Error('Invalid image (too short file)');
        }

        // check MAGIC bytes 0x96f3b83d
        if (view[0] !== 0x3d || view[1] !== 0xb8 || view[2] !== 0xf3 || view[3] !== 0x96) {
            throw new Error('Invalid image (wrong magic bytes)');
        }

        // check load address is 0x00000000
        if (view[4] !== 0x00 || view[5] !== 0x00 || view[6] !== 0x00 || view[7] !== 0x00) {
            throw new Error('Invalid image (wrong load address)');
        }

        const headerSize = view[8] + view[9] * 2 ** 8;

        const imageSize = view[12] + view[13] * 2 ** 8 + view[14] * 2 ** 16 + view[15] * 2 ** 24;
        info.imageSize = imageSize;

        // check image size is correct
        if (view.length < imageSize + headerSize) {
            throw new Error('Invalid image (wrong image size)');
        }

        const version = `${view[20]}.${view[21]}.${view[22] + view[23] * 2 ** 8}`;
        info.version = version;

        info.hash = [...new Uint8Array(await hash(image.slice(0, imageSize + 32)))].map(b => b.toString(16).padStart(2, '0')).join('');

        return info;
    }

    async function sendMessage(op, group, id, data) {
        const _flags = 0;
        let encodedData = [];
        if (typeof data !== 'undefined') {
            encodedData = [...new Uint8Array(CBOR.encode(data))];
        }
        const length_lo = encodedData.length & 255;
        const length_hi = encodedData.length >> 8;
        const group_lo = group & 255;
        const group_hi = group >> 8;
        const message = [op, _flags, length_hi, length_lo, group_hi, group_lo, seq, id, ...encodedData];

        console.log("=+++ Send Message ++++=")
        console.log("EncodedData: ", encodedData);
        console.log('Operation:', op);
        console.log('Flags:', _flags);
        console.log('Length High:', length_hi);
        console.log('Length Low:', length_lo);
        console.log('Group High:', group_hi);
        console.log('Group Low:', group_lo);
        console.log('Sequence:', seq);
        console.log('ID:', id);
        console.log("=++++++++++++++++++++=")

        await smp_characteristic.characteristic.writeValueWithoutResponse(Uint8Array.from(message));
        setSeq((seq + 1) % 256)
    }

    function onMessage(op, group, id, data, length ){
        switch (group) {
            case MGMT_GROUP_ID_OS:
                switch (id) {
                    case OS_MGMT_ID_ECHO:
                        alert(data.r);
                        break;
                    case OS_MGMT_ID_TASKSTAT:
                        console.table(data.tasks);
                        break;
                    case OS_MGMT_ID_MPSTAT:
                        console.log(data);
                        break;
                }
                break;
            case MGMT_GROUP_ID_IMAGE:
                switch (id) {
                    case IMG_MGMT_ID_STATE:
                        // Group images by image number

                        let image_renderer = {};
                        data.images.forEach(image_slot => {

                            if (!image_renderer[image_slot.image]) {
                                image_renderer[image_slot.image] = [];
                            }
                            let statusClass = "image ";
                            statusClass += image_slot.active ? 'status-active' : 'status-standby';

                            let tableClass = "center-table "
                            tableClass += image_slot.active ? 'table-active' : 'table-standby';

                            let thClass = ""
                            thClass += image_slot.active ? 'th-active' : 'th-standby';

                            const hashStr = Array.from(image_slot.hash).map(byte => byte.toString(16).padStart(2, '0')).join('');

                            const currentImageStatus = image_slot.active ? 'active' : 'standby';

                            Object.defineProperty(image_slot, "currentImageStatus", {value:currentImageStatus});
                            Object.defineProperty(image_slot, "statusClass", {value:statusClass});
                            Object.defineProperty(image_slot, "tableClass", {value:tableClass});
                            Object.defineProperty(image_slot, "thClass", {value:thClass});
                            Object.defineProperty(image_slot, "hashStr", {value:hashStr});

                            image_renderer[image_slot.image].push(image_slot);
                            
                        });

                        
                        setTargetImageList(image_renderer); 
                        console.log(image_renderer);

                        break;
                }
                break;
            default:
                console.log('Unknown group');
                break;
        }
    };

    function processMessage(message) {
        const [op, _flags, length_hi, length_lo, group_hi, group_lo, _seq, id] = message;
        const data = CBOR.decode(message.slice(8).buffer);
        const length = length_hi * 256 + length_lo;
        const group = group_hi * 256 + group_lo;

        console.log("===Process Message===")
        console.log('Operation:', op);
        console.log('Flags:', _flags);
        console.log('Sequence:', _seq);
        console.log("group : ", group);
        console.log("length : ", length);
        console.log("data : ", data);
        console.log("id : ", id);
        console.log("====================")

        if (group === MGMT_GROUP_ID_IMAGE && id === IMG_MGMT_ID_UPLOAD && (data.rc === 0 || data.rc === undefined) && data.off) {
            /* uploadNext will be called thanks to the useEffect on UploadOffset */
            setUploadOffset(data.off);
            return;
        }

        onMessage(op, group, id, data, length);
    }

    function notificationHandler(event) {
        const message = new Uint8Array(event.target.value.buffer);
        buffer = new Uint8Array([...buffer, ...message]);
        const messageLength = buffer[2] * 256 + buffer[3];

        /* We wait for the message full lenght */
        if (buffer.length < messageLength + 8) return;

        processMessage(buffer.slice(0, messageLength + 8));
        buffer = buffer.slice(messageLength + 8);
    }

    async function cmdImageState() {
        return sendMessage(MGMT_OP_READ, MGMT_GROUP_ID_IMAGE, IMG_MGMT_ID_STATE);
    }

    async function cmdImageErase(image) {
        return sendMessage(MGMT_OP_WRITE, MGMT_GROUP_ID_IMAGE, IMG_MGMT_ID_ERASE, { slot: image});
    }

    async function cmdImageTest(hash) {
        /* We could use { hash, confirm: false } as parameter too */
        return sendMessage(MGMT_OP_WRITE, MGMT_GROUP_ID_IMAGE, IMG_MGMT_ID_STATE, { hash });
    }

    async function cmdReset() {
        return sendMessage(MGMT_OP_WRITE, MGMT_GROUP_ID_OS, OS_MGMT_ID_RESET);
    }

    async function cmdImageConfirm(hash) {
        return sendMessage(MGMT_OP_WRITE, MGMT_GROUP_ID_IMAGE, IMG_MGMT_ID_STATE, { hash, confirm: true });
    }

    async function uploadNext(imageData, imageOffset) {
        console.log("imageData:");
        console.log(imageData);
        if (imageOffset >= imageData.byteLength) {
            setUploadIsInProgress(false);
            onImageUploadFinished();
            return;
        }

        const nmpOverhead = 8;
        const message = { data: new Uint8Array(), off: uploadOffset };
        if (imageOffset === 0) {
            message.image = uploadSlot;
            message.len = imageData.byteLength;
            message.sha = new Uint8Array(await hash(imageData));
        }

        onImageUploadProgress( Math.floor(imageOffset / imageData.byteLength * 100));

        const length = mtu - CBOR.encode(message).byteLength - nmpOverhead;

        message.data = new Uint8Array(imageData.slice(imageOffset, imageOffset + length));

        sendMessage(MGMT_OP_WRITE, MGMT_GROUP_ID_IMAGE, IMG_MGMT_ID_UPLOAD, message);
    }

    async function cmdUpload(imageData, slot) {
        if (uploadIsInProgress) {
            console.log('Upload is already in progress.');
            return;
        }
        setUploadIsInProgress(true);
        /* This will call the uploadNext thanks to the useEffect */
        setUploadOffset(0);
        setUploadImageData(imageData);
        setUploadSlot(slot);
    }

    /* When uploadOffset is modified, useEffect is called */
    useEffect(() => {
        uploadNext(uploadImageData, uploadOffset);
    }, [uploadOffset])

    useEffect(() => {
        const script = document.createElement('script');
        script.src = "js/cbor.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);


    // Initialisation de MCUManager
    //const mcumgr = new MCUManager();
    
    // Initialization of Bluetooth characteristics
    props.allCharacteristics.map(element => {
    switch (element.characteristic.uuid) {
        case "da2e7828-fbce-4e01-ae9e-261174997c48":
            smp_characteristic = element;

            console.log("Characteristic UUID SMP - Enable Notifications ");
                
            smp_characteristic.characteristic.startNotifications();
            smp_characteristic.characteristic.oncharacteristicvaluechanged = notificationHandler;
            break;

        default:
            console.log("# No characteristics found..");

    }
    // Hide the info element on startup
    document.getElementById("readmeInfo").style.display = "none";

    });

    function fileImageOnChange(event){
        var file = event.target.files[0]

        setFile(file);
        setFileData(null);
        const reader = new FileReader();

        reader.onload = async () => {
            var fileData = reader.result;
            setFileData(fileData);
            try {
                const info = await imageInfo(fileData);
                let table = `<table class="table-newImage center-table">`;
                table += `<tr><th>Version</th><td>v${info.version}</td></tr>`;
                table += `<tr><th>Hash</th><td>${info.hash}</td></tr>`;
                table += `<tr><th>File Size</th><td>${fileData.byteLength} bytes</td></tr>`;
                table += `<tr><th>Size</th><td>${info.imageSize} bytes</td></tr>`;
                table += `</table>`;

                document.getElementById('file-status').innerText = 'Ready to upload';
                document.getElementById('file-info').innerHTML = table;
                document.getElementById('file-upload').disabled = false;
            } catch (e) {
                console.log("Error loading image");
                document.getElementById('file-info').innerHTML = `ERROR: ${e.message}`;
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function hexStringToByteArray(hexString) {
        // Ensure the input string is valid
        if (!hexString || hexString.length % 2 !== 0) {
          throw new Error("Invalid hexadecimal string");
        }
      
        // Create a byte array
        const byteArray = new Uint8Array(hexString.length / 2);
      
        // Convert each pair of hexadecimal characters to a byte
        for (let i = 0; i < hexString.length; i += 2) {
          byteArray[i / 2] = parseInt(hexString.substr(i, 2), 16);
        }
      
        return byteArray;
      }

    async function handleTestClick(){
        let hashValue = hashSelectedVal;
        const hashByteArray = hexStringToByteArray(hashValue);
        console.log("hashByteArray : " + hashByteArray);
        await cmdImageTest(hashByteArray);
    }

    async function handleConfirmClick(){
        let hashValue = hashSelectedVal;
        const hashByteArray = hexStringToByteArray(hashValue);
        await cmdImageConfirm(hashByteArray);
    }

    async function handleResetClick(){
        await cmdReset();
    }

    async function handleEraseClick(){
        await cmdImageErase(imageSelectedVal);
    }

    async function handleRefreshClick(){
        await cmdImageState();
    }

    async function handleUploadClick(){
        document.getElementById('file-upload').disabled = true;
        document.getElementById('progress-container').style.display = 'block';

        console.log("Slots value : " + imageSelectedVal);

        if (file && fileData) {
            await cmdUpload(fileData, imageSelectedVal);
            document.getElementById('progress-bar').style.width = '0%';
            document.getElementById('progress-bar').innerText = '0%';

            setProgress("0%");
        }else{
            console.log("error: no file selected");
        }
    }

    function handleClickSlot(index_image, index_slot){
        if(!uploadIsInProgress){
            console.log("handleClick: " + index_image + " " + index_slot);

            setImageSelectedVal(index_image);
            setSlotSelectedVal(index_slot);
            setHashSelectedVal(targetImageList[index_image][index_slot].hashStr);
        }
    }

    function handleMouseEnter(index_image, index_slot){
        if(!uploadIsInProgress){
            setTableHoverNumber(index_image);
            setSlotHoverNumber(index_slot);
        }
    }

    function handleMouseLeave(index_image, index_slot){
        if(!uploadIsInProgress){
            setTableHoverNumber(-1);
            setSlotHoverNumber(-1);
        }
    }

    /* The different style to be used in the html content */
    const tableStyle = {
        border: "2px solid black",
        borderCollapse: "collapse",
    };

    const tableStyleSelected = {
        border: "3px solid black",
        borderCollapse: "collapse",
        background: "#B6DBF4"
    }

    const tdHoverStyle = {
        background: "#FFD200"
    }

    const tdSelectedStyle = {
        background: "#B6DBF4",
        border: "5px solid black",
    }

    const noNewLineDive = {
        display: "inline"
    }


    return (
        <div className="container-fluid">
            <div className="container">
                
                <div id="image-list">
                {
                    targetImageList != null &&
                    Object.keys(targetImageList).map((key, index) => (

                        <div class="image-group" id={`group-${index}`} >
                        <h1>Image #{index}</h1>
                        <table class="center-table table-group" style={index == imageSelectedVal ? tableStyleSelected:tableStyle}>

                        {/* Start a single row with a large cell for all slots*/}
                        <tr>
                        {
                            targetImageList[index].map(current_image =>
                                
                                <td style={
                                    imageSelectedVal==index && slotSelectedVal==current_image.slot ? tdSelectedStyle:
                                    tableHoverNumber==index && slotHoverNumber==current_image.slot ? tdHoverStyle:
                                    null
                                }
                                onClick={() => handleClickSlot(index, current_image.slot)} 
                                onMouseEnter={() => handleMouseEnter(index, current_image.slot)} 
                                onMouseLeave={() => handleMouseLeave(index, current_image.slot)}
                                >
                                    <div class={`image ${current_image.currentImageStatus}`}>
                                    <h2><span class={current_image.statusClass}> Slot #{current_image.slot} {current_image.currentImageStatus.toUpperCase()}</span></h2>
                                    <table class={current_image.tableClass}>
                                        <tr><th class={current_image.thClass}>Version</th><td>v{current_image.version.toString()}</td></tr>
                                        <tr><th class={current_image.thClass}>Bootable</th><td>{current_image.bootable.toString()}</td></tr>
                                        <tr><th class={current_image.thClass}>Confirmed</th><td>{current_image.confirmed.toString()}</td></tr>
                                        <tr><th class={current_image.thClass}>Pending</th><td>{current_image.pending.toString()}</td></tr>
                                        <tr><th class={current_image.thClass}>Hash</th><td>{current_image.hashStr}</td></tr>
                                    </table>
                                    </div>
                                </td>
                            )
                        }

                        {/* Close the large cell and row*/}
                        </tr> 
                        {/*Close the table for this image group*/}
                        </table>
                        </div>
                        
                    ))

                }
                </div>

                <div><b>Image selected : </b><div style={noNewLineDive} id="image-selected">{imageSelectedVal}</div></div>
                <div><b>Slot selected : </b><div style={noNewLineDive} id="slot-selected">{slotSelectedVal}</div></div>
                <div><b>Hash selected : </b><div style={noNewLineDive} id="hash-selected">{hashSelectedVal}</div> </div>

                <div>
                    <button id="button-image-state" type="submit" className="defaultButton SMP-Button-Margin"
                    onClick={() => handleRefreshClick()}
                    ><i className="bi-arrow-down-circle"></i> Refresh</button>
                    <button id="button-erase" type="submit" className="defaultButton SMP-Button-Margin"
                    onClick={() => handleEraseClick()}
                    ><i className="bi-eraser-fill"></i> Erase</button>
                    <button id="button-test" type="submit" className="defaultButton SMP-Button-Margin" enabled
                    onClick={() => handleTestClick()}
                    ><i className="bi-question-square"></i> Test</button>
                    <button id="button-confirm" type="submit" className="defaultButton SMP-Button-Margin" enabled
                    onClick={() => handleConfirmClick()}
                    ><i className="bi-check2-square"></i> Confirm</button>
                    <button id="button-reset" type="submit" className="defaultButton SMP-Button-Margin" enabled
                    onClick={() => handleResetClick()}
                    ><i className="bi-arrow-clockwise"></i> Reset</button>
                </div>
                <hr />

                <h3>Image Upload</h3>
                <div className="form-group">
                    <input type="file" class="form-control" id="file-image" 
                    onChange={e=>fileImageOnChange(e)}/>
                </div>
                <div className="image">
                    <div class="form-group">
                        <div id="file-status">Select image file</div>
                        <div id="file-info"></div>
                    </div>
                    <div class="progress" id="progress-container" style={{display:'none'}}>
                        <div id="progress-bar" class="progress-bar" style={{ width: progress }}>{progress}</div>
                    </div>
                    <button className="defaultButton SMP-Button-Margin" id="file-upload" //disabled
                    onClick={() => handleUploadClick()}
                    ><i className="bi-upload"></i> Upload</button>
                </div>

            </div>
        </div>
    );
};
export default SMP;

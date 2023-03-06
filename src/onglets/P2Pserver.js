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

const P2Pserver = (props) => {
  let notifyCharacteristic;
  let ReadWriteCharacteristic;
  let rebootCharacteristic;
  
  // Filtering the different datathroughput characteristics
  props.allCharacteristics.map(element => {
    switch (element.characteristic.uuid) {
      case "0000fe42-8e22-4541-9d4c-21edae82ed19":
        notifyCharacteristic = element;
        notifyCharacteristic.characteristic.stopNotifications();
        break;
      case "0000fe41-8e22-4541-9d4c-21edae82ed19":
        ReadWriteCharacteristic = element;
        break;
      case "0000fe11-8e22-4541-9d4c-21edae82ed19":
        rebootCharacteristic = element;
        break;
      default:
        console.log("# No characteristics found..");
    }
  });
  
  document.getElementById("readmeInfo").style.display = "none";

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
  // Read button handler
  async function onReadButtonClick() {
    var value = await ReadWriteCharacteristic.characteristic.readValue();
    let statusWord = new Uint8Array(value.buffer);
    console.log(statusWord);
    document.getElementById('readLabel').innerHTML = "0x" + statusWord.toString();
    createLogElement(statusWord, 1, "P2Pserver READ");
  }

  // Enable Light image handler
  async function onEnableLightClick() {
    let imgStatus = document.getElementById('imageLightPink').getAttribute('src')
    let myWord;
    try {
      if (imgStatus === imagelightOffBlue) {
        myWord = new Uint8Array(2);
        myWord[0] = parseInt('01', 8);
        myWord[1] = parseInt('01', 8);
        await ReadWriteCharacteristic.characteristic.writeValue(myWord);
        createLogElement(myWord, 1, "P2Pserver WRITE");
        document.getElementById('enableLightButton').innerHTML = "Light ON";
        document.getElementById('imageLightPink').src = imagelightOnBlue;
      } else {
        myWord = new Uint8Array(2);
        myWord[0] = parseInt('01', 8);
        myWord[1] = parseInt('00', 8);
        await ReadWriteCharacteristic.characteristic.writeValue(myWord);
        createLogElement(myWord, 1, "P2Pserver WRITE");
        document.getElementById('enableLightButton').innerHTML = "Light OFF";
        document.getElementById('imageLightPink').src = imagelightOffBlue;
      }
    }
    catch (error) {
      console.log('2 : Argh! ' + error);
    }
  }

  // Notify button click handler
  async function onNotifyButtonClick() {
    let notifStatus = document.getElementById('notifyButton').innerHTML;
    if (notifStatus === "Notify OFF") {
      console.log('Notification ON');
      notifyCharacteristic.characteristic.startNotifications();
      notifyCharacteristic.characteristic.oncharacteristicvaluechanged = notifHandler;
      document.getElementById('notifyButton').innerHTML = "Notify ON"
      createLogElement(notifyCharacteristic, 3, "P2Pserver ENABLE NOTIFICATION ");
    } else {
      notifyCharacteristic.characteristic.stopNotifications();
      console.log('Notification OFF');
      document.getElementById('notifyButton').innerHTML = "Notify OFF"
      createLogElement(notifyCharacteristic, 3, "P2Pserver DISABLE NOTIFICATION ");
    }
  }

  // notification handler
  function notifHandler(event) {
    console.log("Notification received");
    var buf = new Uint8Array(event.target.value.buffer);
    console.log(buf);
    createLogElement(buf, 1, "P2Pserver NOTIFICATION RECEIVED");
    if (buf[1].toString() === "1") {
      document.getElementById('imageLightBlue').src = imagelightOnPink;
    } else {
      document.getElementById('imageLightBlue').src = imagelightOffPink;
    }
  }

  // Tooltips

  const popoverNotifyButton = (
    <Popover id="popover-trigger-hover-focus" title="Popover bottom">
      <strong>Info :</strong> Enable the reception of notifications from the connected device. <br />
      Example : <br />
      Enable the notifications then push SW1. 
    </Popover>
  );

  const popoverEnableLightButton = (
    <Popover id="popover-trigger-hover-focus" title="Popover bottom">
      <strong>Info :</strong> Turn on/off the led on the device. <br />
      <strong>Tip :</strong> You can also click on the pink led
    </Popover>
  );

  const popoverWriteButton = (
    <Popover id="popover-trigger-hover-focus" title="Popover bottom">
      <strong>Info :</strong> Send a value to the connected device. <br />
      Example : <br />
      0x 0101 to turn ON the led<br />
      0x 0100 to turn OFF the led
    </Popover>
  );
  
  const popoverReadButton = (
    <Popover id="popover-trigger-hover-focus" title="Popover bottom">
      <strong>Info :</strong> Read value written on the connected device. <br />
      Example : <br />
      0x 1,1 : led is on<br />
      0x 1,0 : led is off
    </Popover>
  );

  return (
      <div className="container-fluid">
        <div className="container">
          <div className='row justify-content-center mt-3'>
            <div className='col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
              <div className='d-flex flex-row'>
              <button className="defaultButton w-100" type="button" onClick={onEnableLightClick} id="enableLightButton">Light OFF</button>
                <span>
                  <OverlayTrigger
                    trigger={['hover', 'focus']}
                    placement="bottom"
                    overlay={popoverEnableLightButton}>
                    <img className="iconInfo" src={iconInfo}></img>
                  </OverlayTrigger>
                </span>
              </div>
            </div>
            <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
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
          <div className='row justify-content-center mt-3'>
            <div className='col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
              <div class="input-group">
                <span class="input-group-text" id="button-write">0x</span>
                <input type="text" class="form-control" placeholder="..." aria-describedby="button-write" maxLength="4" id="writeInput"></input>
                <button class="defaultButton" type="button" id="button-write" onClick={onWriteButtonClick}>Write</button>
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
                <button className="defaultButton" type="button" onClick={onReadButtonClick} aria-describedby="readLabel">Read</button>
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
          <div className='row justify-content-center'>
            <div className='col-6 col-md-3 col-lg-3 justify-content-center'>
              <img src={imagelightOffBlue} onClick={onEnableLightClick} id='imageLightPink' className="img-fluid img-thumbnail "></img>
            </div>
            <div className='col-6 col-md-3 col-lg-3 justify-content-center'>
              <img src={imagelightOffPink} id='imageLightBlue' className="img-fluid img-thumbnail " ></img>
            </div>
          </div>
        </div>
      </div>
     
  );
};

export default P2Pserver;
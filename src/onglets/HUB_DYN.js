// ******************************************************************************
// * @file    HUB_DYN.js
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
import iconInfo from '../images/iconInfo.svg';
import { createLogElement } from "../components/Header";
import { OverlayTrigger, Popover } from 'react-bootstrap';
import Zigbee from '../images/Zigbee.png';
import hot from '../images/thermohot.svg';
import cold from '../images/thermocold.svg';
import midcold from '../images/thermomidcold.svg';
import midhot from '../images/thermomidhot.svg';


const HUB_DYN = (props) => {
  let ReportedCharacteristic;
  let JoinCharacteristic;
  props.allCharacteristics.map(element => {
    switch (element.characteristic.uuid) {
      case "0000fe92-8e22-4541-9d4c-21edae82ed19":
        ReportedCharacteristic = element;
        ReportedCharacteristic.characteristic.stopNotifications();
        break;
        case "0000fe91-8e22-4541-9d4c-21edae82ed19":
          JoinCharacteristic = element;
            break;
      default:
        console.log("# No characteristics found..");
    }
  });
  document.getElementById("readmeInfo").style.display = "none";

  const [numCards, setNumCards] = useState(5);

  const handleNumCardsChange = (event) => {
    var test = event.target.value;
    if (test < 1) {
      event.target.value = 1;
    } else if (test > 10) {
      event.target.value = 10;
    }
    setNumCards(event.target.value);
  }

  function displayImage(j, imageName) {
    // Récupération de l'élément HTML où afficher l'image
    const container = document.getElementById(`${j}myImage`);
    if (!container) {
        console.error(`Element with ID '${j}myImage' not found in HTML document.`);
        return;
    }

    // Vérification de l'existence d'un élément img dans le conteneur
    let img = container.querySelector('img');
    if (img) {
        // Si un élément img existe déjà, mettez à jour son attribut src
        img.src = imageName;
    } else {
        // Sinon, créez un nouvel élément img et ajoutez-le au conteneur
        img = document.createElement('img');
        img.src = imageName;
        img.style.width = '75px';
        img.style.height = '150px';
        // img.style.left = '1000px'; // Cette propriété n'est pas nécessaire si l'image doit être dans le conteneur
        container.appendChild(img);
    }
}

  //Notify ON/OFF Button
  async function onNotifyButtonClick() {
    let notifStatus = document.getElementById('notifyButton').innerHTML;

    if (notifStatus === "Notify OFF") {
      console.log('Notification ON');
      //Start Notif
      ReportedCharacteristic.characteristic.startNotifications();
      ReportedCharacteristic.characteristic.oncharacteristicvaluechanged = notifHandler;
      document.getElementById('notifyButton').innerHTML = "Notify ON"
      createLogElement(ReportedCharacteristic, 3, "REPORT ENABLE NOTIFICATION ");
    } else {
      //Stop Notif
      ReportedCharacteristic.characteristic.stopNotifications();
      console.log('Notification OFF');
      document.getElementById('notifyButton').innerHTML = "Notify OFF"
      createLogElement(ReportedCharacteristic, 3, "REPORT DISABLE NOTIFICATION ");
    }
  }

  const onJoinButtonClick = async () => {
    const myWord = new Uint8Array([]);
    ;
    try {
        await JoinCharacteristic.characteristic.writeValue(myWord);
        createLogElement(myWord, 1, "join");
    } catch (error) {
        console.log('Argh! ' + error);
    }
  }

  function notifHandler(event) {
    console.log("Notification received");
    var buf = new Uint8Array(event.target.value.buffer);
    let bufSize = (buf.byteLength) / 4;
    console.log(buf);
    console.log(bufSize);
    createLogElement(buf, 1, "NOTIFICATION RECEIVED");
    if (buf[0] == 1) {
      console.log('Anomaly detected');
    } else {
      for (var j = 0; j < bufSize; j++) {
        var valeur = buf[3 + 4 * j];

        if (buf[3 + 4 * j] > 127) { valeur = -(256 - buf[3 + 4 * j]); }
        document.getElementById(`${j}sensorName`).textContent = "SENSOR " + parseInt(j + 1);
        document.getElementById(`${j}sensorId`).textContent = "Sensor ID (Zigbee ntwrk adresse device) : 0x" + buf[4 * j].toString(16) + buf[1 + 4 * j].toString(16);
        document.getElementById(`${j}temperature`).textContent = "Temperature : " + valeur + "°C";
       
        if (valeur < 20) {
          displayImage(j, cold);
        } else 
        
        if (valeur >= 20 && valeur < 22) {
          displayImage(j, midcold);
        } else 
        
        if (valeur >= 22 && valeur < 25) {
          displayImage(j, midhot);
        } else {
          displayImage(j, hot);
        }               
      }
    }
  }

  // Tooltips
  function generateCards() {
    var cardsContainer = document.getElementById("cards-container");
    cardsContainer.innerHTML = ""; // Clear previous cards
    for (var i = 0; i < numCards; i++) {

      var card = `
      <div class="card m-2">
      <div class="card-header" id="${i}sensorName">
        SENSOR UNKNOWN
      </div>
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3">

          <div>
            <p class="card-text" id="${i}name">Name: UNKNOWN</p>
            <p class="card-text" id="${i}sensorId">Sensor ID (Zigbee network address): UNKNOWN</p>
            <p class="card-text" id="${i}temperature">Temperature value in Celsius: UNKNOWN</p>
          </div>

          <div class="d-flex justify-content-between align-items-center mb-3">
            <div className='col-md-8 col-lg-6 text-center'>
              <div id="${i}myImage">
            </div>
          </div>

          </div>
        </div>

        <button class="btn btn-primary" id="${i}renameBtn" onclick="
          document.getElementById('${i}renameBtn').classList.add('d-none');
          document.getElementById('${i}renameForm').classList.remove('d-none');
          document.getElementById('${i}newName').focus();
        ">Rename</button>

        <div id="${i}renameForm" class="d-none">
          <form onsubmit="
            var newName = document.getElementById('${i}newName').value;
            if (newName !== '') {
              console.log(newName);
              document.getElementById('${i}name').textContent = newName;
              document.getElementById('${i}renameBtn').classList.remove('d-none');
              document.getElementById('${i}renameForm').classList.add('d-none');
            }
            return false;
          ">
            <div class="input-group mb-3">
              <input type="text" class="form-control" id="${i}newName" placeholder="Enter a new name">
              <div class="input-group-append">
                <button class="btn btn-outline-secondary" type="submit">Rename</button>
                <button class="btn btn-outline-secondary" type="button" onclick="
                  document.getElementById('${i}renameBtn').classList.remove('d-none');
                  document.getElementById('${i}renameForm').classList.add('d-none');
                ">Cancel</button>
              </div>
            </div>
          </form>
        </div>

      </div>

      <div class="card-footer text-muted">
        Last updated: just now
      </div>
      
    </div>
      `;

      cardsContainer.innerHTML += card;
    }
    document.getElementById("numCards").innerText = numCards; // mettre à jour la valeur affichée
    ReportedCharacteristic.characteristic.startNotifications();
    ReportedCharacteristic.characteristic.oncharacteristicvaluechanged = notifHandler;
    document.getElementById('notifyButton').innerHTML = "Notify ON";
  }

  function toggleRename(index) {
    var renameBtn = document.getElementById(index + 'renameBtn');
    var renameForm = document.getElementById(index + 'renameForm');
    renameBtn.classList.toggle('d-none');
    renameForm.classList.toggle('d-none');
    if (!renameForm.classList.contains('d-none')) {
      document.getElementById(index + 'newName').focus();
    }
  }
  
  function renameSensor(index) {
    var newName = document.getElementById(index + 'newName').value;
    if (newName !== '') {
      console.log(newName);
      document.getElementById(index + 'name').textContent = newName;
      toggleRename(index);
    }
    return false; // Prevent form submission
  }

  const popoverNotifyButton = (
    <Popover id="popover-trigger-hover-focus" title="Popover bottom">
      <strong>Info :</strong> Enable the reception of notifications from the connected device. <br />
      Example : <br />
      Enable the notifications then push SW1.
    </Popover>
  );

  return (
    <div className="container-fluid bg-light py-4">

    <div className="text-center mb-4">
      <img className="Zigbee" src={Zigbee} style={{ width: '200px' }} alt="Zigbee Logo"></img>
    </div>
  
    <div className="container">

      <div className='row justify-content-center mb-4'>
        <div className='col-md-8 col-lg-6'>
          <div className='d-flex justify-content-center gap-3 bg-primary p-3 rounded shadow'>
            <button className="btn btn-light mx-2" type="button" onClick={onNotifyButtonClick} id="notifyButton">Notify OFF</button>
            <button className="btn btn-light mx-2" type="button" onClick={onJoinButtonClick} id="JoinButton">Join</button>
            <OverlayTrigger
              trigger={['hover', 'focus']}
              placement="bottom"
              overlay={popoverNotifyButton}>
              <img className="iconInfo" src={iconInfo} alt="Info" style={{ width: '30px' }}></img>
            </OverlayTrigger>
          </div>
        </div>
      </div>

      <div className="row justify-content-center mb-4">
        <div className="col-md-8 col-lg-6">
          <div className="input-group">
            <input
              type="number"
              className="form-control"
              min="1"
              max="10"
              value={numCards}
              onChange={handleNumCardsChange}
            />
            <button className="btn btn-primary" type="button" onClick={generateCards}>Number of Sensors</button>
          </div>
        </div>
      </div>

      <div className='row justify-content-center mb-4'>
        <div className='col-md-8 col-lg-6 text-center'>
          <div className="p-2 bg-white rounded shadow-sm">
            <span className="text-secondary">Set number of sensors:</span>
            <p id='numCards' className="h5 mb-0 font-weight-bold text-primary">UNKNOWN</p>
          </div>
        </div>
      </div>

      <div className="card text-dark bg-light mb-3">
        <div className="card-body" style={{ position: "relative" }}>
          <div id='cards-container'></div>
        </div>
      </div>
    </div>
  </div>
  );


};

export default HUB_DYN;
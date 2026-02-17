// ******************************************************************************
// * @file    WeightScale.js
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
import scaleslogo from '../images/scales.svg';
import height1 from '../images/height1.gif';
import libra from '../images/libra.gif';
import healthy from '../images/healthy.svg';
import over from '../images/overweight.svg';
import under from '../images/underweight.svg';


const WeightScale = (props) => {
  let IndicateCharacteristic;
  let ReadWriteIndicateCharacteristic;
  let NotifyCharacteristic;
  let ReadCharacteristic

  
  let weight;
  let bmi;
  let height;


  props.allCharacteristics.map(element => {
    switch (element.characteristic.uuid) {
      case "00002a9d-0000-1000-8000-00805f9b34fb":
        IndicateCharacteristic = element; // Weight Measurement
        IndicateCharacteristic.characteristic.startNotifications();
        IndicateCharacteristic.characteristic.oncharacteristicvaluechanged = WeightMeasurement;

        break;
      case "00002a9e-0000-1000-8000-00805f9b34fb":
        ReadCharacteristic = element; // Weight Scale
        break;
      default:
        console.log("# No characteristics found..");
    }
  });
  
  document.getElementById("readmeInfo").style.display = "none";




  function buf2hex(buffer) { // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
  }




  function WeightMeasurement(event){
    console.log(" >> Indication received : ");
    var buf = new Uint8Array(event.target.value.buffer);
    console.log(buf);
    let bufHex = buf2hex(buf);
    console.log(bufHex);

    weight = buf[1]/2;   //weight
    bmi = buf[10]/10;  //BMI
    height = buf[12]/100;  //height

    console.log("----- Indication Received -----");
    console.log("Weight : ", weight);
    console.log("BMI : ", bmi);
    console.log("Height : ", height);
    console.log("-------------------------------");

    var w = document.getElementById("w");
    w.innerText = weight + " kg";
    
    var h = document.getElementById("h");
    h.innerText = height + " m";
    
    var b = document.getElementById("b");
    b.innerText = bmi;

    var bmiImage = document.getElementById('bmilogo');
  
 
    if (bmi > 25) {

      bmiImage.src = over; // Image indiquant un surplus de poids

    } else if (bmi < 18) {

      bmiImage.src = under; // Image indiquant un poids insuffisant

    } else {

      bmiImage.src = healthy; // Image indiquant un poids normal

    }

  }




  return (

    <div className="tempPannel">

      <div className="titlebox">
        <img src={scaleslogo} alt="" className="WSlogo"></img>
        <h3><strong>Weight Scale</strong></h3>
      </div>

      <div class="WS__container container grid">

        <div class="WStitle__card">
          <h3 class="passion__title">B M I</h3>
        </div>

        <div class="WStitle__card">
          <h3 class="passion__title">W e i g h t</h3>
        </div>

        <div class="WStitle__card">
        <h3 class="passion__title">H e i g h t</h3>
        </div>


      </div>

      <div class="WS__container container grid">

       <div class="WStitle__card2">
            <div class="unite">
            <img id='bmilogo' src={healthy} alt="" className="heightlogo2" ></img>
            </div>
            <span className='BMIInfo' id='b' > </span>
        </div>

        <div class="WStitle__card2">
            <div class="unite">
            <img src={libra} alt="" className="heightlogo"></img>
            </div>
            <span className='WSInfo' id='w'> </span>
        </div>

        <div class="WStitle__card2">
            <div class="unite">
            <img src={height1} alt="" className="heightlogo" ></img>
            </div>
            <span className='WSInfo' id='h'> </span>
        </div>


      </div>
      </div>
     
  );
};

export default WeightScale;
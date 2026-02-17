// ******************************************************************************
// * @file    RSC.js
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
import sneaker from '../images/sneaker.svg';
import walk from '../images/walk.gif';
import walkInShoe from '../images/InshoeRSC.png';
import walkOnTopOfShoe from '../images/OntopofshoeRSC.png';
import walkHip from '../images/HipRSC.png';
import walkChest from '../images/chestRSC.png';
import walkOther from '../images/OtherRSC.png';
import speed from '../images/speedometer.gif';
import { Chart, registerables } from 'chart.js';
import foot from '../images/foot.gif';
import ruler from '../images/ruler.gif';
import run from '../images/running.gif';
import runstat from '../images/run.gif';
Chart.register(...registerables);


const RunningSpeedandCadence = (props) => {
  let IndicateCharacteristic;
  let ReadWriteIndicateCharacteristic;
  let NotifyCharacteristic;
  let ReadCharacteristic

  let WriteIndicateCharacteristic

  const speedChartContainer = useRef(null);
  const cadenceChartContainer = useRef(null);
  const strideLengthChartContainer = useRef(null);
  const distanceChartContainer = useRef(null);

  const [speedChart, setSpeedChart] = useState(null);
  const [cadenceChart, setCadenceChart] = useState(null);
  const [strideLengthChart, setStrideLengthChart] = useState(null);
  const [distanceChart, setDistanceChart] = useState(null);

  const [currentActivityImage, setCurrentActivityImage] = useState(walk);
  
  let speedDataSet = [];
  let speedTime = [];

  const createChartConfig = (label, title, color) => {
    return {
      type: "line",
      data: {
        labels: [], // Initialize as empty array
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
        if (speedChartContainer.current) {
            const newSpeedChart = new Chart(speedChartContainer.current, speedChartConfig);
            setSpeedChart(newSpeedChart);
        }

        if (cadenceChartContainer.current) {
          const newCadenceChart = new Chart(cadenceChartContainer.current, cadenceChartConfig);
          setCadenceChart(newCadenceChart);
        }
        if (strideLengthChartContainer.current) {
          const newStrideLengthChart = new Chart(strideLengthChartContainer.current, strideLengthChartConfig);
          setStrideLengthChart(newStrideLengthChart);
        }
        if (distanceChartContainer.current) {
          const newDistanceChart = new Chart(distanceChartContainer.current, distanceChartConfig);
          setDistanceChart(newDistanceChart);
        }
        if (WriteIndicateCharacteristic && WriteIndicateCharacteristic.characteristic) {
          WriteIndicateCharacteristic.characteristic.startNotifications()
            .then(() => {
              WriteIndicateCharacteristic.characteristic.addEventListener('characteristicvaluechanged', handleSLIndication);
            })
            .catch(error => {
              console.error('Error starting indications for RACP:', error);
            });
        }

        return () => {
          if (speedChart) speedChart.destroy();
          if (cadenceChart) cadenceChart.destroy();
          if (strideLengthChart) strideLengthChart.destroy();
          if (distanceChart) distanceChart.destroy();
          if (WriteIndicateCharacteristic && WriteIndicateCharacteristic.characteristic) {
            WriteIndicateCharacteristic.characteristic.removeEventListener('characteristicvaluechanged', handleSLIndication);
            WriteIndicateCharacteristic.characteristic.stopNotifications();
          }
        };
      }, [WriteIndicateCharacteristic]);

      const speedChartConfig = createChartConfig('Speed', 'Instantaneous Speed Chart', '#33CCCC');
      const cadenceChartConfig = createChartConfig('Cadence', 'Instantaneous Cadence Chart', '#33CCCC');
      const strideLengthChartConfig = createChartConfig('Stride Length', 'Instantaneous Stride Length Chart', '#33CCCC');
      const distanceChartConfig = createChartConfig('Distance', 'Total Distance Chart', '#33CCCC');

      const updateDataset = (chart, datasetIndex, newData) => {
        if (!chart) {
          console.error('Chart instance is not yet initialized.');
          return;
        }
      
        let currentTime = new Date();
        let time = currentTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        });
      
        const GRAPH_MAX_LABELS = 30; 
      
       
        if (chart.data.labels.length >= GRAPH_MAX_LABELS) {
          chart.data.labels.pop(); 
          chart.data.datasets[datasetIndex].data.pop(); 
        }
      
        chart.data.labels.unshift(time);
        chart.data.datasets[datasetIndex].data.unshift(newData); 
      
        // Update the chart with new values
        chart.update();
      }


  props.allCharacteristics.map(element => {
    switch (element.characteristic.uuid) {
      case "00002a53-0000-1000-8000-00805f9b34fb":
        IndicateCharacteristic = element; // RSC Measurement
        IndicateCharacteristic.characteristic.startNotifications();
        IndicateCharacteristic.characteristic.oncharacteristicvaluechanged = handleRSCMeasurement;

        break;
      case "00002a5d-0000-1000-8000-00805f9b34fb":
        ReadCharacteristic = element; // Sensor Location
        readSensorLocation();
        break;
      case "00002a54-0000-1000-8000-00805f9b34fb":
        ReadCharacteristic = element; // RSC Feature
        break;
      case "00002a55-0000-1000-8000-00805f9b34fb":
        WriteIndicateCharacteristic = element;
        break;
      default:
        console.log("# No characteristics found..");
    }
  });
  
  document.getElementById("readmeInfo").style.display = "none";

  let initialdistance = 0;




  function buf2hex(buffer) { 
    return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
  }

  function handleRSCMeasurement(event) {
    console.log(" >> Indication received : ");
    var buf = new Uint8Array(event.target.value.buffer);
    console.log(buf);
    let bufHex = buf2hex(buf);
    console.log(bufHex);
    const rscData = parseRSCMeasurement(buf);
    console.log(rscData);
  }


  function parseRSCMeasurement(buffer) {
    const flags = buffer[0];
    let status;
  
    let index = 1; 
    let instantaneousSpeed, instantaneousCadence, instantaneousStrideLength;
  
      instantaneousSpeed = (buffer[index] | (buffer[index + 1] << 8)) / 256; // Speed in m/s
      instantaneousSpeed = parseFloat(instantaneousSpeed.toFixed(2));
      updateDataset(speedChart, 0, instantaneousSpeed);
      index += 2;
  
      instantaneousCadence = buffer[index]; // Cadence in steps/min
      updateDataset(cadenceChart, 0, instantaneousCadence);
      index += 1;
  
    instantaneousStrideLength = buffer[1] / 10; // Stride length in meters
    updateDataset(strideLengthChart, 0, instantaneousStrideLength);

    initialdistance += instantaneousStrideLength; // Add stride length to the total distance
    initialdistance = parseFloat(initialdistance.toFixed(1));
    
    let totalDistance = initialdistance;
    updateDataset(distanceChart, 0, totalDistance);


    status = (flags & 0x04) ? 'Running' : 'Walking'; 
    if (status === 'Running') {
      setCurrentActivityImage(runstat);
    } else {
      setCurrentActivityImage(walk);
    }

    console.log("----- Indication Received -----");
    console.log("Speed : ", instantaneousSpeed);
    console.log("Cadence : ", instantaneousCadence);
    console.log("Stride Length : ", instantaneousStrideLength);
    console.log("Total Distance : ", totalDistance);
    console.log("Status : ", status);
    console.log("-------------------------------");

    var temp = document.getElementById("temp");
    temp.innerText = instantaneousSpeed + " m / s";
    
    var loc = document.getElementById("location");
    loc.innerText = instantaneousCadence + " / m i n";
    
    var date = document.getElementById("date");
    date.innerText = instantaneousStrideLength + " c m";

    var dist = document.getElementById("dist");
    dist.innerText = totalDistance + " m";

    var stat = document.getElementById("stat");
    stat.innerText = status;

  }

  async function readSensorLocation() {
    var value = await ReadCharacteristic.characteristic.readValue();
    let locationData = new Uint8Array(value.buffer);
    let locationValue = locationData[0];
    console.log("loc : ", locationValue);
    let sensorLocation;
  
      switch (locationValue) {
        case 0:
          sensorLocation = 'Other';
          setCurrentImage(walkOther);
          break;
        case 1:
          sensorLocation = 'Top of Shoe';
          setCurrentImage(walkOnTopOfShoe);
          break;
        case 2:
          sensorLocation = 'In Shoe';
          setCurrentImage(walkInShoe);
          break;
        case 3:
          sensorLocation = 'Hip';
          setCurrentImage(walkHip);
          break;
        case 4:
          sensorLocation = 'Front Wheel';
          break;
        case 5:
          sensorLocation = 'Left Crank';
          break;
        case 6:
          sensorLocation = 'Right Crank';
          break;
        case 7:
          sensorLocation = 'Left Pedal';
          break;
        case 8:
          sensorLocation = 'Right Pedal';
          break;
        case 9:
          sensorLocation = 'Front Hub';
          break;
        case 10:
          sensorLocation = 'Rear Dropout';
          break;
        case 11:
          sensorLocation = 'Chainstay';
          break;
        case 12:
          sensorLocation = 'Rear Wheel';
          break;
        case 13:
          sensorLocation = 'Rear Hub';
          break;
        case 14:
          sensorLocation = 'Chest';
          setCurrentImage(walkChest);
          break;
        case 15:
          sensorLocation = 'Spider';
          break;
        case 16:
          sensorLocation = 'Chain Ring';
          break;
        default:
          sensorLocation = 'Unknown';
          break;
      }

      console.log("Sensor Location : ", sensorLocation);


  }
  

const [currentImage, setCurrentImage] = useState(walkInShoe);


const onSensorLocationButtonClick = (event) => {
  const location = parseInt(event.target.value, 10); 
  const opCode = 0x03; 
  const command = new Uint8Array([opCode, location]);

  switch (location) {
    case 2:
      setCurrentImage(walkInShoe);
      break;
    case 1:
      setCurrentImage(walkOnTopOfShoe);
      break;
    case 3:
      setCurrentImage(walkHip);
      break;
    case 14:
      setCurrentImage(walkChest);
      break;

    default:
      setCurrentImage(walkOther);
  }

  try {
    console.log(`Sending Update Sensor Location: Location=${location}`);
    console.log("Writing >> ", command);
    WriteIndicateCharacteristic.characteristic.writeValue(command)
      .then(() => {
        console.log('Write successful');
       
      })
      .catch((error) => {
        console.error('Error writing to characteristic:', error);
      });
  } catch (error) {
    console.error('Error sending Update Sensor Location command:', error);
  }
};


function handleSLIndication(event) {
  const value = event.target.value;
  console.log(value)
  const opCode = value.getUint8(0);
  const operator = value.getUint8(1);
  const operand = value.getUint8(2);

  console.log(`Sensor Location Indication: OpCode=${opCode}, Operator=${operator}, Operand=${operand}`);

  if (opCode === 16 &&  operand === 1 ) {
    console.log('Received successful response to Op Code 0x03');
  
  }

}



  

  

  return (
      <div className="tempPannel">

        <div className="titlebox">
          <img src={sneaker} alt="" className="WSlogo"></img>
          <h3><strong>Running Speed and Cadence</strong></h3>
        </div>


        
        <div class="WS__container container grid">

        <div>
        <div class="WStitle__card3">
            <h3 class="passion__title">Status</h3>
          </div>

        <div class="WStitle__card2">
              <div class="unite">
              <img src={currentActivityImage}  alt="" className="walklogo" ></img>
              </div>
              <span className='RSCInfo' id='stat'> </span>
        </div>
        </div>


        <div>
        <div class="WStitle__card3">
            <h3 class="passion__title">Sensor Location</h3>
          </div>

          <div class="RSCtitle__card2">
            <div className="input-group">
              <div className="input-group-text">
                  <input className="form-check-input mt-0" type="radio" value="2" name='sensorLocation' onClick={onSensorLocationButtonClick}></input>
                </div>
                <input type="text" disabled={true} style={{ fontSize: '20px' , fontWeight: 500}} className="form-control" aria-label="Text input with radio button" value="In shoe"></input>
            </div>
            <div className="input-group">
                <div className="input-group-text">
                  <input className="form-check-input mt-0" type="radio" value="1" name='sensorLocation' onClick={onSensorLocationButtonClick}></input>
                </div>
                <input type="text" disabled={true} style={{ fontSize: '20px' , fontWeight: 500}} className="form-control" aria-label="Text input with radio button" value="On top of shoe"></input>
            </div>
            <div className="input-group">
                <div className="input-group-text">
                  <input className="form-check-input mt-0" type="radio" value="3" name='sensorLocation' onClick={onSensorLocationButtonClick}></input>
                </div>
                <input type="text" disabled={true} style={{ fontSize: '20px' , fontWeight: 500}} className="form-control" aria-label="Text input with radio button" value="Hip"></input>
            </div>
            <div className="input-group">
                <div className="input-group-text">
                  <input className="form-check-input mt-0" type="radio" value="14" name='sensorLocation' onClick={onSensorLocationButtonClick}></input>
                </div>
                <input type="text" disabled={true} style={{ fontSize: '20px' , fontWeight: 500}} className="form-control" aria-label="Text input with radio button" value="Chest"></input>
            </div>
            <div className="input-group">
                <div className="input-group-text">
                  <input className="form-check-input mt-0" type="radio" value="0" name='sensorLocation' onClick={onSensorLocationButtonClick}></input>
                </div>
                <input type="text" disabled={true} style={{ fontSize: '20px' , fontWeight: 500}} className="form-control" aria-label="Text input with radio button" value="Other"></input>
            </div>
        </div>
        </div>

        <div>

        <div class="WStitle__card3">
            <h3 class="passion__title">Body</h3>
          </div>

        <div class="RSCtitle__card2">
            <div class="unite">
            <img src={currentImage} alt="Sensor Location" className="RSClogo" ></img>
            </div>
        </div>
        </div>

      </div>

      <div class="WS__container container grid">
        <div class="WStitle__card">
          <h3 class="passion__title">Instantaneous Speed</h3>
        </div>
      </div>

      <div class="RSC__container container grid">
  
        <div class="WStitle__card2">
          <div class="unite">
            <img src={speed} alt="" className="walklogo2" ></img>
          </div>
          <span className='RSCInfo' id='temp'> </span>
        </div>
        <div class="chart-container" style={{height: "225px", width: "100%"}}>  
          <canvas ref={speedChartContainer}></canvas>
        </div>
      </div>

      <div class="WS__container container grid">
        <div class="WStitle__card">
          <h3 class="passion__title">Instantaneous Cadence</h3>
        </div>
      </div>

      <div class="RSC__container container grid">
  
        <div class="WStitle__card2">
          <div class="unite">
            <img src={foot} alt="" className="walklogo2" ></img>
          </div>
          <span className='RSCInfo' id='location'> </span>
        </div>
        <div class="chart-container" style={{height: "225px", width: "100%"}}>  
          <canvas ref={cadenceChartContainer}></canvas>
        </div>
      </div>

      <div class="WS__container container grid">
        <div class="WStitle__card">
          <h3 class="passion__title">Instantaneous Stride Length</h3>
        </div>
      </div>

      <div class="RSC__container container grid">
  
        <div class="WStitle__card2">
          <div class="unite">
            <img src={run} alt="" className="walklogo2" ></img>
          </div>
          <span className='RSCInfo' id='date'> </span>
        </div>
        <div class="chart-container" style={{height: "225px", width: "100%"}}>  
          <canvas ref={strideLengthChartContainer}></canvas>
        </div>
      </div>

      <div class="WS__container container grid">
        <div class="WStitle__card">
          <h3 class="passion__title">Total Distance</h3>
        </div>
      </div>

      <div class="RSC__container container grid">
  
        <div class="WStitle__card2">
          <div class="unite">
            <img src={ruler} alt="" className="walklogo2" ></img>
          </div>
          <span className='RSCInfo' id='dist'> </span>
        </div>
        <div class="chart-container" style={{height: "225px", width: "100%"}}>  
          <canvas ref={distanceChartContainer}></canvas>
        </div>
      </div>
      
      </div>
     
  );
};

export default RunningSpeedandCadence;
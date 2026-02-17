// ******************************************************************************
// * @file    GHS.js
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


const GenericHealthSensor = (props) => {
  let IndicateCharacteristic;
  let ReadWriteIndicateCharacteristic;
  let NotifyCharacteristic;
  let ReadCharacteristic;
  let WriteIndicateCharacteristic;

  let Live_Health_Observations_Indicate_Notif_C;
  let Stored_Health_Observations_Indicate_Notif_C;
  let GHS_Control_Point_Write_Indicate_C;

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
          WriteIndicateCharacteristic.characteristic.addEventListener('CharacteristicValueChanged', handleSLIndication);
        })
        .catch(error => {
          console.error('Error starting indications for RACP:', error);
        });
    }
    if (Live_Health_Observations_Indicate_Notif_C && Live_Health_Observations_Indicate_Notif_C.characteristic) {
      Live_Health_Observations_Indicate_Notif_C.characteristic.startNotifications()
        .then(() => {
          Live_Health_Observations_Indicate_Notif_C.characteristic.addEventListener('CharacteristicValueChanged', handleSLIndication);
        })
        .catch(error => {
          console.error('Error starting indications for RACP:', error);
        });
    }
    if (Stored_Health_Observations_Indicate_Notif_C && Stored_Health_Observations_Indicate_Notif_C.characteristic) {
      Stored_Health_Observations_Indicate_Notif_C.characteristic.startNotifications()
        .then(() => {
          Stored_Health_Observations_Indicate_Notif_C.characteristic.addEventListener('CharacteristicValueChanged', handleSLIndication);
        })
        .catch(error => {
          console.error('Error starting indications for RACP:', error);
        });
    }
    if (GHS_Control_Point_Write_Indicate_C && GHS_Control_Point_Write_Indicate_C.characteristic) {
      GHS_Control_Point_Write_Indicate_C.characteristic.startNotifications()
        .then(() => {
          GHS_Control_Point_Write_Indicate_C.characteristic.addEventListener('CharacteristicValueChanged', handleSLIndication);
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
        WriteIndicateCharacteristic.characteristic.removeEventListener('CharacteristicValueChanged', handleSLIndication);
        WriteIndicateCharacteristic.characteristic.stopNotifications();
      }
      if (Live_Health_Observations_Indicate_Notif_C && Live_Health_Observations_Indicate_Notif_C.characteristic) {
        Live_Health_Observations_Indicate_Notif_C.characteristic.removeEventListener('CharacteristicValueChanged', handleSLIndication);
        Live_Health_Observations_Indicate_Notif_C.characteristic.stopNotifications();
      }
      if (Stored_Health_Observations_Indicate_Notif_C && Stored_Health_Observations_Indicate_Notif_C.characteristic) {
        Stored_Health_Observations_Indicate_Notif_C.characteristic.removeEventListener('CharacteristicValueChanged', handleSLIndication);
        Stored_Health_Observations_Indicate_Notif_C.characteristic.stopNotifications();
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
      case "00002b8b-0000-1000-8000-00805f9b34fb":
        Live_Health_Observations_Indicate_Notif_C = element;
        Live_Health_Observations_Indicate_Notif_C.characteristic.startNotifications();
        Live_Health_Observations_Indicate_Notif_C.characteristic.oncharacteristicvaluechanged = handleLiveHealthObservations;
        // const cccd = Live_Health_Observations_Indicate_Notif_C.getDescriptor('00002902-0000-1000-8000-00805f9b34fb');
        // cccd.writeValue(Uint8Array.of(0x02, 0x00)); // 0x02 pour indications, 0x01 pour notifications
        break;
      case "00002bdd-0000-1000-8000-00805f9b34fb":
        Stored_Health_Observations_Indicate_Notif_C = element;
        Stored_Health_Observations_Indicate_Notif_C.characteristic.startNotifications();
        Stored_Health_Observations_Indicate_Notif_C.characteristic.oncharacteristicvaluechanged = handleStoredHealthObservations;
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

  function handleLiveHealthObservations(event) {
    console.log(" >> Indication received : ");
    console.log(" >> handleLiveHealthObservations ");
    var buf = new Uint8Array(event.target.value.buffer);
    console.log(buf);
    let bufHex = buf2hex(buf);
    console.log(bufHex);
  }

  function handleStoredHealthObservations(event) {
    console.log(" >> Indication received : ");
    console.log(" >> handleStoredHealthObservations ");
    var buf = new Uint8Array(event.target.value.buffer);
    console.log(buf);
    let bufHex = buf2hex(buf);
    console.log(bufHex);
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


 // Enable Light image handler
 async function startSendingLiveObservations() {
  let myWord;
  try {
    //if (1) {
      myWord = new Uint8Array(2);
      myWord[0] = parseInt('01', 8);
      myWord[1] = parseInt('00', 8);
      console.log(myWord, " - Command to start sending live observations");
      await GHS_Control_Point_Write_Indicate_C.characteristic.writeValue(myWord);
      
    //} else {
      // myWord = new Uint8Array(2);
      // myWord[0] = parseInt('01', 8);
      // myWord[1] = parseInt('00', 8);
      // await ReadWriteCharacteristic.characteristic.writeValue(myWord);
      // createLogElement(myWord, 1, "P2Pserver WRITE");
      // document.getElementById('enableLightButton').innerHTML = "Light OFF";
      // document.getElementById('imageLightPink').src = imagelightOffBlue;
    //}
  }
  catch (error) {
    console.log('2 : Argh! ' + error);
  }
}
  

  

  return (
      <div className="tempPannel">
        
        <div class="WS__container container grid">


        <div>
        <div class="WStitle__card3">
            <h3 class="passion__title">Sensor Location</h3>
          </div>

          <div class="RSCtitle__card2">
            <div className="input-group">
              <div className="input-group-text">
                  <input className="form-check-input mt-0" type="radio" value="2" name='sensorLocation' onClick={startSendingLiveObservations}></input>
                </div>
                <input type="text" disabled={true} style={{ fontSize: '20px' , fontWeight: 500}} className="form-control" aria-label="Text input with radio button" value="GHS Control Point"></input>
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


      </div>

      




      
      </div>
     
  );
};

export default GenericHealthSensor;
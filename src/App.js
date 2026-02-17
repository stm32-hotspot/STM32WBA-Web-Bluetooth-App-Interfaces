// ******************************************************************************
// * @file    App.js
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
import Header from './components/Header';
import DataThroughput from './onglets/DataThroughput';
import HeartRate from './onglets/HeartRate';
import P2Pserver from './onglets/P2Pserver';
import P2Prouter from './onglets/P2Prouter';
import Ota from './onglets/Ota';
import HealthThermometer from './onglets/HT';
import FingerPrint from './onglets/FingerPrint';
import WeightScale from './onglets/WeightScale';
import BloodPressure from './onglets/BloodPressure';
import RunningSpeedandCadence from './onglets/RSC';
import ContinuousGlucoseMonitoring from './onglets/CGM';
import WifiCommissioning from './onglets/WifiCommissioning';
import FanProject from './onglets/FanProject';
import SMP from './onglets/MCUMGR/SMP';
import Electrocardiogram from './onglets/Electrocardiogram';
import Pulse_Oximeter from './onglets/Pulse_Oximeter'
import HUB_DYN from './onglets/HUB_DYN';
import SolarDemo from './onglets/SolarDemo';
import { BrowserRouter, Route, Link, Routes } from "react-router-dom";
import './styles/style.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import bootstrap from 'bootstrap';



const App = () => {
  const [allServices, setAllServices] = useState([]);
  const [allCharacteristics, setAllCharacteristics] = useState([]);
  const [isDisconnected, setIsDisconnected] = useState(true);
  let listItems = [];
  listItems = [];
  
allServices.map(service => {
  if(service.service.uuid === "0000fe80-cc7a-482a-984a-7f2ed5b3e58f"){
    listItems.push(<li className="liProfile"><Link to="/DT">Data Throughput</Link></li>);
  }
  if(service.service.uuid === "0000180d-0000-1000-8000-00805f9b34fb"){
    listItems.push(<li className="liProfile"><Link to="/HR">Heart Rate</Link></li>);
  }
  if(service.service.uuid === "0000fe40-cc7a-482a-984a-7f2ed5b3e58f"){
    listItems.push(<li className="liProfile"><Link to="/P2P">P2P Server</Link></li>);
  }
  if(service.service.uuid === "0000feb0-cc7a-482a-984a-7f2ed5b3e58f"){
    listItems.push(<li className="liProfile"><Link to="/P2P_ROUTER">P2P Router</Link></li>);
  }
  if(service.service.uuid === "0000fe20-cc7a-482a-984a-7f2ed5b3e58f"){
    listItems.push(<li className="liProfile"><Link to="/OTA">Firmware Update Over The Air</Link></li>);
  }
  if(service.service.uuid === "00001809-0000-1000-8000-00805f9b34fb"){
    listItems.push(<li className="liProfile"><Link to="/HT">Health Thermometer</Link></li>);
  }
  if(service.service.uuid === "d973f2e0-b19e-11e2-9e96-0800200c9a66"){
    listItems.push(<li className="liProfile"><Link to="/FP">Finger Print</Link></li>);
  }
  if(service.service.uuid === "00001810-0000-1000-8000-00805f9b34fb"){
    listItems.push(<li className="liProfile"><Link to="/BLS">Blood Pressure</Link></li>);
  }
  if(service.service.uuid === "0000181d-0000-1000-8000-00805f9b34fb"){
    listItems.push(<li className="liProfile"><Link to="/WS">Weight Scale</Link></li>);
  }
  if(service.service.uuid === "00001814-0000-1000-8000-00805f9b34fb"){
    listItems.push(<li className="liProfile"><Link to="/RSC">Running Speed and Cadence</Link></li>);
  }
  if(service.service.uuid === "0000181f-0000-1000-8000-00805f9b34fb"){
    listItems.push(<li className="liProfile"><Link to="/CGM">Continuous Glucose Monitoring</Link></li>);
  }
  if(service.service.uuid === "0000ff9a-cc7a-482a-984a-7f2ed5b3e58f"){
    listItems.push(<li className="liProfile"><Link to="/WCom">Wifi Commissioning</Link></li>);
  }
  if(service.service.uuid === "0000f11a-cc7a-482a-984a-7f2ed5b3e58f"){
    listItems.push(<li className="liProfile"><Link to="/FC">Fan Project</Link></li>);
  }
  if(service.service.uuid === "8d53dc1d-1db7-4cd3-868b-8a527460aa84"){
    listItems.push(<li className="liProfile"><Link to="/SMP">Simple Management Protocol</Link></li>);
  }
  if(service.service.uuid === "00001840-0000-1000-8000-00805f9b34fb"){
    if(service.device.name.startsWith("ECG_"))
      listItems.push(<li className="liProfile"><Link to="/Electrocardiogram">Electrocardiogram</Link></li>);
    if(service.device.name.startsWith("PO_"))
      listItems.push(<li className="liProfile"><Link to="/Pulse_Oximeter">Pulse Oximeter</Link></li>);
  }
  if(service.service.uuid === "0000fe90-cc7a-482a-984a-7f2ed5b3e58f"){
    listItems.push(<li className="liProfile"><Link to="/HUB_DYN">BLE HUB Zigbee</Link></li>);
  }
  if(service.service.uuid === "0000ab40-cc7a-482a-984a-7f2ed5b3e58f"){
    listItems.push(<li className="liProfile"><Link to="/SOLAR">Solar Panel </Link></li>);
  }
  
});


  return (
    <BrowserRouter>
      <div>
        <Header setIsDisconnected={setIsDisconnected} setAllServices={setAllServices} setAllCharacteristics={setAllCharacteristics}></Header>
          <ul className="ulProfile">{listItems}</ul>
        {/* if device isDisconnected do render nothing more, else render component services contain in onglets[] */}
        {/* {isDisconnected ? null : onglets} */}
        <div className="main-route-place">
          <Routes>
            <Route path="/"/>
            <Route path="*"/>
            {/* If isDisconnected === true, element = null eslse element = <component></component> */}
            <Route path="/DT" element={isDisconnected ? null : <DataThroughput allCharacteristics={allCharacteristics}></DataThroughput>} />
            <Route path="/HR" element={isDisconnected ? null : <HeartRate allCharacteristics={allCharacteristics}></HeartRate>} />
            <Route path="/P2P" element={isDisconnected ? null : <P2Pserver allCharacteristics={allCharacteristics}></P2Pserver>} />
            <Route path="/P2P_ROUTER" element={isDisconnected ? null : <P2Prouter allCharacteristics={allCharacteristics}></P2Prouter>} />
            <Route path="/OTA" element={isDisconnected ? null : <Ota allCharacteristics={allCharacteristics}></Ota>} />
            <Route path="/HT" element={isDisconnected ? null : <HealthThermometer allCharacteristics={allCharacteristics}></HealthThermometer>} />
            <Route path="/FP" element={isDisconnected ? null : <FingerPrint allCharacteristics={allCharacteristics}></FingerPrint>} />
            <Route path="/BLS" element={isDisconnected ? null : <BloodPressure allCharacteristics={allCharacteristics}></BloodPressure>} />
            <Route path="/WS" element={isDisconnected ? null : <WeightScale allCharacteristics={allCharacteristics}></WeightScale>} />
            <Route path="/RSC" element={isDisconnected ? null : <RunningSpeedandCadence allCharacteristics={allCharacteristics}></RunningSpeedandCadence>} />
            <Route path="/CGM" element={isDisconnected ? null : <ContinuousGlucoseMonitoring allCharacteristics={allCharacteristics}></ContinuousGlucoseMonitoring>} />
	          <Route path="/WCom" element={isDisconnected ? null : <WifiCommissioning allCharacteristics={allCharacteristics}></WifiCommissioning>} />
            <Route path="/FC" element={isDisconnected ? null : <FanProject allCharacteristics={allCharacteristics}></FanProject>} />
            <Route path="/SMP" element={isDisconnected ? null : <SMP allCharacteristics={allCharacteristics}></SMP>} />
            <Route path="/Electrocardiogram" element={isDisconnected ? null : <Electrocardiogram allCharacteristics={allCharacteristics}></Electrocardiogram>} />
            <Route path="/Pulse_Oximeter" element={isDisconnected ? null : <Pulse_Oximeter allCharacteristics={allCharacteristics}></Pulse_Oximeter>} />
	          <Route path="/HUB_DYN" element={isDisconnected ? null : <HUB_DYN allCharacteristics={allCharacteristics}></HUB_DYN>} />
            <Route path="/SOLAR" element={isDisconnected ? null : <SolarDemo allCharacteristics={allCharacteristics}></SolarDemo>} />
          </Routes>
          </div>
      </div>
    </BrowserRouter>
    

  );
}

export default App;

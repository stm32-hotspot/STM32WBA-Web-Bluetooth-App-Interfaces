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
import React, { Suspense, lazy, useState } from 'react';
import Header from './components/Header';
import { BrowserRouter, Route, Link, Routes } from "react-router-dom";
import './styles/style.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const DataThroughput = lazy(() => import('./onglets/DataThroughput'));
const HeartRate = lazy(() => import('./onglets/HeartRate'));
const P2Pserver = lazy(() => import('./onglets/P2Pserver'));
const P2Prouter = lazy(() => import('./onglets/P2Prouter'));
const Ota = lazy(() => import('./onglets/Ota'));
const HealthThermometer = lazy(() => import('./onglets/HT'));
const FingerPrint = lazy(() => import('./onglets/FingerPrint'));
const WeightScale = lazy(() => import('./onglets/WeightScale'));
const BloodPressure = lazy(() => import('./onglets/BloodPressure'));
const RunningSpeedandCadence = lazy(() => import('./onglets/RSC'));
const ContinuousGlucoseMonitoring = lazy(() => import('./onglets/CGM'));
const WifiCommissioning = lazy(() => import('./onglets/WifiCommissioning'));
const FanProject = lazy(() => import('./onglets/FanProject'));
const SMP = lazy(() => import('./onglets/MCUMGR/SMP'));
const Electrocardiogram = lazy(() => import('./onglets/Electrocardiogram'));
const PulseOximeter = lazy(() => import('./onglets/Pulse_Oximeter'));
const HUB_DYN = lazy(() => import('./onglets/HUB_DYN'));
const SolarDemo = lazy(() => import('./onglets/SolarDemo'));
const AppConfig = lazy(() => import('./onglets/AppConfig'));

const renderLazyRoute = (isDisconnected, Component, allCharacteristics) => {
  if (isDisconnected) {
    return null;
  }

  return <Component allCharacteristics={allCharacteristics} />;
};



const App = () => {
  const [allServices, setAllServices] = useState([]);
  const [allCharacteristics, setAllCharacteristics] = useState([]);
  const [isDisconnected, setIsDisconnected] = useState(true);
  let listItems = [];
  listItems = [];

allServices.map(service => {
  if(service.service.uuid === "0000fe80-cc7a-482a-984a-7f2ed5b3e58f"){
    listItems.push(<li key="DT" className="liProfile"><Link to="/DT">Data Throughput</Link></li>);
  }
  if(service.service.uuid === "0000180d-0000-1000-8000-00805f9b34fb"){
    listItems.push(<li key="HR" className="liProfile"><Link to="/HR">Heart Rate</Link></li>);
  }
  if(service.service.uuid === "0000fe40-cc7a-482a-984a-7f2ed5b3e58f"){
    listItems.push(<li key="P2P" className="liProfile"><Link to="/P2P">P2P Server</Link></li>);
  }
  if(service.service.uuid === "0000feb0-cc7a-482a-984a-7f2ed5b3e58f"){
    listItems.push(<li key="P2P_ROUTER" className="liProfile"><Link to="/P2P_ROUTER">P2P Router</Link></li>);
  }
  if(service.service.uuid === "0000fe20-cc7a-482a-984a-7f2ed5b3e58f"){
    listItems.push(<li key="OTA" className="liProfile"><Link to="/OTA">Firmware Update Over The Air</Link></li>);
  }
  if(service.service.uuid === "00001809-0000-1000-8000-00805f9b34fb"){
    listItems.push(<li key="HT" className="liProfile"><Link to="/HT">Health Thermometer</Link></li>);
  }
  if(service.service.uuid === "d973f2e0-b19e-11e2-9e96-0800200c9a66"){
    listItems.push(<li key="FP" className="liProfile"><Link to="/FP">Finger Print</Link></li>);
  }
  if(service.service.uuid === "00001810-0000-1000-8000-00805f9b34fb"){
    listItems.push(<li key="BLS" className="liProfile"><Link to="/BLS">Blood Pressure</Link></li>);
  }
  if(service.service.uuid === "0000181d-0000-1000-8000-00805f9b34fb"){
    listItems.push(<li key="WS" className="liProfile"><Link to="/WS">Weight Scale</Link></li>);
  }
  if(service.service.uuid === "00001814-0000-1000-8000-00805f9b34fb"){
    listItems.push(<li key="RSC" className="liProfile"><Link to="/RSC">Running Speed and Cadence</Link></li>);
  }
  if(service.service.uuid === "0000181f-0000-1000-8000-00805f9b34fb"){
    listItems.push(<li key="CGM" className="liProfile"><Link to="/CGM">Continuous Glucose Monitoring</Link></li>);
  }
  if(service.service.uuid === "0000ff9a-cc7a-482a-984a-7f2ed5b3e58f"){
    listItems.push(<li key="WCom" className="liProfile"><Link to="/WCom">Wifi Commissioning</Link></li>);
  }
  if(service.service.uuid === "0000f11a-cc7a-482a-984a-7f2ed5b3e58f"){
    listItems.push(<li key="FC" className="liProfile"><Link to="/FC">Fan Project</Link></li>);
  }
  if(service.service.uuid === "8d53dc1d-1db7-4cd3-868b-8a527460aa84"){
    listItems.push(<li key="SMP" className="liProfile"><Link to="/SMP">Simple Management Protocol</Link></li>);
  }
  if(service.service.uuid === "00001840-0000-1000-8000-00805f9b34fb"){
    if(service.device.name.startsWith("ECG_"))
      listItems.push(<li key="Electrocardiogram" className="liProfile"><Link to="/Electrocardiogram">Electrocardiogram</Link></li>);
    if(service.device.name.startsWith("PO_"))
      listItems.push(<li key="Pulse_Oximeter" className="liProfile"><Link to="/Pulse_Oximeter">Pulse Oximeter</Link></li>);
  }
  if(service.service.uuid === "0000fe90-cc7a-482a-984a-7f2ed5b3e58f"){
    listItems.push(<li key="HUB_DYN" className="liProfile"><Link to="/HUB_DYN">BLE HUB Zigbee</Link></li>);
  }
  if(service.service.uuid === "0000ab40-cc7a-482a-984a-7f2ed5b3e58f"){
    listItems.push(<li key="SOLAR" className="liProfile"><Link to="/SOLAR">Solar Panel </Link></li>);
  }
  if(service.service.uuid === "0000fe50-cc7a-482a-984a-7f2ed5b3e58f"){
    listItems.push(<li className="liProfile"><Link to="/AppConfig">App Config</Link></li>);
  }

});


  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div>
        <Header setIsDisconnected={setIsDisconnected} setAllServices={setAllServices} setAllCharacteristics={setAllCharacteristics}></Header>
          <ul className="ulProfile">{listItems}</ul>
        {/* if device isDisconnected do render nothing more, else render component services contain in onglets[] */}
        {/* {isDisconnected ? null : onglets} */}
        <div className="main-route-place">
          <Suspense fallback={<div className="container-fluid py-3">Loading profile...</div>}>
            <Routes>
              {/* If isDisconnected === true, element = null else element = <component /> */}
              <Route path="/DT" element={renderLazyRoute(isDisconnected, DataThroughput, allCharacteristics)} />
              <Route path="/HR" element={renderLazyRoute(isDisconnected, HeartRate, allCharacteristics)} />
              <Route path="/P2P" element={renderLazyRoute(isDisconnected, P2Pserver, allCharacteristics)} />
              <Route path="/P2P_ROUTER" element={renderLazyRoute(isDisconnected, P2Prouter, allCharacteristics)} />
              <Route path="/OTA" element={renderLazyRoute(isDisconnected, Ota, allCharacteristics)} />
              <Route path="/HT" element={renderLazyRoute(isDisconnected, HealthThermometer, allCharacteristics)} />
              <Route path="/FP" element={renderLazyRoute(isDisconnected, FingerPrint, allCharacteristics)} />
              <Route path="/BLS" element={renderLazyRoute(isDisconnected, BloodPressure, allCharacteristics)} />
              <Route path="/WS" element={renderLazyRoute(isDisconnected, WeightScale, allCharacteristics)} />
              <Route path="/RSC" element={renderLazyRoute(isDisconnected, RunningSpeedandCadence, allCharacteristics)} />
              <Route path="/CGM" element={renderLazyRoute(isDisconnected, ContinuousGlucoseMonitoring, allCharacteristics)} />
	            <Route path="/WCom" element={renderLazyRoute(isDisconnected, WifiCommissioning, allCharacteristics)} />
              <Route path="/FC" element={renderLazyRoute(isDisconnected, FanProject, allCharacteristics)} />
              <Route path="/SMP" element={renderLazyRoute(isDisconnected, SMP, allCharacteristics)} />
              <Route path="/Electrocardiogram" element={renderLazyRoute(isDisconnected, Electrocardiogram, allCharacteristics)} />
              <Route path="/Pulse_Oximeter" element={renderLazyRoute(isDisconnected, PulseOximeter, allCharacteristics)} />
	            <Route path="/HUB_DYN" element={renderLazyRoute(isDisconnected, HUB_DYN, allCharacteristics)} />
              <Route path="/SOLAR" element={renderLazyRoute(isDisconnected, SolarDemo, allCharacteristics)} />
              <Route path="/AppConfig" element={renderLazyRoute(isDisconnected, AppConfig, allCharacteristics)} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </BrowserRouter>


  );
}

export default App;

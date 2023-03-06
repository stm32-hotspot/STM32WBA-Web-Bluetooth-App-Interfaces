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
          </Routes>
          </div>
      </div>
    </BrowserRouter>
    

  );
}

export default App;

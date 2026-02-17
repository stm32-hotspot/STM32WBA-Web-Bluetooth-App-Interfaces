// ******************************************************************************
// * @file    config-overrides.js
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
//  ******************************************************************************
const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add more polyfills if necessary
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "stream": require.resolve("stream-browserify"),
    
  };
  console.log("CONFIG-OVERRIDES.js");
  
  return config;
};
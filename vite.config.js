// ******************************************************************************
// * @file    vite.config.js
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
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const homepage = '/Web_Bluetooth_App_WBA/';

export default defineConfig({
  base: homepage,
  plugins: [
    react(),
  ],
  test: {
    globals: true,
  },
});
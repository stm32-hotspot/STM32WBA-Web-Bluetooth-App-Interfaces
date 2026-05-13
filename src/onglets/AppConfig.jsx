// ******************************************************************************
// * @file    AppConfig.js
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
import React, { useCallback, useEffect, useState } from 'react';
import { createLogElement } from '../components/Header';

const APPCONFIG_DATA_CHAR_UUID = '0000fe51-8e22-4541-9d4c-21edae82ed19';
const CONFIG_PROTOCOL_VERSION = 0x03;
const CONFIG_HEADER_SIZE = 10;
const DEVICE_NAME_PREFIX = 'PS_';
const DEVICE_NAME_MAX_LENGTH = 10;
const DEVICE_NAME_SUFFIX_MAX_LENGTH = DEVICE_NAME_MAX_LENGTH - DEVICE_NAME_PREFIX.length;
const CONNECTION_INTERVAL_MIN_MS = 8;
const CONNECTION_INTERVAL_MAX_MS = 4000;
const LOW_POWER_TABLE_ACTUAL_DBM = [
  -20.5, -19.5, -17.9, -17.0, -16.0, -15.0, -14.1, -13.1,
  -12.2, -11.3, -10.4, -9.4, -8.3, -7.2, -6.2, -5.5,
  -4.5, -3.5, -2.5, -0.6, -0.4, 0.7, 2.0, 2.6,
];
const TX_POWER_MIN = 0;
const TX_POWER_MAX = LOW_POWER_TABLE_ACTUAL_DBM.length - 1;

const AppConfig = (props) => {
  const [config, setConfig] = useState({
    deviceNameSuffix: '',
    advIntervalMinMs: '80',
    advIntervalMaxMs: '100',
    connectionIntervalMs: '1000',
    logsEnabled: true,
    txPower: '20',
  });
  const [statusMessage, setStatusMessage] = useState('Read the current BLE configuration from the device.');
  const [isBusy, setIsBusy] = useState(false);

  const configCharacteristic = props.allCharacteristics.find(
    (element) => element.characteristic.uuid === APPCONFIG_DATA_CHAR_UUID,
  )?.characteristic;

  document.getElementById("readmeInfo").style.display = "none";

  function decodeConfigPayload(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

    if (bytes.length < CONFIG_HEADER_SIZE || bytes[0] !== CONFIG_PROTOCOL_VERSION) {
      throw new Error('Invalid BLE configuration payload.');
    }

    const deviceNameLength = bytes[1];
    if (bytes.length !== CONFIG_HEADER_SIZE + deviceNameLength) {
      throw new Error('Unexpected BLE configuration payload length.');
    }

    const deviceName = String.fromCharCode(...bytes.slice(CONFIG_HEADER_SIZE, CONFIG_HEADER_SIZE + deviceNameLength));
    const advIntervalMinMs = bytes[2] | (bytes[3] << 8);
    const advIntervalMaxMs = bytes[4] | (bytes[5] << 8);
    const logsEnabled = bytes[6] !== 0;
    const txPower = bytes[7];
    const connectionIntervalMs = bytes[8] | (bytes[9] << 8);

    return {
      deviceNameSuffix: deviceName.startsWith(DEVICE_NAME_PREFIX)
        ? deviceName.slice(DEVICE_NAME_PREFIX.length)
        : deviceName,
      advIntervalMinMs: String(advIntervalMinMs),
      advIntervalMaxMs: String(advIntervalMaxMs),
      connectionIntervalMs: String(connectionIntervalMs),
      logsEnabled,
      txPower: String(txPower),
    };
  }

  function encodeConfigPayload() {
    const trimmedSuffix = config.deviceNameSuffix.trim();
    const fullDeviceName = `${DEVICE_NAME_PREFIX}${trimmedSuffix}`;
    const advIntervalMinMs = Number(config.advIntervalMinMs);
    const advIntervalMaxMs = Number(config.advIntervalMaxMs);
    const connectionIntervalMs = Number(config.connectionIntervalMs);
    const txPower = Number(config.txPower);

    if (trimmedSuffix.length > DEVICE_NAME_SUFFIX_MAX_LENGTH) {
      throw new Error(`Name suffix must contain at most ${DEVICE_NAME_SUFFIX_MAX_LENGTH} ASCII characters.`);
    }

    for (const character of trimmedSuffix) {
      const asciiCode = character.charCodeAt(0);
      if (asciiCode < 0x20 || asciiCode > 0x7e) {
        throw new Error('Name suffix must contain printable ASCII characters only.');
      }
    }

    if (!Number.isInteger(advIntervalMinMs) || !Number.isInteger(advIntervalMaxMs)) {
      throw new Error('Advertising intervals must be integer values in milliseconds.');
    }

    if (advIntervalMinMs < 20 || advIntervalMaxMs > 10240 || advIntervalMinMs > advIntervalMaxMs) {
      throw new Error('Advertising intervals must follow 20 ms <= min <= max <= 10240 ms.');
    }

    if (!Number.isInteger(connectionIntervalMs) ||
        connectionIntervalMs < CONNECTION_INTERVAL_MIN_MS ||
        connectionIntervalMs > CONNECTION_INTERVAL_MAX_MS) {
      throw new Error(`Connection interval must be an integer in the ${CONNECTION_INTERVAL_MIN_MS}..${CONNECTION_INTERVAL_MAX_MS} ms range.`);
    }

    if (!Number.isInteger(txPower) || txPower < TX_POWER_MIN || txPower > TX_POWER_MAX) {
      throw new Error(`TX power must be a low-power-table index in the ${TX_POWER_MIN}..${TX_POWER_MAX} range.`);
    }

    const payload = new Uint8Array(CONFIG_HEADER_SIZE + fullDeviceName.length);
    payload[0] = CONFIG_PROTOCOL_VERSION;
    payload[1] = fullDeviceName.length;
    payload[2] = advIntervalMinMs & 0xff;
    payload[3] = (advIntervalMinMs >> 8) & 0xff;
    payload[4] = advIntervalMaxMs & 0xff;
    payload[5] = (advIntervalMaxMs >> 8) & 0xff;
    payload[6] = config.logsEnabled ? 1 : 0;
    payload[7] = txPower & 0xff;
    payload[8] = connectionIntervalMs & 0xff;
    payload[9] = (connectionIntervalMs >> 8) & 0xff;

    for (let index = 0; index < fullDeviceName.length; index += 1) {
      payload[CONFIG_HEADER_SIZE + index] = fullDeviceName.charCodeAt(index);
    }

    return payload;
  }

  const readCurrentConfig = useCallback(async () => {
    if (!configCharacteristic) {
      return;
    }

    setIsBusy(true);
    try {
      const value = await configCharacteristic.readValue();
      const currentConfig = decodeConfigPayload(new Uint8Array(value.buffer));
      setConfig(currentConfig);
      setStatusMessage('Current BLE configuration loaded from the device.');
      createLogElement(new Uint8Array(value.buffer), 1, 'AppConfig READ');
    } catch (error) {
      console.error(error);
      setStatusMessage(error.message);
    } finally {
      setIsBusy(false);
    }
  }, [configCharacteristic]);

  useEffect(() => {
    if (!configCharacteristic) {
      return undefined;
    }

    void readCurrentConfig();
  }, [configCharacteristic, readCurrentConfig]);

  async function writeCurrentConfig() {
    if (!configCharacteristic) {
      return;
    }

    setIsBusy(true);
    try {
      const payload = encodeConfigPayload();
      if (configCharacteristic.writeValueWithResponse) {
        await configCharacteristic.writeValueWithResponse(payload);
      } else {
        await configCharacteristic.writeValue(payload);
      }
      createLogElement(payload, 1, 'AppConfig WRITE');
      setStatusMessage('BLE configuration sent to the device.');
      await readCurrentConfig();
    } catch (error) {
      console.error(error);
      setStatusMessage(error.message);
    } finally {
      setIsBusy(false);
    }
  }

  function onFieldChange(event) {
    const { name, value, type, checked } = event.target;
    setConfig((previousConfig) => ({
      ...previousConfig,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  const txPowerIndex = Number(config.txPower);
  const selectedActualPower = Number.isInteger(txPowerIndex) &&
    txPowerIndex >= TX_POWER_MIN &&
    txPowerIndex <= TX_POWER_MAX
    ? LOW_POWER_TABLE_ACTUAL_DBM[txPowerIndex]
    : null;

  return (
    <section className="panel-card config-panel">
      <div className="config-panel-header">
        <div>
          <p className="eyebrow">AppConfig Service</p>
          <h2>BLE Parameters in Persistent Storage</h2>
        </div>
        <div className="button-row">
          <button className="defaultButton" type="button" onClick={readCurrentConfig} disabled={!configCharacteristic || isBusy}>
            Read
          </button>
          <button className="defaultButton" type="button" onClick={writeCurrentConfig} disabled={!configCharacteristic || isBusy}>
            Save
          </button>
        </div>
      </div>

      <h3 className="field-label">BLE Parameters</h3>
      <div className="config-grid">
        <label className="field-label" htmlFor="deviceNameSuffix">Device name suffix (after PS_)</label>
        <input
          id="deviceNameSuffix"
          name="deviceNameSuffix"
          className="form-control"
          maxLength={DEVICE_NAME_SUFFIX_MAX_LENGTH}
          value={config.deviceNameSuffix}
          onChange={onFieldChange}
        />

        <label className="field-label" htmlFor="advIntervalMinMs">Advertising interval min (ms)</label>
        <input
          id="advIntervalMinMs"
          name="advIntervalMinMs"
          className="form-control"
          inputMode="numeric"
          value={config.advIntervalMinMs}
          onChange={onFieldChange}
        />

        <label className="field-label" htmlFor="advIntervalMaxMs">Advertising interval max (ms)</label>
        <input
          id="advIntervalMaxMs"
          name="advIntervalMaxMs"
          className="form-control"
          inputMode="numeric"
          value={config.advIntervalMaxMs}
          onChange={onFieldChange}
        />

        <label className="field-label" htmlFor="txPower">TX power index (low power table)</label>
        <input
          id="txPower"
          name="txPower"
          className="form-control"
          inputMode="numeric"
          value={config.txPower}
          onChange={onFieldChange}
        />

        <label className="field-label" htmlFor="connectionIntervalMs">Connection interval (ms, applied by button 3)</label>
        <input
          id="connectionIntervalMs"
          name="connectionIntervalMs"
          className="form-control"
          inputMode="numeric"
          value={config.connectionIntervalMs}
          onChange={onFieldChange}
        />
      </div>

      <div style={{ height: '1rem' }} aria-hidden="true" />

      <h3 className="field-label">System Parameters</h3>
      <div className="config-grid">
        <label className="field-label" htmlFor="logsEnabled">Logs enabled</label>
        <input
          id="logsEnabled"
          name="logsEnabled"
          className="form-check-input"
          type="checkbox"
          checked={config.logsEnabled}
          onChange={onFieldChange}
        />
      </div>

      <div className="config-hints">
        <p>Advertising name prefix is fixed to {DEVICE_NAME_PREFIX}</p>
        <p>Name suffix length: {config.deviceNameSuffix.length}/{DEVICE_NAME_SUFFIX_MAX_LENGTH} characters</p>
        <p>Total device name length: {(DEVICE_NAME_PREFIX + config.deviceNameSuffix).length}/{DEVICE_NAME_MAX_LENGTH}</p>
        <p>Valid interval range: 20 ms to 10240 ms</p>
        <p>Connection interval range: {CONNECTION_INTERVAL_MIN_MS} ms to {CONNECTION_INTERVAL_MAX_MS} ms</p>
        <p>TX power index range: {TX_POWER_MIN} to {TX_POWER_MAX}</p>
        <p>
          Actual TX power: {selectedActualPower !== null ? `${selectedActualPower.toFixed(1)} dBm` : 'invalid index'}
        </p>
        <p>Logs: {config.logsEnabled ? 'enabled' : 'disabled'}</p>
      </div>

      <div className="status-box">
        <strong>Status:</strong> {statusMessage}
      </div>
    </section>
  );
};

export default AppConfig;

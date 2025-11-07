import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Stores data against a key
 * @param {string} key 
 * @param {string} data - Stringified JSON or string value
 */
const storeData = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, data);
  } catch (e) {
    console.log('storeData error:', e);
  }
};

/**
 * Retrieves data by key
 * @param {string} key 
 * @returns {string|null}
 */
const getData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value;
  } catch (e) {
    console.log('getData error:', e);
  }
};

/**
 * Removes data for a specific key
 * @param {string} key 
 */
const removeKeyData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.log('removeKeyData error:', e);
  }
};

/**
 * Clears all data from AsyncStorage
 */
const clearAll = async () => {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.log('clearAll error:', e);
  }
};

/**
 * Removes all keys except specified keys
 * @param  {...string} keysToKeep 
 */
const removeMultipleKeysDataFromLocalStorage = async (...keysToKeep) => {
  try {
    let keys = await AsyncStorage.getAllKeys();
    const keysToRemove = keys.filter(key => !keysToKeep.includes(key));
    await AsyncStorage.multiRemove(keysToRemove);
  } catch (e) {
    console.log('removeMultipleKeysDataFromLocalStorage error:', e);
  }
};

/**
 * Retrieves all keys stored in AsyncStorage
 * @returns {Array<string>}
 */
const getAllKeys = async () => {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (e) {
    console.log('getAllKeys error:', e);
    return [];
  }
};

export {
  storeData,
  getData,
  removeKeyData,
  clearAll,
  removeMultipleKeysDataFromLocalStorage,
  getAllKeys,
};

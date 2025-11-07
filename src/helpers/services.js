
import axios from 'axios';
import * as Config from '../helpers/Config';
import { getData, clearAll } from './localStorage';
import { Alert } from 'react-native';

/**
 * POST Service with conditional headers
 * @param {string} url - API endpoint (without baseUrl)
 * @param {object} postData - Data to send in body
 * @returns {Promise} Axios response or error
 */
export const apiPostService = async (url, postData) => {
console.log("POST DATA",`${url}`)
  try {
     let localDataObj = await getData(Config?.store_key_login_details);
    let token = localDataObj;
    console.log("token", token)
    try {
      token = JSON.parse(localDataObj);
    } catch (e) {
      // Not JSON, keep as raw string
    }
    let clientCode = await getData(Config?.clientCode);
       console.log("clientCode", clientCode)
    try {
      clientCode = JSON.parse(clientCode);
    } catch (e) {
      // Not JSON, keep as raw string
    }

    const headers = {
      'Content-Type': 'application/json',
          "tenantId": 'motisons'
    };
    // console.log("HEADES:::=", postData,clientCode,token)

     if (token) headers.Authorization = token;
    if (clientCode) headers.clientCode = clientCode;

    console.log('POST Headers:', {
      method: 'POST',
      url: `${Config.baseUrl}${url}`,
      data: postData,
      headers,
    });

    const response = await axios({
      method: 'POST',
      url: `${Config.baseUrl}${url}`,
      data: postData,
      headers,
    });

    console.log('POST Response:', response);
    return response;
  } catch (error) {
    console.log('POST Error:', error);
    Alert.alert('Server Error', `${error?.message}`);
    // await clearAll();
    return error;
  }
};

/**
 * GET Service with conditional headers
 * @param {string} url - API endpoint (without baseUrl)
 * @param {object} params - Optional query parameters
 * @returns {Promise} Axios response or error
 */
export const apiGetService = async (url, params = {}) => {
  console.log("url data ==>>",`${Config.baseUrl}${url}`)
  try {
    let localDataObj = await getData(Config?.store_key_login_details);
    // console.log('apiGetService called with url:', url, 'and params:', params, "token", localDataObj);
    
    let token = localDataObj;
        // console.log("token", token)
    try {
      token = JSON.parse(localDataObj);
    } catch (e) {
      // Not JSON, keep as raw string
    }

    // console.log('Token:', token);

    let clientCode = await getData(Config?.clientCode);
    // console.log("clientCode", clientCode)
    try {
      clientCode = JSON.parse(clientCode);
    } catch (e) {
      // Not JSON, keep as raw string
    }

    // console.log('Client Code:', clientCode);

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) headers.Authorization = token;
    // if()
    if (clientCode) headers.clientCode = clientCode;

    console.log('GET Headers:', {
      method: 'GET',
      url: `${Config.baseUrl}${url}`,
      params,
      headers,
    });

    const response = await axios({
      method: 'GET',
      url: `${Config.baseUrl}${url}`,
      params,
      headers,
    });

    console.log('GET Response:', response);
    return response;
  } catch (error) {
    console.log('GET Error:', error);
    // Alert.alert('Server Error', `${error?.message}`);
    // await clearAll();
    return error;
  }
};

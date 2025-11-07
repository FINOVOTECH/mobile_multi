import { useState, useEffect } from 'react';

export const useLoginValidation = () => {
  const [validationErrors, setValidationErrors] = useState({});

  const validationPatterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[6-9]\d{9}$/,
    clientCode: /^[A-Za-z0-9]{4,20}$/,
  };

  const validateInput = (value, method) => {
    const errors = {};
    
    if (!value || value.trim() === '') {
      errors.referenceId = `${method === 'phone' ? 'Phone number' : method === 'email' ? 'Email' : 'Client code'} is required`;
      return errors;
    }

    const trimmedValue = value.trim();

    switch (method) {
      case 'email':
        if (!validationPatterns.email.test(trimmedValue)) {
          errors.referenceId = 'Please enter a valid email address';
        }
        break;
      
      case 'phone':
        const phoneDigits = trimmedValue.replace(/\D/g, '');
        if (!validationPatterns.phone.test(phoneDigits)) {
          errors.referenceId = 'Please enter a valid 10-digit phone number';
        }
        break;
      
      case 'client':
        if (!validationPatterns.clientCode.test(trimmedValue)) {
          errors.referenceId = 'Client code must be 4-20 alphanumeric characters';
        }
        break;
      
      default:
        errors.referenceId = 'Invalid login method';
    }

    return errors;
  };

  const validateOtp = (otpArray) => {
    const otpString = otpArray.join('');
    if (otpString.length !== 4) {
      return 'Please enter complete 4-digit OTP';
    }
    if (!/^\d{4}$/.test(otpString)) {
      return 'OTP must contain only numbers';
    }
    return null;
  };

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 10);
  };

  const clearValidationErrors = () => {
    setValidationErrors({});
  };

  return {
    validationErrors,
    setValidationErrors,
    validateInput,
    validateOtp,
    formatPhoneNumber,
    clearValidationErrors,
  };
};
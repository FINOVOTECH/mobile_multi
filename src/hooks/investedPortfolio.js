import { useState, useCallback } from 'react';
import { apiGetService } from '../helpers/services';
import { useFocusEffect } from '@react-navigation/native';

const InvestedPorfolio = () => {
  const [investmentData, setInvestmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      const response = await apiGetService('/api/v1/allotement/order/units');
      console.log('Portfolio Response:', response?.data);
      setInvestmentData(response?.data || []);
    } catch (err) {
      console.log('Error fetching portfolio:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 REFRESH EVERY TIME BOTTOM TAB IS FOCUSED
  useFocusEffect(
    useCallback(() => {
      fetchPortfolioData();
    }, [])
  );

  return { investmentData, loading, error, refetch: fetchPortfolioData };
};

export default InvestedPorfolio;

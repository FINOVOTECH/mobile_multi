import { useState, useEffect, useCallback } from 'react';
import { apiGetService } from '../helpers/services';
import { useFocusEffect } from '@react-navigation/native';

const useGetPortfolioData = () => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      const response = await apiGetService('/api/v1/allotement/order/units/aggregated');
      console.log('Portfolio Data Response:', response.data);
      setPortfolioData(response?.data?.portfolioSummary || []);
    } catch (err) {
      console.log('Error fetching portfolio data:', err.response || err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPortfolioData();
    }, [])
  );


  return { portfolioData, loading, error, refetch: fetchPortfolioData };
};

export default useGetPortfolioData;

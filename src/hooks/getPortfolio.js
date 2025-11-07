import { useState, useEffect } from 'react';
import { apiGetService } from '../helpers/services'; 

const useGetPortfolioData = () => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      const response = await apiGetService('/api/v1/order/allotement/order/units');
      console.log('Portfolio Data Response:', response.data);
      setPortfolioData(response?.data);
    } catch (err) {
      console.log('Error fetching portfolio data:', err.response || err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  return { portfolioData, loading, error, refetch: fetchPortfolioData };
};

export default useGetPortfolioData;

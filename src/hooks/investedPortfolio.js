import { useState, useEffect } from 'react';
import { apiGetService } from '../helpers/services'; 

const InvestedPorfolio = () => {
  const [investmentData, setInvestmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      const response = await apiGetService('/api/v1/order/allotement/order/units');
      console.log('Portfolio INvested Response:', response?.data);
      setInvestmentData(response?.data || []);
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

  return { investmentData, loading, error, refetch: fetchPortfolioData };
};

export default InvestedPorfolio;

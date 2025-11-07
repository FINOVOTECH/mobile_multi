export const formatIndianRupee = (value) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(0)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(0)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)} K`;
  return `₹${value.toFixed(0)}`;
};

export const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const first = parseInt(parts[0]);
      const second = parseInt(parts[1]);
      const third = parseInt(parts[2]);
      
      if (third > 1000) {
        return first > 12 
          ? new Date(third, second - 1, first)
          : new Date(third, second - 1, first);
      }
    }
  }
  
  return new Date(dateStr);
};
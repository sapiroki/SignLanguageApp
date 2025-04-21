import { signsData } from '../data/signs';

export const getTotalSignCount = () => {
  return signsData.length;
};

export const getCategorySignCount = (categoryId) => {
  return signsData.filter(sign => sign.categoryId === categoryId).length;
};

export const getAllCategoryCounts = () => {
  const counts = {};
  
  signsData.forEach(sign => {
    if (!counts[sign.categoryId]) {
      counts[sign.categoryId] = 0;
    }
    counts[sign.categoryId]++;
  });
  
  return counts;
};

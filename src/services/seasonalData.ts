export interface ProduceItem {
  name: string;
  icon: string;
}

export const seasonalProduceData: { [month: string]: ProduceItem[] } = {
  January: [
    { name: 'Mango', icon: '🥭' },
    { name: 'Avocado', icon: '🥑' },
    { name: 'Pineapple', icon: '🍍' },
    { name: 'Yam', icon: '🍠' },
  ],
  February: [
    { name: 'Mango', icon: '🥭' },
    { name: 'Avocado', icon: '🥑' },
    { name: 'Pineapple', icon: '🍍' },
    { name: 'Watermelon', icon: '🍉' },
  ],
  March: [
    { name: 'Papaya', icon: '🥭' },
    { name: 'Banana', icon: '🍌' },
    { name: 'Guava', icon: '🍈' },
    { name: 'Bitterleaf', icon: '🍃' },
  ],
  April: [
    { name: 'Papaya', icon: '🥭' },
    { name: 'Banana', icon: '🍌' },
    { name: 'Guava', icon: '🍈' },
    { name: 'Corn', icon: '🌽' },
  ],
  May: [
    { name: 'Plum', icon: '🍑' },
    { name: 'Orange', icon: '🍊' },
    { name: 'Cassava', icon: '🥔' },
    { name: 'Greens', icon: '🥬' },
  ],
  June: [
    { name: 'Plum', icon: '🍑' },
    { name: 'Orange', icon: '🍊' },
    { name: 'Cassava', icon: '🥔' },
    { name: 'Beans', icon: '🫘' },
  ],
  July: [
    { name: 'Pear', icon: '🍐' },
    { name: 'Soursop', icon: '🍈' },
    { name: 'Okra', icon: '🥬' },
    { name: 'Groundnut', icon: '🥜' },
  ],
  August: [
    { name: 'Pear', icon: '🍐' },
    { name: 'Soursop', icon: '🍈' },
    { name: 'Okra', icon: '🥬' },
    { name: 'Groundnut', icon: '🥜' },
  ],
  September: [
    { name: 'Tomato', icon: '🍅' },
    { name: 'Pepper', icon: '🌶️' },
    { name: 'Egusi', icon: '🍈' },
    { name: 'Cabbage', icon: '🥬' },
  ],
  October: [
    { name: 'Tomato', icon: '🍅' },
    { name: 'Pepper', icon: '🌶️' },
    { name: 'Sweet Potato', icon: '🍠' },
    { name: 'Cocoyam', icon: '🥔' },
  ],
  November: [
    { name: 'Pineapple', icon: '🍍' },
    { name: 'Watermelon', icon: '🍉' },
    { name: 'Carrot', icon: '🥕' },
    { name: 'Ginger', icon: '🫚' },
  ],
  December: [
    { name: 'Pineapple', icon: '🍍' },
    { name: 'Watermelon', icon: '🍉' },
    { name: 'Yam', icon: '🍠' },
    { name: 'Garlic', icon: '🧄' },
  ],
};

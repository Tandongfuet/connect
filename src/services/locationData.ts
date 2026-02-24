export interface CityData {
  name: string;
  region: 'Adamawa' | 'Centre' | 'East' | 'Far North' | 'Littoral' | 'North' | 'North-West' | 'South' | 'South-West' | 'West';
  coords: { x: number; y: number };
  lat: number;
  lon: number;
}

export const cities: CityData[] = [
  // Adamawa
  { name: 'Ngaoundéré', region: 'Adamawa', coords: { x: 340, y: 280 }, lat: 7.323, lon: 13.583 },
  { name: 'Tibati', region: 'Adamawa', coords: { x: 290, y: 320 }, lat: 6.467, lon: 12.633 },
  // Centre
  { name: 'Yaoundé', region: 'Centre', coords: { x: 295, y: 480 }, lat: 3.8667, lon: 11.5167 },
  { name: 'Mbalmayo', region: 'Centre', coords: { x: 300, y: 505 }, lat: 3.5167, lon: 11.5 },
  // East
  { name: 'Bertoua', region: 'East', coords: { x: 380, y: 440 }, lat: 4.5833, lon: 13.6833 },
  { name: 'Batouri', region: 'East', coords: { x: 420, y: 450 }, lat: 4.4333, lon: 14.3667 },
  // Far North
  { name: 'Maroua', region: 'Far North', coords: { x: 380, y: 135 }, lat: 10.592, lon: 14.326 },
  { name: 'Kousséri', region: 'Far North', coords: { x: 420, y: 80 }, lat: 12.0833, lon: 15.0333 },
  // Littoral
  { name: 'Douala', region: 'Littoral', coords: { x: 215, y: 465 }, lat: 4.05, lon: 9.7 },
  { name: 'Edéa', region: 'Littoral', coords: { x: 240, y: 490 }, lat: 3.8, lon: 10.1333 },
  // North
  { name: 'Garoua', region: 'North', coords: { x: 340, y: 190 }, lat: 9.3, lon: 13.4 },
  { name: 'Guider', region: 'North', coords: { x: 360, y: 165 }, lat: 9.9333, lon: 13.9333 },
  // North-West
  { name: 'Bamenda', region: 'North-West', coords: { x: 235, y: 370 }, lat: 5.9667, lon: 10.15 },
  { name: 'Kumbo', region: 'North-West', coords: { x: 265, y: 360 }, lat: 6.2167, lon: 10.6833 },
  // South
  { name: 'Ebolowa', region: 'South', coords: { x: 290, y: 540 }, lat: 2.9167, lon: 11.15 },
  { name: 'Kribi', region: 'South', coords: { x: 235, y: 545 }, lat: 2.9333, lon: 9.9167 },
  // South-West
  { name: 'Buea', region: 'South-West', coords: { x: 190, y: 460 }, lat: 4.1667, lon: 9.2333 },
  { name: 'Limbe', region: 'South-West', coords: { x: 180, y: 475 }, lat: 4.0167, lon: 9.2167 },
  // West
  { name: 'Bafoussam', region: 'West', coords: { x: 250, y: 410 }, lat: 5.4667, lon: 10.4167 },
  { name: 'Dschang', region: 'West', coords: { x: 230, y: 425 }, lat: 5.45, lon: 10.05 },
];

export const regions = [
  'All Regions', 
  ...[...new Set(cities.map(c => c.region))].sort()
];

export const getCityData = (cityName?: string) => cities.find(c => c.name === cityName);
export const getCitiesByRegion = (regionName: string) => cities.filter(c => c.region === regionName).map(c => c.name);

export const getRegionFromCity = (cityName?: string): string | undefined => {
    if (!cityName) return undefined;
    const cityData = cities.find(c => c.name === cityName);
    return cityData?.region;
};
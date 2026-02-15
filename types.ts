
export interface EnergyDataPoint {
  time: string;
  // House Mode
  houseBattery: number;
  housePV: number;
  housePVTemp: number;
  houseGrid: number;
  houseCost: number;
  // Factory Mode
  factoryBattery: number;
  factoryPV: number;
  factoryPVTemp: number;
  factoryGrid: number;
  factoryCost: number;
  // Wind Energy
  windEnergy: number;
  windSpeed: number;
  // Weather
  temperature: number;
  weather: 'Sunny' | 'Cloudy' | 'Rainy' | 'Windy';
}

export interface DashboardState {
  history: EnergyDataPoint[];
  current: EnergyDataPoint | null;
  loading: boolean;
  aiInsights: string;
  lastUpdate: Date;
}

// 📁 lib/vehicleModels/vehicleSubTypes.ts

export interface VehicleSubType {
  label: string;
  value: string;
  vehicleType:
    | 'bike'
    | 'motorbike'
    | 'car'
    | 'van'
    | 'bus'
    | 'other';
}

export const VEHICLE_SUB_TYPES: VehicleSubType[] = [
  // 🚲 Bicycle
  { label: 'Road Bike', value: 'roadbike', vehicleType: 'bike' },
  { label: 'Mountain Bike', value: 'mountainbike', vehicleType: 'bike' },
  { label: 'City Bike', value: 'citybike', vehicleType: 'bike' },
  { label: 'Folding Bike', value: 'foldingbike', vehicleType: 'bike' },
  { label: 'Fat Bike', value: 'fatbike', vehicleType: 'bike' },
  { label: 'Tandem Bike', value: 'tandem', vehicleType: 'bike' },
  { label: 'Electric Bike (eBike)', value: 'ebike', vehicleType: 'bike' },
  { label: 'Cargo Bike', value: 'cargobike', vehicleType: 'bike' },

  // 🛵 Motorbike
  { label: 'Scooter', value: 'scooter', vehicleType: 'motorbike' },
  { label: 'Cub / Underbone', value: 'cub', vehicleType: 'motorbike' },
  { label: 'Manual Motorbike', value: 'manualbike', vehicleType: 'motorbike' },
  { label: '3-Wheel Motorbike', value: 'tricycle', vehicleType: 'motorbike' },
  { label: 'Electric Motorbike', value: 'emotorbike', vehicleType: 'motorbike' },
  { label: 'Electric Scooter', value: 'escooter', vehicleType: 'motorbike' },

  // 🚗 Car
  { label: 'Hatchback', value: 'hatchback', vehicleType: 'car' },
  { label: 'Sedan', value: 'sedan', vehicleType: 'car' },
  { label: 'SUV', value: 'suv', vehicleType: 'car' },
  { label: 'Crossover', value: 'crossover', vehicleType: 'car' },
  { label: 'Pickup Truck', value: 'pickup', vehicleType: 'car' },
  { label: 'Electric Car', value: 'electriccar', vehicleType: 'car' },

  // 🚐 Van / Limo
  { label: 'Mini Van', value: 'minivan', vehicleType: 'van' },
  { label: 'Van', value: 'van', vehicleType: 'van' },
  { label: 'Limousine', value: 'limousine', vehicleType: 'van' },

  // 🚌 Bus
  { label: 'Minibus', value: 'minibus', vehicleType: 'bus' },
  { label: 'Coach', value: 'coach', vehicleType: 'bus' },
  { label: 'Sleeper Bus', value: 'sleeperbus', vehicleType: 'bus' },

  // 🚜 Other
  { label: 'ATV / Quad Bike', value: 'atv', vehicleType: 'other' },
  { label: 'Golf Cart', value: 'golfcart', vehicleType: 'other' },
  { label: 'Truck / Lorry', value: 'truck', vehicleType: 'other' },
  { label: 'Trailer', value: 'trailer', vehicleType: 'other' },
  { label: 'Other', value: 'other', vehicleType: 'other' },
];

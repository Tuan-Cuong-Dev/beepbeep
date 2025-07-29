export type TechnicianPartnerType = 'mobile' | 'shop'; // 👈 mới

export interface ServiceFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multi-select' | 'number' | 'checkbox';
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export const serviceFieldConfig: {
  [category: string]: {
    [serviceType: string]: ServiceFieldConfig[] | {
      mobile?: ServiceFieldConfig[];
      shop?: ServiceFieldConfig[];
    };
  };
} = {
  repair: {
    repair_basic: {
      mobile: [
        { name: 'location', label: 'fields.location.label', placeholder: 'fields.location.placeholder', type: 'text', required: true },
        { name: 'specialties', label: 'fields.specialties.label', placeholder: 'fields.specialties.placeholder', type: 'textarea' },
        { name: 'workingHours', label: 'fields.workingHours.label', placeholder: 'fields.workingHours.placeholder', type: 'text' },
      ],
      shop: [
        { name: 'storeLocation', label: 'fields.storeLocation.label', placeholder: 'fields.storeLocation.placeholder', type: 'text', required: true },
        { name: 'equipment', label: 'fields.equipment.label', placeholder: 'fields.equipment.placeholder', type: 'textarea' },
        { name: 'workingHours', label: 'fields.workingHours.label', placeholder: 'fields.workingHours.placeholder', type: 'text' },
      ],
    },
    battery_check: [
      { name: 'location', label: 'fields.location.label', placeholder: 'fields.location.placeholder', type: 'text', required: true },
      { name: 'equipment', label: 'fields.equipment.label', placeholder: 'fields.equipment.placeholder', type: 'text' },
      { name: 'vehicleTypes', label: 'fields.vehicleTypes.label', type: 'multi-select', options: ['options.vehicleType.motorbike', 'options.vehicleType.car'] },
    ],
  },

  rental: {
    rental_self_drive: [
      { name: 'location', label: 'fields.pickupLocation.label', placeholder: 'fields.pickupLocation.placeholder', type: 'text', required: true },
      { name: 'vehicleTypes', label: 'fields.vehicleTypes.label', type: 'multi-select', options: ['options.vehicleType.motorbike', 'options.vehicleType.car', 'options.vehicleType.van'] },
      { name: 'rentalTerms', label: 'fields.rentalTerms.label', placeholder: 'fields.rentalTerms.placeholder', type: 'textarea' },
    ],
    rental_with_driver: [
      { name: 'location', label: 'fields.pickupLocation.label', placeholder: 'fields.pickupLocation.placeholder', type: 'text', required: true },
      { name: 'driverExperience', label: 'fields.driverExperience.label', placeholder: 'fields.driverExperience.placeholder', type: 'text' },
      { name: 'vehicleTypes', label: 'fields.vehicleTypes.label', type: 'multi-select', options: ['options.vehicleType.car', 'options.vehicleType.van', 'options.vehicleType.bus'] },
    ],
    tour_rental: [
      { name: 'languages', label: 'fields.languages.label', type: 'multi-select', required: true, options: ['options.language.en', 'options.language.vi', 'options.language.ko', 'options.language.ja'] },
      { name: 'region', label: 'fields.region.label', placeholder: 'fields.region.placeholder', type: 'text', required: true },
      { name: 'duration', label: 'fields.duration.label', placeholder: 'fields.duration.placeholder', type: 'text' },
      { name: 'price', label: 'fields.price.label', type: 'number' },
    ],
  },

  battery: {
    battery_swap: [
      { name: 'location', label: 'fields.swapLocation.label', placeholder: 'fields.swapLocation.placeholder', type: 'text', required: true },
      { name: 'supportedModels', label: 'fields.supportedModels.label', placeholder: 'fields.supportedModels.placeholder', type: 'textarea' },
      { name: 'availableBatteries', label: 'fields.availableBatteries.label', type: 'number' },
    ],
    battery_delivery: [
      { name: 'deliveryArea', label: 'fields.deliveryArea.label', placeholder: 'fields.deliveryArea.placeholder', type: 'text', required: true },
      { name: 'deliveryTime', label: 'fields.deliveryTime.label', placeholder: 'fields.deliveryTime.placeholder', type: 'text' },
      { name: 'vehicleTypes', label: 'fields.vehicleTypes.label', type: 'multi-select', options: ['options.vehicleType.motorbike', 'options.vehicleType.car'] },
    ],
  },

  transport: {
    vehicle_rescue: [
      { name: 'location', label: 'fields.rescueArea.label', placeholder: 'fields.rescueArea.placeholder', type: 'text', required: true },
      { name: 'maxWeight', label: 'fields.maxWeight.label', type: 'number' },
      { name: 'workingHours', label: 'fields.workingHours.label', placeholder: 'fields.workingHours.placeholder', type: 'text' },
    ],
    intercity_transport: [
      { name: 'routes', label: 'fields.routes.label', placeholder: 'fields.routes.placeholder', type: 'textarea' },
      { name: 'vehicleTypes', label: 'fields.vehicleTypes.label', type: 'multi-select', options: ['options.vehicleType.car', 'options.vehicleType.van', 'options.vehicleType.bus'] },
      { name: 'pricePerKm', label: 'fields.pricePerKm.label', type: 'number' },
    ],
  },

  care: {
    vehicle_cleaning: [
      { name: 'location', label: 'fields.location.label', placeholder: 'fields.location.placeholder', type: 'text' },
      { name: 'cleaningPackages', label: 'fields.cleaningPackages.label', placeholder: 'fields.cleaningPackages.placeholder', type: 'textarea' },
      { name: 'priceRange', label: 'fields.priceRange.label', placeholder: 'fields.priceRange.placeholder', type: 'text' },
    ],
    accessory_sale: [
      { name: 'accessoryTypes', label: 'fields.accessoryTypes.label', placeholder: 'fields.accessoryTypes.placeholder', type: 'textarea' },
      { name: 'deliveryAvailable', label: 'fields.deliveryAvailable.label', placeholder: 'fields.deliveryAvailable.placeholder', type: 'checkbox' },
      { name: 'storeLocation', label: 'fields.storeLocation.label', placeholder: 'fields.storeLocation.placeholder', type: 'text' },
    ],
  },

  legal: {
    insurance_sale: [
      { name: 'insuranceTypes', label: 'fields.insuranceTypes.label', type: 'multi-select', options: ['options.insuranceType.accident', 'options.insuranceType.liability', 'options.insuranceType.theft', 'options.insuranceType.comprehensive'] },
      { name: 'supportedVehicles', label: 'fields.supportedVehicles.label', type: 'multi-select', options: ['options.vehicleType.motorbike', 'options.vehicleType.car', 'options.vehicleType.van'] },
      { name: 'policyTerms', label: 'fields.policyTerms.label', placeholder: 'fields.policyTerms.placeholder', type: 'textarea' },
    ],
    registration_assist: [
      { name: 'location', label: 'fields.registrationArea.label', placeholder: 'fields.registrationArea.placeholder', type: 'text', required: true },
      { name: 'supportedVehicles', label: 'fields.supportedVehicles.label', type: 'multi-select', options: ['options.vehicleType.motorbike', 'options.vehicleType.car'] },
      { name: 'processingTime', label: 'fields.processingTime.label', placeholder: 'fields.processingTime.placeholder', type: 'text' },
    ],
  },
};

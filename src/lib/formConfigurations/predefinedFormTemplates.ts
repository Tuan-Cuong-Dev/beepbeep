// file: formConfigurations/predefinedFormTemplates.ts

import { PredefinedSection } from './formConfigurationTypes';

export const predefinedFormTemplates: PredefinedSection[] = [
  {
    id: 'customer_information',
    title: '1. CUSTOMER INFORMATION',
    fields: [
      { key: 'idImage', label: 'Upload ID', type: 'upload' },
      { key: 'fullName', label: 'Full Name', type: 'text' },
      { key: 'channel', label: 'Channel', type: 'select', options: ['Facebook', 'Instagram', 'KakaoTalk', 'Phone number', 'WeChat', 'WhatsApp', 'Zalo'] },
      { key: 'phone', label: 'Phone Number', type: 'text' },
      { key: 'idNumber', label: 'ID Number', type: 'text' },
      { key: 'address', label: 'Address', type: 'text' },
    ],
  },
  {
    id: 'vehicle_information',
    title: '2. VEHICLE INFORMATION',
    fields: [
      { key: 'vehicleSearch', label: 'Enter part of Vehicle ID', type: 'text' },
      { key: 'vehicleModel', label: 'Vehicle Model', type: 'text' },
      { key: 'vehicleColor', label: 'Vehicle Color', type: 'text' },
      { key: 'vin', label: 'VIN', type: 'text' },
      { key: 'licensePlate', label: 'License Plate (optional)', type: 'text' },
    ],
  },
  {
    id: 'battery_information',
    title: '3. BATTERY INFORMATION',
    fields: [
      { key: 'batteryCode1', label: 'Battery Code 1', type: 'text' },
      { key: 'batteryCode2', label: 'Battery Code 2', type: 'text' },
      { key: 'batteryCode3', label: 'Battery Code 3', type: 'text' },
      { key: 'batteryCode4', label: 'Battery Code 4', type: 'text' },
    ],
  },
  {
    id: 'rental_period',
    title: '4. RENTAL PERIOD',
    fields: [
      { key: 'rentalStartDate', label: 'Rental Start Date', type: 'date' },
      { key: 'rentalStartHour', label: 'Rental Start Hour', type: 'time' },
      { key: 'rentalDays', label: 'Rental Days', type: 'number' },
      { key: 'rentalEndDate', label: 'Rental End Date', type: 'date' },
    ],
  },
  {
    id: 'pricing_deposit',
    title: '5. PRICING & DEPOSIT',
    fields: [
      { key: 'package', label: 'Rental Package', type: 'select' },
      { key: 'basePrice', label: 'Base Price (VND)', type: 'number' },
      { key: 'batteryFee', label: 'Battery Rental Fee (VND)', type: 'number' }, // 👈 bổ sung rõ tên
      { key: 'totalAmount', label: 'Total Amount (VND)', type: 'number' },
      { key: 'deposit', label: 'Deposit (VND)', type: 'number' },
      { key: 'remainingBalance', label: 'Remaining Balance (VND)', type: 'number' },
    ],
  },
  {
    id: 'delivery_method',
    title: '6. DELIVERY METHOD',
    fields: [
      { key: 'deliveryMethod', label: 'Delivery Method', type: 'select', options: ['Pickup at Shop', 'Deliver to Address'] },
      { key: 'deliveryAddress', label: 'Delivery Address (if delivered)', type: 'text' },
    ],
  },
  {
    id: 'accessories_info',
    title: '7. ACCESSORIES INFO',
    fields: [
      { key: 'helmet', label: 'Helmet Included', type: 'checkbox' },
      { key: 'charger', label: 'Charger Included', type: 'checkbox' },
      { key: 'phoneHolder', label: 'Phone Holder', type: 'checkbox' },
      { key: 'rearRack', label: 'Rear Carrier Rack', type: 'checkbox' },
      { key: 'raincoat', label: 'Raincoat Included', type: 'checkbox' },
    ],
  },
  {
    id: 'notes',
    title: '8. NOTES',
    fields: [
      { key: 'note', label: 'Additional Notes', type: 'textarea' },
    ],
  },
];

// ❌ Không cần 'use client' vì chỉ export constants

import { FormConfiguration } from './formConfigurationTypes';

export const DEFAULT_FORM_CONFIG: FormConfiguration = {
  companyId: '',
  createdBy: '',
  sections: [
    {
      id: 'customer_information',
      title: '1. CUSTOMER INFORMATION',
      fields: [
        { key: 'idImage', label: 'Upload ID', type: 'upload', required: false, visible: true },
        { key: 'fullName', label: 'Full Name', type: 'text', required: true, visible: true },
        { key: 'channel', label: 'Channel', type: 'select', required: true, visible: true, options: ['Facebook', 'Instagram', 'KakaoTalk', 'Phone', 'WeChat', 'WhatsApp', 'Zalo'] },
        { key: 'phone', label: 'Add or Search by Phone Number', type: 'text', required: true, visible: true },
        { key: 'idNumber', label: 'ID Number', type: 'text', required: true, visible: true },
        { key: 'address', label: 'Address', type: 'text', required: false, visible: true },
      ],
    },
    {
      id: 'vehicle_information',
      title: '2. VEHICLE INFORMATION',
      fields: [
        { key: 'vehicleSearch', label: 'Enter part of Vehicle ID', type: 'text', required: false, visible: true },
        { key: 'vehicleModel', label: 'Vehicle Model', type: 'text', required: true, visible: true },
        { key: 'vehicleColor', label: 'Vehicle Color', type: 'text', required: false, visible: true },
        { key: 'vin', label: 'VIN', type: 'text', required: false, visible: true },
        { key: 'licensePlate', label: 'License Plate (optional)', type: 'text', required: false, visible: true },
      ],
    },
    {
      id: 'battery_information',
      title: '3. BATTERY INFORMATION',
      fields: [
        { key: 'batteryCode1', label: 'Battery Code 1', type: 'text', required: false, visible: true },
        { key: 'batteryCode2', label: 'Battery Code 2', type: 'text', required: false, visible: true },
        { key: 'batteryCode3', label: 'Battery Code 3', type: 'text', required: false, visible: true },
        { key: 'batteryCode4', label: 'Battery Code 4', type: 'text', required: false, visible: true },
      ],
    },
    {
      id: 'rental_schedule',
      title: '4. RENTAL SCHEDULE',
      fields: [
        { key: 'rentalStartDate', label: 'Rental Start Date', type: 'date', required: true, visible: true },
        { key: 'rentalStartHour', label: 'Rental Start Hour', type: 'time', required: true, visible: true },
        { key: 'rentalDays', label: 'Number of Rental Days or Months', type: 'number', required: true, visible: true },
        { key: 'rentalEndDate', label: 'Rental End Date', type: 'date', required: true, visible: true }, // 👈 ✅ Thêm trường này!
      ],
    },
    {
      id: 'pricing_deposit',
      title: '5. PRICING & DEPOSIT',
      fields: [
        { key: 'package', label: 'Rental Package', type: 'select', required: true, visible: true },
        { key: 'basePrice', label: 'Base Price (VND)', type: 'number', required: false, visible: true },
        { key: 'batteryFee', label: 'Battery Rental or Insurance Fee (VND)', type: 'number', required: false, visible: true }, // 👈 thêm phí thuê pin
        { key: 'totalAmount', label: 'Total Amount (VND)', type: 'number', required: false, visible: true },
        { key: 'deposit', label: 'Deposit (VND)', type: 'number', required: false, visible: true },
        { key: 'remainingBalance', label: 'Remaining Balance (VND)', type: 'number', required: false, visible: true },
      ],
    },
    {
      id: 'rental_method',
      title: '6. RENTAL METHOD',
      fields: [
        { key: 'rentalMethod', label: 'Rental Method', type: 'select', required: true, visible: true, options: ['Pickup at Store', 'Deliver to Address'] },
        { 
          key: 'deliveryAddress', 
          label: 'Delivery Address (if delivered)', 
          type: 'textarea', 
          required: false, 
          visible: true,
          conditional: { dependsOn: 'rentalMethod', valueEquals: 'Deliver to Address' },
        },
      ],
    },
    {
      id: 'accessories_info',
      title: '7. ACCESSORIES INFO',
      fields: [
        { key: 'helmet', label: 'Helmet Included', type: 'checkbox', required: false, visible: true },
        { key: 'charger', label: 'Charger Included', type: 'checkbox', required: false, visible: true },
        { key: 'phoneHolder', label: 'Phone Holder', type: 'checkbox', required: false, visible: true },
        { key: 'rearRack', label: 'Rear Carrier Rack', type: 'checkbox', required: false, visible: true },
        { key: 'raincoat', label: 'Raincoat Included', type: 'checkbox', required: false, visible: true },
      ],
    },
    {
      id: 'notes',
      title: '8. NOTES',
      fields: [
        { key: 'note', label: 'Additional Notes', type: 'textarea', required: false, visible: true },
      ],
    },
  ],
};

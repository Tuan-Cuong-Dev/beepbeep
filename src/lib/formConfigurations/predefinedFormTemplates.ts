'use client';

import { PredefinedSection } from './formConfigurationTypes';
import { useTranslation } from 'react-i18next';

export function usePredefinedFormTemplates(): PredefinedSection[] {
  const { t } = useTranslation('common');

  return [
    {
      id: 'customer_information',
      title: t('predefined_form_templates.1.customer_information'),
      fields: [
        { key: 'idImage', label: t('predefined_form_templates.upload_id'), type: 'upload' },
        { key: 'fullName', label: t('predefined_form_templates.full_name'), type: 'text' },
        {
          key: 'channel',
          label: t('predefined_form_templates.channel'),
          type: 'select',
          options: [
            'Facebook',
            'Instagram',
            'KakaoTalk',
            'Phone number',
            'WeChat',
            'WhatsApp',
            'Zalo',
          ],
        },
        { key: 'phone', label: t('predefined_form_templates.add_or_search_phone'), type: 'text' },
        { key: 'idNumber', label: t('predefined_form_templates.id_number'), type: 'text' },
        { key: 'address', label: t('predefined_form_templates.address'), type: 'text' },
      ],
    },
    {
      id: 'vehicle_information',
      title: t('predefined_form_templates.2.vehicle_information'),
      fields: [
        { key: 'vehicleSearch', label: t('predefined_form_templates.enter_vehicle_id'), type: 'text' },
        { key: 'vehicleModel', label: t('predefined_form_templates.vehicle_model'), type: 'text' },
        { key: 'vehicleColor', label: t('predefined_form_templates.vehicle_color'), type: 'text' },
        { key: 'vin', label: t('predefined_form_templates.vin'), type: 'text' },
        { key: 'licensePlate', label: t('predefined_form_templates.license_plate'), type: 'text' },
      ],
    },
    {
      id: 'battery_information',
      title: t('predefined_form_templates.3.battery_information'),
      fields: [
        { key: 'batteryCode1', label: t('predefined_form_templates.battery_code_1'), type: 'text' },
        { key: 'batteryCode2', label: t('predefined_form_templates.battery_code_2'), type: 'text' },
        { key: 'batteryCode3', label: t('predefined_form_templates.battery_code_3'), type: 'text' },
        { key: 'batteryCode4', label: t('predefined_form_templates.battery_code_4'), type: 'text' },
      ],
    },
    {
      id: 'rental_period',
      title: t('predefined_form_templates.4.rental_period'),
      fields: [
        { key: 'rentalStartDate', label: t('predefined_form_templates.rental_start_date'), type: 'date' },
        { key: 'rentalStartHour', label: t('predefined_form_templates.rental_start_hour'), type: 'time' },
        { key: 'rentalDays', label: t('predefined_form_templates.rental_days'), type: 'number' },
        { key: 'rentalEndDate', label: t('predefined_form_templates.rental_end_date'), type: 'date' },
      ],
    },
    {
      id: 'pricing_deposit',
      title: t('predefined_form_templates.5.pricing_deposit'),
      fields: [
        { key: 'package', label: t('predefined_form_templates.rental_package'), type: 'select' },
        { key: 'basePrice', label: t('predefined_form_templates.base_price'), type: 'number' },
        { key: 'batteryFee', label: t('predefined_form_templates.battery_fee'), type: 'number' },
        { key: 'totalAmount', label: t('predefined_form_templates.total_amount'), type: 'number' },
        { key: 'deposit', label: t('predefined_form_templates.deposit'), type: 'number' },
        { key: 'remainingBalance', label: t('predefined_form_templates.remaining_balance'), type: 'number' },
      ],
    },
    {
      id: 'delivery_method',
      title: t('predefined_form_templates.6.delivery_method'),
      fields: [
        {
          key: 'deliveryMethod',
          label: t('predefined_form_templates.delivery_method'),
          type: 'select',
          options: ['Pickup at Shop', 'Deliver to Address'],
        },
        {
          key: 'deliveryAddress',
          label: t('predefined_form_templates.delivery_address'),
          type: 'text',
        },
      ],
    },
    {
      id: 'accessories_info',
      title: t('predefined_form_templates.7.accessories_info'),
      fields: [
        { key: 'helmet', label: t('predefined_form_templates.helmet'), type: 'checkbox' },
        { key: 'charger', label: t('predefined_form_templates.charger'), type: 'checkbox' },
        { key: 'phoneHolder', label: t('predefined_form_templates.phone_holder'), type: 'checkbox' },
        { key: 'rearRack', label: t('predefined_form_templates.rear_rack'), type: 'checkbox' },
        { key: 'raincoat', label: t('predefined_form_templates.raincoat'), type: 'checkbox' },
      ],
    },
    {
      id: 'notes',
      title: t('predefined_form_templates.8.notes'),
      fields: [
        { key: 'note', label: t('predefined_form_templates.note'), type: 'textarea' },
      ],
    },
  ];
}

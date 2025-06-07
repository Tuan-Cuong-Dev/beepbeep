'use client';
// Form này hoạt động theo company, user và cấu hình động từ Company-Owner setup cho.
import { useEffect, useState } from 'react';
import { getFormConfigurationByCompanyId } from '@/src/lib/services/Configirations/formConfigurationService';
import { FormConfiguration } from '@/src/lib/formConfigurations/formConfigurationTypes';
import { useRentalForm } from '../../hooks/useRentalForm';
import { DynamicRentalFieldRenderer } from './common/DynamicRentalFieldRenderer';
import { Button } from '@/src/components/ui/button';
import NotificationDialog, { NotificationType } from '@/src/components/ui/NotificationDialog';

interface Props {
  companyId: string;
  userId: string;
}

export default function DynamicRentalForm({ companyId, userId }: Props) {
  const [config, setConfig] = useState<FormConfiguration | null>(null);
  const [bikeSuggestions, setBikeSuggestions] = useState<any[]>([]);
  const [dialog, setDialog] = useState<{
    open: boolean;
    type: NotificationType;
    title: string;
    description?: string;
  }>({ open: false, type: 'info', title: '' });

  const {
    formData,
    handleChange,
    handleSubmit,
    packages,
    allBikes,
    loading,
  } = useRentalForm(companyId, userId);

  // Load form configuration
  useEffect(() => {
    const fetchConfig = async () => {
      const result = await getFormConfigurationByCompanyId(companyId);
      setConfig(result);
    };

    fetchConfig();
  }, [companyId]);

  // Suggest bikes when user types
  const populateVehicleSuggestions = (search: string) => {
    const suggestions = allBikes.filter(bike =>
      bike.vehicleID?.toLowerCase().includes(search.toLowerCase()) ||
      bike.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
      bike.modelName?.toLowerCase().includes(search.toLowerCase())
    );
    setBikeSuggestions(suggestions);
  };

  // When user selects bike from suggestions
  const handleSelectBike = (bike: any) => {
    handleChange('vehicleSearch', bike.vehicleID || '');
    handleChange('vehicleModel', bike.modelName || '');
    handleChange('vehicleColor', bike.color || '');
    handleChange('vin', bike.vehicleID || '');
    handleChange('licensePlate', bike.plateNumber || '');
    handleChange('stationId', bike.stationId || '');
    setBikeSuggestions([]);
  };

  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    const result = await handleSubmit();

    if (result.status === 'success') {
      const booking = result.booking;
      setDialog({
        open: true,
        type: 'success',
        title: 'Booking Successful!',
        description: 'Your booking has been created successfully.',
      });
    } else if (result.status === 'validation_error') {
      setDialog({
        open: true,
        type: 'error',
        title: 'Missing Information',
        description: 'Please fill in the required rental information before submitting.',
      });
    } else {
      setDialog({
        open: true,
        type: 'error',
        title: 'Booking Failed',
        description: 'An error occurred while creating your booking. Please try again later.',
      });
    }
  };

  if (loading || !config) {
    return <div className="text-center py-10 text-gray-500">Loading form...</div>;
  }

  return (
    <div className="space-y-8">
      {config.sections.map((section) => {
        const visibleFields = section.fields.filter(field => field.visible);
        if (!visibleFields.length) return null;

        return (
          <div key={section.id} className="border rounded-lg p-4 bg-white">
            <h3 className="text-lg font-semibold mb-3">{section.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleFields.map((field) => (
                <DynamicRentalFieldRenderer
                  key={field.key}
                  field={field}
                  formData={formData}
                  handleChange={handleChange}
                  bikeSuggestions={bikeSuggestions}
                  populateVehicleSuggestions={populateVehicleSuggestions}
                  handleSelectBike={handleSelectBike}
                  companyId={companyId}
                />
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex flex-col sm:flex-row gap-4 mt-6 p-4">
        <Button onClick={handleConfirmBooking} className="flex-1">
          ✅ Confirm Booking
        </Button>
        <Button variant="outline" onClick={() => window.print()} className="flex-1">
          🖨️ Print Invoice
        </Button>
      </div>

      <NotificationDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        description={dialog.description}
        onClose={() => setDialog(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}

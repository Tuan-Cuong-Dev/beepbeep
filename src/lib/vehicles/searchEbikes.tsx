import { Ebike } from './ebikeTypes';

/**
 * Hàm tìm kiếm xe đạp điện theo nhiều tiêu chí
 * @param ebikes - danh sách ebike
 * @param searchTerm - từ khóa tìm kiếm
 * @returns danh sách ebike thỏa mãn
 */
export function searchEbikes(ebikes: Ebike[], searchTerm: string): Ebike[] {
    if (!searchTerm.trim()) return ebikes;
  
    const lowerSearch = searchTerm.toLowerCase();
  
    return ebikes.filter((ebike) =>
      ebike.serialNumber.toLowerCase().includes(lowerSearch) ||
      ebike.vehicleID.toLowerCase().includes(lowerSearch) ||
      ebike.plateNumber.toLowerCase().includes(lowerSearch) ||
      ebike.status.toLowerCase().includes(lowerSearch) ||
      ebike.currentLocation.toLowerCase().includes(lowerSearch) ||
      ebike.modelId.toLowerCase().includes(lowerSearch) ||
      ebike.color.toLowerCase().includes(lowerSearch)
    );
  }
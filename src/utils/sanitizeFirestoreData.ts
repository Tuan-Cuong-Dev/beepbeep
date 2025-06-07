// utils/sanitizeFirestoreData.ts

export function sanitizeFirestoreData(data: Record<string, any>): Record<string, any> {
    return cleanObject(data);
  }
  
  function cleanObject(obj: any): any {
    if (obj === null) return null;
  
    if (Array.isArray(obj)) {
      return obj
        .map((item) => cleanObject(item))
        .filter((item) => item !== undefined);
    }
  
    if (typeof obj === 'object') {
      const cleaned: Record<string, any> = {};
      Object.keys(obj).forEach((key) => {
        const value = obj[key];
  
        if (value === undefined) {
          // ❌ Bỏ qua undefined
          return;
        }
  
        if (typeof value === 'number' && isNaN(value)) {
          // ❌ Bỏ qua NaN
          return;
        }
  
        cleaned[key] = cleanObject(value);
      });
      return cleaned;
    }
  
    return obj;
  }
  
export function extractInfoFromRawText(text: string): {
  name: string;
  idNumber: string;
  address: string;
  sex: string;
  nationality: string;
  placeOfOrigin: string;
  placeOfResidence: string;
  dateOfBirth: string;
} {
  if (!text || typeof text !== 'string') {
    return {
      name: '',
      idNumber: '',
      address: '',
      sex: '',
      nationality: '',
      placeOfOrigin: '',
      placeOfResidence: '',
      dateOfBirth: '',
    };
  }

  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  let name = '', idNumber = '', dateOfBirth = '', sex = '', nationality = '', placeOfOrigin = '', placeOfResidence = '', address = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 🔍 ID Number (KHÔNG ĐỘNG VÀO – ĐANG ĐÚNG)
    if (/S[ốóô]?[\s\/:-]*No\.?[:\s]*\d{6,15}/i.test(line)) {
      const match = line.match(/\d{9,15}/);
      if (match) idNumber = match[0];
    }

    // 🔍 Name
    if (/Họ và tên|Full name/i.test(line)) {
      const idx = line.indexOf(':');
      if (idx !== -1) {
        const inlineName = line.substring(idx + 1).trim();
        if (inlineName.length > 3) name = inlineName;
      }
      if (!name && lines[i + 1]) {
        name = lines[i + 1].trim();
        if (lines[i + 2] && lines[i + 2].split(' ').length <= 3) {
          name += ' ' + lines[i + 2].trim();
        }
      }
    }

    // ✅ FIXED – Date of Birth: hỗ trợ nhiều định dạng OCR sai
    if (/Ngày sinh|Date of birth/i.test(line)) {
      const dobMatch = line.match(/\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}/);
      if (dobMatch) {
        dateOfBirth = dobMatch[0];
      } else {
        // Một số OCR bị lỗi format số → fallback tìm các số gần dòng đó
        const nextLine = lines[i + 1] || '';
        const fallbackMatch = nextLine.match(/\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}/);
        if (fallbackMatch) dateOfBirth = fallbackMatch[0];
      }
    }

    // ✅ FIXED – Sex & Nationality on same line
    if ((/Giới tính|Sex/i.test(line)) && (/Quốc tịch|Nationality/i.test(line))) {
      const sexMatch = line.match(/(?:Giới tính|Sex)\s*[:\-]?\s*([A-Za-zÀ-ỹ]+)/i);
      const nationMatch = line.match(/(?:Quốc tịch|Nationality)\s*[:\-]?\s*([A-Za-zÀ-ỹ\s]+)/i);

      if (sexMatch) {
        const rawSex = sexMatch[1].toLowerCase();
        if (['nam', 'nữ', 'male', 'female'].includes(rawSex)) {
          sex = capitalizeFirst(rawSex);
        }
      }

      if (nationMatch) {
        nationality = nationMatch[1].trim();
      }
    } else {
      // ✅ fallback – Sex riêng
      if (/Giới tính|Sex/i.test(line)) {
        const match = line.match(/(?:Giới tính|Sex)\s*[:\-]?\s*([A-Za-zÀ-ỹ]+)/i);
        if (match) {
          const raw = match[1].toLowerCase();
          if (['nam', 'nữ', 'male', 'female'].includes(raw)) {
            sex = capitalizeFirst(raw);
          }
        }
      }

      // FIXED – Nationality with fallback to next line
      if (/Quốc tịch|Nationality/i.test(line)) {
        let current = line.replace(/^I\s+/i, '').trim(); // remove 'I ' if any

        // Trường hợp dòng chỉ chứa từ khóa: "Nationality" hoặc "Quốc tịch"
        if (/^Nationality$|^Quốc tịch$/i.test(current)) {
          const nextLine = lines[i + 1] || '';
          nationality = nextLine.trim();
        } else {
          const match = current.match(/(?:Quốc tịch|Nationality)\s*[:\-]?\s*([A-Za-zÀ-ỹ\s]+)/i);
          if (match) {
            nationality = match[1].trim();
          }
        }
      }

    }



    // 🔍 Place of Origin
    if (/Quê quán|Place of origin/i.test(line)) {
      let originValue = '';
      const idx = line.indexOf(':');
      if (idx !== -1) originValue = line.substring(idx + 1).trim();

      i++;
      while (i < lines.length && !/^(Họ và tên|Full name|Ngày sinh|Date of birth|Giới tính|Sex|Quốc tịch|Nationality|Nơi thường trú|Place of residence|Số|No\.|Ngày cấp|Date of issue|Có giá trị đến|Date of expiry)/i.test(lines[i])) {
        originValue += ' ' + lines[i].trim();
        i++;
      }
      placeOfOrigin = originValue.replace(/,$/, '').trim();
      i--;
    }

    // 🔍 Place of Residence
    if (/Nơi thường trú|Place of residence/i.test(line)) {
      let residenceValue = '';
      const idx = line.indexOf(':');
      if (idx !== -1) residenceValue = line.substring(idx + 1).trim();

      i++;
      while (i < lines.length && !/^(Họ và tên|Full name|Ngày sinh|Date of birth|Giới tính|Sex|Quốc tịch|Nationality|Quê quán|Place of origin|Số|No\.|Ngày cấp|Date of issue|Có giá trị đến|Date of expiry)/i.test(lines[i])) {
        residenceValue += ' ' + lines[i].trim();
        i++;
      }
      placeOfResidence = residenceValue.replace(/,$/, '').trim();
      address = placeOfResidence;
      i--;
    }
  }

  console.log('[✅ Extracted Result]', {
    name,
    idNumber,
    address,
    sex,
    nationality,
    placeOfOrigin,
    placeOfResidence,
    dateOfBirth,
  });

  return {
    name: name || '',
    idNumber: idNumber || '',
    address: address || '',
    sex: sex || '',
    nationality: nationality || '',
    placeOfOrigin: placeOfOrigin || '',
    placeOfResidence: placeOfResidence || '',
    dateOfBirth: dateOfBirth || '',
  };
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

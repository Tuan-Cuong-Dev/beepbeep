//  in QRCode cho từng viên pin
import { Battery } from "@/src/lib/batteries/batteryTypes";

export const printSingleBatteryQR = (battery: Battery) => {
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    battery.batteryCode || battery.id
  )}`;

  const html = `
    <html>
      <head>
        <title>Battery QR Label</title>
        <style>
          @media print {
            @page { size: auto; margin: 0; }
            body { margin: 0; padding: 0; }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          .container {
            width: 100%;
            height: 100%;
            padding: 10mm;
            box-sizing: border-box;
          }
          .label {
            width: 60mm;
            height: 70mm;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 4mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            text-align: center;
            box-sizing: border-box;
          }
          .label img {
            width: 36mm;
            height: 36mm;
          }
          .info {
            margin-top: 2.5mm;
            font-size: 10pt;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="label">
            <img src="${qrImageUrl}" alt="QR Code" />
            <div class="info"><strong>Battery Code</strong></div>
            <div class="info">${battery.batteryCode}</div>
            <div class="info">ID: ${battery.id}</div>
          </div>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open("", "", "width=500,height=700");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      const images = printWindow.document.images;
      let loadedCount = 0;

      const checkAndPrint = () => {
        if (loadedCount === images.length) {
          printWindow.print();
          printWindow.close();
        }
      };

      if (images.length === 0) checkAndPrint();

      for (let img of images) {
        if (img.complete) {
          loadedCount++;
          checkAndPrint();
        } else {
          img.onload = img.onerror = () => {
            loadedCount++;
            checkAndPrint();
          };
        }
      }
    }, 300);
  }
};

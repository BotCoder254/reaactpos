import QRCode from 'qrcode';

export const generateQRCode = async (data) => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const generateQRCodeSVG = async (data) => {
  try {
    const qrCodeSvg = await QRCode.toString(data, {
      type: 'svg',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    return qrCodeSvg;
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw error;
  }
}; 
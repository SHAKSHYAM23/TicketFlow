import QRCode from 'qrcode'

interface QRResult {
  base64: string     
  bookingId: string  
}


const generateQR = async (bookingId: string): Promise<QRResult> => {

  const base64 = await QRCode.toDataURL(bookingId, {
    width: 300,          
    margin: 2,           
    color: {
      dark: '#000000',   
      light: '#FFFFFF'  
    },
    errorCorrectionLevel: 'H' 
                              
  })

  return { base64, bookingId }
}

export { generateQR }
export type { QRResult }
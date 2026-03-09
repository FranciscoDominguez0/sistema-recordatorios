export function buildReminderEmail({ clientName, serviceName, expirationDate }) {
   const subject = `Recordatorio: ${serviceName} esté próximo a vencer`;
 
   const html = `
     <div style="font-family: Arial, sans-serif; line-height: 1.5;">
       <h2>Hola ${clientName},</h2>
       <p>
         Te recordamos que tu servicio <strong>${serviceName}</strong> esté próximo a vencer.
       </p>
       <p>
         <strong>Fecha de expiración:</strong> ${expirationDate}
       </p>
       <p>Saludos.</p>
     </div>
   `;
 
   return { subject, html };
}

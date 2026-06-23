import nodemailer from 'nodemailer';
import { getChannel, QUEUES } from '../config/rabbitmq.js';
import { generateQR } from '../services/qr.service.js';
import prisma from '../config/db.js';
import { emailSentCounter, emailFailCounter, dlqCounter } from '../config/metrics.js';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 30000;
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});
const verifyTransporter = async () => {
    try {
        await transporter.verify();
        console.log('✅ SMTP transporter ready');
    }
    catch (err) {
        console.error('❌ SMTP connection failed:', err);
    }
};
// ─── Build HTML Email — original design, QR via cid ───
const buildEmailHTML = (userName, eventTitle, eventDate, venue, seats, totalAmount, bookingId) => {
    const seatList = seats
        .map(s => `${s.rowLabel}${s.seatNumber}`)
        .join(', ');
    const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(totalAmount / 100);
    const partialBookingId = `****${bookingId.slice(-8)}`;
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Booking Confirmed</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 36px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 26px; letter-spacing: 0.5px; }
    .header p { color: #a0a0b0; margin: 10px 0 0; font-size: 14px; }
    .body { padding: 32px 30px; }
    .greeting { font-size: 18px; color: #1a1a2e; margin-bottom: 8px; }
    .subtext { color: #6c757d; margin: 0 0 24px; font-size: 14px; line-height: 1.6; }
    .detail-card { background: #f8f9fa; border-radius: 10px; padding: 4px 20px; margin-bottom: 24px; }
    .detail-row { display: table; width: 100%; padding: 14px 0; border-bottom: 1px solid #e9ecef; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { display: table-cell; color: #6c757d; font-size: 13px; vertical-align: middle; }
    .detail-value { display: table-cell; color: #1a1a2e; font-size: 14px; font-weight: 600; text-align: right; vertical-align: middle; }
    .qr-section { text-align: center; padding: 28px 20px; background: #f8f9fa; border-radius: 10px; margin-bottom: 24px; }
    .qr-section img { width: 200px; height: 200px; border: 6px solid #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); display: inline-block; }
    .qr-section p { color: #6c757d; font-size: 12px; margin: 14px 0 0; }
    .qr-section .qr-warn { color: #856404; font-weight: 600; margin-top: 4px; }
    .booking-ref { text-align: center; font-size: 12px; color: #9aa0a6; letter-spacing: 0.5px; margin-bottom: 24px; }
    .notice-box { background: #fff3cd; border-radius: 10px; padding: 16px 18px; }
    .notice-box p { color: #856404; font-size: 13px; margin: 0; line-height: 1.6; }
    .footer { background: #f8f9fa; padding: 22px 30px; text-align: center; }
    .footer p { color: #9aa0a6; font-size: 12px; margin: 0; }
    .highlight { color: #0F6E56; font-weight: 700; }
  </style>
</head>
<body>
  <div class="container">

    <div class="header">
      <h1>🎫 Ticketflow</h1>
      <p>Your booking has been confirmed</p>
    </div>

    <div class="body">
      <p class="greeting">Hi <strong>${userName}</strong>,</p>
      <p class="subtext">
        Your booking has been confirmed. Show the QR code below at the entrance.
      </p>

      <div class="detail-card">
        <div class="detail-row">
          <span class="detail-label">Event</span>
          <span class="detail-value">${eventTitle}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Venue</span>
          <span class="detail-value">${venue}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Seats</span>
          <span class="detail-value highlight">${seatList}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount Paid</span>
          <span class="detail-value highlight">${formattedAmount}</span>
        </div>
      </div>

      <div class="qr-section">
        <img src="cid:qrcode" alt="Your ticket QR code" />
        <p>Show this QR code at the entrance</p>
        <p class="qr-warn">Valid for one-time scan only</p>
      </div>

      <div class="booking-ref">
        BOOKING REFERENCE — ${partialBookingId}
      </div>

      <div class="notice-box">
        <p>
          <strong>Did not receive this email correctly?</strong><br>
          Log in to your account and visit My Bookings to resend or view your QR code.
        </p>
      </div>
    </div>

    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
      <p style="margin-top: 6px;">© 2026 Ticketflow</p>
    </div>

  </div>
</body>
</html>
  `;
};
const sendConfirmationEmail = async (payload) => {
    const booking = await prisma.booking.findUnique({
        where: { id: payload.bookingId },
        include: {
            user: { select: { name: true, email: true } },
            event: { select: { title: true, eventDate: true, venue: true } },
            seats: {
                include: {
                    seat: { select: { rowLabel: true, seatNumber: true } }
                }
            }
        }
    });
    if (!booking) {
        throw new Error(`Booking not found: ${payload.bookingId}`);
    }
    if (!booking.user.email) {
        throw new Error(`No email for user: ${booking.userId}`);
    }
    const qrResult = await generateQR(booking.id);
    const seats = booking.seats.map(bs => ({
        rowLabel: bs.seat.rowLabel,
        seatNumber: bs.seat.seatNumber
    }));
    const html = buildEmailHTML(booking.user.name, booking.event.title, booking.event.eventDate, booking.event.venue, seats, booking.totalAmount, booking.id);
    const qrBase64Raw = qrResult.base64.split('base64,')[1];
    await transporter.sendMail({
        from: process.env.EMAIL_FROM ?? 'Ticket Booking <noreply@ticketbooking.com>',
        to: booking.user.email,
        subject: `Booking Confirmed — ${booking.event.title}`,
        html,
        attachments: [
            {
                filename: 'ticket-qr.png',
                content: qrBase64Raw,
                encoding: 'base64',
                cid: 'qrcode'
            }
        ]
    });
    await prisma.booking.update({
        where: { id: booking.id },
        data: { emailSent: true }
    });
    emailSentCounter.inc();
    console.log(`✅ Email sent for bookingId: ${payload.bookingId}`);
};
export const startEmailWorker = async () => {
    await verifyTransporter();
    const channel = getChannel();
    await channel.assertQueue('notify_retry', {
        durable: true,
        arguments: {
            'x-message-ttl': RETRY_DELAY_MS,
            'x-dead-letter-exchange': '',
            'x-dead-letter-routing-key': QUEUES.NOTIFY
        }
    });
    await channel.assertQueue('notify_failed', {
        durable: true
    });
    channel.prefetch(1);
    console.log(' Email worker started — waiting for messages...');
    channel.consume(QUEUES.NOTIFY, async (msg) => {
        if (!msg)
            return;
        let payload;
        try {
            payload = JSON.parse(msg.content.toString());
        }
        catch {
            console.error('❌ Malformed message — moving to DLQ');
            channel.sendToQueue('notify_failed', msg.content, { persistent: true });
            channel.ack(msg);
            dlqCounter.inc();
            return;
        }
        const retryCount = payload.retryCount ?? 0;
        try {
            await sendConfirmationEmail(payload);
            channel.ack(msg);
        }
        catch (err) {
            console.error(`❌ Email failed for bookingId: ${payload.bookingId}`, `retry: ${retryCount}/${MAX_RETRIES}`, err);
            emailFailCounter.inc();
            if (retryCount >= MAX_RETRIES) {
                console.error(`💀 Moving to DLQ after ${MAX_RETRIES} failures — bookingId: ${payload.bookingId}`);
                channel.sendToQueue('notify_failed', Buffer.from(JSON.stringify({
                    ...payload,
                    failedAt: new Date().toISOString(),
                    finalError: err.message
                })), { persistent: true });
                channel.ack(msg);
                dlqCounter.inc();
            }
            else {
                channel.sendToQueue('notify_retry', Buffer.from(JSON.stringify({
                    ...payload,
                    retryCount: retryCount + 1
                })), { persistent: true });
                channel.ack(msg);
                console.log(`Retry ${retryCount + 1}/${MAX_RETRIES} queued for bookingId: ${payload.bookingId}`);
            }
        }
    });
};
//# sourceMappingURL=email.worker.js.map
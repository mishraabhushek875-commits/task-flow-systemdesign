import nodemailer from "nodemailer";

// Ethereal ek FAKE SMTP service hai testing ke liye — real email kisi ko nahi jata,
// ek preview link milta hai jahan email dekh sakte ho. Real project mein isi jagah
// Gmail/SendGrid ki details aayengi.
let transporterPromise = null;

const getTransporter = async () => {
  if (!transporterPromise) {
    transporterPromise = nodemailer.createTestAccount().then((testAccount) => {
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    });
  }
  return transporterPromise;
};

export const sendTaskEmail = async ({ to, subject, text }) => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: '"TaskFlow" <no-reply@taskflow.com>',
    to,
    subject,
    text,
  });

  // Ethereal ek preview URL deta hai — isko browser mein kholke actual email dekh sakte ho
  console.log("Email sent! Preview URL:", nodemailer.getTestMessageUrl(info));
};
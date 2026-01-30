/**
 * Message Configuration
 * 
 * All roasts, insults, and message templates are defined here.
 * No database needed - just edit this file to change messages.
 */

// ============================================================
// ROASTS - Random motivational/insulting messages
// ============================================================

export const ROASTS = [
  "Abe gadhe, DSA kar varna Swiggy pe delivery karega zindagi bhar! 🛵",
  "Oye nikamme! Netflix band kar, LeetCode khol! Nahi toh jobless marega! 💀",
  "Tere dost Google join kar rahe, tu abhi bhi Two Sum mein atka hai ullu! 😭",
  "DSA nahi aati? Koi baat nahi, Chai Ka Thela khol le nalayak! ☕",
  "Ek problem bhi solve nahi karta? Teri toh kismat hi kharab hai bhai! 🏫",
  "Array reverse karna nahi aata? Teri life reverse ho jayegi bekaar! 🔄",
  "Bro itna useless kaun hota hai? Thoda toh padhle kamina! 🙈",
  "Teri struggle story LinkedIn pe viral hogi... rejection ke saath! 😅",
  "Placement season mein tujhe dekhke HR log bhi hasenge! 🤣",
  "Recursion samajh nahi aata? Tu khud ek infinite loop hai bc! 🔁",
  "Aaj bhi kuch nahi kiya? Teri productivity toh COVID se bhi zyada khatarnak hai! 🦠",
  "Tere resume mein sirf WhatsApp forward karne ka experience hai kya? 📱",
  "DSA Dhurandhar banne aaya tha, DSA Bekaar ban gaya! 🤡",
];

export const INSULTS = [
  "You're not just behind, you're in a completely different race.",
  "Your LinkedIn says 'Open to Work' but your LeetCode says 'Never Worked'.",
  "Even ChatGPT can't help someone who doesn't try.",
  "Your future self will be very disappointed.",
  "The only thing consistent about you is your inconsistency.",
  "Your competition thanks you for not showing up.",
  "Dreams don't work unless you do.",
  "You're not lazy, you're just on energy-saving mode... permanently.",
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getRandomRoast(): string {
  return ROASTS[Math.floor(Math.random() * ROASTS.length)];
}

export function getRandomInsult(): string {
  return INSULTS[Math.floor(Math.random() * INSULTS.length)];
}

// ============================================================
// WHATSAPP TEMPLATE
// ============================================================

export function getWhatsAppMessage(userName: string, roast?: string, insult?: string): string {
  const r = roast || getRandomRoast();
  const i = insult || getRandomInsult();

  return `🔥 *Wake up, ${userName}!* 🔥

*REALITY:* ${r}
*TRUTH:* ${i}

Stop scrolling and start coding! 🚀

🎯 *Goal:* 2+ Medium problems
💻 *Solve:* https://leetcode.com/problemset/
🌐 *Track:* https://dsa-grinders.vercel.app/

*Competition is winning. GET TO WORK!* 💪
---
DSA Grinders 💀`;
}

// ============================================================
// EMAIL TEMPLATES
// ============================================================

const EMAIL_STYLE = `
  body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #e2e8f0; }
  .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; }
  .header { padding: 40px 20px; text-align: center; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border-bottom: 2px solid #ef4444; }
  .logo { width: 80px; height: 80px; margin-bottom: 16px; border-radius: 20px; }
  .title { margin: 0; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.025em; }
  .subtitle { margin: 4px 0 0 0; font-size: 14px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; }
  .content { padding: 40px; }
  .greeting { font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 24px; }
  .roast-card { background-color: #0f172a; border-left: 4px solid #ef4444; padding: 24px; border-radius: 8px; margin-bottom: 24px; }
  .roast-text { margin: 0; font-size: 18px; color: #fecaca; font-weight: 500; font-style: italic; line-height: 1.6; }
  .harsh-truth { font-size: 15px; color: #94a3b8; margin-bottom: 32px; line-height: 1.6; border-top: 1px solid #334155; pt: 16px; margin-top: 16px; }
  .instruction { font-size: 16px; color: #cbd5e1; margin-bottom: 24px; line-height: 1.6; }
  .btn-primary { display: block; background-color: #ef4444; color: #ffffff; padding: 18px 32px; font-size: 18px; font-weight: 700; text-decoration: none; border-radius: 12px; text-align: center; margin-bottom: 16px; transition: background-color 0.2s; }
  .btn-secondary { display: block; background-color: transparent; border: 2px solid #334155; color: #cbd5e1; padding: 14px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px; text-align: center; }
  .footer { padding: 32px; background-color: #0f172a; text-align: center; font-size: 12px; color: #64748b; }
  .footer-link { color: #94a3b8; text-decoration: underline; }
`;

export function getEmailHTML(userName: string, roast?: string, insult?: string): string {
  const r = roast || getRandomRoast();
  const i = insult || getRandomInsult();

  return `<!DOCTYPE html>
<html>
<head>
  <style>${EMAIL_STYLE}</style>
</head>
<body>
  <div style="padding: 20px;">
    <div class="container">
      <div class="header">
        <img src="cid:logo" alt="DSA Grinders" class="logo">
        <h1 class="title">DSA GRINDERS</h1>
        <p class="subtitle">Daily Reality Check</p>
      </div>
      
      <div class="content">
        <p class="greeting">Hey ${userName}! 🔥</p>
        
        <div class="roast-card">
          <p class="roast-text">${r}</p>
        </div>
        
        <p class="instruction">
          Your competitors are grinding LeetCode <strong>right now</strong> while you're reading this. 
          Every minute you waste is a minute they use to take your future job.
        </p>

        <div class="harsh-truth">
          💡 <strong>HARSH TRUTH:</strong> ${i}
        </div>
        
        <a href="https://leetcode.com/problemset/" class="btn-primary">SOLVE A PROBLEM NOW</a>
        <a href="https://dsa-grinders.vercel.app/" class="btn-secondary">View Your Dashboard</a>
      </div>
      
      <div class="footer">
        <p>Keep grinding or keep failing. The choice is yours.</p>
        <p style="margin-top: 12px;">
          Sent with 💀 from <a href="https://dsa-grinders.vercel.app/" class="footer-link">DSA Grinders</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function getCustomEmailHTML(userName: string, subject: string, message: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <style>${EMAIL_STYLE}</style>
</head>
<body>
  <div style="padding: 20px;">
    <div class="container">
      <div class="header">
        <img src="cid:logo" alt="DSA Grinders" class="logo">
        <h1 class="title">DSA GRINDERS</h1>
        <p class="subtitle">Admin Message</p>
      </div>
      
      <div class="content">
        <p class="greeting">Hey ${userName}!</p>
        
        <div style="background-color: #0f172a; padding: 24px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 24px;">
          <h3 style="color: #ef4444; margin: 0 0 12px 0;">${subject}</h3>
          <p style="margin: 0; font-size: 16px; color: #e2e8f0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>
        
        <a href="https://dsa-grinders.vercel.app/" class="btn-primary">GO TO WEBSITE</a>
        <a href="https://leetcode.com/problemset/" class="btn-secondary">Open LeetCode</a>
      </div>
      
      <div class="footer">
        <p>This is a direct message from the DSA Grinders admin team.</p>
        <p style="margin-top: 12px;">
          <a href="https://dsa-grinders.vercel.app/" class="footer-link">dsa-grinders.vercel.app</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function getEmailSubject(userName: string): string {
  return `🚨 Wake Up ${userName}! Time to Grind DSA`;
}

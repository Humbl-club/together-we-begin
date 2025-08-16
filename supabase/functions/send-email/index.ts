import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  type: "welcome" | "event_confirmation" | "challenge_complete" | "invite";
  data?: any;
}

const generateEmailContent = (type: string, data: any) => {
  switch (type) {
    case "welcome":
      return {
        subject: "Welcome to our Women's Community! 🌟",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h1 style="color: #be185d; text-align: center; margin-bottom: 20px;">Welcome to Our Sisterhood! 💕</h1>
              <p style="color: #374151; line-height: 1.6;">Dear ${data.name || 'Sister'},</p>
              <p style="color: #374151; line-height: 1.6;">
                We're absolutely thrilled to have you join our empowering community of women! 
                You're now part of a supportive network that celebrates growth, wellness, and sisterhood.
              </p>
              <div style="background: #fdf2f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #be185d; margin-top: 0;">What's Next?</h3>
                <ul style="color: #374151; line-height: 1.8;">
                  <li>🧘‍♀️ Join our wellness challenges</li>
                  <li>📅 RSVP to upcoming events</li>
                  <li>💬 Share your journey in our social feed</li>
                  <li>🏆 Earn loyalty points for participating</li>
                </ul>
              </div>
              <p style="color: #374151; line-height: 1.6;">
                Remember: You are strong, you are worthy, and you belong here. 
                We can't wait to see you thrive!
              </p>
              <p style="color: #374151; line-height: 1.6;">
                With love and support,<br>
                <strong style="color: #be185d;">The Community Team</strong>
              </p>
            </div>
          </div>
        `
      };
    
    case "event_confirmation":
      return {
        subject: `Event Confirmation: ${data.eventTitle} 🎉`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h1 style="color: #be185d; text-align: center;">You're Registered! ✨</h1>
              <div style="background: #fdf2f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #be185d; margin-top: 0;">${data.eventTitle}</h2>
                <p style="color: #374151; margin: 5px 0;"><strong>📅 Date:</strong> ${data.date}</p>
                <p style="color: #374151; margin: 5px 0;"><strong>⏰ Time:</strong> ${data.time}</p>
                <p style="color: #374151; margin: 5px 0;"><strong>📍 Location:</strong> ${data.location}</p>
              </div>
              <p style="color: #374151; line-height: 1.6;">
                We're excited to see you there! This will be an amazing opportunity to connect, 
                learn, and grow together with your fellow sisters.
              </p>
              <p style="color: #374151; line-height: 1.6;">
                If you have any questions, please don't hesitate to reach out.
              </p>
              <p style="color: #374151; line-height: 1.6;">
                See you soon!<br>
                <strong style="color: #be185d;">The Event Team</strong>
              </p>
            </div>
          </div>
        `
      };

    case "challenge_complete":
      return {
        subject: `Challenge Completed! You earned ${data.points} points 🏆`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h1 style="color: #d97706; text-align: center;">🎉 Challenge Completed! 🎉</h1>
              <div style="text-align: center; margin: 20px 0;">
                <div style="background: #fef3c7; border-radius: 50%; width: 100px; height: 100px; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 48px;">
                  🏆
                </div>
              </div>
              <h2 style="color: #d97706; text-align: center;">${data.challengeTitle}</h2>
              <p style="color: #374151; line-height: 1.6; text-align: center;">
                Congratulations! You've successfully completed the challenge and earned <strong>${data.points} loyalty points</strong>!
              </p>
              <p style="color: #374151; line-height: 1.6;">
                Your dedication and commitment are truly inspiring. You're not just achieving your goals - 
                you're inspiring others in our community to push forward too!
              </p>
              <p style="color: #374151; line-height: 1.6;">
                Keep up the amazing work, warrior!<br>
                <strong style="color: #d97706;">Your Cheerleading Squad</strong>
              </p>
            </div>
          </div>
        `
      };

    default:
      return {
        subject: "Update from Women's Community",
        html: `<p>You have a new update from our community!</p>`
      };
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, type, data }: EmailRequest = await req.json();
    const emailContent = generateEmailContent(type, data);

    const emailResponse = await resend.emails.send({
      from: "Women's Community <hello@resend.dev>",
      to: [to],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
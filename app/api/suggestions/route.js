import nodemailer from "nodemailer";

export async function POST(req) {
    try {
        const { name, email, message } = await req.json();

        if (!message) {
            return Response.json(
                { error: "Suggestion message is required." },
                { status: 400 }
            );
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SUGGESTION_EMAIL_USER,
                pass: process.env.SUGGESTION_EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false, // fixes your certificate error
            },
        });

        await transporter.sendMail({
            from: `"ContractorFinder Suggestions" <${process.env.SUGGESTION_EMAIL_USER}>`,
            to: process.env.SUGGESTION_EMAIL_TO,
            subject: "[ContractorFinder Suggestion]",
            text: `
New ContractorFinder Suggestion

Name: ${name || "Not provided"}
Email: ${email || "Not provided"}

Message:
${message}
      `,
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error("Suggestion email error:", error);

        return Response.json(
            { error: "Could not send suggestion." },
            { status: 500 }
        );
    }
}
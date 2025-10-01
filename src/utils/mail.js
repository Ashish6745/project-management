import Mailgen from "mailgen";
import nodemailer from 'nodemailer';



const sendMail = async (options) => {
  const mailGenerator =    new Mailgen({
        theme:"default",
        product:{
            name:"Project Management",
            link:"https://projectmanager.com"
        },

    })
   const emailTextual =  mailGenerator.generatePlaintext(options.mailgenContent);
   const emailHTML =  mailGenerator.generate(options.mailgenContent);


  const transporter = nodemailer.createTransport({
    host:process.env.MAIL_TRAP_HOST,
    port:process.env.MAIL_TRAP_PORT,
    auth:{
        user:process.env.MAIL_TRAP_USER,
        pass:process.env.MAIL_TRAP_PASSWORD
    },
  });


  const mail = {
    from:"mail.project@example.com",
    to:options.email,
    subject:options.subject,
    text:emailTextual,
    html:emailHTML
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error("Error while sending mail ......... !!!!!!!",error);
  }


}




const emailVerificationMailContent = (username, verificationMailUrl) => {
    return {
          body: {
        name: username,
        intro: 'Welcome to Project Management. We are very excited to have you on board.',
        action: {
            instructions: 'To get started with Project Management, please click here:',
            button: {
                color: '#48B3AF',
                text: 'Confirm your account',
                link: verificationMailUrl
            }
        },
        outro: 'Need help, or have questions? Just reply to this email, we would love to help.'
    }
    }
}





const forgotPasswordMailContent = (username, passwordResetMail) => {
    return {
        body: {
            name: username,
            intro: 'We received a request to reset your password for Project Management.',
            action: {
                instructions: 'Click the button below to reset your password:',
                button: {
                    color: '#48B3AF',
                    text: 'Reset your password',
                    link: passwordResetMail
                }
            },
            outro: 'If you did not request a password reset, you can safely ignore this email.'
        }
    }
};












export {emailVerificationMailContent, forgotPasswordMailContent, sendMail};
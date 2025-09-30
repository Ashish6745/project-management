import Mailgen from "mailgen";


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
}








export {emailVerificationMailContent, forgotPasswordMailContent};
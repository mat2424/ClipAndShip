-- Set OTP expiry to 30 minutes (1800 seconds) for better security
UPDATE auth.config 
SET value = '1800' 
WHERE parameter = 'email_otp_expiry';
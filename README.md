## Steps to repo
1. `git clone` the repo and `npm install` the required dependencies. 
2. Add your API keys to `.env.example` and change it to `.env.local`
3. Ensure that two step verification is enabled in your Clerk app 
4. Ensure that Google SSO is enabled
5. `npm run dev` to launch the development server.
6. If not automatically redirected to AP, Select the "Sign in" button in the top-right corner of the app's homepage.
7. Sign-in with Google and you'll be taken to the custom `/mfa-setup` page
8. Setup MFA for Duo by scanning the QR code, enter the code, click "Verify" (it usually works)
    8.a If you can't get past the `Incorrect Code` error, I found deleting the Duo connection and scanning the QR code again to set up a new connection worked
    -  This is the step where i encountered the most frequent `Incorrect code` error even though the code was entered correctly
9. Sign-out via the `< UserProfile />` and to test Account Portal flow full sign-in flow + MFA, try signing in again through Google, and enter the OTP code from Duo, which sometimes works and sometimes doesn't
10. To test the custom flow go to `localhost:3000/sign-in`, sign-in with Google and enter the OTP code


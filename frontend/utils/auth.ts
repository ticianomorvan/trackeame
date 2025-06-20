import { GoogleAuthProvider } from "firebase/auth";

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope("https://www.googleapis.com/auth/userinfo.email");
googleAuthProvider.addScope("https://www.googleapis.com/auth/userinfo.profile");
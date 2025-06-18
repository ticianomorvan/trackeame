import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import { auth } from "./firebase";
import { fetcher } from "./fetch";

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope("https://www.googleapis.com/auth/userinfo.email");
googleAuthProvider.addScope("https://www.googleapis.com/auth/userinfo.profile");

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleAuthProvider)
    .then(async ({ user }) => {
      const idToken = await user.getIdToken()

      const result = await fetcher("/")
    })
}
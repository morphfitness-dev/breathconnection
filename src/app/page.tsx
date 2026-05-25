import { redirect } from "next/navigation";

// Root redirects to the app home; auth middleware handles unauthenticated users
export default function RootPage() {
  redirect("/home");
}

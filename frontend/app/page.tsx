import { redirect } from "next/navigation";

export default function Home() {
  // Redirige automáticamente al usuario al login cuando intente entrar a la raíz "/"
  redirect("/login");
}

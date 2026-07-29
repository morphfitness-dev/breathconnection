import LoginForm from "@/components/LoginForm";
import BrandMark from "@/components/BrandMark";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <BrandMark />
      <div className="flex w-full flex-col items-center gap-6">
        <h1 className="text-2xl">Coach Login</h1>
        <LoginForm />
      </div>
    </main>
  );
}

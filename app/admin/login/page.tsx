import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setAdminCookie } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

async function loginAction(formData: FormData) {
  "use server";
  const u = String(formData.get("username") ?? "");
  const p = String(formData.get("password") ?? "");

  if (u === process.env.ADMIN_USERNAME && p === process.env.ADMIN_PASSWORD) {
    await setAdminCookie();
    redirect("/admin");
  }

  redirect("/admin/login?error=1");
}

export default async function AdminLogin({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams?.error === "1";

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl">Admin login</h1>
      <p className="mt-2 text-sm text-soft-black/70">Use the credentials in your environment variables.</p>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Incorrect username or password.
        </div>
      )}

      <form action={loginAction} className="mt-8 grid gap-4 rounded-2xl border border-soft-black/10 bg-white/60 p-6 shadow-soft">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Username</label>
          <Input name="username" required />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Password</label>
          <Input name="password" type="password" required />
        </div>
        <Button type="submit">Sign in</Button>
      </form>

      <p className="mt-6 text-xs text-soft-black/55">Tip: Change <code>ADMIN_PASSWORD</code> before going live.</p>
    </div>
  );
}

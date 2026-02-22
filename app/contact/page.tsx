"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>Contact</Badge>
        <Badge>Support</Badge>
      </div>

      <h1 className="mt-6 font-display text-4xl">Let’s talk</h1>
      <p className="mt-4 text-sm text-soft-black/70">This form is a demo. Connect it to your email provider (Resend, Formspark, etc.).</p>

      <div className="mt-10 rounded-2xl border border-soft-black/10 bg-white/60 p-6 shadow-soft">
        {sent ? (
          <div className="text-center">
            <div className="font-display text-2xl">Message sent ✨</div>
            <p className="mt-2 text-sm text-soft-black/70">Demo success state.</p>
            <div className="mt-6"><Button onClick={() => setSent(false)}>Send another</Button></div>
          </div>
        ) : (
          <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Name</label>
              <Input required placeholder="Your name" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email</label>
              <Input required type="email" placeholder="you@example.com" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea required placeholder="How can we help?" />
            </div>
            <div className="mt-2"><Button type="submit">Send message</Button></div>
          </form>
        )}
      </div>
      <p className="mt-4 text-sm text-soft-black/70">
  Email us at{" "}
  <a
    href="mailto:info@blingbeautyproducts.com"
    className="font-medium underline-offset-4 hover:underline"
  >
    info@blingbeautyproducts.com
  </a>
</p>

    </div>
  );
}
